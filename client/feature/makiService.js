'use strict';

/*
 * Maki
 */
exports.Maki = [
	function() {

		var maki = require('maki/_includes/maki.json');

		var makiSprite = require('maki/www/maki-sprite.json');

		return {
			maki: maki,
			makiSprite: function(icon) {
				var pos = makiSprite[icon + '-24'];
				return 'background-position: -' + pos.x + 'px -' + pos.y + 'px;' + 'width:' + pos.width + 'px;' + 'height:' + pos.height + 'px;';
			}
		}

	}
]