'use strict';

/*
 * Map controller
 */

exports.MapCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'$state',
	'$stateParams',
	'Page',
	'Map',
	'Layer',
	'Content',
	'Feature',
	'MapService',
	'MessageService',
	'SessionService',
	function($scope, $rootScope, $location, $state, $stateParams, Page, Map, Layer, Content, Feature, MapService, Message, Session) {

		$scope.user = Session.user;

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

			$scope.isEditing = function() {
				return $location.path().indexOf('edit') !== -1;
			}

			Map.resource.get({mapId: $stateParams.mapId}, function(map) {

				Page.setTitle(map.title);

				$scope.map = angular.copy(map);

				if($scope.isEditing()) {

					Layer.resource.query({
						creatorOnly: true
					}, function(res) {

						$scope.userLayers = res.layers;
						$scope.availableLayers = angular.copy($scope.userLayers);

					});

				}

				$scope.layerSearch = '';

				$scope.$watch('layerSearch', function(text) {

					if(text) {

						Layer.resource.query({
							search: text
						}, function(res) {

							if(res.layers) {

								$scope.availableLayers = res.layers;

							}

						});

					} else {

						$scope.availableLayers = angular.copy($scope.userLayers);

					}

				});

				$scope.focusLayer = function(layer) {



				};

				$scope.toggleLayer = function(layer) {

					if(!$scope.map.layers)
						$scope.map.layers = [];

					var mapLayers = angular.copy($scope.map.layers);

					if($scope.hasLayer(layer)) {
						if($scope.isEditing() && confirm('Tem certeza que gostaria de remover esta camada do seu mapa?'))
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

				var renderLayer = function(layer) {

					// Add layer to map and get feature data
					var layerData = MapService.addLayer(layer);

					layer._mcData = layerData;

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

					$scope.layers.push(layer);

					// Fix ordering
					if($scope.layers.length === $scope.map.layers.length) {
						$scope.setupMapContent();
						$scope.fixLayerOrdering();
					}

				};

				$scope.fixLayerOrdering = function() {
					var ordered = [];
					angular.forEach($scope.map.layers, function(layerId) {
						ordered.push($scope.layers.filter(function(layer) { return layer._id == layerId; })[0]);
					});
					$scope.layers = ordered;
				};

				$scope.hideAllLayers = function() {

					angular.forEach($scope.layers, function(layer) {
						$scope.hideLayer(layer._mcData.markerLayer);
					});

				};

				$scope.hideLayer = function(layer) {

					MapService.get().removeLayer(layer);

				};

				$scope.showAllLayers = function() {

					angular.forEach($scope.layers, function(layer) {
						$scope.showLayer(layer._mcData.markerLayer);
					});

				};

				$scope.showLayer = function(layer) {

					MapService.get().addLayer(layer);

				};

				$scope.setupMapContent = function() {
					var contents = [];
					var features = [];
					angular.forEach($scope.layers, function(layer) {
						angular.forEach(layer.features, function(lF) {
							features.push(lF);
						});
						angular.forEach(layer.contents, function(lC) {
							contents.push(lC);
						});
					});
					Content.set(contents);
					Feature.set(features);
					$rootScope.$broadcast('data.ready', $scope.map);

					$scope.$on('content.filtering.started', $scope.hideAllLayers);

					$scope.$on('feature.filtering.started', $scope.hideAllLayers);

					$scope.$on('content.filtering.closed', $scope.showAllLayers);

					$scope.$on('feature.filtering.closed', $scope.showAllLayers);
				}

				$scope.$watch('map.layers', function(layers) {

					MapService.clearAll();

					$scope.layers = [];

					angular.forEach(layers, function(layerId) {

						var layer,
							layerData;

						if(fetchedLayers[layerId]) {
							layer = fetchedLayers[layerId];
							renderLayer(layer);
						} else {
							Layer.resource.get({layerId: layerId}, function(layer) {
								layer = fetchedLayers[layer._id] = layer;
								renderLayer(layer);
							});
						}

					});

				});

				$scope.sortLayer = {
					stop: function() {
						var newOrder = [];
						angular.forEach($scope.layers, function(layer) {
							newOrder.push(layer._id);
						});
						$scope.map.layers = newOrder;
					}
				}

				$scope.$on('map.save.success', function(event, map) {
					Page.setTitle(map.title);
					$scope.map = map;
				});

				$scope.$on('map.delete.success', function() {
					$location.path('/dashboard/maps').replace();
				});

				$scope.$on('$stateChangeStart', function() {
					Map.deleteDraft($scope.map);
				});

				$scope.close = function() {

					if(Map.isDraft($scope.map)) {
						$location.path('/dashboard/maps');
					} else {
						$location.path('/maps/' + $scope.map._id);
					}

				}

				if($location.path().indexOf('edit') !== -1) {
					if($scope.map.title == 'Untitled') {
						$scope.map.title = '';
						Page.setTitle('Novo mapa');
					}
				}

				$scope.$on('markerClicked', function(event, feature) {

					$state.go('singleMap.feature', {
						featureId: feature._id
					});

				});

			});

		} else {

			Page.setTitle('Mapas');

			Map.resource.query(function(res) {
				$scope.maps = res.maps;
			});

		}

	}
];