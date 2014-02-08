'use strict';

require('angular/angular');

angular.module('mapasColetivos.dashboard', [])

.controller('DashboardCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'SessionService',
	'$location',
	'Layer',
	'Map',
	function($scope, $state, $stateParams, SessionService, $location, Layer, Map) {
		if(!SessionService.authenticated) {
			window.location = '/login';
		}
		$scope.user = SessionService.user;

		Layer.query({
			creatorOnly: true
		}, function(res) {
			$scope.layers = res.layers;
		});

		Map.resource.query({
			creatorOnly: true
		}, function(res) {
			$scope.maps = res.maps;
		});

	}
]);