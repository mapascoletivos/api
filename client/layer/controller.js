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
	'MapService',
	function($scope, $rootScope, $location, $state, $stateParams, $q, Page, Layer, Feature, Content, Message, Session, MapService) {

		$scope.$layer = Layer;

		var mapFeatures;

		var populateMap = function(features, force) {

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
									$rootScope.$broadcast('marker.clicked', f);
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
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/layers/' + draft._id + '/edit').replace();
			}, function(err) {
				// TODO error handling
			});

		// Single layer
		} else if($stateParams.layerId) {

			$scope.activeObj = 'settings';

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

			$scope.$on('layer.delete.success', function() {
				$location.path('/dashboard/layers').replace();
			});

			Layer.resource.get({layerId: $stateParams.layerId}, function(layer) {

				if(!layer.contributors)
					layer.contributors = [
						{
							email: 'miguel@cardume.art.br'
						},
						{
							email: 'vitorgeorge@gmail.com'
						},
						{
							email: 'vjpixel@gmail.com'
						},
						{
							email: 'gufalei@gmail.com'
						}
					];

				/*
				$scope.$on('layer.contributor.added', function(event, layer) {
					$scope.layer.contributors = layer.contributors;
				});

				$scope.$on('layer.contributor.removed', function(event, layer) {
					$scope.layer.contributors = layer.contributors;
				});
				*/

				$scope.layer = layer;

				$scope.baseUrl = '/layers/' + layer._id;

				Page.setTitle(layer.title);

				var map = MapService.init('layer-map', {
					center: [0,0],
					zoom: 2
				});

				$scope.fitMarkerLayer = function() {
					MapService.fitMarkerLayer();
				}

				// Init features
				Feature.set(angular.copy(layer.features));
				populateMap(layer.features, true);

				var viewingContent = false;
				$scope.$on('content.filtering.started', function(event, c, cF) {
					viewingContent = true;
					if(cF.length) {
						populateMap(cF);
					}
				});

				$scope.$on('content.filtering.closed', function() {
					if(viewingContent) {
						populateMap(layer.features);
						viewingContent = false;
					}
				});

				$scope.$on('layerObjectChange', function(event, active) {
					populateMap(layer.features, true);
				});

				// Set content shared data
				Content.set(layer.contents);

				$rootScope.$broadcast('data.ready', layer);

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {

					Layer.edit(layer);

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