'use strict';

exports.ImportInput = [
	'$rootScope',
	function($rootScope) {

		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				angular.element(element)
					.on('change', function() {
						scope.$emit('import.input.change', this);
					});
			}
		}

	}
];

exports.ImportInputTrigger = [
	function() {

		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				angular.element(element).on('click', function() {
					angular.element('#' + attrs.importInputTrigger).trigger('click');
				});
			}
		}

	}
];