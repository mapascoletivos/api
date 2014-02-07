/*
 * App modules
 */

angular.module('mapasColetivos.map', []);

angular.module('mapasColetivos.user', []);

angular.module('mapasColetivos.session', []);

angular.module('mapasColetivos.content', [
	'ngSanitize'
]);

angular.module('mapasColetivos.feature', []);

angular.module('mapasColetivos.layer', [
	'ngResource',
	'mapasColetivos.map',
	'mapasColetivos.feature',
	'mapasColetivos.content'
]);

angular
	.module('mapasColetivos', [
		'fitVids',
		'loadingStatus',
		'ui.router',
		'ui.keypress',
		'monospaced.elastic',
		'ngRoute',
		'ngAnimate',
		'mapasColetivos.layer',
		'mapasColetivos.user'
	])
	.value('apiPrefix', '/api/v1');

/*
 * App routes and interceptors
 */

angular.module('mapasColetivos').config([
	'$stateProvider',
	'$urlRouterProvider',
	'$locationProvider',
	'$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

		$httpProvider.defaults.withCredentials = true;

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'IndexCtrl',
				templateUrl: '/home'
			})
			.state('explore', {
				url: '/explore',
				controller: 'ExploreCtrl',
				templateUrl: '/views/explore.html'
			})
			.state('dashboard', {
				url: '/dashboard',
				controller: 'DashboardCtrl',
				templateUrl: '/views/dashboard/index.html'
			})
			.state('dashboard.layers', {
				url: '/layers',
				templateUrl: '/views/dashboard/layers.html'
			})
			.state('dashboard.maps', {
				url: '/maps',
				templateUrl: '/views/dashboard/maps.html'
			})
			.state('dashboard.profile', {
				url: '/profile',
				templateUrl: '/views/dashboard/profile.html'
			})
			.state('layers', {
				url: '/layers',
				controller: 'LayerCtrl',
				templateUrl: '/views/layer/index.html'
			})
			.state('newLayer', {
				url: '/layers/new',
				controller: 'LayerCtrl',
				templateUrl: '/views/layer/index.html'
			})
			.state('singleLayer', {
				url: '/layers/:layerId',
				controller: 'LayerCtrl',
				templateUrl: '/views/layer/show.html'
			})
			.state('singleLayer.content', {
				url: '/content/:contentId'
			})
			.state('singleLayer.feature', {
				url: '/feature/:featureId'
			})
			.state('editLayer', {
				url: '/layers/:layerId/edit',
				controller: 'LayerCtrl',
				templateUrl: '/views/layer/edit.html'
			})
			.state('maps', {
				url: '/maps',
				controller: 'MapCtrl',
				templateUrl: '/views/map/index.html'
			})
			.state('newMap', {
				url: '/maps/new',
				controller: 'MapCtrl',
				templateUrl: '/views/map/index.html'
			})
			.state('singleMap', {
				url: '/maps/:mapId',
				controller: 'MapCtrl',
				templateUrl: '/views/map/show.html'
			})
			.state('singleMap.content', {
				url: '/content/:contentId'
			})
			.state('singleMap.feature', {
				url: '/feature/:featureId'
			})
			.state('editMap', {
				url: '/maps/:mapId/edit',
				controller: 'MapCtrl',
				templateUrl: '/views/map/edit.html'
			});

		$locationProvider.html5Mode(true);

		var interceptor = ['$rootScope', '$q', '$location', function(scope, $q, $location) {

			function success(response) {
				return response;
			}

			function error(response) {

				var status = response.status;

				if (status == 401) {
					window.location = '/login';
					return;
				}
				// otherwise
				return $q.reject(response);

			}

			return function (promise) {
				return promise.then(success, error);
			}

		}];

		$httpProvider.responseInterceptors.push(interceptor);

	}
]);

/*
 * Session service
 */
angular.module('mapasColetivos').factory('SessionService', [
	function() {
		var _this = this;
		_this._data = {
			authenticated: !! window.isAuthenticated,
			user: window.user
		};
		return _this._data;
	}
]);

/*
 * Feature service
 */
angular.module('mapasColetivos.feature').factory('Feature', [
	'$resource',
	'apiPrefix',
	'LayerSharedData',
	function($resource, apiPrefix, LayerSharedData) {

		return {
			resource: $resource(apiPrefix + '/features/:featureId', {'_csrf': window.token}, {
				'save': {
					method: 'POST',
					url: apiPrefix + '/layers/:layerId/features'
				},
				'delete': {
					method: 'DELETE',
					url: apiPrefix + '/layers/:layerId/features/:featureId'
				},
				'update': {
					method: 'PUT'
				}
			}),
			getContents: function(feature) {

				if(feature.contents.length) {

					var layerContents = LayerSharedData.contents();

					if(layerContents && layerContents.length) {

						var featureContents = layerContents.filter(function(content) {
							return feature.contents.indexOf(content._id) !== -1;
						});

						return featureContents;

					}

				}

				return false;

			}
		};

	}
]);

/*
 * Feature helpers
 */

angular.module('mapasColetivos.feature').factory('featureToMapObj', [
	function() {
		return function(feature) {
			if(feature.geometry && feature.geometry.coordinates) {
				return L.marker(feature.geometry.coordinates);
			}
			return false;
		}
	}
]);

/*
 * Content service
 */
