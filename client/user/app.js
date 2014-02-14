'use strict';

/* 
 * User module
 */
angular
	.module('mapasColetivos.user', [])
	.factory('User', require('./service').User)
	.controller('UserCtrl', require('./controller').UserCtrl);