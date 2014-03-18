'use strict';

/*
 * Map service
 */

exports.Map = [
	'$resource',
	'$rootScope',
	'apiPrefix',
	'LoadingService',
	'MessageService',
	function($resource, $rootScope, apiPrefix, Loading, Message) {

		var params = {};

		return {
			resource: $resource(apiPrefix + '/maps/:mapId', null, {
				'query': {
					isArray: false,
					method: 'GET',
					loadingMessage: 'Carregando mapas',
					params: {
						perPage: 10,
						page: 1
					},
					interceptor: {
						response: function(data) {
							params = data.config.params;
							return data.data;
						}
					}
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando mapa',
					interceptor: {
						response: function(data) {
							var map = data.data;

							if(map.southWest && map.northEast) {
								map.bounds = [map.southWest, map.northEast];
							}

							return map;
						}
					}
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando mapa'
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo mapa'
				}
			}),
			busy: false,
			nextPage: function() {
				var self = this;
				Loading.disable();
				if(!self.busy) {
					self.busy = true;
					this.resource.query(_.extend(params, {
						page: params.page + 1
					}), function(res) {
						if(res.maps.length) {
							self.busy = false;
							$rootScope.$broadcast('map.page.next', res);
						}
						Loading.enable();
					});
				}
			},
			isDraft: function(map) {
				return map.isDraft;
			},
			deleteDraft: function(map) {
				Message.disable();
				if(this.isDraft(map)) {
					this.resource.delete({mapId: map._id}, function() {
						Message.enable();
					});
				}
			}
		}

	}
];