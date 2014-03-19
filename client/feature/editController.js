'use strict';

var featureToMapObj = require('./featureToMapObjService');

/*
 * Feature edit controller
 */

exports.FeatureEditCtrl = [
	'$scope',
	'$rootScope',
	'Feature',
	'Layer',
	'MessageService',
	'GeocodeService',
	'MapService',
	function($scope, $rootScope, Feature, Layer, Message, Geocode, MapService) {

		var layer;

		var drawControl;

		$scope.$layer = Layer;

		$scope.$watch('$layer.edit()', function(editing) {
			layer = editing;
			var map = MapService.get();
			if(map) {
				drawControl = new L.Control.Draw();
				map.on('draw:created', function(e) {
					$scope.drawing = false;
					$scope.marker = e.layer;
					$scope.editing.geometry = e.layer.toGeoJSON().geometry;
					Feature.edit($scope.editing);
					$scope.marker.editing.enable();
					$scope.marker.on('edit', function(e) {
						$scope.editing.geometry = e.target.toGeoJSON().geometry;
					});
					MapService.addFeature($scope.marker);
					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
						MapService.get().fitBounds($scope.marker.getBounds());
					}, 200);
				});
			}
		});

		$scope.$feature = Feature;

		$scope.$watch('$feature.get()', function(features) {
			$scope.features = features;
		});

		$scope.$watch('$feature.edit()', function(editing) {
			$scope.tool = false;
			$scope.marker = false;
			$scope._data = {};
			$scope.editing = editing;
			if(editing) {
				$scope.setMarker();
				if($scope.editing.geometry && editing.geometry.type == 'Point' && !editing.geometry.coordinates) {
					MapService.get().on('click', addMarkerOnClick);
				}
				$rootScope.$broadcast('feature.edit.start');
			} else {
				$rootScope.$broadcast('feature.edit.stop');
			}
			setTimeout(function() {
				window.dispatchEvent(new Event('resize'));
			}, 200);
		});

		$scope._data = {};

		$scope.marker = false;

		$scope.defaults = {
			scrollWheelZoom: false
		};

		$scope.newFeature = function(type) {
			Feature.edit({
				geometry: {
					type: type
				}
			});
			$scope.setMarker(false);
		}

		var addMarkerOnClick = function(LatLng) {

			var LatLng = LatLng.latlng;

			if(!$scope.marker) {
				$scope.editing.geometry.coordinates = [
					LatLng.lng,
					LatLng.lat
				];
				Feature.edit($scope.editing);
				$scope.setMarker();
			}

		}

		$scope.setMarker = function(focus) {

			var map = MapService.get();

			MapService.clearFeatures();

			if($scope.editing) {

				if($scope.editing.geometry) {

					if($scope.editing.geometry.coordinates) {

						$scope.marker = featureToMapObj($scope.editing, {
							draggable: true
						});

						if($scope.editing.geometry.type == 'Point') {

							$scope.marker
								.bindPopup('<p class="tip">Arraste para alterar a localização.</p>')
								.on('dragstart', function() {
									$scope.marker.closePopup();
								})
								.on('drag', function() {
									$scope.marker.closePopup();
									var coordinates = $scope.marker.getLatLng();
									$scope.editing.geometry.coordinates = [
										coordinates.lng,
										coordinates.lat
									];
								});

							$scope.marker.openPopup();

							if(focus !== false) {
								setTimeout(function() {
									window.dispatchEvent(new Event('resize'));
									map.invalidateSize(false);
									map.setView($scope.marker.getLatLng(), 15, {
										reset: true
									});
								}, 150);
							}

						} else {

							if(($scope.editing.source == 'local' || !$scope.editing.source) && _.flatten($scope.editing.geometry.coordinates).length < 250) {
								$scope.marker.editing.enable();

								$scope.marker.on('edit', function(e) {
									$scope.editing.geometry = e.target.toGeoJSON().geometry;
								});
							}

							if(focus !== false) {
								setTimeout(function() {
									window.dispatchEvent(new Event('resize'));
									map.invalidateSize(false);
									map.fitBounds($scope.marker.getBounds());
								}, 150);
							}

						}

						MapService.addFeature($scope.marker);

					} else {

						var draw;

						switch($scope.editing.geometry.type) {
							case 'LineString':
								draw = new L.Draw.Polyline(map, {
									shapeOptions: {
										stroke: true,
										color: '#333',
										weight: 4,
										opacity: 0.5,
										fill: false,
										clickable: true
									}
								});
								draw.enable();
								break;
							case 'Polygon':
								draw = new L.Draw.Polygon(map, {
									shapeOptions: {
										stroke: true,
										color: '#333',
										weight: 4,
										opacity: 0.5,
										fill: true,
										clickable: true
									}
								});
								draw.enable();
								break;
						}

					}

				}

			}

		}

		$scope.save = function(silent) {

			if($scope.editing && $scope.editing._id) {

				Feature.resource.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

					// Replace feature in local features
					angular.forEach($scope.features, function(feature, i) {
						if(feature._id == $scope.editing._id)
							$scope.features[i] = $scope.editing;
					});
					Feature.set($scope.features);

					if(silent !== true) {
						Message.message({
							status: 'ok',
							text: 'Feature salva.'
						});
						Feature.edit(false);
					} else {
						Feature.edit(angular.copy($scope.editing));
					}

				});

			} else {

				var feature = new Feature.resource($scope.editing);

				feature.$save({layerId: layer._id}, function(feature) {

					// Locally push new feature
					$scope.features.push(feature);
					Feature.set($scope.features);

					// Update editing feature to saved data
					Feature.edit(angular.copy(feature));

					Message.message({
						status: 'ok',
						text: 'Feature adicionada.'
					});

				});

			}

		}

		$scope.delete = function() {

			if(confirm('Você tem certeza que deseja remover esta feature?')) {

				Feature.resource.delete({featureId: $scope.editing._id, layerId: layer._id}, function(res) {

					Feature.set($scope.features.filter(function(f) {
						return f._id !== $scope.editing._id;
					}));

					Message.message({
						status: 'ok',
						text: 'Feature removida.'
					});
					
					Feature.edit(false);

				});

			}

		}

		/*
		 * Tools
		 */

		$scope.tool = false;

		$scope.setTool = function(tool) {
			if(tool == $scope.tool)
				$scope.tool = false;
			else
				$scope.tool = tool;
		}

		$scope.geocode = function() {

			Geocode.get($scope._data.geocode)
				.success(function(res) {
					$scope._data.geocodeResults = res;
				})
				.error(function(err) {
					$scope._data.geocodeResults = [];
				});

		}

		$scope.setNominatimFeature = function(feature, type) {

			$scope.editing.source = 'osm';

			if(type == 'geojson') {

				$scope.editing.geometry = feature.geojson;

			} else {

				$scope.editing.geometry = {
					type: 'Point',
					coordinates: [
						parseFloat(feature.lon),
						parseFloat(feature.lat)
					]
				};

			}

			$scope.setMarker();

		}

		$scope.$on('layer.save.success', function() {

			if($scope.editing) {
				$scope.save(true);
			}

		});

	}
];