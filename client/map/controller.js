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
	'Page',
	'Map',
	'Layer',
	'MapService',
	'MessageService',
	'SessionService',
	function($scope, $location, $state, $stateParams, Page, Map, Layer, MapService, Message, Session) {

		/*
		 * Permission control
		 */
		$scope.canEdit = function(map) {

			if(!map || !Session.user)
				return false;

			if(typeof map.creator == 'string' && map.creator == Session.user._id) {
				return true;
			} else if(typeof map.creator == 'object' && map.creator._id == Session.user._id) {
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

					});

				}

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

					$scope.layers.push(layer);
					$scope.layers = $scope.layers; // update val (push method doesn't apply on angular)

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

			});

		} else {

			Page.setTitle('Mapas');

			Map.resource.query(function(res) {
				$scope.maps = res.maps;
			});

		}

	}
];