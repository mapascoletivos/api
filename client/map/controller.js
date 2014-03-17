'use strict';

/*
 * Map controller
 */

exports.MapCtrl = [
	'$scope',
	'$rootScope',
	'$timeout',
	'$location',
	'$state',
	'$stateParams',
	'Page',
	'Map',
	'Layer',
	'Content',
	'Feature',
	'MapService',
	'MapView',
	'MessageService',
	'SessionService',
	function($scope, $rootScope, $timeout, $location, $state, $stateParams, Page, Map, Layer, Content, Feature, MapService, MapView, Message, Session) {

		$scope.user = Session.user;

		$scope.$map = Map;

		// New map
		if($location.path() == '/maps/new/') {

			var draft = new Map.resource({
				title: 'Untitled',
				center: [0,0],
				zoom: 2
			});
			draft.$save(function(draft) {
				$location.path('/maps/' + draft._id + '/edit/').replace();
			}, function(err) {
				// TODO error handling
			});

		} else if($stateParams.mapId) {

			var origMap;

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

				MapView.sidebar(true);

				Page.setTitle(map.title);

				origMap = map;

				$scope.map = angular.copy(map);

				$scope.baseUrl = '/maps/' + map._id;

				var mapOptions = {
					center: $scope.map.center ? $scope.map.center : [0,0],
					zoom: $scope.map.zoom ? $scope.map.zoom : 2
				};

				if(!$scope.isEditing()) {
					mapOptions = _.extend(mapOptions, {
						minZoom: $scope.map.minZoom ? $scope.map.minZoom : undefined,
						maxZoom: $scope.map.maxZoom ? $scope.map.maxZoom : undefined,
						maxBounds: $scope.map.southWest.length ? L.latLngBounds($scope.map.southWest, $scope.map.northEast) : undefined
					});
				}

				var map = MapService.init('map', mapOptions);

				if($scope.isEditing()) {

					var destroyConfirmation = $rootScope.$on('$stateChangeStart', function(event) {
						if(!angular.equals($scope.map, origMap))
							if(!confirm('Deseja sair sem salvar alterações?'))
								event.preventDefault();
							else
								Map.deleteDraft($scope.map);
					});

					$scope.$on('$destroy', function() {
						destroyConfirmation();
					});

					Layer.resource.query({
						creatorOnly: true
					}, function(res) {

						$scope.userLayers = res.layers;
						$scope.availableLayers = angular.copy($scope.userLayers);

					});

				}

				$scope.layerSearch = '';

				$scope.$watch('layerSearch', _.debounce(function(text) {

					if(text) {

						Layer.resource.query({
							search: text
						}, function(res) {

							if(res.layers) {

								$scope.availableLayers = res.layers;

							}

						});

					} else {

						$timeout(function() {
							$scope.availableLayers = angular.copy($scope.userLayers);
						}, 100);

					}

				}, 300));

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

				$scope.$watch('map.layers', function(layers) {

					markers = [];

					MapService.clearAll();

					$scope.layers = [];

					$scope.contents = [];

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

				// Cache fetched layers
				var fetchedLayers = {};

				var markers = [];

				var renderLayer = function(layer) {

					// Add layer to map and get feature data
					var layerData = MapService.addLayer(layer);

					if(layer.type == 'FeatureLayer') {

						layer._mcData = layerData;

						angular.forEach(layerData.features, function(marker) {

							markers.push(marker);

							marker.on('click', function() {

								if(!$scope.isEditing()) {

									$state.go('singleMap.feature', {
										featureId: marker.mcFeature._id
									});

								} else {

									// Do something?

								}

							});

						});

					}

					$scope.layers.push(layer);

					if($scope.layers.length === $scope.map.layers.length) {
						// Fix ordering
						$scope.fixLayerOrdering();

						// Setup map content
						$scope.setupMapContent();
					}

				};

				$scope.fixLayerOrdering = function() {
					var ordered = [];
					angular.forEach($scope.map.layers, function(layerId) {
						ordered.push($scope.layers.filter(function(layer) { return layer._id == layerId; })[0]);
					});
					$scope.layers = ordered;
				};

				$scope.setupMapContent = function() {
					var contents = [];
					var features = [];
					angular.forEach($scope.layers, function(layer) {
						angular.forEach(layer.features, function(lF) {
							lF.layer = layer;
							features.push(lF);
						});
						angular.forEach(layer.contents, function(lC) {
							lC.layer = layer;
							contents.push(lC);
						});
					});
					Content.set(contents);
					Feature.set(features);
					$rootScope.$broadcast('data.ready', $scope.map);

					$scope.$on('features.updated', function(event, features) {

						filterFeatures(features);

					});
				};

				var filterFeatures = function(features) {

					var filteredGroup = L.featureGroup();
					var map = MapService.get();

					angular.forEach($scope.layers, function(layer) {

						if(layer.type == 'FeatureLayer') {

							var markerLayer = layer._mcData.featureLayer;
							var markers = layer._mcData.features;

							angular.forEach(markers, function(marker) {

								if(!features.filter(function(f) { return marker.mcFeature._id == f._id; }).length)
									markerLayer.removeLayer(marker);
								else {
									if(!markerLayer.hasLayer(marker))
										markerLayer.addLayer(marker);

									filteredGroup.addLayer(marker);
								}

							});

						}

					});

					if(map && features.length !== markers.length) {
						//map.fitBounds(filteredGroup.getBounds());
					}
					else {
						map.setView($scope.map.center, $scope.map.zoom);
					}

				}

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

				/*
				 * Sortable config
				 */
				$scope.sortLayer = {
					stop: function() {
						var newOrder = [];
						angular.forEach($scope.layers, function(layer) {
							newOrder.push(layer._id);
						});
						$scope.map.layers = newOrder;
					}
				}

				/*
				 * Map options auto input methods
				 */

				$scope.autoInput = {
					center: function() {
						var center = MapService.get().getCenter();
						$scope.map.center = [center.lat, center.lng];
					},
					zoom: function() {
						$scope.map.zoom = MapService.get().getZoom();
					},
					bounds: function() {
						var bounds = MapService.get().getBounds();
						$scope.map.bounds = [
							[
								bounds.getSouth(),
								bounds.getWest()
							],
							[
								bounds.getNorth(),
								bounds.getEast()
							]
						];
					},
					minZoom: function() {
						$scope.map.minZoom = MapService.get().getZoom();
					},
					maxZoom: function() {
						$scope.map.maxZoom = MapService.get().getZoom();
					},
					all: function() {
						this.center();
						this.zoom();
						this.bounds();
						this.minZoom();
						this.maxZoom();
					}
				};

				$scope.$on('map.save.success', function(event, map) {
					Page.setTitle(map.title);
					origMap = map;
					$scope.map = angular.copy(map);
				});

				$scope.$on('map.delete.success', function() {
					$location.path('/dashboard/maps').replace();
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

			});

		} else {

			Page.setTitle('Mapas');

			Map.resource.query(function(res) {
				$scope.maps = res.maps;

				$scope.$watch('search', _.debounce(function(text) {

					if(text) {

						Map.resource.query({
							search: text
						}, function(searchRes) {

							$scope.maps = searchRes.maps;

						});

					} else {

						Map.resource.query(function(res) {
							$scope.maps = res.maps;
						});

					}

				}, 300));

			});

		}

		$scope.$on('map.page.next', function(event, res) {
			if(res.maps.length) {
				angular.forEach(res.maps, function(map) {
					$scope.maps.push(map);
				});
				$scope.maps = $scope.maps; // trigger digest
			}
		});

	}
];