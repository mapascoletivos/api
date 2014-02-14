'use strict';

var featureToMapObj = require('./featureToMapObjService');

/*
 * Feature controller
 */

exports.FeatureCtrl = [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'$location',
	'Feature',
	'Content',
	'MapService',
	function($scope, $rootScope, $state, $stateParams, $location, Feature, Content, MapService) {

		$scope.objType = 'feature';

		$scope.$feature = Feature;

		$rootScope.$on('data.ready', function() {

			var triggerView = true;

			$scope.$watch('$feature.get()', function(features) {
				$scope.features = features;
				populateMap(true);
				if(triggerView) {
					viewState();
					triggerView = false;
				}
			});

		});

		var mapFeatures;

		var populateMap = function(force) {

			// Repopulate map if feature in scope has changed
			if(!angular.equals(mapFeatures, $scope.features) || force === true) {

				mapFeatures = angular.copy($scope.features);

				MapService.clearMarkers();

				if($scope.features) {

					angular.forEach($scope.features, function(f) {

						var marker = featureToMapObj(f);

						if(marker) {

							marker
								.on('click', function() {
									$rootScope.$broadcast('markerClicked', f);
								})
								.on('mouseover', function() {
									marker.openPopup();
								})
								.on('mouseout', function() {
									marker.closePopup();
								})
								.bindPopup('<h3 class="feature-title">' + f.title + '</h3>');


							MapService.addMarker(marker);

						}

					});
				}
			}

			if($scope.features && $scope.features.length) {
				// Fit marker layer after 200ms (animation safe)
				setTimeout(function() {
					MapService.fitMarkerLayer();
				}, 200);
			}

		}

		var viewing = false;

		var contents,
			features;

		$scope.view = function(feature) {

			contents = Content.get();
			features = Feature.get();

			$scope.close(false);

			viewing = true;

			$scope.feature = feature;

			var featureContents = Feature.getContents(feature, angular.copy(contents));

			Content.set(featureContents);
			Feature.set([feature]);

			$rootScope.$broadcast('feature.filtering.started', feature, featureContents);

		}

		$scope.close = function(fit) {

			$scope.feature = false;

			if(typeof features !== 'undefined')
				Feature.set(features);

			if(typeof contents !== 'undefined')
				Content.set(contents);

			if(fit !== false)
				MapService.fitMarkerLayer();

			viewing = false;

			$rootScope.$broadcast('feature.filtering.closed');

		}

		$scope.$on('layerObjectChange', function(event, active) {
			populateMap(true);
		});

		// Force repopulate map on feature close
		$scope.$on('closedFeature', function() {
			populateMap(true);
		});

		/*
		 * Manage view state
		 */
		var viewState = function() {
			if($stateParams.featureId && $scope.features) {
				var feature = $scope.features.filter(function(f) { return f._id == $stateParams.featureId; })[0];
				if(feature) {
					$scope.view(feature);
					return true;
				}
			}
			return false;
		}

		$rootScope.$on('$stateChangeSuccess', function() {

			if(!viewState() && viewing) {
				$scope.close();
			}

		});

		/*
		 * Edit actions
		 */
		if($location.path().indexOf('edit') !== -1) {

			$scope.$on('markerClicked', function(event, feature) {
				$scope.edit(feature._id);
			});

			$scope.new = function() {

				Feature.edit({});

			};

			$scope.edit = function(featureId) {

				Feature.edit(angular.copy($scope.features.filter(function(f) { return f._id == featureId; })[0]));

				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);

			};

		/*
		 * View actions
		 */
		}

	}
];