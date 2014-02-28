'use strict';

/*
 * Layer controller
 */
exports.LayerCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'$state',
	'$stateParams',
	'$q',
	'Page',
	'Layer',
	'Feature',
	'Content',
	'MessageService',
	'SessionService',
	'LoadingService',
	'MapService',
	'MapView',
	function($scope, $rootScope, $location, $state, $stateParams, $q, Page, Layer, Feature, Content, Message, Session, Loading, MapService, MapView) {

		$scope.$layer = Layer;
		$scope.$feature = Feature;
		$scope.$content = Content;

		var mapFeatures;

		var populateMap = function(features, layer, force) {

			// Repopulate map if feature in scope has changed
			if(!angular.equals(mapFeatures, features) || force === true) {

				mapFeatures = angular.copy(features);

				MapService.clearMarkers();

				if(features) {

					angular.forEach(features, function(f) {

						var marker = require('../feature/featureToMapObjService')(f);

						if(marker) {

							marker
								.on('click', function() {
									$rootScope.$broadcast('marker.clicked', f, layer);
								})
								.on('mouseover', function() {
									marker.openPopup();
								})
								.on('mouseout', function() {
									marker.closePopup();
								})
								.bindPopup('<h3 class="feature-title">' + f.title + '</h3>');


							MapService.addMarker(marker);

						}

					});
				}
			}

			if(features && features.length) {
				// Fit marker layer after 200ms (animation safe)
				setTimeout(function() {
					MapService.fitMarkerLayer();
				}, 200);
			}

		}

		// New layer
		if($location.path() == '/layers/new/') {

			var draft = new Layer.resource({
				title: 'Untitled',
				type: 'FeatureLayer'
			});
			draft.$save(function(draft) {
				$location.path('/layers/' + draft.layer._id + '/edit/').replace();
			});

		// Single layer
		} else if($stateParams.layerId) {

			$scope.$on('layer.delete.success', function() {
				$location.path('/dashboard/layers').replace();
			});

			Layer.resource.get({layerId: $stateParams.layerId}, function(layer) {

				$scope.layer = layer;

				$scope.baseUrl = '/layers/' + layer._id;

				Page.setTitle(layer.title);

				var map = MapService.init('layer-map', {
					center: [0,0],
					zoom: 2
				});

				if(!layer.description && !layer.features.length && !layer.contents.length) {
					MapView.sidebar(false);
				} else {
					MapView.sidebar(true);
				}

				if(layer.type == 'TileLayer') {

					MapService.removeBaseLayer();

					var tilelayer = MapService.addTileLayer(layer.url);

					Loading.show('Carregando camada');

					if(layer.properties.service == 'mapbox') {
						tilelayer.on('load', _.once(function() {
							MapService.renderTileJSON(tilelayer.getTileJSON());
							$rootScope.$apply(function() {
								Loading.hide();
							});
						}));
					}

				} else {

					if(!layer.contributors)
						layer.contributors = [];

					$scope.fitMarkerLayer = function() {
						MapService.fitMarkerLayer();
					}

					// Init features
					Feature.set(angular.copy(layer.features));
					populateMap(layer.features, layer, true);

					var viewingContent = false;
					$scope.$on('content.filtering.started', function(event, c, cF) {
						viewingContent = true;
						if(cF.length) {
							populateMap(cF, layer);
						}
					});

					$scope.$on('content.filtering.closed', function() {
						if(viewingContent) {
							populateMap(layer.features, layer);
							viewingContent = false;
						}
					});

					// Set content shared data
					Content.set(layer.contents);

					$rootScope.$broadcast('data.ready', layer);

					MapService.get().invalidateSize(true);

				}

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

					$scope.$on('layerObjectChange', function(event, active) {
						populateMap(layer.features, layer, true);
					});

					if(!Layer.canEdit(layer)) {
						$location.path('/layers/' + layer._id);
						Message.add({
							status: 'error',
							text: 'Sem permissões para editar esta camada'
						});
					}

					if(Layer.isOwner(layer)) {
						$scope.activeObj = 'settings';
					} else {
						$scope.activeObj = 'feature';
					}

					$scope.layerObj = function(objType) {
						if($scope.activeObj == objType)
							return 'active';

						return false;
					}

					$scope.setLayerObj = function(obj) {

						$scope.activeObj = obj;
						setTimeout(function() {
							window.dispatchEvent(new Event('resize'));
						}, 100);

					}

					$scope.$watch('activeObj', function(active) {

						Feature.edit(false);
						Content.edit(false);
						$scope.$broadcast('layerObjectChange', active);

					});

					Layer.edit(layer);

					$scope.$watch('$feature.get()', function(features) {
						$scope.layer.features = features;
					});

					$scope.$watch('$feature.edit()', function(editingFeature) {
						if(!editingFeature)
							populateMap(layer.features, layer, true);
					});

					$scope.$watch('$content.get()', function(contents) {
						$scope.layer.contents = contents;
					});

					if($scope.layer.title == 'Untitled') {
						$scope.layer.title = '';
						Page.setTitle('Nova camada');
					}

					$scope.$on('layer.save.success', function(event, layer) {
						Page.setTitle(layer.title);
						$scope.layer = layer;
					});
					$scope.close = function() {

						if(Layer.isDraft(layer)) {
							$location.path('/dashboard/layers').replace();
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

					$scope.$on('$stateChangeStart', function() {
						Layer.deleteDraft(layer);
					});

				} else {

					$scope.$on('marker.clicked', function(event, feature) {

						$state.go('singleLayer.feature', {
							featureId: feature._id
						});

					});

				}

			}, function() {

				$location.path('/layers').replace();

				Message.message({
					status: 'error',
					text: 'Esta camada não existe'
				});

			});

			$scope.$on('$destroy', function() {
				MapService.destroy();
				$scope.features = [];
				$scope.contents = [];
				Feature.set([]);
				Content.set([]);
			});

		// All layers
		} else {

			Page.setTitle('Camadas');

			Layer.resource.query(function(res) {
				$scope.layers = res.layers;

				$scope.$watch('search', _.debounce(function(text) {

					if(text) {

						Layer.resource.query({
							search: text
						}, function(searchRes) {
							$scope.layers = searchRes.layers;
						});

					} else {

						Layer.resource.query(function(res) {
							$scope.layers = res.layers;
						});

					}

				}, 300));
			});

		}

		$scope.$on('layer.page.next', function(event, res) {
			if(res.layers.length) {
				angular.forEach(res.layers, function(layer) {
					$scope.layers.push(layer);
				});
				$scope.layers = $scope.layers; // trigger digest
			}
		});

	}

];