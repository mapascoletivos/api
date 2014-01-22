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
				method: 'PUT',
				url: apiPrefix + '/layers/:layerId/features/:featureId'
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
angular.module('mapasColetivos.layer').factory('LayerFeatures', [
	function() {
		var layer = {};
		var features = [];
		return {
			getLayer: function() {
				return layer;
			},
			setLayer: function(val) {
				layer = val;
				return val;
			},
			getFeatures: function() {
				return features;
			},
			setFeatures: function(val) {
				features = val;
				return features;
			}
		}
	}
]);

/*
 * Feature contents service - NOT WORKING (should be layerContents service)
 * TODO - Associate contents to layer to perform contents query in layer listing
 */
angular.module('mapasColetivos.feature').factory('featureContents', [
	function() {
		var feature = {};
		var contents = [];
		return {
			getFeature: function() {
				return feature;
			},
			setFeature: function(val) {
				feature = val;
				return val;
			},
			getContents: function() {
				return features;
			},
			setContents: function(val) {
				contents = val;
				return contents;
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
		console.log($scope.user);
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
		$scope.map.addLayer(L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png'));
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
	'LayerFeatures',
	function($scope, $location, $routeParams, $q, Layer, LayerFeatures) {

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

			var featuresDefer = $q.defer();
			LayerFeatures.setFeatures(featuresDefer.promise);

			var layerDefer = $q.defer();
			LayerFeatures.setLayer(layerDefer.promise);

			Layer.get({layerId: $routeParams.layerId}, function(layer) {

				// Set layer and it's features using service (resolving promise)
				featuresDefer.resolve(layer.features);
				layerDefer.resolve(layer);

				$scope.layer = layer;

				if($routeParams.action == 'edit') {

					$scope.save = function($event) {

						Layer.update({layerId: layer._id}, $scope.layer, function(layer) {
							// TODO message system (do not change location)
							// $location.path('/layers/' + layer._id);
							console.log('Salvo');
						}, function(err){
							// TODO error handling
						});

					}

					$scope.delete = function() {

						if(confirm('Você tem certeza que deseja remover esta feature?')) {
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

	}
]);

/*
 * Feature controller
 */
angular.module('mapasColetivos.feature').value('editing', false).controller('FeatureCtrl', [
	'$scope',
	'LayerFeatures',
	'Feature',
	'MapService',
	'editing',
	function($scope, LayerFeatures, Feature, MapService, editing) {

		LayerFeatures.getLayer().then(function(layer) {

			$scope.features = layer.features;

			var map = MapService.getMap();

			$scope.editing = editing;

			$scope.new = function() {

				$scope.editing = {};

			}

			$scope.edit = function(featureId) {

				$scope.editing = $scope.features.filter(function(f) { return f._id == featureId; })[0];

			}

			$scope.save = function() {

				if($scope.editing && $scope.editing._id) {

					Feature.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

						// Disable editing ui
						$scope.editing = false;

					}, function(err) {
						// TODO error handling
						console.log(err);
					});

				} else {

					var feature = new Feature($scope.editing);

					feature.$save({layerId: layer._id}, function(feature) {

						// Locally push feature to scope
						$scope.features.push(feature);

						// Disable editing ui
						$scope.editing = false;

					}, function(err) {
						// TODO error handling
						console.log(err);
					});

				}

			}

			$scope.delete = function() {

				Feature.delete({featureId: $scope.editing._id, layerId: layer._id}, function() {

					$scope.features = $scope.features.filter(function(f) {
						return f._id !== $scope.editing._id;
					});
					$scope.editing = false;

				}, function(err) {
					// TODO error handling
					console.log(err);
				});

			}

			$scope.cancel = function() {

				$scope.editing = false;

			}

			if(typeof map !== 'undefined') {

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

angular.module('mapasColetivos.content').controller('ContentCtrl', [
	'$scope',
	'Content',
	function($scope, Content) {



	}
]);