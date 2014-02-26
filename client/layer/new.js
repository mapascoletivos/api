'use strict';

exports.newLayerService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'LayerActionsCtrl',
			controllerAs: 'layer',
			templateUrl: '/views/layer/new.html'
		});
	}
];