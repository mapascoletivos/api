'use strict';

var readFile = require('./readfile');

exports.DataImportCtrl = [
	'$scope',
	'$rootScope',
	function($scope, $rootScope) {

		$scope.selectFile = function(layer) {

			if(!layer._id) {
				
			}

			jQuery('#import-data-input').trigger('click');

		}

		$rootScope.$on('DataInputChanged', function(e, node) {
			onSubmit(node);
		});

		function onSubmit(node) {

			var files = node.files;
			if (!(files && files[0])) return;
				readFile.readAsText(files[0], function(err, text) {
				readFile.readFile(files[0], text, onImport);
			});

		}

        function onImport(err, gj, warning) {
        	console.log(gj);
        	console.log(err);
        }

	}
];