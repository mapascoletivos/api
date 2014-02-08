'use strict';

require('angular/angular');

/*
 * Geocode service
 */

angular.module('mapasColetivos.geocode', [])

.factory('GeocodeService', [
	'$http',
	function($http) {
		return {
			get: function(query) {
				return $http.jsonp('http://nominatim.openstreetmap.org/search.php?q=' + query + '&format=json&json_callback=JSON_CALLBACK');
			}
		}
	}
]);