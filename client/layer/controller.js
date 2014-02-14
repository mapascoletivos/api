'use strict';

require('angular/angular');
require('angular-resource/angular-resource');

/*
 * Layer controller
 */
exports.LayerCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'$stateParams',
	'$q',
	'Page',
	'Layer',
	'Feature',
	'Content',
	'LayerSharedData',
	'MessageService',
	'SessionService',
	'MapService',
	function($scope, $rootScope, $location, $stateParams, $q, Page, Layer, Feature, Content, LayerSharedData, Message, Session, MapService) {

		// New layer
		if($location.path() == '/layers/new') {

			var draft = new Layer.resource({
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/layers/' + draft._id + '/edit').replace();
			}, function(err) {
				// TODO error handling
			});

		// Single layer
		} else if($stateParams.layerId) {

			$scope.activeObj = 'settings';

			$scope.layerObj = function(objType) {
				if($scope.activeObj == objType)
					return 'active';

				return false;
			}

			$scope.setLayerObj = function(obj) {

				$scope.activeObj = obj;
				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);

			}

			$scope.$watch('activeObj', function(active) {

				LayerSharedData.editingFeature(false);
				LayerSharedData.editingContent(false);
				$scope.$broadcast('layerObjectChange', active);

			});

			$scope.$on('layer.delete.success', function() {
				$location.path('/dashboard/layers').replace();
			});

			var layerDefer = $q.defer();
			LayerSharedData.layer(layerDefer.promise);

			Layer.resource.get({layerId: $stateParams.layerId}, function(layer) {

				$scope.layer = layer;

				Page.setTitle(layer.title);

				var map = MapService.init('layer-map', {
					center: [0,0],
					zoom: 2
				});

				$scope.fitMarkerLayer = function() {
					MapService.fitMarkerLayer();
				}

				// Set layer shared data using service (resolving promise)
				layerDefer.resolve(layer);

				// Set feature shared data
				Feature.set(layer.features);

				// Set content shared data
				Content.set(layer.contents);

				$rootScope.$broadcast('data.ready', layer);

				/*
				// Store shared data on scope
				$scope.sharedData = LayerSharedData;

				// Watch active sidebar on layer parent scope
				$scope.activeSidebar = false;
				$scope.$watch('sharedData.activeSidebar()', function(active) {
					$scope.activeSidebar = active;
				});
				*/

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {

					Layer.edit(layer);

					if($scope.layer.title == 'Untitled') {
						$scope.layer.title = '';
						Page.setTitle('Nova camada');
					}

					$scope.$on('layer.save.success', function(event, layer) {
						Page.setTitle(layer.title);
						$scope.layer = layer;
					});
					$scope.close = function() {

						if(Layer.isDraft(layer)) {
							$location.path('/dashboard/layers').replace();
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

					$scope.$on('$stateChangeStart', function() {
						Layer.deleteDraft(layer);
					});

				}

			}, function() {

				$location.path('/layers').replace();

				Message.message({
					status: 'error',
					text: 'Esta camada não existe'
				});

			});

			$scope.$on('$destroy', function() {
				MapService.destroy();
			});

		// All layers
		} else {

			Page.setTitle('Camadas');

			Layer.resource.query(function(res) {
				$scope.layers = res.layers;
			});

		}

	}
];