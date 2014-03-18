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

.service('LoadingService', function() {

	var active = false;
	var message = 'Carregando...';
	var enabled = true;

	return {
		show: function(text) {
			if(enabled) {
				if(typeof text !== 'undefined')
					message = text;
				active = true;
				return active;
			}
		},
		hide: function() {
			if(enabled) {
				message = 'Carregando...';
				active = false;
				return active;
			}
		},
		get: function() {
			return active;
		},
		setMessage: function(text) {
			message = text;
		},
		getMessage: function() {
			return message;
		},
		disable: function() {
			enabled = false;
		},
		enable: function() {
			enabled = true;
		}
	}

})

.directive('loadingStatusMessage', [
	'LoadingService',
	function(service) {
		return {
			link: function($scope, $element, attrs) {
				var show = function() {
					$element.addClass('active').find('.loading-message').html(service.getMessage());
				};
				var hide = function() {
					$element.removeClass('active');
				};
				$scope.$service = service;
				$scope.$watch('$service.get()', function(active) {
					if(active)
						show();
					else
						hide();
				});
			}
		};
	}
])

.factory('loadingStatusInterceptor', [
	'$q',
	'$rootScope',
	'$timeout',
	'LoadingService',
	function($q, $rootScope, $timeout, service) {
		var loadingMessage = 'Carregando...';
		var activeRequests = 0;
		var started = function() {
			if(activeRequests==0) {
				service.setMessage(loadingMessage);
				service.show();
				$rootScope.$broadcast('loadingStatusActive', loadingMessage);
			}    
			activeRequests++;
		};
		var ended = function() {
			activeRequests--;
			if(activeRequests==0) {
				service.hide();
				$rootScope.$broadcast('loadingStatusInactive', loadingMessage);
			}
		};
		return {
			request: function(config) {

				if(config.loadingMessage)
					loadingMessage = config.loadingMessage;
				else
					loadingMessage = 'Carregando...';

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