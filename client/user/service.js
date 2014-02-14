'use strict';

/*
 * User service
 */

exports.User = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return {
			resource: $resource(apiPrefix + '/users', {}, {
				'update': {
					method: 'PUT'
				},
				'updatePwd': {
					method: 'PUT'
				}
			})
		}

	}
]