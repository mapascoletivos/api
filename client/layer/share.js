'use strict';

exports.shareService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'LayerActionsCtrl',
			controllerAs: 'share',
			templateUrl: '/views/layer/share.html'
		});
	}
];