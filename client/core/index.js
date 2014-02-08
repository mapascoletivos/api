'use strict';

require('angular/angular');

angular.module('mapasColetivos.index', [])

.controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	function($scope, SessionService, $location) {

		if(SessionService.authenticated) {
			$location.path('/dashboard').replace();
		}

	}
]);