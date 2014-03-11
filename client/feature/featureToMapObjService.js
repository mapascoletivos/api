'use strict';

module.exports = function(feature, options) {

	var feature = angular.copy(feature);

	var geojson = L.geoJson({
		'type': 'FeatureCollection',
		'features': []
	});

	if(feature.geometry && feature.geometry.coordinates) {

		if(!feature.properties) {
			feature.properties = {};
		}

		if(feature.geometry.type == 'Polygon') {

			var leafletCoordinates = [];

			_.each(feature.geometry.coordinates[0], function(latlng) {

				// Clear Y value
				latlng.splice(2,1);

				leafletCoordinates.push(latlng.reverse());
			});

			return L.polygon(leafletCoordinates);

		} else if(feature.geometry.type == 'LineString') {

			var leafletCoordinates = [];

			_.each(feature.geometry.coordinates, function(latlng) {
				
				// Clear Y value
				latlng.splice(2,1);

				leafletCoordinates.push(latlng.reverse());

			});

			return L.polyline(leafletCoordinates);

		} else if(feature.geometry.type == 'Point') {

			feature.properties = angular.extend({
				'marker-size': 'medium',
				'marker-color': '#444',
				'stroke': '#333',
				'stroke-width': 2,
				'fill': '#444'
			}, feature.properties);

			options = angular.extend({
				icon: L.mapbox.marker.icon(feature.properties)
			}, options);
				
			// Clear Y value
			feature.geometry.coordinates.splice(2,1);

			var leafletCoordinates = feature.geometry.coordinates.reverse();

			return L.marker(leafletCoordinates, options);

		}

	}

	return false;
}