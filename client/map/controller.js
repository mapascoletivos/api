'use strict';

require('angular/angular');

/*
 * Map controller
 */

exports.MapCtrl = [
	'$scope',
	'$location',
	'$state',
	'$stateParams',
	'Map',
	'Layer',
	'MapService',
	'MessageService',
	'SessionService',
	function($scope, $location, $state, $stateParams, Map, Layer, MapService, Message, SessionService) {

		/*
		 * Permission control
		 */
		$scope.canEdit = function(map) {

			if(!map || !SessionService.user)
				return false;

			if(map.creator && map.creator._id == SessionService.user._id) {
				return true;
			}

			return false;

		};

		// New layer
		if($location.path() == '/maps/new') {

			var draft = new Map.resource({
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/maps/' + draft._id + '/edit').replace();
			}, function(err) {
				// TODO error handling
			});

		} else if($stateParams.mapId) {

			var map = MapService.init('map', {
				center: [0,0],
				zoom: 2
			});

			$scope.activeObj = 'settings';

			$scope.mapObj = function(objType) {
				if($scope.activeObj == objType)
					return 'active';

				return false;
			}

			$scope.setMapObj = function(obj) {

				$scope.activeObj = obj;
				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);

			}

			Map.resource.get({mapId: $stateParams.mapId}, function(map) {

				$scope.map = angular.copy(map);

				Layer.query({
					creatorOnly: true
				}, function(res) {

					$scope.userLayers = res.layers;

					$scope.toggleLayer = function(layer) {

						if(!$scope.map.layers)
							$scope.map.layers = [];

						var mapLayers = angular.copy($scope.map.layers);

						if($scope.hasLayer(layer)) {
							mapLayers = mapLayers.filter(function(layerId) { return layerId !== layer._id; });
						} else {
							mapLayers.push(layer._id);
						}

						$scope.map.layers = mapLayers;

					};

					$scope.hasLayer = function(layer) {

						if(!$scope.map.layers)
							$scope.map.layers = [];

						return $scope.map.layers.filter(function(layerId) { return layerId == layer._id; }).length;

					};

					// Cache fetched layers
					var fetchedLayers = {};

					$scope.layers = [];

					var renderLayer = function(layer) {

						$scope.layers.push(layer);

						// Add layer to map and get feature data
						var layerData = MapService.addLayer(layer);

						angular.forEach(layerData.markers, function(marker) {

							marker
								.on('click', function() {

									if($location.path().indexOf('edit') == -1) {

										$state.go('singleMap.feature', {
											featureId: marker.mcFeature._id
										});

									} else {

										// Do something?

									}

								})
								.on('mouseover', function() {

									marker.openPopup();

								})
								.on('mouseout', function() {

									marker.closePopup();

								})
								.bindPopup('<h3 class="feature-title">' + marker.mcFeature.title + '</h3>');

						});

					};

					$scope.$watch('map.layers', function(layers) {

						MapService.clearAll();

						angular.forEach(layers, function(layerId) {

							var layer,
								layerData;

							if(fetchedLayers[layerId]) {
								layer = fetchedLayers[layerId];
								renderLayer(layer);
							} else {
								Layer.get({layerId: layerId}, function(layer) {
									layer = fetchedLayers[layer._id] = layer;
									renderLayer(layer);
								});
							}

						});

					});

					/*
					 * Manage view state
					var viewState = function() {
						if($stateParams.featureId) {
							var feature = layer.features.filter(function(f) { return f._id == $stateParams.featureId; })[0];
							if(feature) {
								$scope.view(feature);
								return true;
							}
						} else if($stateParams.contentId) {

						}
						return false;
					}

					viewState();

					$rootScope.$on('$stateChangeSuccess', function() {

						if(!viewState() && viewing) {
							$scope.close();
						}

					});
					 */

				});

				$scope.save = function() {

					Message.message({
						status: 'loading',
						text: 'Salvando mapa...'
					});

					var map = angular.copy($scope.map);
					map.isDraft = false;

					Map.resource.update({mapId: map._id}, map, function(map) {
						$scope.map = angular.copy(map);
						Message.message({
							status: 'ok',
							text: 'Mapa atualizado'
						});
						$scope.$broadcast('mapSaved');
					}, function(err){
						Message.message({
							status: 'error',
							text: 'Ocorreu um erro.'
						});
					});

				}

				$scope.delete = function() {

					if(confirm('Você tem certeza que deseja remover este mapa?')) {
						Map.resource.delete({mapId: map._id}, function(res) {
							$location.path('/maps').replace();
							Message.message({
								status: 'ok',
								text: 'Mapa removido.'
							});
						}, function(err) {
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro.'
							});
						});
					}

				}

				var deleteDraft = function(callback) {
					if((!$scope.map.title || $scope.map.title == 'Untitled') && !$scope.map.layers.length) {
						if(typeof callback === 'function')
							Map.resource.delete({mapId: map._id}, callback);
						else
							Map.resource.delete({mapId: map._id});
					}
				}

				$scope.close = function() {

					if((!$scope.map.title || $scope.map.title == 'Untitled') && !$scope.map.layers.length) {
						deleteDraft(function(res) {
							$location.path('/maps').replace();
						});
					} else {
						$location.path('/maps/' + map._id);
					}

				}

				$scope.$on('$stateChangeStart', deleteDraft);

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {
					if($scope.map.title == 'Untitled')
						$scope.map.title = '';
				}

			});

		} else {

			Map.resource.query(function(res) {
				$scope.maps = res.maps;
			});

		}

	}
];