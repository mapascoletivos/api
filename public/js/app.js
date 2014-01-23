/*
 * App modules
 */

angular.module('mapasColetivos.map', []);

angular.module('mapasColetivos.user', []);

angular.module('mapasColetivos.session', []);

angular.module('mapasColetivos.content', []);

angular.module('mapasColetivos.feature', []);

angular.module('mapasColetivos.layer', [
	'ngResource',
	'mapasColetivos.map',
	'mapasColetivos.feature',
	'mapasColetivos.content'
]);

angular
	.module('mapasColetivos', [
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
	'$routeProvider',
	'$locationProvider',
	'$httpProvider',
	function($routeProvider, $locationProvider, $httpProvider) {

		$httpProvider.defaults.withCredentials = true;

		$routeProvider
			.when('/', {
				controller: 'IndexCtrl',
				templateUrl: '/home'
			})
			.when('/explore', {
				controller: 'ExploreCtrl',
				templateUrl: '/views/explore.html'
			})
			.when('/dashboard', {
				controller: 'DashboardCtrl',
				templateUrl: '/views/dashboard.html'
			})
			.when('/user/:userName', {
				controller: 'UserCtrl',
				templateUrl: '/views/user/index.html'
			})
			.when('/user/:userName/layers', {
				controller: 'UserCtrl',
				templateUrl: '/views/user/layers.html'
			})
			.when('/layers', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/index.html'
			})
			.when('/layers/new', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/index.html'
			})
			.when('/layers/:layerId', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/show.html'
			})
			.when('/layers/:layerId/:action', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/edit.html'
			})
			.when('/layers/:layerId/:action/feature/:featureId', {
				controller: 'FeatureEdit',
				templateUrl: '/views/features/edit.html'
			})
			.otherwise('/');

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
 * Map service
 */
angular.module('mapasColetivos.map').factory('MapService', [
	function() {
		var map = undefined;
		return {
			getMap: function() {
				if(map instanceof L.Map)
					return map;
				else
					return false;
			},
			setMap: function(val) {
				if(val instanceof L.Map)
					map = val;
				else {
					console.log('Map must be an instance of Leaflet map (L.Map)');
					map = false;
				}
				return map;
			}
		}
	}
]);

/*
 * Feature service
 */
angular.module('mapasColetivos.feature').factory('Feature', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/features/:featureId', {'_csrf': window.token}, {
			'save': {
				method: 'POST',
				url: apiPrefix + '/layers/:layerId/features'
			},
			'update': {
				method: 'PUT'
			},
			'delete': {
				method: 'DELETE',
				url: apiPrefix + '/layers/:layerId/features/:featureId'
			}
		});

	}
]);

/*
 * Content service
 */
angular.module('mapasColetivos.content').factory('Content', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/contents/:contentId', {'_csrf': window.token}, {
			'save': {
				method: 'POST',
				url: apiPrefix + '/contents/:contentId' // TODO '/layers/:layerId/contents/:contentId'
			},
			'update': {
				method: 'PUT'
			}
		});

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
 * Layer features service
 */
angular.module('mapasColetivos.layer').factory('LayerSharedData', [
	function() {
		var layer = {};
		var features = [];
		var contents = [];
		var editingFeature = false;
		var editingContent = false;
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

				if(typeof(val) !== 'undefined')
					editingFeature = val;

				return editingFeature;
			},
			editingContent: function(val) {

				if(typeof(val) !== 'undefined')
					editingContent = val;

				return editingContent;
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
					//console.log(element);
					element.blur();
				}

				function keyCallback(event) {

					if(event.which == 13) {

						//scope.$apply(triggerBlur);
						triggerBlur();
						event.preventDefault();

					}

				}

				element.on('keydown keypress', keyCallback);
			}
		}
	}
]);

angular.module('mapasColetivos').controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	function($scope, SessionService, $location) {

		if(SessionService.authenticated) {
			$location.path('/dashboard');
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
	'SessionService',
	'$location',
	function($scope, SessionService, $location) {
		if(!SessionService.authenticated) {
			window.location = '/login';
		}
		$scope.user = SessionService.user;
	}
]);

/*
 * Map controller
 */
angular.module('mapasColetivos.map').controller('MapCtrl', [
	'$scope',
	'MapService',
	function($scope, MapService) {
		$scope.map = L.map('map', {
			center: [0, 0],
			zoom: 2
		});
		MapService.setMap($scope.map);
		$scope.map.addLayer(L.tileLayer('http://{s}.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png'));
	}
]);

/*
 * Layer controller
 */
