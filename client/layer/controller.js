'use strict';

require('angular/angular');
require('angular-resource/angular-resource');

/*
 * Layer controller
 */
exports.LayerCtrl = [
	'$scope',
	'$location',
	'$stateParams',
	'$q',
	'Layer',
	'LayerSharedData',
	'MessageService',
	'MapService',
	'SessionService',
	function($scope, $location, $stateParams, $q, Layer, LayerSharedData, Message, MapService, SessionService) {

		/*
		 * Permission control
		 */
		$scope.canEdit = function(layer) {

			if(!layer || !SessionService.user)
				return false;

			if(layer.creator && layer.creator._id == SessionService.user._id) {
				return true;
			}

			return false;

		};

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

			var layerDefer = $q.defer();
			LayerSharedData.layer(layerDefer.promise);

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

			Layer.resource.get({layerId: $stateParams.layerId}, function(layer) {

				var map = MapService.init('layer-map', {
					center: [0,0],
					zoom: 2
				});

				$scope.fitMarkerLayer = function() {
					MapService.fitMarkerLayer();
				}

				// Set layer shared data using service (resolving promise)
				layerDefer.resolve(layer);

				$scope.layer = layer;

				// Store shared data on scope
				$scope.sharedData = LayerSharedData;

				// Watch active sidebar on layer parent scope
				$scope.activeSidebar = false;
				$scope.$watch('sharedData.activeSidebar()', function(active) {
					$scope.activeSidebar = active;
				});

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {

					if($scope.layer.title == 'Untitled')
						$scope.layer.title = '';

					$scope.$on('layer.save.success', function(event, layer) {
						$scope.layer = layer;
					});

					$scope.$on('layer.delete.success', function() {
						$location.path('/dashboard/layers').replace();
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

			Layer.resource.query(function(res) {
				$scope.layers = res.layers;
			});

		}

	}
];