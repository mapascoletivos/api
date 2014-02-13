'use strict';

require('angular/angular');

/*
 * Content service
 */
 
exports.Content = [
	'$resource',
	'apiPrefix',
	'LayerSharedData',
	'Feature',
	function($resource, apiPrefix, LayerSharedData, Feature) {

		var contents = [];
		var editing = false;

		return {
			resource: $resource(apiPrefix + '/contents/:contentId', {'_csrf': window.token}, {
				'save': {
					method: 'POST',
					url: apiPrefix + '/contents',
					params: {
						layer: '@id'
					}
				},
				'delete': {
					method: 'DELETE',
					url: apiPrefix + '/contents/:contentId'
				},
				'update': {
					method: 'PUT'
				}
			}),
			// Object sharing between controllers methods
			set: function(val) {
				contents = val;
			},
			add: function(val) {
				contents.push(val);
			},
			get: function() {
				return contents;
			},
			edit: function(content) {
				if(typeof content !== 'undefined')
					editing = content;

				return editing;
			},
			// Get content features method
			getFeatures: function(content) {

				if(content.features.length) {

					var layerFeatures = LayerSharedData.features();

					if(layerFeatures && layerFeatures.length) {

						var contentFeatures = layerFeatures.filter(function(feature) {
							return content.features.indexOf(feature._id) !== -1;
						});

						return contentFeatures;

					}

				}

				return false;

			}
		};

	}
];