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

		var contents,
			features;

		$rootScope.$on('data.ready', function() {

			contents = Content.get();
			features = Feature.get();

			var init = true;

			$scope.$watch('$feature.get()', function(features) {

				if(typeof features !== 'undefined' && features) {

					$scope.features = features;
					$rootScope.$broadcast('features.updated', features);

					if(init) {

						viewState();
						init = false;

					}

				}

			});

		});

		var viewing = false;

		$scope.view = function(feature) {

			$scope.close(false);

			viewing = true;

			$scope.feature = feature;

			var featureContents = Feature.getContents(feature, contents);

			Content.set(featureContents);
			Feature.set([feature]);

			$rootScope.$broadcast('feature.filtering.started', feature, featureContents);

		}

		$scope.close = function(fit) {

			$scope.feature = false;

			if(typeof features !== 'undefined' && Feature.get() !== features)
				Feature.set(features);

			if(typeof contents !== 'undefined' && Content.get() !== contents)
				Content.set(contents);

			if(fit !== false)
				MapService.fitMarkerLayer();

			viewing = false;

			$rootScope.$broadcast('feature.filtering.closed');

		}

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

			$scope.$on('marker.clicked', function(event, feature) {
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
		}

	}
];