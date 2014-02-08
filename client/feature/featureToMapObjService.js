'use strict';

var L = require('leaflet');

exports.featureToMapObj = [
	function() {
		return function(feature) {
			if(feature.geometry && feature.geometry.coordinates) {
				return L.marker(feature.geometry.coordinates);
			}
			return false;
		}
	}
];