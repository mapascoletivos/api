'use strict';

/*
 * Geocode service
 */

angular.module('mapasColetivos.geocode', [])

.factory('GeocodeService', [
	'$http',
	function($http) {
		return {
			get: function(query) {
				return $http.jsonp('http://nominatim.openstreetmap.org/search.php?q=' + query + '&format=json&polygon_geojson=1&json_callback=JSON_CALLBACK', {
					loadingMessage: 'Buscando localizações'
				});
			}
		}
	}
]);