'use strict';

require('angular/angular');

/*
 * Layer features service
 */
exports.LayerSharedData = [
	function() {

		// Basic content
		var layer = {};
		var features = [];
		var contents = [];

		// Editing
		var editingFeature = false;
		var editingContent = false;

		// Viewing
		var activeSidebar = false;

		return {
			layer: function(val) {

				if(typeof val !== 'undefined')
					layer = val;

				return layer;
			},
			features: function(val) {

				if(typeof val !== 'undefined')
					features = val;

				return features;

			},
			contents: function(val) {

				if(typeof val !== 'undefined')
					contents = val;

				return contents;

			},
			editingFeature: function(val) {

				if(typeof val !== 'undefined')
					editingFeature = val;

				return editingFeature;
			},
			editingContent: function(val) {

				if(typeof val !== 'undefined')
					editingContent = val;

				return editingContent;
			},
			activeSidebar: function(val) {

				if(typeof val !== 'undefined')
					activeSidebar = val;

				return activeSidebar;

			}
		}
	}
];