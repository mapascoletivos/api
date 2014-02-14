'use strict';

exports.UserCtrl = [
	'$scope',
	'$rootScope',
	'User',
	'MessageService',
	function($scope, $rootScope, User, Message) {

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

	}
];