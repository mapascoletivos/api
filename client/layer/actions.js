'use strict';

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
	'LayerShare',
	'NewLayer',
	'TileLayerEditor',
	function($rootScope, $scope, $q, $location, Message, Session, Layer, LayerShare, NewLayerBox, TileLayerEditor) {

		$scope.getUrl = function(layer) {

			var url = window.location.protocol + '//' + window.location.host + '/layers/' + layer._id;

			return url;

		};

		/*
		 * Permission control
		 */
		$scope.canEdit = function(layer) {
			return Layer.canEdit(layer);
		};
		$scope.canDelete = function(layer) {
			return Layer.canDelete(layer);
		};
		$scope.isOwner = function(layer) {
			return Layer.isOwner(layer);
		};
		$scope.isContributor = function(layer) {
			return Layer.isContributor(layer);
		};

		$scope.edit = function(layer) {

			if(layer.type == 'TileLayer')
				$scope.editTileLayer(layer);
			else
				$location.path('/layers/' + layer._id + '/edit/');

		};

		$scope.addContributor = function(email, layer) {

			Layer.resource.addContributor({layerId: layer._id, email: email}, function(res) {

				layer.contributors = res.layer.contributors;

				$rootScope.$broadcast('layer.contributor.added', layer);

				$scope.newContributor = '';

			});

		}

		$scope.removeContributor = function(contributor, layer) {

			Layer.resource.removeContributor({layerId: layer._id, contributorId: contributor._id}, function(res) {
				console.log(res);
			});

			$rootScope.$broadcast('layer.contributor.removed', layer);

		}

		$scope.new = function() {

			NewLayerBox.activate({
				newLayer: function(type, service) {
					this.close();
					if(type == 'TileLayer') {
						var layer = {
							type: 'TileLayer',
							visibility: 'Private',
							properties: {
								service: service
							}
						}
						$scope.editTileLayer(layer);
					} else {
						$location.path('/layers/new/');
					}
				},
				close: function() {
					NewLayerBox.deactivate();
				}
			});

		}

		$scope.editTileLayer = function(layer) {

			TileLayerEditor.activate({
				saveTileLayer: function(layer) {
					if(!layer._id) {

						var newLayer = new Layer.resource(layer);
						newLayer.$save(function(layer) {
							TileLayerEditor.deactivate();
							$scope.editTileLayer(layer);
							$rootScope.$broadcast('layer.add.success', layer);
						});

					} else {

						$scope.save(layer);

					}
				},
				close: function() {
					TileLayerEditor.deactivate();
				},
				layer: layer
			});

		}

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

		$scope.share = function(layer) {
			LayerShare.activate({
				layer: layer,
				social: {
					facebook: 'http://facebook.com/share.php?u=' + $scope.getUrl(layer),
					twitter: 'http://twitter.com/share?url=' + $scope.getUrl(layer)
				},
				socialWindow: function(url, type) {
					window.open(url, type, "width=550,height=300,resizable=1");
				},
				close: function() {
					LayerShare.deactivate();
				}
			});

			$scope.$on('$destroy', function() {
				LayerShare.deactivate();
			});
		};

		$scope.templates = {
			list: '/views/layer/list-item.html'
		};

	}
];