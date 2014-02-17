'use strict';

/*
 * Layer controller
 */
exports.LayerCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'$state',
	'$stateParams',
	'$q',
	'Page',
	'Layer',
	'Feature',
	'Content',
	'MessageService',
	'SessionService',
	'MapService',
	function($scope, $rootScope, $location, $state, $stateParams, $q, Page, Layer, Feature, Content, Message, Session, MapService) {

		$scope.$layer = Layer;

		// New layer
		if($location.path() == '/layers/new/') {

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

				Feature.edit(false);
				Content.edit(false);
				$scope.$broadcast('layerObjectChange', active);

			});

			$scope.$on('layer.delete.success', function() {
				$location.path('/dashboard/layers').replace();
			});

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

				// Set feature shared data
				Feature.set(layer.features);

				// Set content shared data
				Content.set(layer.contents);

				$rootScope.$broadcast('data.ready', layer);

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

				} else {

					$scope.$on('markerClicked', function(event, feature) {

						$state.go('singleLayer.feature', {
							featureId: feature._id
						});

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

		$scope.$on('layer.page.next', function(event, res) {
			if(res.layers.length) {
				angular.forEach(res.layers, function(layer) {
					$scope.layers.push(layer);
				});
				$scope.layers = $scope.layers; // trigger digest
			}
		});

	}
];