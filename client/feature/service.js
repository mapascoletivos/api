'use strict';

/*
 * Feature service
 */
exports.Feature = [
	'$resource',
	'apiPrefix',
	'LayerSharedData',
	function($resource, apiPrefix, LayerSharedData) {

		return {
			resource: $resource(apiPrefix + '/features/:featureId', {'_csrf': window.token}, {
				'save': {
					method: 'POST',
					url: apiPrefix + '/layers/:layerId/features'
				},
				'delete': {
					method: 'DELETE',
					url: apiPrefix + '/layers/:layerId/features/:featureId'
				},
				'update': {
					method: 'PUT'
				}
			}),
			getContents: function(feature) {

				if(feature.contents.length) {

					var layerContents = LayerSharedData.contents();

					if(layerContents && layerContents.length) {

						var featureContents = layerContents.filter(function(content) {
							return feature.contents.indexOf(content._id) !== -1;
						});

						return featureContents;

					}

				}

				return false;

			}
		};

	}
];