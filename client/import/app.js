'use strict';

angular
	.module('mapasColetivos.dataImport', [])
	.directive('DataInput', require('./directive').DataInput);
	.controller('DataImportCtrl', require('./controller').DataImportCtrl);