angular.module('mapasColetivos.content').factory('Content', [
	'$resource',
	'apiPrefix',
	'LayerSharedData',
	'Feature',
	function($resource, apiPrefix, LayerSharedData, Feature) {

		return {
			resource: $resource(apiPrefix + '/contents/:contentId', {'_csrf': window.token}, {
				'save': {
					method: 'POST',
					url: apiPrefix + '/contents',
					params: {
						layer: '@id'
					}
				},
				'delete': {
					method: 'DELETE',
					url: apiPrefix + '/contents/:contentId'
				},
				'update': {
					method: 'PUT'
				}
			}),
			getFeatures: function(content) {

				if(content.features.length) {

					var layerFeatures = LayerSharedData.features();

					if(layerFeatures && layerFeatures.length) {

						var contentFeatures = layerFeatures.filter(function(feature) {
							return content.features.indexOf(feature._id) !== -1;
						});

						return contentFeatures;

					}

				}

				return false;

			}
		};

	}
]);

/*
 * Layer service
 */
angular.module('mapasColetivos.layer').factory('Layer', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/layers/:layerId', {'_csrf': window.token}, {
			'query': {
				isArray: false,
				method: 'GET'
			},
			'update': {
				method: 'PUT'
			}
		});

	}
]);

/*
 * Map service
 */

angular.module('mapasColetivos.map').factory('Map', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return {
			resource: $resource(apiPrefix + '/maps/:mapId', {'_csrf': window.token}, {
				'query': {
					isArray: false,
					method: 'GET'
				},
				'update': {
					method: 'PUT'
				}
			})
		}

	}
]);



/*
 * Layer features service
 */
angular.module('mapasColetivos.layer').factory('LayerSharedData', [
	function() {

		// Basic content
		var layer = {};
		var features = [];
		var contents = [];

		// Editing
		var editingFeature = false;
		var editingContent = false;

		// Viewing
		var activeSidebar = false;

		return {
			layer: function(val) {

				if(typeof val !== 'undefined')
					layer = val;

				return layer;
			},
			features: function(val) {

				if(typeof val !== 'undefined')
					features = val;

				return features;

			},
			contents: function(val) {

				if(typeof val !== 'undefined')
					contents = val;

				return contents;

			},
			editingFeature: function(val) {

				if(typeof val !== 'undefined')
					editingFeature = val;

				return editingFeature;
			},
			editingContent: function(val) {

				if(typeof val !== 'undefined')
					editingContent = val;

				return editingContent;
			},
			activeSidebar: function(val) {

				if(typeof val !== 'undefined')
					activeSidebar = val;

				return activeSidebar;

			}
		}
	}
]);

/*
 * Message service
 */
angular.module('mapasColetivos').factory('MessageService', [
	'$timeout',
	function($timeout) {

		var message = {
			status: 'ok',
			text: false
		};

		return {
			message: function(val, timeout) {

				if(typeof val !== 'undefined') {
					message = val;

					if(timeout !== false) {
						timeout = timeout ? timeout : 3000;
						$timeout(function() {
							message = {
								status: 'ok',
								text: ''
							};
						}, timeout);
					}

				}

				return message;
			}
		}

	}
]);

/*
 * Leaflet service
 */

angular.module('mapasColetivos.map').factory('MapService', [
	'featureToMapObj',
	'$rootScope',
	function(featureToMapObj, $rootScope) {

		var map,
			markerLayer = L.featureGroup(),
			groups = [],
			markers = [],
			hiddenMarkers = [],
			baseTile = 'http://{s}.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png';

		return {
			init: function(id, config) {
				if(map instanceof L.Map) {
					map.remove();
				}
				map = L.map(id, config);
				map.whenReady(function() {
					map.addLayer(L.tileLayer(baseTile));
					map.addLayer(markerLayer);
				});
				return map;
			},
			get: function() {
				return map;
			},
			clearMarkers: function() {
				if(markers.length) {
					angular.forEach(markers, function(marker) {
						if(markerLayer.hasLayer(marker))
							markerLayer.removeLayer(marker);
					});
					markers = [];
				}
			},
			getMarkerLayer: function() {
				return markerLayer;
			},
			addMarker: function(marker) {
				markerLayer.addLayer(marker);
				markers.push(marker);
			},
			removeMarker: function(marker) {
				markers = markers.filter(function(m) { return m !== marker; });
				markerLayer.removeLayer(marker);
			},
			hideMarker: function(marker) {
				if(markers.indexOf(marker) !== -1) {
					markerLayer.removeLayer(marker);
					hiddenMarkers.push(marker);
					markers = markers.filter(function(m) { return m !== marker; });
				}
			},
			showMarker: function(marker) {
				if(hiddenMarkers.indexOf(marker) !== -1) {
					markerLayer.addMarker(marker);
					markers.push(marker);
					hiddenMarkers = markers.filter(function(m) { return m !== marker; });
				}
			},
			showAllMarkers: function() {
				if(hiddenMarkers.length) {
					angular.forEach(hiddenMarkers, function(hM) {
						this.showMarker(hM);
					});
				}
			},
			fitWorld: function() {
				map.setView([0,0], 2);
			},
			fitMarkerLayer: function() {
				if(map instanceof L.Map) {
					map.invalidateSize(false);
					if(markers.length) {
						map.fitBounds(markerLayer.getBounds());
					}
				}
				return map;
			},
			addLayer: function(layer) {
				var self = this;
				var markers = [];
				var markerLayer = L.featureGroup();
				markerLayer.mcLayer = layer;
				groups.push(markerLayer);
				angular.forEach(layer.features, function(f) {
					var marker = featureToMapObj(f);
					marker.mcFeature = f;
					markers.push(marker);
					markerLayer.addLayer(marker);
				});
				markerLayer.addTo(map);
				return {
					markerLayer: markerLayer,
					markers: markers
				};
			},
			clearGroups: function() {
				if(groups.length) {
					angular.forEach(groups, function(group) {
						if(map.hasLayer(group))
							map.removeLayer(group);
					});
				}
				groups = []
			},
			clearAll: function() {
				this.clearMarkers();
				this.clearGroups();
			},
			destroy: function() {
				this.clearAll();
				map.remove();
				map = null;
			}
		}
	}
]);

