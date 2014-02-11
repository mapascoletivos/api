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
	function($scope, $location, $state, $stateParams, Page, Map, Layer, MapService, Message, SessionService) {

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

				Layer.resource.query({
					creatorOnly: true
				}, function(res) {

					Page.setTitle(map.title);

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
								Layer.resource.get({layerId: layerId}, function(layer) {
									layer = fetchedLayers[layer._id] = layer;
									renderLayer(layer);
								});
							}

						});

					});

				});

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