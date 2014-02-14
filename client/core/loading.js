'use strict';

/*
 * Loading module
 */
angular.module('mapasColetivos.loadingStatus', [])

.config([
	'$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('loadingStatusInterceptor');
	}
])

.directive('loadingStatusMessage', function() {
	return {
		link: function($scope, $element, attrs) {
			var show = function() {
				$element.addClass('active');
			};
			var hide = function() {
				$element.removeClass('active');
			};
			$scope.$on('loadingStatusActive', show);
			$scope.$on('loadingStatusInactive', hide);
			hide();
		}
	};
})

.factory('loadingStatusInterceptor', [
	'$q',
	'$rootScope',
	'$timeout',
	function($q, $rootScope, $timeout) {
		var activeRequests = 0;
		var started = function() {
			if(activeRequests==0) {
				$rootScope.$broadcast('loadingStatusActive');
			}    
			activeRequests++;
		};
		var ended = function() {
			activeRequests--;
			if(activeRequests==0) {
				$rootScope.$broadcast('loadingStatusInactive');
			}
		};
		return {
			request: function(config) {
				started();
				return config || $q.when(config);
			},
			response: function(response) {
				ended();
				return response || $q.when(response);
			},
			responseError: function(rejection) {
				ended();
				return $q.reject(rejection);
			}
		};
	}
]);