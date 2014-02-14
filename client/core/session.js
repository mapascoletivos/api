'use strict';

/*
 * Session module
 */
angular.module('mapasColetivos.session', [])

.factory('SessionService', [
	function() {
		var _this = this;
		_this._data = {
			authenticated: !! window.isAuthenticated,
			user: window.user
		};
		return _this._data;
	}
]);