'use strict';

/*
 * Leaflet service
 */

angular.module('mapasColetivos.leaflet', [])

.factory('MapService', [
	function() {

		var map = false,
			markerLayer = L.featureGroup(),
			groups = [],
			markers = [],
			hiddenMarkers = [],
			baseLayer = L.mapbox.tileLayer('tmcw.map-7s15q36b'),
			legendControl = L.mapbox.legendControl();

		var featureToMapObj = require('../feature/featureToMapObjService');

		return {
			init: function(id, config) {
				this.destroy();
				//config = _.extend({ infoControl: tr, attributionControl: true }, config);
				map = L.mapbox.map(id, null, config);
				map.whenReady(function() {
					console.log(map);
					map.addLayer(baseLayer);
					map.addLayer(markerLayer);
					map.addControl(legendControl);
					map.infoControl.addInfo('<a href="https://www.mapbox.com/map-feedback/" target="_blank" class="mapbox-improve-map">Melhore este mapa</a>');
				});
				return map;
			},
			get: function() {
				return map;
			},
			clearMarkers: function() {
				if(markers.length) {
					angular.forEach(markers, function(marker) {
						if(markerLayer.hasLayer(marker))
							markerLayer.removeLayer(marker);
					});
					markers = [];
				}
			},
			getMarkerLayer: function() {
				return markerLayer;
			},
			addMarker: function(marker) {
				markerLayer.addLayer(marker);
				markers.push(marker);
			},
			removeMarker: function(marker) {
				markers = markers.filter(function(m) { return m !== marker; });
				markerLayer.removeLayer(marker);
			},
			hideMarker: function(marker) {
				if(markers.indexOf(marker) !== -1) {
					markerLayer.removeLayer(marker);
					hiddenMarkers.push(marker);
					markers = markers.filter(function(m) { return m !== marker; });
				}
			},
			showMarker: function(marker) {
				if(hiddenMarkers.indexOf(marker) !== -1) {
					markerLayer.addMarker(marker);
					markers.push(marker);
					hiddenMarkers = markers.filter(function(m) { return m !== marker; });
				}
			},
			showAllMarkers: function() {
				if(hiddenMarkers.length) {
					angular.forEach(hiddenMarkers, function(hM) {
						this.showMarker(hM);
					});
				}
			},
			fitWorld: function() {
				map.setView([0,0], 2);
			},
			fitMarkerLayer: function() {
				if(map instanceof L.Map) {
					map.invalidateSize(false);
					if(markers.length) {
						map.fitBounds(markerLayer.getBounds());
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
					var markers = [];
					var markerLayer = L.featureGroup();
					markerLayer.mcLayer = layer;
					groups.push(markerLayer);
					angular.forEach(layer.features, function(f) {
						var marker = featureToMapObj(f);
						marker.mcFeature = f;
						markers.push(marker);
						markerLayer.addLayer(marker);
					});
					markerLayer.addTo(map);
					return {
						markerLayer: markerLayer,
						markers: markers
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
				this.clearMarkers();
				this.clearGroups();
			},
			destroy: function() {
				this.clearAll();
				baseLayer = L.mapbox.tileLayer('tmcw.map-7s15q36b');
				legendControl = L.mapbox.legendControl();
				if(map instanceof L.Map)
					map.remove();
				map = null;
			}
		}
	}
]);