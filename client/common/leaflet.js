'use strict';

//L.Icon.Default.imagePath = '/img/leaflet';

/*
 * Leaflet service
 */

angular.module('mapasColetivos.leaflet', [])

.factory('MapService', [
	function() {

		var map,
			markerLayer = L.featureGroup(),
			groups = [],
			markers = [],
			hiddenMarkers = [],
			baseTile = 'http://{s}.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png';

		var featureToMapObj = require('../feature/featureToMapObjService');

		return {
			init: function(id, config) {
				this.destroy();
				map = L.mapbox.map(id, null, config);
				map.whenReady(function() {
					map.addLayer(L.tileLayer(baseTile));
					map.addLayer(markerLayer);
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
			},
			clearGroups: function() {
				if(groups.length) {
					angular.forEach(groups, function(group) {
						if(map.hasLayer(group))
							map.removeLayer(group);
					});
				}
				groups = []
			},
			clearAll: function() {
				this.clearMarkers();
				this.clearGroups();
			},
			destroy: function() {
				this.clearAll();
				if(map instanceof L.Map)
					map.remove();
				map = null;
			}
		}
	}
]);