/*
 * Geocode service
 */

angular.module('mapasColetivos.map').factory('GeocodeService', [
	'$http',
	function($http) {
		return {
			get: function(query) {
				return $http.jsonp('http://nominatim.openstreetmap.org/search.php?q=' + query + '&format=json&json_callback=JSON_CALLBACK');
			}
		}
	}
]);

/*
 * Sir Trevor service
 */

angular.module('mapasColetivos').factory('SirTrevor', [
	function() {

		// Providers regex from SirTrevor's video block code
		var videoProviders = {
			vimeo: {
				regex: /(?:http[s]?:\/\/)?(?:www.)?vimeo.com\/(.+)/,
				html: "<iframe src=\"{{protocol}}//player.vimeo.com/video/{{remote_id}}?title=0&byline=0\" width=\"580\" height=\"320\" frameborder=\"0\"></iframe>"
			},
			youtube: {
				regex: /(?:http[s]?:\/\/)?(?:www.)?(?:(?:youtube.com\/watch\?(?:.*)(?:v=))|(?:youtu.be\/))([^&].+)/,
				html: "<iframe src=\"{{protocol}}//www.youtube.com/embed/{{remote_id}}\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
			}
		};

		return {
			render: function(blocks) {
				var self = this;
				var rendered = '';
				angular.forEach(blocks, function(block) {
					rendered += self.renderBlock(block);
				});
				return rendered;
			},
			renderBlock: function(block) {
				var rendered = '';
				console.log(block);
				switch(block.type) {
					case 'text':
						rendered += '<div class="text">' + markdown.toHTML(block.data.text) + '</div>';
						break;
					case 'list':
						rendered += '<div class="list">' + markdown.toHTML(block.data.text) + '</div>';
						break;
					case 'image':
						rendered += '<div class="image"><img src="' + block.data.file.url + '" /></div>';
						break;
					case 'video':
						rendered += '<div class="video" fit-vids>' + videoProviders[block.data.source].html
							.replace('{{protocol}}', window.location.protocol)
							.replace('{{remote_id}}', block.data.remote_id) + '</div>';
						break;
				}
				return rendered;
			}
		}
	}
]);

/*
 * Directives
 */

angular.module('mapasColetivos').directive('mcDisableEnter', [
	function() {
		return {
			link: function(scope, element) {

				function triggerBlur() {
					element.blur();
				}

				function keyCallback(event) {

					if(event.which == 13) {

						triggerBlur();
						event.preventDefault();

					}

				}

				element.on('keydown keypress', keyCallback);
			}
		}
	}
]);

// Render bindings for dynamic html
angular.module('mapasColetivos').directive('dynamic', [
	'$compile',
	function($compile) {
		return function(scope, element, attrs) {
			scope.$watch(
				function(scope) {
					// watch the 'dynamic' expression for changes
					return scope.$eval(attrs.dynamic);
				},
				function(value) {
					// when the 'dynamic' expression changes
					// assign it into the current DOM
					element.html(value);

					// compile the new DOM and link it to the current
					// scope.
					// NOTE: we only compile .childNodes so that
					// we don't get into infinite loop compiling ourselves
					$compile(element.contents())(scope);
				}
			);
		};
	}
]);

/*
 * Sir Trevor
 */

angular.module('mapasColetivos.content').directive('sirTrevorEditor', [
	'apiPrefix',
	function(apiPrefix) {
		return {
			link: function(scope, element, attrs) {
				SirTrevor.setDefaults({
					uploadUrl: apiPrefix + '/images'
				});
				scope.sirTrevor = new SirTrevor.Editor({
					el: $(element),
					blockTypes: [
						'Embedly',
						'Text',
						'List',
						'Image',
						'Video'
					],
					defaultType: 'Text',
					required: 'Text'
				});
			}
		}
	}
]);

/*
 * CONTROLLERS
 */

/*
 * Message controller
 */
angular.module('mapasColetivos').controller('MessageCtrl', [
	'$scope',
	'MessageService',
	function($scope, MessageService) {

		$scope.service = MessageService;

		$scope.$watch('service.message()', function(message) {
			$scope.message = message;
		});

		$scope.close = function() {
			$scope.service.message(false);
		}

	}
]);

angular.module('mapasColetivos').controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	function($scope, SessionService, $location) {

		if(SessionService.authenticated) {
			$location.path('/dashboard').replace();
		}

	}
]);

