'use strict';

var readFile = require('./readfile');

exports.DataImportCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'Layer',
	'Feature',
	'MessageService',
	function($scope, $rootScope, $location, Layer, Feature, Message) {

		$rootScope.$on('import.input.change', function(e, node) {
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
        	if(err) {
        		Message.add({
        			status: 'error',
        			text: err.message
        		});
        	} else {
        		if(!Layer.edit()) {
        			var draft = new Layer.resource({
						title: 'Untitled',
						type: 'FeatureLayer'
					});
					draft.$save(function(draft) {
						var features = [];
						angular.forEach(gj.features, function(feature) {
							if(feature.properties.name && typeof feature.properties.name == 'string')
								feature.title = feature.properties.name;
							if(feature.properties.title && typeof feature.properties.title == 'string')
								feature.title = feature.properties.title;
							else
								feature.title = 'Untitled';

							features.push(feature);

						});

						Feature.resource.import({layerId: draft.layer._id}, features, function() {
							$location.path('/layers/' + draft.layer._id + '/edit/');
						});
					});
        		}
        	}
        }

	}
];