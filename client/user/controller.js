'use strict';

exports.UserCtrl = [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'User',
	'ChangePwd',
	'ChangeEmail',
	'Layer',
	'Map',
	'Page',
	'MessageService',
	function($scope, $rootScope, $state, $stateParams, User, ChangePwd, ChangeEmail, Layer, Map, Page, Message) {

		$scope.save = function(user) {

			User.resource.update({userId: user._id}, user, function(res) {

				$rootScope.$broadcast('user.save.success', user);

			}, function(err) {

				$rootScope.$broadcast('user.save.error', err);

			});

		}

		$scope.openPwdModal = function(user) {
			ChangePwd.activate({
				user: user
			});

			$scope.$on('$destroy', function() {
				ChangePwd.deactivate();
			});
		};

		$scope.closePwdModal = function() {
			ChangePwd.deactivate();
		};

		$scope.openEmailModal = function(user) {
			ChangeEmail.activate({
				user: user
			});

			$scope.$on('$destroy', function() {
				ChangeEmail.deactivate();
			});
		};

		$scope.closeEmailModal = function() {
			ChangeEmail.deactivate();
		};

		$scope.changePassword = function(user, chPwd) {

			if(typeof chPwd === 'undefined') {
				return false;
			}

			if(!chPwd.userPwd) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir sua senha atual.'
				});
				return false;
			}

			if(!chPwd.newPwd) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir uma nova senha.'
				});
				return false;
			}

			if(chPwd.newPwd != chPwd.validatePwd) {
				Message.message({
					status: 'error',
					text: 'As senhas não são compatíveis'
				})
				return false;
			}

			User.resource.update({userId: user._id}, chPwd);

		}

		$scope.changeEmail = function(user) {

			if(!user.newEmail) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir um email.'
				});
				return false;
			}

			User.resource.update({userId: user._id}, {
				email: user.newEmail
			});

		}

		$scope.profileUrl = function(user) {

			if(typeof user !== 'undefined') {

				var slug = user._id;

				if(user.username)
					slug =  user.username;
	
				return '/user/' + slug + '/';
	
			}

			return '';

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