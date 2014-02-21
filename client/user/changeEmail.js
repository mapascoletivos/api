'use strict';

exports.changeEmail = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'UserCtrl',
			controllerAs: 'share',
			templateUrl: '/views/user/change-email.html'
		});
	}
];