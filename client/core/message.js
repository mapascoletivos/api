'use strict';

/*
 * Message module
 */
angular.module('mapasColetivos.messageStatus', [])

.factory('MessageService', [
	'$timeout',
	function($timeout) {

		var messages = [];

		return {
			get: function() {
				return messages;
			},
			close: function(message) {
				messages = messages.filter(function(m) { return m !== message; });
			},
			add: function(val, timeout) {

				var self = this;

				if(typeof val !== 'undefined') {

					var message = val;
					messages.push(message);

					if(timeout !== false) {
						timeout = timeout ? timeout : 3000;
						$timeout(function() {
							self.close(message);
						}, timeout);
					}

				}

				return message;
			},
			message: function(val, timeout) {
				this.add(val, timeout);
			}
		}

	}
])

.controller('MessageCtrl', [
	'$scope',
	'MessageService',
	function($scope, MessageService) {

		$scope.service = MessageService;

		$scope.$watch('service.get()', function(messages) {
			$scope.messages = messages;
		});

		$scope.close = function(message) {
			$scope.service.close(message);
		}

	}
]);;