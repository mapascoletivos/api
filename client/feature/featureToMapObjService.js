'use strict';

module.exports = function(feature, options, map) {

	var lFeature = false;

	if(feature.geometry && feature.geometry.coordinates) {

		if(!feature.properties) {
			feature.properties = {};
		}

		var coordinates = angular.copy(feature.geometry.coordinates);
		var leafletCoordinates = coordinates;

		if(feature.geometry.type == 'Polygon') {

			var leafletCoordinates = [];
			_.each(coordinates[0], function(latlng) {
				// Clear Y value
				latlng.splice(2,1);
				leafletCoordinates.push(latlng.reverse());
			});

			lFeature = L.polygon(leafletCoordinates, L.mapbox.simplestyle.style(feature));

		} else if(feature.geometry.type == 'LineString') {

			leafletCoordinates = [];
			_.each(coordinates, function(latlng) {
				// Clear Y value
				latlng.splice(2,1);
				leafletCoordinates.push(latlng.reverse());
			});

			lFeature = L.polyline(leafletCoordinates, L.mapbox.simplestyle.style(feature));

		} else if(feature.geometry.type == 'Point') {

			options = angular.extend({
				icon: L.mapbox.marker.icon(feature.properties)
			}, options);
				
			// Clear Y value
			coordinates.splice(2,1);
			leafletCoordinates = coordinates.reverse();

			lFeature = L.marker(leafletCoordinates, options);

		}

	}

	if(lFeature && map) {

		var popupOptions = {};

		if(feature.geometry.type !== 'Point')
			popupOptions.autoPan = false;

		var popup = L.popup(popupOptions).setContent('<h3 class="feature-title">' + feature.title + '</h3>');

		var followMousePopup = function(e) {
			popup.setLatLng(e.latlng);
		}

		lFeature
			.on('mouseover', function() {
				lFeature.openPopup();
				if(feature.geometry.type !== 'Point')
					map.on('mousemove', followMousePopup);
			})
			.on('mouseout', function() {
				lFeature.closePopup();
				if(feature.geometry.type !== 'Point')
					map.off('mousemove', followMousePopup);
			})
			.bindPopup(popup);
	}

	return lFeature;
}