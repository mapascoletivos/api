'use strict';

require('angular/angular');
window.L = require('leaflet');
require('mapbox.js');

module.exports = function(feature, options) {

	if(feature.geometry && feature.geometry.coordinates) {

		if(!feature.properties) {
			feature.properties = {};
		}

		feature.properties = angular.extend({
			'marker-size': 'medium',
			'marker-color': '#444',
			'stroke': '#333',
			'stroke-width': 2,
			'fill': '#444'
		}, feature.properties);

		var options = angular.extend({
			icon: L.mapbox.marker.icon(feature.properties)
		}, options);

		return L.marker(feature.geometry.coordinates, options);
	}
	return false;
}