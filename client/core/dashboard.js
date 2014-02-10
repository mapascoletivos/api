'use strict';

require('angular/angular');
var grvtr = require('grvtr');

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
	'$rootScope',
	'$state',
	'$stateParams',
	'SessionService',
	'$location',
	'Layer',
	'Map',
	function($scope, $rootScope, $state, $stateParams, SessionService, $location, Layer, Map) {

		if(!SessionService.authenticated) {
			window.location = '/login';
		}
		$scope.user = SessionService.user;

		$scope.user.grvtr = grvtr.create($scope.user.email, {
			size: 58,
			defaultImage: 'mm',
			rating: 'g'
		});

		var stateFunctions = function() {
			if($state.current.name === 'dashboard')
				$location.path('/dashboard/layers').replace();
			$scope.currentState = $state.current.name.replace('dashboard.', '');
		}

		stateFunctions();
		$rootScope.$on('$stateChangeSuccess', function() {
			stateFunctions();
		});

		Layer.resource.query({
			creatorOnly: true
		}, function(res) {
			$scope.layers = res.layers;
		});

		Map.resource.query({
			creatorOnly: true
		}, function(res) {
			$scope.maps = res.maps;
		});

		$rootScope.$on('map.delete.success', function(event, map) {
			$scope.maps = $scope.maps.filter(function(m) { return map._id != m._id; });
		});

		$rootScope.$on('layer.delete.success', function(event, layer) {
			$scope.layers = $scope.layers.filter(function(m) { return layer._id != m._id; });
		});

	}
]);