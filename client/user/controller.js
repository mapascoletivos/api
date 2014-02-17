'use strict';

exports.UserCtrl = [
	'$scope',
	'$rootScope',
	'$stateParams',
	'User',
	'Page',
	'MessageService',
	function($scope, $rootScope, $stateParams, User, Page, Message) {

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

			})

		}

	}
];