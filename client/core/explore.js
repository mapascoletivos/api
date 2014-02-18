'use strict';

angular.module('mapasColetivos.explore', [])

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('explore', {
				url: '/explore/',
				controller: 'ExploreCtrl',
				templateUrl: '/views/explore.html'
			});

	}
])

.controller('ExploreCtrl', [
	'$scope',
	'Page',
	'Layer',
	'Map',
	function($scope, Page, Layer, Map) {

		Page.setTitle('Explore a comunidade');

		Layer.resource.get({
			perPage: 4
		}, function(res) {

			$scope.layers = res.layers;

		});

		Map.resource.get({
			perPage: 4
		}, function(res) {

			$scope.maps = res.maps;

		});

	}
]);