angular.module('mapasColetivos.layer').controller('LayerCtrl', [
	'$scope',
	'$location',
	'$routeParams',
	'$q',
	'Layer',
	'LayerSharedData',
	'MessageService',
	function($scope, $location, $routeParams, $q, Layer, LayerSharedData, MessageService) {

		// New layer
		if($location.path() == '/layers/new') {

			var draft = new Layer({
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/layers/' + draft._id + '/edit/');
			}, function(err) {
				// TODO error handling
				console.log(err);
			});

		// Single layer
		} else if($routeParams.layerId) {

			var layerDefer = $q.defer();
			LayerSharedData.layer(layerDefer.promise);

			Layer.get({layerId: $routeParams.layerId}, function(layer) {

				// Set layer shared data using service (resolving promise)
				layerDefer.resolve(layer);

				$scope.layer = layer;

				if($routeParams.action == 'edit') {

					$scope.save = function($event) {

						Layer.update({layerId: layer._id}, $scope.layer, function(layer) {
							MessageService.message({
								status: 'ok',
								text: 'Camada atualizada'
							});
						}, function(err){
							// TODO error handling
						});

					}

					$scope.delete = function() {

						if(confirm('Você tem certeza que deseja remover esta camada?')) {
							Layer.delete({layerId: layer._id}, function(res) {
								$location.path('/layers');
							}, function(err) {
								// TODO error handling
								console.log(err);
							});
						}

					}

					$scope.cancel = function() {

						if($scope.layer.title == 'Untitled' && !$scope.layer.features.length) {
							Layer.delete({layerId: layer._id}, function(res) {
								$location.path('/layers');
							}, function(err) {
								// TODO error handling
								console.log(err);
							});
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

				}

			});

		// All layers
		} else {

			Layer.query(function(res) {
				$scope.layers = res.layers;
			});

		}

		var activeObj = 'feature';

		$scope.layerObj = function(objType) {
			if(activeObj == objType)
				return 'active';

			return false;
		}

		$scope.setLayerObj = function(obj) {

			activeObj = obj;

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

/*
 * Feature controller
 */

angular.module('mapasColetivos.feature').controller('FeatureCtrl', [
	'$scope',
	'LayerSharedData',
	'Feature',
	'MapService',
	function($scope, LayerSharedData, Feature, MapService) {

		$scope.objType = 'feature';
		
		$scope.sharedData = LayerSharedData;

		$scope.sharedData.layer().then(function(layer) {

			$scope.sharedData.features(layer.features);

			$scope.$watch('sharedData.features()', function(features) {
				$scope.features = features;
			});

			var map = MapService.getMap();

			$scope.new = function() {

				$scope.sharedData.editingFeature({});

			}

			$scope.edit = function(featureId) {

				$scope.sharedData.editingFeature($scope.features.filter(function(f) { return f._id == featureId; })[0]);

			}

			if(typeof map !== 'undefined' && typeof $scope.features !== 'undefined') {

				var markers = [];

				angular.forEach($scope.features, function(f) {

					var marker = L.marker(f.geometry.coordinates);
					markers.push(marker);

				});

				var featureLayer = L.featureGroup(markers);

				map.addLayer(featureLayer);
				map.fitBounds(featureLayer.getBounds());

				$scope.viewInMap = function(featureId) {

					var feature = $scope.features.filter(function(f) { return f._id == featureId; })[0];

					map.setView(feature.geometry.coordinates, 14);

				};

			}

		});

	}
]);

/*
 * Feature edit controller
 */

angular.module('mapasColetivos.feature').controller('FeatureEditCtrl', [
	'$scope',
	'Feature',
	'LayerSharedData',
	'MessageService',
	function($scope, Feature, LayerSharedData, Message) {

		$scope.sharedData = LayerSharedData;

		$scope.sharedData.layer().then(function(layer) {

			$scope.$watch('sharedData.editingFeature()', function(editing) {
				$scope.editing = editing;
			});

			$scope.$watch('sharedData.features()', function(features) {
				$scope.features = features;
			});

			$scope.save = function() {

				if($scope.editing && $scope.editing._id) {

					Feature.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

						// Disable editing ui
						$scope.sharedData.editingFeature(false);

						Message.message({
							status: 'ok',
							text: 'Feature salva.'
						});

					}, function(err) {
						// TODO error handling
						console.log(err);
					});

				} else {

					var feature = new Feature($scope.editing);

					feature.$save({layerId: layer._id}, function(feature) {

						// Locally push new feature
						$scope.features.push(feature);

						// Disable editing ui
						$scope.sharedData.editingFeature(false);

					}, function(err) {
						// TODO error handling
						console.log(err);
					});

				}

			}

			$scope.delete = function() {

				Feature.delete({featureId: $scope.editing._id, layerId: layer._id}, function() {

					$scope.sharedData.features($scope.features.filter(function(f) {
						return f._id !== $scope.editing._id;
					}));
					LayerSharedData.editingFeature(false);

				}, function(err) {
					// TODO error handling
					console.log(err);
				});

			}

			$scope.cancel = function() {

				LayerSharedData.editingFeature(false);

			}

		});

	}
]);

angular.module('mapasColetivos.content').controller('ContentCtrl', [
	'$scope',
	'Content',
	function($scope, Content) {

		$scope.objType = 'content';

	}
]);