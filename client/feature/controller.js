'use strict';

require('angular/angular');

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
	'LayerSharedData',
	'MapService',
	'featureToMapObj',
	function($scope, $rootScope, $state, $stateParams, $location, Feature, LayerSharedData, MapService, featureToMapObj) {

		$scope.objType = 'feature';
		
		$scope.sharedData = LayerSharedData;

		$scope.features = [];

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
									$scope.$emit('markerClicked', f);
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

		var unhookContents;

		$scope.view = function(feature) {

			$scope.close(false);

			$scope.sharedData.features([feature]);

			viewing = true;

			$scope.sharedData.activeSidebar(true);

			$scope.feature = feature;

			var contents = Feature.getContents(feature);

			$scope.sharedData.contents(contents);
			unhookContents = $rootScope.$on('layerContentsReady', function() {
				$scope.sharedData.contents(contents);
			});

		}

		$scope.close = function(fit) {

			$scope.sharedData.features($scope.layer.features);
			$scope.sharedData.contents($scope.layer.contents);
			$scope.feature = false;

			$scope.sharedData.activeSidebar(false);

			if(fit !== false)
				MapService.fitMarkerLayer();

			viewing = false;

			if(typeof unhookContents == 'function')
				unhookContents();

		}

		$scope.$on('layerObjectChange', function(event, active) {
			populateMap(true);
		});

		// Get layer data then...
		$scope.sharedData.layer().then(function(layer) {

			// Update features shared data with layer features
			$scope.sharedData.features(layer.features);

			// Watch layer features
			$scope.$watch('sharedData.features()', function(features) {

				$scope.features = features;
				populateMap();

			});

			if($location.path().indexOf('edit') !== -1) {

				// Force repopulate map on feature close
				$scope.$on('closedFeature', function() {
					populateMap(true);
				});

			}

			/*
			 * Manage view state
			 */
			var viewState = function() {
				if($stateParams.featureId) {
					var feature = layer.features.filter(function(f) { return f._id == $stateParams.featureId; })[0];
					if(feature) {
						$scope.view(feature);
						return true;
					}
				}
				return false;
			}

			viewState();

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

					$scope.sharedData.editingFeature({});

				};

				$scope.edit = function(featureId) {

					$scope.sharedData.editingFeature(angular.copy($scope.features.filter(function(f) { return f._id == featureId; })[0]));

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

				};

			/*
			 * View actions
			 */
			} else {

				$scope.$on('markerClicked', function(event, feature) {

					$state.go('singleLayer.feature', {
						featureId: feature._id
					});


				});

			}

		});

	}
];