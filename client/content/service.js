'use strict';

/*
 * Content service
 */
 
exports.Content = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		var contents = [];
		var editing = false;

		return {
			resource: $resource(apiPrefix + '/contents/:contentId', {}, {
				'query': {
					method: 'GET',
					isArray: false,
					loadingMessage: 'Carregando conteúdos'
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando conteúdo'
				},
				'save': {
					method: 'POST',
					loadingMessage: 'Criando conteúdo',
					url: apiPrefix + '/contents',
					params: {
						layer: '@id'
					}
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo conteúdo',
					url: apiPrefix + '/contents/:contentId'
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando conteúdo'
				}
			}),
			// Object sharing between controllers methods
			set: function(val) {
				contents = val;
				contents = _.sortBy(contents, function(c) {
					return c.createdAt;
				}).reverse();
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
			getFeatures: function(content, features) {

				if(content.features.length) {

					if(features && features.length) {

						var contentFeatures = features.filter(function(feature) {
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