angular.module('mapasColetivos').controller('ExploreCtrl', [
	'$scope',
	function($scope) {

	}
]);

angular.module('mapasColetivos').controller('DashboardCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'SessionService',
	'$location',
	'Layer',
	'Map',
	function($scope, $state, $stateParams, SessionService, $location, Layer, Map) {
		if(!SessionService.authenticated) {
			window.location = '/login';
		}
		$scope.user = SessionService.user;

		Layer.query({
			creatorOnly: true
		}, function(res) {
			$scope.layers = res.layers;
		});

		Map.resource.query({
			creatorOnly: true
		}, function(res) {
			$scope.maps = res.maps;
		});

	}
]);

/*
 * Map controller
 */

angular.module('mapasColetivos.map').controller('MapCtrl', [
	'$scope',
	'$location',
	'$state',
	'$stateParams',
	'Map',
	'Layer',
	'MapService',
	'MessageService',
	'SessionService',
	function($scope, $location, $state, $stateParams, Map, Layer, MapService, Message, SessionService) {

		/*
		 * Permission control
		 */
		$scope.canEdit = function(map) {

			if(!map || !SessionService.user)
				return false;

			if(map.creator && map.creator._id == SessionService.user._id) {
				return true;
			}

			return false;

		};

		// New layer
		if($location.path() == '/maps/new') {

			var draft = new Map.resource({
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/maps/' + draft._id + '/edit').replace();
			}, function(err) {
				// TODO error handling
			});

		} else if($stateParams.mapId) {

			var map = MapService.init('map', {
				center: [0,0],
				zoom: 2
			});

			$scope.activeObj = 'settings';

			$scope.mapObj = function(objType) {
				if($scope.activeObj == objType)
					return 'active';

				return false;
			}

			$scope.setMapObj = function(obj) {

				$scope.activeObj = obj;
				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);

			}

			Map.resource.get({mapId: $stateParams.mapId}, function(map) {

				$scope.map = angular.copy(map);

				Layer.query({
					creatorOnly: true
				}, function(res) {

					$scope.userLayers = res.layers;

					$scope.toggleLayer = function(layer) {

						if(!$scope.map.layers)
							$scope.map.layers = [];

						var mapLayers = angular.copy($scope.map.layers);

						if($scope.hasLayer(layer)) {
							mapLayers = mapLayers.filter(function(layerId) { return layerId !== layer._id; });
						} else {
							mapLayers.push(layer._id);
						}

						$scope.map.layers = mapLayers;

					};

					$scope.hasLayer = function(layer) {

						if(!$scope.map.layers)
							$scope.map.layers = [];

						return $scope.map.layers.filter(function(layerId) { return layerId == layer._id; }).length;

					};

					// Cache fetched layers
					var fetchedLayers = {};

					$scope.layers = [];

					var renderLayer = function(layer) {

						$scope.layers.push(layer);

						// Add layer to map and get feature data
						var layerData = MapService.addLayer(layer);

						angular.forEach(layerData.markers, function(marker) {

							marker
								.on('click', function() {

									if($location.path().indexOf('edit') == -1) {

										$state.go('singleMap.feature', {
											featureId: marker.mcFeature._id
										});

									} else {

										// Do something?

									}

								})
								.on('mouseover', function() {

									marker.openPopup();

								})
								.on('mouseout', function() {

									marker.closePopup();

								})
								.bindPopup('<h3 class="feature-title">' + marker.mcFeature.title + '</h3>');

						});

					};

					$scope.$watch('map.layers', function(layers) {

						MapService.clearAll();

						angular.forEach(layers, function(layerId) {

							var layer,
								layerData;

							if(fetchedLayers[layerId]) {
								layer = fetchedLayers[layerId];
								renderLayer(layer);
							} else {
								Layer.get({layerId: layerId}, function(layer) {
									layer = fetchedLayers[layer._id] = layer;
									renderLayer(layer);
								});
							}

						});

					});

					/*
					 * Manage view state
					var viewState = function() {
						if($stateParams.featureId) {
							var feature = layer.features.filter(function(f) { return f._id == $stateParams.featureId; })[0];
							if(feature) {
								$scope.view(feature);
								return true;
							}
						} else if($stateParams.contentId) {

						}
						return false;
					}

					viewState();

					$rootScope.$on('$stateChangeSuccess', function() {

						if(!viewState() && viewing) {
							$scope.close();
						}

					});
					 */

				});

				$scope.save = function() {

					Message.message({
						status: 'loading',
						text: 'Salvando mapa...'
					});

					var map = angular.copy($scope.map);
					map.isDraft = false;

					Map.resource.update({mapId: map._id}, map, function(map) {
						$scope.map = angular.copy(map);
						Message.message({
							status: 'ok',
							text: 'Mapa atualizado'
						});
						$scope.$broadcast('mapSaved');
					}, function(err){
						Message.message({
							status: 'error',
							text: 'Ocorreu um erro.'
						});
					});

				}

				$scope.delete = function() {

					if(confirm('Você tem certeza que deseja remover este mapa?')) {
						Map.resource.delete({mapId: map._id}, function(res) {
							$location.path('/maps').replace();
							Message.message({
								status: 'ok',
								text: 'Mapa removido.'
							});
						}, function(err) {
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro.'
							});
						});
					}

				}

				var deleteDraft = function(callback) {
					if((!$scope.map.title || $scope.map.title == 'Untitled') && !$scope.map.layers.length) {
						if(typeof callback === 'function')
							Map.resource.delete({mapId: map._id}, callback);
						else
							Map.resource.delete({mapId: map._id});
					}
				}

				$scope.close = function() {

					if((!$scope.map.title || $scope.map.title == 'Untitled') && !$scope.map.layers.length) {
						deleteDraft(function(res) {
							$location.path('/maps').replace();
						});
					} else {
						$location.path('/maps/' + map._id);
					}

				}

				$scope.$on('$stateChangeStart', deleteDraft);

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {
					if($scope.map.title == 'Untitled')
						$scope.map.title = '';
				}

			});

		} else {

			Map.resource.query(function(res) {
				$scope.maps = res.maps;
			});

		}

	}
]);

