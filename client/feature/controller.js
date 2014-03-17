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
	'MessageService',
	'MapService',
	'SessionService',
	function($scope, $rootScope, $state, $stateParams, $location, Feature, Content, Message, MapService, Session) {

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

		var focused = false;

		$scope.focus = function(feature) {

			setTimeout(function() {
				var lFeature = featureToMapObj(feature);
				MapService.get().fitBounds(L.featureGroup([lFeature]).getBounds());
				focused = true;
			}, 100);


		}

		$scope.view = function(feature) {

			$scope.close();

			viewing = true;

			$scope.feature = feature;

			if(window.mcHistory.length == 1) {
				setTimeout(function() {
					var lFeature = featureToMapObj(feature);
					MapService.get().fitBounds(L.featureGroup([lFeature]).getBounds());
					focused = true;
				}, 200);
			}

			var featureContents = Feature.getContents(feature, contents);

			Content.set(featureContents);

			$rootScope.$broadcast('feature.filtering.started', feature, featureContents);

		}

		$scope.description = function(feature) {

			if(feature && feature.description) {

				var description = angular.copy(feature.description);

				description = description.replace(new RegExp('{{', 'g'), '<%= ');
				description = description.replace(new RegExp('}}', 'g'), ' %>');

				var compiled = _.template(description);

				return markdown.toHTML(compiled(feature.properties));

			}

			return '';

		}

		$scope.close = function() {

			$scope.feature = false;

			if(typeof features !== 'undefined' && Feature.get() !== features)
				Feature.set(features);

			if(typeof contents !== 'undefined' && Content.get() !== contents)
				Content.set(contents);

			viewing = false;

			if(focused) {
				focused = false;
				MapService.fitFeatureLayer();
			}

			$rootScope.$broadcast('feature.filtering.closed');

		}

		$scope.templates = {
			list: '/views/feature/list-item.html',
			show: '/views/feature/show.html'
		};

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

			$scope.canEdit = function(feature, layer) {

				var featureCreatorId = feature.creator._id ? feature.creator._id : feature.creator;

				// User is feature owner
				if(featureCreatorId == Session.user._id) {
					return true;
				}

				// User is layer owner
				if(layer.creator._id == Session.user._id) {
					return true;
				}

				return false;

			}

			$scope.$on('marker.clicked', function(event, feature, layer) {
				$scope.edit(feature, layer);
			});

			$scope.new = function() {

				Feature.edit({});

			};

			$scope.edit = function(feature, layer) {

				if($scope.canEdit(feature, layer)) {

					Feature.edit(angular.copy(feature));

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

				} else {

					Message.add({
						'status': 'error',
						'text': 'Você não tem permissão para editar este local'
					});

				}

			};
		}

	}
];