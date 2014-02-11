'use strict';

require('angular/angular');

angular
	.module('mapasColetivos.feature', [])
	.factory('Feature', require('./service').Feature)
	.controller('FeatureCtrl', require('./controller').FeatureCtrl)
	.controller('FeatureEditCtrl', require('./editController').FeatureEditCtrl);