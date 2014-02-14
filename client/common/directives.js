'use strict';

angular.module('mapasColetivos.directives', [
	'ngSanitize',
	'fitVids'
])

.directive('disableEnterKey', [
	function() {
		return {
			link: function(scope, element) {

				function triggerBlur() {
					element.blur();
				}

				function keyCallback(event) {

					if(event.which == 13) {

						triggerBlur();
						event.preventDefault();

					}

				}

				element.on('keydown keypress', keyCallback);
			}
		}
	}
])

// Render bindings for dynamic html
.directive('dynamic', [
	'$compile',
	function($compile) {
		return function(scope, element, attrs) {
			scope.$watch(
				function(scope) {
					// watch the 'dynamic' expression for changes
					return scope.$eval(attrs.dynamic);
				},
				function(value) {
					// when the 'dynamic' expression changes
					// assign it into the current DOM
					element.html(value);

					// compile the new DOM and link it to the current
					// scope.
					// NOTE: we only compile .childNodes so that
					// we don't get into infinite loop compiling ourselves
					$compile(element.contents())(scope);
				}
			);
		};
	}
]);