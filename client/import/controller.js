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

		var disableInputChange = $scope.$on('import.input.change', function(e, node) {
			onSubmit(node);
		});

		$scope.$on('$destroy', function() {
			disableInputChange();
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
						type: 'FeatureLayer',
						isDraft: false
					});
					draft.$save(function(draft) {

						doImport(draft.layer, gj, function() {
							$location.path('/layers/' + draft.layer._id + '/edit/');
						});
					});

        		} else {

        			var layer = Layer.edit();

        			doImport(layer, gj, function() {
        				if(layer.isDraft) {
        					layer.isDraft = false;
        					delete layer.features;
        					delete layer.contents;
        					Layer.resource.update({layerId: layer._id}, layer, function(res) {
        						window.location.reload();
        					})
        				} else {
        					window.location.reload();
        				}
        			});

        		}

        	}
        }

        function doImport(layer, gj, callback) {

			var features = [];
			angular.forEach(gj.features, function(feature) {

				if(feature.geometry) {

					if(feature.properties.title && typeof feature.properties.title == 'string')
						feature.title = feature.properties.title;
					else if(feature.properties.name && typeof feature.properties.name == 'string')
						feature.title = feature.properties.name;
					else
						feature.title = 'Untitled';

					if(feature.geometry.type == 'GeometryCollection' && feature.geometry.geometries) {

						angular.forEach(feature.geometry.geometries, function(geometry) {
							var collectionFeature = angular.copy(feature);
							collectionFeature.geometry = geometry;
							features.push(collectionFeature);
						});

					} else {

						features.push(feature);

					}

				}

			});

			Feature.resource.import({layerId: layer._id}, features, callback);

        }

	}
];