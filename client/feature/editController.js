'use strict';

var featureToMapObj = require('./featureToMapObjService');

/*
 * Feature edit controller
 */

exports.FeatureEditCtrl = [
	'$scope',
	'$rootScope',
	'$timeout',
	'Feature',
	'Maki',
	'Layer',
	'MessageService',
	'GeocodeService',
	'MapService',
	function($scope, $rootScope, $timeout, Feature, Maki, Layer, Message, Geocode, MapService) {

		var layer;

		var draw;

		$scope.$layer = Layer;

		$scope.$watch('$layer.edit()', function(editing) {
			layer = editing;
			var map = MapService.get();
			if(map) {
				map.on('draw:created', function(e) {
					$scope.drawing = false;
					$scope.editing.geometry = e.layer.toGeoJSON().geometry;
					init($scope.editing);
				});
			}
		});

		$scope.$feature = Feature;

		$scope.$watch('$feature.get()', function(features) {
			$scope.features = features;
		});

		var originalEditing;

		var init = function(editing) {
			$scope.tool = false;
			$scope.marker = false;
			$scope._data = {};
			$scope.editing = angular.copy(editing);
			originalEditing = angular.copy(editing);
			if(draw) {
				draw.disable();
			}
			if(editing) {
				$scope.setMarker();
				if($scope.editing.geometry && editing.geometry.type == 'Point' && !editing.geometry.coordinates) {
					MapService.get().on('click', addMarkerOnClick);
				} else {
					if(MapService.get())
						MapService.get().off('click', addMarkerOnClick);
				}
				$rootScope.$broadcast('feature.edit.start', editing);
			} else {
				$rootScope.$broadcast('feature.edit.stop');
			}
			if(MapService.get()) {
				window.dispatchEvent(new Event('resize'));
				setTimeout(function() {
					MapService.get().invalidateSize(false);
					window.dispatchEvent(new Event('resize'));
				}, 300);
			}
		}

		$scope.$watch('$feature.edit()', init);

		$scope._data = {};

		$scope.marker = false;

		$scope.defaults = {
			scrollWheelZoom: false
		};

		$scope.newFeature = function(type) {
			Feature.edit({
				geometry: {
					type: type
				},
				properties: {}
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
				init($scope.editing);
			}

		}

		$scope.setMarker = function(focus) {

			var map = MapService.get();

			if(!map)
				return false;

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
								window.dispatchEvent(new Event('resize'));
								setTimeout(function() {
									window.dispatchEvent(new Event('resize'));
									map.invalidateSize(true);
									map.setView($scope.marker.getLatLng(), 15, {
										reset: true
									});
									map.invalidateSize(true);
								}, 200);
							}

						} else {

							if(($scope.editing.source == 'local' || !$scope.editing.source) && _.flatten($scope.editing.geometry.coordinates).length < 250) {
								$scope.marker.editing.enable();

								$scope.marker.on('edit', function(e) {
									$scope.editing.geometry = e.target.toGeoJSON().geometry;
								});
							}

							if(focus !== false) {
								window.dispatchEvent(new Event('resize'));
								setTimeout(function() {
									window.dispatchEvent(new Event('resize'));
									map.invalidateSize(false);
									map.fitBounds($scope.marker.getBounds());
								}, 300);
							}

						}

						MapService.addFeature($scope.marker);

					} else {

						switch($scope.editing.geometry.type) {
							case 'LineString':
								draw = new L.Draw.Polyline(map, {
									shapeOptions: {
										stroke: true,
										color: '#555',
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
										color: '#555',
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

			$scope.$emit('feature.save.init', $scope.editing);

			if($scope.editing && $scope.editing._id) {

				Feature.resource.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

					// Replace feature in local features
					angular.forEach($scope.features, function(feature, i) {
						if(feature._id == $scope.editing._id)
							$scope.features[i] = $scope.editing;
					});
					Feature.set($scope.features);

					$rootScope.$broadcast('features.updated');

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

					$rootScope.$broadcast('features.updated');

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

					$rootScope.$broadcast('features.updated');

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

			if(!$scope.editing.properties)
				$scope.editing.properties = {};

			if(!$scope.editing.title)
				$scope.editing.title = feature.display_name;

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

			init($scope.editing);

		}

		/*
		 * Property Editor
		 */

		$scope.properties = [];

		$scope.reservedProperties = [];

		$scope.isReservedProperty = function(propKey) {
			if($scope.reservedProperties.indexOf(propKey) !== -1)
				return true;
			return false;
		}

		$scope.removeProperty = function(id) {
			var properties = [];
			angular.forEach($scope.properties, function(property, i) {
				if(property._id !== id) {
					properties.push({
						_id: i,
						key: property.key,
						val: property.val
					});
				}
			});
			$scope.properties = properties;
		}

		$scope.removePropertyByKey = function(key) {
			var properties = [];
			angular.forEach($scope.properties, function(property, i) {
				if(property.key !== key) {
					properties.push({
						_id: i,
						key: property.key,
						val: property.val
					});
				}
			});
			$scope.properties = properties;
		}

		$scope.addProperty = function(key, val) {

			if(typeof key == 'undefined')
				key = '';

			if(typeof val == 'undefined')
				val = '';

			$scope.properties.push({
				_id: $scope.properties.length,
				key: key,
				val: val
			});

			$scope.properties = $scope.properties;

		}

		var getProperty = function(key) {
			return _.find($scope.properties, function(prop) { return prop.key == key; });
		};

		var updateProperties = function(properties) {
			for(var key in properties) {
				$scope.updateProperty(key, properties[key]);
			}
			$scope.properties = $scope.properties;
		};

		var updateProperty = function(key, val) {
			if(getProperty(key)) {
				getProperty(key).val = val;
			} else {
				$scope.addProperty(key, val);
			}
		}

		$scope.$watch('editing', function(editing) {
			if(editing) {
				var properties = editing.properties;
				$scope.properties = [];
				var i = 0;
				if(properties) {
					for(var key in properties) {
						$scope.properties.push({
							_id: i,
							key: key,
							val: properties[key]
						});
						i++;
					}
				}
				$scope.properties = $scope.properties; // trigger digest
			}
		});

		var saveProperties = function() {
			if($scope.editing) {
				var properties = {};
				if($scope.properties.length) {
					angular.forEach($scope.properties, function(prop) {
						properties[prop.key] = prop.val;
					});
				}
				$scope.editing.properties = angular.copy(properties);
			}
		};

		var unHookSaveProperties = $scope.$on('feature.save.init', saveProperties);
		$scope.$on('$destroy', unHookSaveProperties);

		/*
		 * Style editor
		 */

		var defaultStyles;

		$scope.$watch('$layer.edit()', function(layer) {
			if(layer) {
				defaultStyles = layer.styles;
			}
		}, true);

		$scope.reservedProperties = $scope.reservedProperties.concat([
			'marker-size',
			'marker-color',
			'marker-symbol',
			'stroke',
			'stroke-width',
			'stroke-opacity',
			'fill',
			'fill-opacity',
			'customStyle'
		]);

		$scope.maki = Maki.maki;
		$scope.makiSprite = Maki.makiSprite;

		var setStyles = function() {
			if($scope.editing.geometry.type == 'Point') {
				$scope.marker.setIcon(L.mapbox.marker.icon($scope.editing.styles));
			} else {
				$scope.marker.setStyle(L.mapbox.simplestyle.style({properties: $scope.editing.styles}));
			}
		}

		var unHookSetStyles = $scope.$on('feature.edit.start', function(event, feature) {

			if(feature && feature.properties && feature.geometry && feature.geometry.type && defaultStyles) {
				if(!feature.properties.customStyle) {
					feature.styles = _.extend(feature.styles || {}, defaultStyles[feature.geometry.type]);
				} else {
					feature.styles = feature.properties;
				}
				$scope.editing.styles = feature.styles;
			}

			if($scope.marker) {
				setStyles();
			}

		});

		$scope.$on('$destroy', unHookSetStyles);

		$scope.$watch('editing.styles', _.debounce(function(styles, oldVal) {

			if($scope.editing && $scope.editing.geometry && $scope.editing.geometry.coordinates) {

				var dS = angular.copy(defaultStyles[$scope.editing.geometry.type]);

				if(styles === false) {
					$scope.editing.styles = dS;
					window.dispatchEvent(new Event('resize'));
					delete $scope.editing.properties.customStyle;
					$scope.editing = $scope.editing; // trigger digest
					$scope.removePropertyByKey('customStyle');
				}

				if(angular.equals(styles, dS)) {
					for(var styleProp in dS) {
						$scope.removePropertyByKey(styleProp);
					}
					$scope.removePropertyByKey('customStyle');
				} else {
					for(var styleProp in dS) {
						updateProperty(styleProp, styles[styleProp]);
					}
					updateProperty('customStyle', 1);
				}

				setStyles();
			}

		}, 150), true);

		/*
		 * Save feature on layer save
		 */
		var unHookSaveLayer = $scope.$on('layer.save.success', function() {
			if($scope.editing) {
				$scope.save(true);
			}
		});
		$scope.$on('$destroy', unHookSaveLayer);

	}
];