'use strict';

require('angular/angular');
require('angular-resource/angular-resource');

/*
 * Layer service
 */
exports.Layer = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return {
			resource: $resource(apiPrefix + '/layers/:layerId', {'_csrf': window.token}, {
				'query': {
					isArray: false,
					method: 'GET'
				},
				'update': {
					method: 'PUT'
				}
			}),
			isDraft: function(layer) {
				return layer.isDraft;
			},
			deleteDraft: function(layer, callback) {
				if(this.isDraft(layer)) {
					this.resource.delete({layerId: layer._id}, callback);
				}
			}
		};

	}
];