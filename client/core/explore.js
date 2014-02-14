'use strict';

angular.module('mapasColetivos.explore', [])

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('explore', {
				url: '/explore',
				controller: 'ExploreCtrl',
				templateUrl: '/views/explore.html'
			});

	}
])

.controller('ExploreCtrl', [
	'$scope',
	'Page',
	function($scope, Page) {

		Page.setTitle('Explore');

	}
]);