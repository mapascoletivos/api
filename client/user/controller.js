'use strict';

exports.UserCtrl = [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'User',
	'Layer',
	'Map',
	'Page',
	'MessageService',
	function($scope, $rootScope, $state, $stateParams, User, Layer, Map, Page, Message) {

		$scope.save = function(user) {

			User.resource.update({userId: user._id}, user, function(user) {

				Message.message({
					status: 'ok',
					text: 'Usuário atualizado.'
				});
				$rootScope.$broadcast('user.save.success', user);

			}, function(err) {

				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});
				$rootScope.$broadcast('user.save.error', err);

			});

		}

		$scope.changePassword = function(chPwd, user) {

			console.log(chPwd);

			console.log(user);

		}

		/* 
		 * Profile page
		 */
		if($stateParams.userId) {

			User.resource.get({
				userId: $stateParams.userId
			}, function(res) {

				Page.setTitle(res.name);

				$scope.user = res;

			}, function(err) {

				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});

			});

			/*
			 * Layer
			 */

			$scope.$layer = Layer;

			Layer.resource.query({
				userId: $stateParams.userId
			}, function(res) {
				$scope.totalLayer = res.layersTotal;
				$scope.layers = res.layers;
			});

			$scope.$on('layer.page.next', function(event, res) {
				if(res.layers.length) {
					angular.forEach(res.layers, function(layer) {
						$scope.layers.push(layer);
					});
					$scope.layers = $scope.layers; // trigger digest
				}
			});

			/*
			 * Map
			 */

			$scope.$map = Map;

			Map.resource.query({
				userId: $stateParams.userId
			}, function(res) {
				$scope.totalMap = res.mapsTotal;
				$scope.maps = res.maps;
			});

			$scope.$on('map.page.next', function(event, res) {
				if(res.maps.length) {
					angular.forEach(res.maps, function(map) {
						$scope.maps.push(map);
					});
					$scope.maps = $scope.maps; // trigger digest
				}
			});

			/*
			 * State management (profile sub content)
			 */

			var stateFunctions = function() {
				$scope.currentState = $state.current.name.replace('user.', '');
			}

			$rootScope.$on('$viewContentLoaded', function() {
				stateFunctions();
			});

			$rootScope.$on('$stateChangeSuccess', function() {
				stateFunctions();
			});

		}

	}
];