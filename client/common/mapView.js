'use strict';

/*
 * Map View controller
 */

angular.module('mapasColetivos.mapView', [])

.factory('MapView', [
	'MapService',
	function(MapService) {

		var sidebar = true;

		var backLink = false;

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
			},
			backLink: function(url) {
				if(typeof url !== 'undefined') {
					backLink = url;
				}

				return backLink;
			}
		}

	}
])

.controller('MapViewCtrl', [
	'$scope',
	'$rootScope',
	'$location',
	'MapView',
	function($scope, $rootScope, $location, MapView) {

		$scope.mapView = MapView;

		$rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {

			if(from.name.indexOf('singleMap') == -1 && from.name.indexOf('singleLayer') == -1) {
				MapView.backLink(window.mcHistory[window.mcHistory.length-2]);
			}

		});

		$scope.mapView.goBack = function() {

			if(MapView.backLink()) {
				$location.path(MapView.backLink());
			}

		}

	}
]);