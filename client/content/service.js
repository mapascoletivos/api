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