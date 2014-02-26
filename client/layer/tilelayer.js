'use strict';

exports.tileLayerService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'LayerActionsCtrl',
			controllerAs: 'actions',
			templateUrl: '/views/layer/tilelayer.html'
		});
	}
];