'use strict';

require('../common/sirTrevor');

angular
	.module('mapasColetivos.content', [
		'mapasColetivos.sirTrevor'
	])
	.factory('Content', require('./service').Content)
	.controller('ContentCtrl', require('./controller').ContentCtrl)
	.controller('ContentEditCtrl', require('./editController').ContentEditCtrl);