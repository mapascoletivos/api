'use strict';

/*
 * Map View controller
 */

angular.module('mapasColetivos.mapView', [])

.factory('MapView', [
	'MapService',
	function(MapService) {

		var sidebar = true;

		return {
			sidebar: function(enable) {
				if(typeof enable !== 'undefined') {
					sidebar = enable;
					setTimeout(function() {
						if(MapService.get())
							MapService.get().invalidateSize();
					}, 200);
				}

				return sidebar;
			}
		}

	}
])

.controller('MapViewCtrl', [
	'$scope',
	'MapView',
	function($scope, MapView) {

		$scope.mapView = MapView;

	}
]);