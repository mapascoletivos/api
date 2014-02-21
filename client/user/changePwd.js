'use strict';

exports.changePwd = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'UserCtrl',
			controllerAs: 'share',
			templateUrl: '/views/user/change-password.html'
		});
	}
];