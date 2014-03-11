'use strict';

angular
	.module('mapasColetivos.dataImport', [])
	.directive('importInput', require('./directive').ImportInput)
	.directive('importInputTrigger', require('./directive').ImportInputTrigger)
	.controller('DataImportCtrl', require('./controller').DataImportCtrl);