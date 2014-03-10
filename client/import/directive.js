'use strict';

exports.DataInput = [
	'$rootScope',
	function($rootScope) {

		return {
			link: function(scope, element, attrs) {
				jQuery(element)
					.on('change', function() {
						$rootScope.$broadcast('DataInputChanged', this);
					});
			}
		}

	}
];