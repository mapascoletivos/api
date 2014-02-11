'use strict';

require('angular/angular');

/*
 * Map controller
 */

exports.MapActionsCtrl = [
	'$rootScope',
	'$scope',
	'$q',
	'$location',
	'MessageService',
	'SessionService',
	'Map',
	'MapShare',
	function($rootScope, $scope, $q, $location, Message, Session, Map, MapShare) {

		$scope.share = function(map) {
			MapShare.activate({
				map: map,
				social: {
					facebook: 'http://facebook.com/share.php?u=' + 'http://google.com/',
					twitter: 'http://twitter.com/share?url=' + 'http://google.com/'
				},
				socialWindow: function(url, type) {
					window.open(url, type, "width=550,height=300,resizable=1");
				},
				close: function() {
					MapShare.deactivate();
				}
			});

			$scope.$on('$destroy', function() {
				MapShare.deactivate();
			});
		};

		$scope.templates = {
			list: '/views/map/list-item.html'
		};

		$scope.getUrl = function(map) {



		};

		$scope.edit = function(map) {

			$location.path('/maps/' + map._id + '/edit');

		};

		$scope.save = function(map) {

			map.isDraft = false;

			var deferred = $q.defer();

			Map.resource.update({mapId: map._id}, map, function(map) {
				Message.message({
					status: 'ok',
					text: 'Mapa atualizado'
				});
				$rootScope.$broadcast('map.save.success', map);
				deferred.resolve(map);
			}, function(err){
				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});
				$rootScope.$broadcast('map.save.error', err);
				deferred.resolve(err);
			});

			return deferred.promise;

		};

		$scope.delete = function(map, callback) {

			if(confirm('Você tem certeza que deseja remover este mapa?')) {
				Map.resource.delete({mapId: map._id}, function(res) {
					Message.message({
						status: 'ok',
						text: 'Mapa removido.'
					});
					$rootScope.$broadcast('map.delete.success', map);
				}, function(err) {
					Message.message({
						status: 'error',
						text: 'Ocorreu um erro.'
					});
					$rootScope.$broadcast('map.delete.error', err);
				});
			}

		};

	}
];