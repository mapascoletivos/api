'use strict';

exports.shareService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'MapActionsCtrl',
			controllerAs: 'share',
			templateUrl: '/views/map/share.html'
		});
	}
];