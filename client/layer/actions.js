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

			$rootScope.$on('$stateChangeStart', _.once(function() {
				NewLayerBox.deactivate();
			}));

		}

		$scope.editTileLayer = function(layer) {

			TileLayerEditor.activate({
				saveTileLayer: function(layer) {
					if(!layer._id) {

						var newLayer = new Layer.resource(layer);
						newLayer.$save(function(res) {
							TileLayerEditor.deactivate();
							$scope.editTileLayer(res.layer);
							$rootScope.$broadcast('layer.add.success', res.layer);
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

			Layer.resource.update({layerId: layer._id}, layer, function(res) {
				$rootScope.$broadcast('layer.save.success', res.layer);
			});

		};

		$scope.delete = function(layer, callback) {

			if(confirm('Você tem certeza que deseja remover esta camada?')) {
				Layer.resource.delete({layerId: layer._id}, function(res) {
					$rootScope.$broadcast('layer.delete.success', layer);
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