'use strict';

require('angular/angular');
require('../common/sirTrevor');

angular
	.module('mapasColetivos.content', [
		'mapasColetivos.sirTrevor',
		'fitVids'
	])
	.factory('Content', require('./service').Content)
	.controller('ContentCtrl', require('./controller').ContentCtrl)
	.controller('ContentEditCtrl', require('./editController').ContentEditCtrl);