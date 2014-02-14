'use strict';

/* 
 * User module
 */
angular
	.module('mapasColetivos.user', [])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('user', {
					url: '/user/:userName',
					controller: 'UserCtrl',
					templateUrl: '/views/user/show.html'
				})
				.state('user.layers', {
					url: '/layers',
					templateUrl: '/views/user/layers.html'
				})
				.state('user.maps', {
					url: '/maps',
					templateUrl: '/views/user/maps.html'
				});
		}
	])
	.factory('User', require('./service').User)
	.controller('UserCtrl', require('./controller').UserCtrl);