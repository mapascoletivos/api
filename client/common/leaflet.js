'use strict';

/*
 * Leaflet service
 */

angular.module('mapasColetivos.leaflet', [])

.factory('MapService', [
	function() {

		var map = false,
			featureLayer = L.featureGroup(),
			groups = [],
			features = [],
			hiddenFeatures = [],
			baseLayer = L.mapbox.tileLayer('infoamazonia.h17kafbd'),
			legendControl = L.mapbox.legendControl();

		var featureToMapObj = require('../feature/featureToMapObjService');

		return {
			init: function(id, config) {
				this.destroy();
				//config = _.extend({ infoControl: tr, attributionControl: true }, config);
				map = L.mapbox.map(id, null, config);
				map.whenReady(function() {
					map.addLayer(baseLayer);
					map.addLayer(featureLayer);
					map.addControl(legendControl);
					map.infoControl.addInfo('<a href="https://www.mapbox.com/map-feedback/" target="_blank" class="mapbox-improve-map">Melhore este mapa</a>');
				});
				return map;
			},
			get: function() {
				return map;
			},
			clearFeatures: function() {
				if(features.length) {
					angular.forEach(features, function(feature) {
						if(featureLayer.hasLayer(feature))
							featureLayer.removeLayer(feature);
					});
					features = [];
				}
			},
			getFeatureLayer: function() {
				return featureLayer;
			},
			addFeature: function(feature) {
				featureLayer.addLayer(feature);
				features.push(feature);
			},
			removeFeature: function(feature) {
				features = features.filter(function(f) { return f !== feature; });
				featureLayer.removeLayer(feature);
			},
			hideFeature: function(feature) {
				if(features.indexOf(feature) !== -1) {
					featureLayer.removeLayer(feature);
					hiddenFeatures.push(feature);
					features = features.filter(function(f) { return f !== feature; });
				}
			},
			showFeature: function(feature) {
				if(hiddenFeatures.indexOf(feature) !== -1) {
					featureLayer.addFeature(feature);
					features.push(feature);
					hiddenFeatures = features.filter(function(f) { return f !== feature; });
				}
			},
			showAllFeatures: function() {
				if(hiddenFeatures.length) {
					angular.forEach(hiddenFeatures, function(hM) {
						this.showFeature(hM);
					});
				}
			},
			fitWorld: function() {
				map.setView([0,0], 2);
			},
			fitFeatureLayer: function() {
				if(map instanceof L.Map) {
					map.invalidateSize(false);
					if(features.length) {
						map.fitBounds(featureLayer.getBounds());
					}
				}
				return map;
			},
			addLayer: function(layer) {
				if(layer.type == 'TileLayer') {
					var layer = this.addTileLayer(layer.url);
					layer.on('load', _.once(function() {
						legendControl.addLegend(layer._tilejson.legend);
					}));
					groups.push(layer);
				} else {
					var self = this;
					var features = [];
					var featureLayer = L.featureGroup();
					featureLayer.mcLayer = layer;
					groups.push(featureLayer);
					angular.forEach(layer.features, function(f) {
						var properties = angular.copy(layer.styles[f.geometry.type]);
						_.extend(properties, f.properties || {});
						f.properties = properties;
						var feature = featureToMapObj(f, null, self.get());
						feature.mcFeature = f;
						features.push(feature);
						featureLayer.addLayer(feature);
					});
					featureLayer.addTo(map);
					return {
						featureLayer: featureLayer,
						features: features
					};
				}
			},
			addTileLayer: function(url) {
				if(url.indexOf('http://') !== -1) {
					return L.tileLayer(url).addTo(map);
				} else {
					var layer = L.mapbox.tileLayer(url);
					layer.gridLayer = L.mapbox.gridLayer(url).addTo(map);
					layer.gridControl = L.mapbox.gridControl(layer.gridLayer).addTo(map);
					return layer.addTo(map);
				}
			},
			renderTileJSON: function(tilejson) {
				if(tilejson.legend) {
					legendControl.addLegend(tilejson.legend);
				}
				if(tilejson.center) {
					map.setView([tilejson.center[1], tilejson.center[0]], tilejson.center[2]);
				}
				if(tilejson.bounds) {
					var bounds = L.latLngBounds(
						L.latLng(tilejson.bounds[1], tilejson.bounds[2]),
						L.latLng(tilejson.bounds[3], tilejson.bounds[0])
					);
					map.setMaxBounds(bounds);
				}
				if(tilejson.maxZoom) {
					map.options.maxZoom = tilejson.maxZoom;
				}
				if(tilejson.minZoom) {
					map.options.minZoom = tilejson.minZoom;
				}
			},
			removeBaseLayer: function() {
				map.removeLayer(baseLayer);
			},
			clearGroups: function() {
				var self = this;
				if(groups.length) {
					angular.forEach(groups, function(group) {
						if(map.hasLayer(group)) {
							self.removeLayer(group);
						}
					});
				}
				groups = []
			},
			removeLayer: function(layer) {
				map.removeLayer(layer);
				if(layer._tilejson) {
					layer.gridControl.removeFrom(map);
					map.removeLayer(layer.gridLayer);
				}
			},
			clearAll: function() {
				this.clearFeatures();
				this.clearGroups();
			},
			destroy: function() {
				this.clearAll();
				baseLayer = L.mapbox.tileLayer('infoamazonia.h17kafbd');
				legendControl = L.mapbox.legendControl();
				if(map instanceof L.Map)
					map.remove();
				map = null;
			}
		}
	}
]);