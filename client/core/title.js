'use strict';

angular.module('mapasColetivos.pageTitle', [])

.factory('Page', [
	function() {
		var baseTitle = 'Mapas Coletivos';
		var title = baseTitle;
		return {
			title: function() {
				return title;
			},
			setTitle: function(val) {
				title = val + ' - ' + baseTitle;
			}
		}
	}
])

.controller('PageCtrl', [
	'$scope',
	'Page',
	function($scope, Page) {
		$scope.page = Page;
	}
]);