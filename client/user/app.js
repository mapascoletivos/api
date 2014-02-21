'use strict';

/* 
 * User module
 */
angular
	.module('mapasColetivos.user', [
		'btford.modal'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('user', {
					url: '/user/:userId/',
					controller: 'UserCtrl',
					templateUrl: '/views/user/show.html'
				})
				.state('user.layers', {
					url: 'layers/',
					templateUrl: '/views/user/layers.html'
				})
				.state('user.maps', {
					url: 'maps/',
					templateUrl: '/views/user/maps.html'
				});
		}
	])
	.factory('User', require('./service').User)
	.factory('ChangePwd', require('./changePwd').changePwd)
	.factory('ChangeEmail', require('./changeEmail').changeEmail)
	.controller('UserCtrl', require('./controller').UserCtrl);