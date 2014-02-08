'use strict';

require('angular/angular');
require('angular-resource/angular-resource');

/*
 * Map service
 */

exports.Map = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return {
			resource: $resource(apiPrefix + '/maps/:mapId', {'_csrf': window.token}, {
				'query': {
					isArray: false,
					method: 'GET'
				},
				'update': {
					method: 'PUT'
				}
			})
		}

	}
];