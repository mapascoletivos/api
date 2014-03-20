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
	'Maki',
	'Content',
	'MessageService',
	'SessionService',
	'LoadingService',
	'MapService',
	'MapView',
	function($scope, $rootScope, $location, $state, $stateParams, $q, Page, Layer, Feature, Maki, Content, Message, Session, Loading, MapService, MapView) {

		$scope.$layer = Layer;
		$scope.$feature = Feature;
		$scope.$content = Content;

		var mapFeatures;

		var populateMap = function(features, layer, force, focus) {

			// Repopulate map if feature in scope has changed
			if(!angular.equals(mapFeatures, features) || force === true) {

				mapFeatures = angular.copy(features);

				MapService.clearFeatures();

				if(features) {

					angular.forEach(features, function(feature) {

						var f = angular.copy(feature);

						var properties = angular.copy(layer.styles[f.geometry.type]);

						_.extend(properties, f.properties || {});

						f.properties = properties;

						var marker = require('../feature/featureToMapObjService')(f, null, MapService.get());

						if(marker) {

							marker.on('click', function() {
								$rootScope.$broadcast('marker.clicked', f, layer);
							});

							MapService.addFeature(marker);

						}

					});
				}

				if(focus !== false) {

					window.dispatchEvent(new Event('resize'));
					setTimeout(function() {
						MapService.get().invalidateSize(false);
						window.dispatchEvent(new Event('resize'));
						MapService.fitFeatureLayer();
					}, 300);
				}

			}

		}

		// New layer
		if($location.path() == '/layers/new/') {

			Message.disable();

			var draft = new Layer.resource({
				title: 'Untitled',
				type: 'FeatureLayer'
			});
			draft.$save(function(draft) {
				Message.enable();
				$location.path('/layers/' + draft.layer._id + '/edit/').replace();
			});

		// Single layer
		} else if($stateParams.layerId) {

			var origLayer;

			$scope.$on('layer.delete.success', function() {
				$location.path('/dashboard/layers').replace();
			});

			Layer.resource.get({layerId: $stateParams.layerId}, function(layer) {

				origLayer = layer;

				if(!layer.styles) {
					layer.styles = {
						Point: {
							'marker-size': 'medium',
							'marker-color': '#7e7e7e',
							'marker-symbol': ''
						},
						Polygon: {
							'stroke': '#555555',
							'stroke-width': 2,
							'stroke-opacity': 1,
							'fill': '#555555',
							'fill-opacity': 0.5
						},
						LineString: {
							'stroke': '#555555',
							'stroke-width': 2,
							'stroke-opacity': 1
						}
					};
				}

				$scope.layer = angular.copy(layer);

				$scope.$watch('layer.styles', function() {
					Layer.edit($scope.layer); // trigger digest
				});

				$scope.previewLayer = function() {
					populateMap($scope.layer.features, $scope.layer, true, false);
				};

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
						MapService.fitFeatureLayer();
					}

					// Init features
					Feature.set(angular.copy($scope.layer.features));
					populateMap($scope.layer.features, $scope.layer, true);
					
					setTimeout(function() {
						MapService.fitFeatureLayer();
					}, 200);

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

					var destroyConfirmation = $rootScope.$on('$stateChangeStart', function(event) {
						if(!angular.equals($scope.layer, origLayer))
							if(!confirm('Deseja sair sem salvar alterações?'))
								event.preventDefault();
							else
								Layer.deleteDraft(layer);
					});

					$scope.$on('$destroy', function() {
						destroyConfirmation();
					});

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

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

					$scope.$on('$destroy', function() {
						Layer.edit(false);
					});

					var unHookFeaturesUpdate = $scope.$on('features.updated', function() {
						$scope.layer.features = Feature.get();
					});
					$scope.$on('$destroy', unHookFeaturesUpdate);

					$scope.$watch('$feature.edit()', function(editingFeature) {
						if(!editingFeature)
							populateMap($scope.layer.features, $scope.layer, true);
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
						origLayer = layer;
						$scope.layer = angular.copy(layer);
						populateMap($scope.layer.features, $scope.layer, true, false);
					});
					
					$scope.close = function() {

						if(Layer.isDraft(layer)) {
							$location.path('/dashboard/layers').replace();
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

					/*
					 * Styles
					 */

					$scope.maki = Maki.maki;
					$scope.makiSprite = Maki.makiSprite;

				} else {

					$scope.$on('marker.clicked', function(event, feature) {

						$state.go('singleLayer.feature', {
							featureId: feature._id
						});

					});

				}

			}, function() {

				$location.path('/layers').replace();

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