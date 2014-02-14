'use strict';

/* 
 * User module
 */
angular
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
					url: '/user/:userName/layers',
					templateUrl: '/views/user/layers.html'
				});
				.state('user.maps', {
					url: '/user/:userName/maps',
					templateUrl: '/views/user/maps.html'
				});
		}
	])
	.module('mapasColetivos.user', [])
	.factory('User', require('./service').User)
	.controller('UserCtrl', require('./controller').UserCtrl);