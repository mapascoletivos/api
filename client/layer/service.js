'use strict';

/*
 * Layer service
 */
exports.Layer = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		var editing = false;

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
			edit: function(layer) {
				if(typeof layer !== 'undefined')
					editing = layer;

				return editing;
			},
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