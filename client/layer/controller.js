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

			var draft = new Layer({
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

			Layer.get({layerId: $stateParams.layerId}, function(layer) {

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

					var isDraft = function() {
						return (!$scope.layer.title || $scope.layer.title == 'Untitled')
							&& !$scope.layer.features.length
							&& !$scope.layer.contents.length;
					}

					var deleteDraft = function(callback) {
						if(isDraft()) {
							Layer.delete({layerId: layer._id}, callback);
						}
					}

					$scope.save = function($event) {

						Message.message({
							status: 'loading',
							text: 'Salvando camada...'
						});

						var layer = angular.copy($scope.layer);
						layer.isDraft = false;

						Layer.update({layerId: layer._id}, layer, function(layer) {
							$scope.layer = angular.copy(layer);
							Message.message({
								status: 'ok',
								text: 'Camada atualizada'
							});
							$scope.$broadcast('layerSaved');
						}, function(err){
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro.'
							});
						});

					}

					$scope.delete = function() {

						if(confirm('Você tem certeza que deseja remover esta camada?')) {
							Layer.delete({layerId: layer._id}, function(res) {
								$location.path('/layers').replace();
								Message.message({
									status: 'ok',
									text: 'Camada removida.'
								});
							}, function(err) {
								Message.message({
									status: 'error',
									text: 'Ocorreu um erro.'
								});
							});
						}

					}

					$scope.close = function() {

						if(isDraft()) {
							$location.path('/dashboard/layers').replace();
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

					$scope.$on('$stateChangeStart', deleteDraft);

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

			Layer.query(function(res) {
				$scope.layers = res.layers;
			});

		}

	}
];