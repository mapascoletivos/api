'use strict';

angular
	.module('mapasColetivos.feature', [])
	.factory('Feature', require('./service').Feature)
	.factory('Maki', require('./makiService').Maki)
	.controller('FeatureCtrl', require('./controller').FeatureCtrl)
	.controller('FeatureEditCtrl', require('./editController').FeatureEditCtrl);