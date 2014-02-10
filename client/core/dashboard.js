'use strict';

require('angular/angular');

angular.module('mapasColetivos.dashboard', [])

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('dashboard', {
				url: '/dashboard',
				controller: 'DashboardCtrl',
				templateUrl: '/views/dashboard/index.html'
			})
			.state('dashboard.profile', {
				url: '/profile',
				templateUrl: '/views/dashboard/profile.html'
			});

	}
])

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

		$scope.currentState = $state.current;

		$scope.$watch('currentState', function(current) {

			$scope.current = current.name;

			console.log($scope.current);

		});

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