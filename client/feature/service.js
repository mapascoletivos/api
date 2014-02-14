'use strict';

/*
 * Feature service
 */
exports.Feature = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		var features = [],
			filter = false,
			editing = false;

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
			// Object sharing between controllers methods
			set: function(val) {
				features = val;
			},
			add: function(val) {
				features.push(val);
			},
			get: function() {
				return features;
			},
			edit: function(content) {
				if(typeof content !== 'undefined')
					editing = content;

				return editing;
			},
			getContents: function(feature, contents) {

				if(feature.contents.length) {

					if(contents && contents.length) {

						var featureContents = contents.filter(function(content) {
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