/*
 * Layer controller
 */
angular.module('mapasColetivos.layer').controller('LayerCtrl', [
	'$scope',
	'$location',
	'$stateParams',
	'$q',
	'Layer',
	'LayerSharedData',
	'MessageService',
	'MapService',
	'SessionService',
	function($scope, $location, $stateParams, $q, Layer, LayerSharedData, Message, MapService, SessionService) {

		/*
		 * Permission control
		 */
		$scope.canEdit = function(layer) {

			if(!layer || !SessionService.user)
				return false;

			if(layer.creator && layer.creator._id == SessionService.user._id) {
				return true;
			}

			return false;

		};

		// New layer
		if($location.path() == '/layers/new') {

			var draft = new Layer({
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/layers/' + draft._id + '/edit').replace();
			}, function(err) {
				// TODO error handling
			});

		// Single layer
		} else if($stateParams.layerId) {

			var layerDefer = $q.defer();
			LayerSharedData.layer(layerDefer.promise);

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

				LayerSharedData.editingFeature(false);
				LayerSharedData.editingContent(false);
				$scope.$broadcast('layerObjectChange', active);

			});

			Layer.get({layerId: $stateParams.layerId}, function(layer) {

				var map = MapService.init('layer-map', {
					center: [0,0],
					zoom: 2
				});

				$scope.fitMarkerLayer = function() {
					MapService.fitMarkerLayer();
				}

				// Set layer shared data using service (resolving promise)
				layerDefer.resolve(layer);

				$scope.layer = layer;

				// Store shared data on scope
				$scope.sharedData = LayerSharedData;

				// Watch active sidebar on layer parent scope
				$scope.activeSidebar = false;
				$scope.$watch('sharedData.activeSidebar()', function(active) {
					$scope.activeSidebar = active;
				});

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {

					if($scope.layer.title == 'Untitled')
						$scope.layer.title = '';

					var deleteDraft = function(callback) {
						if((!$scope.layer.title || $scope.layer.title == 'Untitled') && !$scope.layer.features.length && !$scope.layer.contents.length) {
							if(typeof callback === 'function')
								Layer.delete({layerId: layer._id}, callback);
							else
								Layer.delete({layerId: layer._id});
						}
					}

					$scope.save = function($event) {

						Message.message({
							status: 'loading',
							text: 'Salvando camada...'
						});

						var layer = angular.copy($scope.layer);
						layer.isDraft = false;

						Layer.update({layerId: layer._id}, layer, function(layer) {
							$scope.layer = angular.copy(layer);
							Message.message({
								status: 'ok',
								text: 'Camada atualizada'
							});
							$scope.$broadcast('layerSaved');
						}, function(err){
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro.'
							});
						});

					}

					$scope.delete = function() {

						if(confirm('Você tem certeza que deseja remover esta camada?')) {
							Layer.delete({layerId: layer._id}, function(res) {
								$location.path('/layers').replace();
								Message.message({
									status: 'ok',
									text: 'Camada removida.'
								});
							}, function(err) {
								Message.message({
									status: 'error',
									text: 'Ocorreu um erro.'
								});
							});
						}

					}

					$scope.close = function() {

						if((!$scope.layer.title || $scope.layer.title == 'Untitled') && !$scope.layer.features.length && !$scope.layer.contents.length) {
							deleteDraft(function(res) {
								$location.path('/layers').replace();
							});
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

					$scope.$on('$stateChangeStart', deleteDraft);

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

			Layer.query(function(res) {
				$scope.layers = res.layers;
			});

		}

	}
]);

/*
 * Feature controller
 */

angular.module('mapasColetivos.feature').controller('FeatureCtrl', [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'$location',
	'Feature',
	'LayerSharedData',
	'MapService',
	'featureToMapObj',
	function($scope, $rootScope, $state, $stateParams, $location, Feature, LayerSharedData, MapService, featureToMapObj) {

		$scope.objType = 'feature';
		
		$scope.sharedData = LayerSharedData;

		$scope.features = [];

		var mapFeatures;

		var populateMap = function(force) {

			// Repopulate map if feature in scope has changed
			if(!angular.equals(mapFeatures, $scope.features) || force === true) {

				mapFeatures = angular.copy($scope.features);

				MapService.clearMarkers();

				if($scope.features) {

					angular.forEach($scope.features, function(f) {

						var marker = featureToMapObj(f);

						if(marker) {

							marker
								.on('click', function() {
									$scope.$emit('markerClicked', f);
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

			if($scope.features && $scope.features.length) {
				// Fit marker layer after 200ms (animation safe)
				setTimeout(function() {
					MapService.fitMarkerLayer();
				}, 200);
			}

		}

		var viewing = false;

		var unhookContents;

		$scope.view = function(feature) {

			$scope.close(false);

			$scope.sharedData.features([feature]);

			viewing = true;

			$scope.sharedData.activeSidebar(true);

			$scope.feature = feature;

			var contents = Feature.getContents(feature);

			$scope.sharedData.contents(contents);
			unhookContents = $rootScope.$on('layerContentsReady', function() {
				$scope.sharedData.contents(contents);
			});

		}

		$scope.close = function(fit) {

			$scope.sharedData.features($scope.layer.features);
			$scope.sharedData.contents($scope.layer.contents);
			$scope.feature = false;

			$scope.sharedData.activeSidebar(false);

			if(fit !== false)
				MapService.fitMarkerLayer();

			viewing = false;

			if(typeof unhookContents == 'function')
				unhookContents();

		}

		$scope.$on('layerObjectChange', function(event, active) {
			populateMap();
		});

		// Get layer data then...
		$scope.sharedData.layer().then(function(layer) {

			// Update features shared data with layer features
			$scope.sharedData.features(layer.features);

			// Watch layer features
			$scope.$watch('sharedData.features()', function(features) {

				$scope.features = features;
				populateMap();

			});

			if($location.path().indexOf('edit') !== -1) {

				// Force repopulate map on feature close
				$scope.$on('closedFeature', function() {
					populateMap(true);
				});

			}

			/*
			 * Manage view state
			 */
			var viewState = function() {
				if($stateParams.featureId) {
					var feature = layer.features.filter(function(f) { return f._id == $stateParams.featureId; })[0];
					if(feature) {
						$scope.view(feature);
						return true;
					}
				}
				return false;
			}

			viewState();

			$rootScope.$on('$stateChangeSuccess', function() {

				if(!viewState() && viewing) {
					$scope.close();
				}

			});

			/*
			 * Edit actions
			 */
			if($location.path().indexOf('edit') !== -1) {

				$scope.$on('markerClicked', function(event, feature) {
					$scope.edit(feature._id);
				});

				$scope.new = function() {

					$scope.sharedData.editingFeature({});

				};

				$scope.edit = function(featureId) {

					$scope.sharedData.editingFeature(angular.copy($scope.features.filter(function(f) { return f._id == featureId; })[0]));

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

				};

			/*
			 * View actions
			 */
			} else {

				$scope.$on('markerClicked', function(event, feature) {

					$state.go('singleLayer.feature', {
						featureId: feature._id
					});


				});

			}

		});

	}
]);

/*
 * Feature edit controller
 */

angular.module('mapasColetivos.feature').controller('FeatureEditCtrl', [
	'$scope',
	'$rootScope',
	'Feature',
	'LayerSharedData',
	'MessageService',
	'GeocodeService',
	'MapService',
	function($scope, $rootScope, Feature, LayerSharedData, Message, Geocode, MapService) {

		$scope.sharedData = LayerSharedData;

		$scope._data = {};

		$scope.marker = false;

		$scope.defaults = {
			scrollWheelZoom: false
		};

		var addMarkerOnClick = function(LatLng) {

			var LatLng = LatLng.latlng;

			if(!$scope.marker) {
				$scope.editing.geometry = {
					coordinates: [
						LatLng.lat,
						LatLng.lng
					]
				};
				$scope.setMarker(false);
			}

		}

		$scope.setMarker = function(focus) {

			if($scope.editing) {

				MapService.clearMarkers();

				if($scope.editing.geometry) {

					$scope.marker = L.marker($scope.editing.geometry.coordinates, {
						draggable: true
					});

					$scope.marker
						.bindPopup('<p class="tip">Arraste para alterar a localização.</p>')
						.on('dragstart', function() {
							$scope.marker.closePopup();
						})
						.on('drag', function() {
							$scope.marker.closePopup();
							var coordinates = $scope.marker.getLatLng();
							$scope.editing.geometry.coordinates = [
								coordinates.lat,
								coordinates.lng
							];
						});

					MapService.addMarker($scope.marker);

					$scope.marker.openPopup();

					if(focus !== false) {
						var map = MapService.get();
						map.setView($scope.marker.getLatLng(), 15, {
							reset: true
						});
					}

				} else {

					MapService.fitWorld();

				}

				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 200);

			}

		}

		/*
		 * Get layer shared data
		 */
		$scope.sharedData.layer().then(function(layer) {

			var map = MapService.get();

			map.on('click', addMarkerOnClick);

			/*
			 * Watch editing feature
			 */
			$scope.$watch('sharedData.editingFeature()', function(editing) {

				$scope.tool = false;
				$scope.marker = false;
				$scope._data = {};
				$rootScope.$broadcast('editFeature');
				$scope.editing = editing;
				$scope.setMarker();

			});

			$scope.$watch('sharedData.features()', function(features) {
				$scope.features = features;
			});

			$scope.save = function(silent) {

				if($scope.editing && $scope.editing._id) {

					Feature.resource.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

						// Replace feature in local features
						angular.forEach($scope.features, function(feature, i) {
							if(feature._id == $scope.editing._id)
								$scope.features[i] = $scope.editing;
						});
						$scope.sharedData.features($scope.features);

						$scope.sharedData.editingFeature(angular.copy($scope.editing));

						if(silent !== true) {
							Message.message({
								status: 'ok',
								text: 'Feature salva.'
							});
							$scope.close();
						}

					}, function(err) {

						if(err.status == 500)
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);

					});

				} else {

					var feature = new Feature.resource($scope.editing);

					feature.$save({layerId: layer._id}, function(feature) {

						// Locally push new feature
						$scope.features.push(feature);
						$scope.sharedData.features($scope.features);

						// Update editing feature to saved data
						$scope.sharedData.editingFeature(angular.copy(feature));

						Message.message({
							status: 'ok',
							text: 'Feature adicionada.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);

					});

				}

			}

			$scope.delete = function() {

				if(confirm('Você tem certeza que deseja remover esta feature?')) {

					Feature.resource.delete({featureId: $scope.editing._id, layerId: layer._id}, function() {

						$scope.sharedData.features($scope.features.filter(function(f) {
							return f._id !== $scope.editing._id;
						}));
						LayerSharedData.editingFeature(false);

						Message.message({
							status: 'ok',
							text: 'Feature removida.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);
					});

				}

			}

			/*
			 * Tools
			 */

			$scope.tool = false;

			$scope.setTool = function(tool) {
				if(tool == $scope.tool)
					$scope.tool = false;
				else
					$scope.tool = tool;
			}

			$scope.geocode = function() {

				Geocode.get($scope._data.geocode)
					.success(function(res) {
						$scope._data.geocodeResults = res;
					})
					.error(function(err) {
						$scope._data.geocodeResults = [];
					});

			}

			$scope.setNominatimFeature = function(feature) {

				$scope.editing.geometry = {};

				$scope.editing.geometry.coordinates = [
					parseFloat(feature.lat),
					parseFloat(feature.lon)
				];

				$scope.setMarker();

			}

			$scope.close = function() {

				$scope.tool = false;
				$scope.marker = false;
				$scope._data = {};
				$scope.sharedData.editingFeature(false);
				$rootScope.$broadcast('closedFeature');

			}

			$scope.$on('layerObjectChange', $scope.close);
			$scope.$on('$stateChangeStart', $scope.close);
			$scope.$on('layerSaved', function() {

				if($scope.sharedData.editingFeature()) {
					$scope.save(true);
				}

			});

		});

	}
]);



/*
 * Content controller
 */

angular.module('mapasColetivos.content').controller('ContentCtrl', [
	'$scope',
	'$rootScope',
	'$stateParams',
	'SirTrevor',
	'Content',
	'LayerSharedData',
	'MapService',
	'featureToMapObj',
	function($scope, $rootScope, $stateParams, SirTrevor, Content, LayerSharedData, MapService, featureToMapObj) {

		$scope.objType = 'content';
		
		$scope.sharedData = LayerSharedData;

		$scope.contents = [];

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		var viewing = false;

		$scope.view = function(content) {

			if(!content)
				return false;

			viewing = true;

			$scope.sharedData.activeSidebar(true);

			var features = Content.getFeatures(content);
			if(features) {
				$scope.sharedData.features(features);
			}

			$scope.content = content;
			$scope.content.featureObjs = features;

		}

		$scope.close = function() {

			$scope.sharedData.features($scope.layer.features);
			$scope.content = false;
			$scope.sharedData.activeSidebar(false);
			MapService.fitMarkerLayer();

			viewing = false;

		}

		$scope.sharedData.layer().then(function(layer) {

			var viewState = function() {
				if($stateParams.contentId) {
					var content = layer.contents.filter(function(c) { return c._id == $stateParams.contentId; })[0];
					$scope.view(content);
					return true;
				}
				return false;
			}

			viewState();

			$rootScope.$on('$stateChangeSuccess', function() {

				if(!viewState() && viewing) {
					$scope.close();
				}

			});

			$scope.layer = layer;

			$scope.sharedData.contents(layer.contents);

			$rootScope.$broadcast('layerContentsReady');

			$scope.$watch('sharedData.contents()', function(contents) {
				$scope.contents = contents;
			});

			$scope.new = function() {

				$scope.sharedData.editingContent({});

			};

			$scope.edit = function(contentId) {

				$scope.sharedData.editingContent(angular.copy($scope.contents.filter(function(c) { return c._id == contentId; })[0]));

				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
					document.getElementById('content-edit-body').scrollTop = 0;
				}, 100);

			};

			$scope.$on('layerObjectChange', $scope.close);
			$scope.$on('$stateChangeStart', $scope.close);

		});

		$scope.$on('closedContent', function() {

			// Fix map size after 200ms (animation safe)
			setTimeout(function() {
				MapService.fitMarkerLayer();
			}, 200);

		});

	}
]);

/*
 * Content edit controller
 */

angular.module('mapasColetivos.content').controller('ContentEditCtrl', [
	'$scope',
	'$rootScope',
	'Content',
	'LayerSharedData',
	'MessageService',
	'SirTrevor',
	function($scope, $rootScope, Content, LayerSharedData, Message, SirTrevor) {

		var original = false;

		$scope.sharedData = LayerSharedData;

		$scope.sharedData.layer().then(function(layer) {

			$scope.$watch('sharedData.editingContent()', function(editing) {
				original = angular.copy(editing);
				$scope.tool = false;
				$scope.editing = editing;
			});

			$scope.$watch('sharedData.contents()', function(contents) {
				$scope.contents = contents;
			});

			$scope.$watch('editing.sirTrevor', function(val) {

				// Reinitialize Sir Trevor with some delay (enough to populate the model with new data)
				setTimeout(function() {
					$scope.sirTrevor.reinitialize();
				}, 20);

			});

			$scope.save = function() {

				// Trigger SirTrevor form submit 
				$scope.sirTrevor.onFormSubmit();

				// Fixed content type
				$scope.editing.type = 'Post';

				// Store content (SirTrevor data)
				$scope.editing.sirTrevorData = $scope.sirTrevor.dataStore.data;

				// Store stringified data
				$scope.editing.sirTrevor = $scope.sirTrevor.el.value;

				if($scope.editing && $scope.editing._id) {

					Content.resource.update({contentId: $scope.editing._id}, $scope.editing, function(content) {

						$scope.editing = angular.copy(content);
						original = angular.copy(content);

						// Replace content in local features
						angular.forEach($scope.contents, function(c, i) {
							if(c._id == $scope.editing._id)
								$scope.contents[i] = $scope.editing;
						});
						$scope.sharedData.contents($scope.contents);

						Message.message({
							status: 'ok',
							text: 'Conteúdo salvo.'
						});

					}, function(err) {

						if(err.status == 500)
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);
						else {
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);
						}


					});

				} else {

					$scope.editing.layer = layer._id;

					var content = new Content.resource($scope.editing);

					content.$save(function(content) {

						original = angular.copy(content);

						// Locally push new content
						$scope.contents.push(content);
						$scope.sharedData.contents($scope.contents);

						// Update editing content to saved data
						$scope.sharedData.editingContent(angular.copy(content));

						Message.message({
							status: 'ok',
							text: 'Conteúdo adicionado.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);

					});

				}

			}

			$scope.delete = function() {

				if(confirm('Você tem certeza que deseja remover este conteúdo?')) {

					Content.resource.delete({contentId: $scope.editing._id}, function() {

						$scope.sharedData.contents($scope.contents.filter(function(c) {
							return c._id !== $scope.editing._id;
						}));
						LayerSharedData.editingContent(false);

						Message.message({
							status: 'ok',
							text: 'Conteúdo removido.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);
					});

				}

			}

			$scope.close = function() {

				if($scope.editing) {
					$scope.sharedData.editingContent(false);
					$rootScope.$broadcast('closedContent');
				}

			}

			$scope.$on('$stateChangeStart', $scope.close);

			/*
			 * Features
			 */
			$scope.hasFeature = function(featureId) {
				if($scope.editing && $scope.editing.features) {
					return $scope.editing.features.filter(function(f) { return f == featureId }).length;
				}
				return false;
			}

			$scope.toggleFeature = function(featureId) {

				if(!$scope.editing.features)
					$scope.editing.features = [];

				var features = angular.copy($scope.editing.features);

				if($scope.hasFeature(featureId)) {
					features = features.filter(function(f) { return f !== featureId });
				} else {
					features.push(featureId);
				}

				$scope.editing.features = features;

			}

			$scope.clearFeatures = function() {

				$scope.editing.features = [];

			}

			/*
			 * Tools
			 */

			$scope.tool = false;

			$scope.setTool = function(tool) {
				if(tool == $scope.tool)
					$scope.tool = false;
				else
					$scope.tool = tool;
			}

			$scope.geocode = function() {

				Geocode.get($scope._data.geocode)
					.success(function(res) {
						$scope._data.geocodeResults = res;
					})
					.error(function(err) {
						$scope._data.geocodeResults = [];
					});

			}

			$scope.isRevertable = function() {

				return (!angular.equals($scope.editing, original) && $scope.editing && $scope.editing._id);

			}

			$scope.revert = function() {

				$scope.editing = angular.copy(original);

			}

		});

	}
]);

/*
 * Loading service
 */

angular.module('loadingStatus', ['ngAnimate'])

.config(function($httpProvider) {
	$httpProvider.interceptors.push('loadingStatusInterceptor');
})

.directive('loadingStatusMessage', function() {
	return {
		link: function($scope, $element, attrs) {
			var show = function() {
				$element.addClass('active');
			};
			var hide = function() {
				$element.removeClass('active');
			};
			$scope.$on('loadingStatusActive', show);
			$scope.$on('loadingStatusInactive', hide);
			hide();
		}
	};
})

.factory('loadingStatusInterceptor', function($q, $rootScope, $timeout) {
	var activeRequests = 0;
	var started = function() {
		if(activeRequests==0) {
			$rootScope.$broadcast('loadingStatusActive');
		}    
		activeRequests++;
	};
	var ended = function() {
		activeRequests--;
		if(activeRequests==0) {
			$rootScope.$broadcast('loadingStatusInactive');
		}
	};
	return {
		request: function(config) {
			started();
			return config || $q.when(config);
		},
		response: function(response) {
			ended();
			return response || $q.when(response);
		},
		responseError: function(rejection) {
			ended();
			return $q.reject(rejection);
		}
	};
});