'use strict';

/*
 * Layer service
 */
exports.Layer = [
	'$resource',
	'$rootScope',
	'apiPrefix',
	function($resource, $rootScope, apiPrefix) {

		var editing = false;

		var params = {};

		return {
			resource: $resource(apiPrefix + '/layers/:layerId', null, {
				'query': {
					isArray: false,
					method: 'GET',
					loadingMessage: 'Carregando camadas',
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
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando camada'
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando camada'
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo camada'
				},
				'addContributor': {
					url: apiPrefix + '/layers/:layerId/contributors/add',
					method: 'PUT',
					loadingMessage: 'Adicionando colaborador',
					params: {
						layerId: '@layerId',
						email: '@email'
					}
				},
				'removeContributor': {
					url: apiPrefix + '/layers/:layerId/contributors/remove',
					method: 'DELETE',
					loadingMessage: 'Removendo colaborador',
					params: {
						layerId: '@layerId',
						contributorId: '@contributorId'
					}
				}
			}),
			busy: false,
			nextPage: function() {
				var self = this;
				if(!self.busy) {
					self.busy = true;
					this.resource.query(_.extend(params, {
						page: params.page + 1
					}), function(res) {
						if(res.layers.length) {
							self.busy = false;
							$rootScope.$broadcast('layer.page.next', res);
						}
					});
				}
			},
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