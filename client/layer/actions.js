'use strict';

require('angular/angular');

/*
 * layer controller
 */

exports.LayerActionsCtrl = [
	'$rootScope',
	'$scope',
	'$q',
	'$location',
	'MessageService',
	'SessionService',
	'Layer',
	function($rootScope, $scope, $q, $location, Message, Session, Layer) {

		$scope.edit = function(layer) {

			$location.path('/layers/' + layer._id + '/edit');

		};

		$scope.save = function(layer) {

			layer.isDraft = false;

			var deferred = $q.defer();

			Layer.resource.update({layerId: layer._id}, layer, function(layer) {
				Message.message({
					status: 'ok',
					text: 'Camada atualizada'
				});
				$rootScope.$broadcast('layer.save.success', layer);
				deferred.resolve(layer);
			}, function(err){
				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});
				$rootScope.$broadcast('layer.save.error', err);
				deferred.resolve(err);
			});

			return deferred.promise;

		};

		$scope.delete = function(layer, callback) {

			if(confirm('Você tem certeza que deseja remover esta camada?')) {
				Layer.resource.delete({layerId: layer._id}, function(res) {
					Message.message({
						status: 'ok',
						text: 'Camada removida.'
					});
					$rootScope.$broadcast('layer.delete.success', layer);
				}, function(err) {
					Message.message({
						status: 'error',
						text: 'Ocorreu um erro.'
					});
					$rootScope.$broadcast('layer.delete.error', err);
				});
			}

		};

	}
];