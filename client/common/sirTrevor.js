'use strict';

/*
 * Sir Trevor
 */

angular.module('mapasColetivos.sirTrevor', [])

.directive('sirTrevorEditor', [
	'apiPrefix',
	function(apiPrefix) {
		return {
			link: function(scope, element, attrs) {
				SirTrevor.setDefaults({
					uploadUrl: apiPrefix + '/images'
				});
				scope.sirTrevor = new SirTrevor.Editor({
					el: jQuery(element),
					blockTypes: [
						'Embedly',
						'Text',
						'List',
						'Image',
						'Video'
					],
					defaultType: 'Text',
					required: 'Text'
				});
			}
		}
	}
])
.factory('SirTrevor', [
	function() {

		// Providers regex from SirTrevor's video block code
		var videoProviders = {
			vimeo: {
				regex: /(?:http[s]?:\/\/)?(?:www.)?vimeo.com\/(.+)/,
				html: "<iframe src=\"{{protocol}}//player.vimeo.com/video/{{remote_id}}?title=0&byline=0\" width=\"580\" height=\"320\" frameborder=\"0\"></iframe>"
			},
			youtube: {
				regex: /(?:http[s]?:\/\/)?(?:www.)?(?:(?:youtube.com\/watch\?(?:.*)(?:v=))|(?:youtu.be\/))([^&].+)/,
				html: "<iframe src=\"{{protocol}}//www.youtube.com/embed/{{remote_id}}\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
			}
		};

		return {
			render: function(blocks) {
				var self = this;
				var rendered = '';
				angular.forEach(blocks, function(block) {
					rendered += self.renderBlock(block);
				});
				return rendered;
			},
			renderBlock: function(block) {
				var rendered = '';
				if(typeof block !== 'undefined' && block) {
					switch(block.type) {
						case 'text':
							rendered += '<div class="text">' + markdown.toHTML(block.data.text) + '</div>';
							break;
						case 'list':
							rendered += '<div class="list">' + markdown.toHTML(block.data.text) + '</div>';
							break;
						case 'image':
							rendered += '<div class="image"><img src="' + block.data.file.url + '" /></div>';
							break;
						case 'video':
							rendered += '<div class="video" fit-vids>' + videoProviders[block.data.source].html
								.replace('{{protocol}}', window.location.protocol)
								.replace('{{remote_id}}', block.data.remote_id) + '</div>';
							break;
					}
				}
				return rendered;
			}
		}
	}
]);