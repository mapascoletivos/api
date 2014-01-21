/*
 * App modules
 */

angular.module('mapasColetivos.map', []);

angular.module('mapasColetivos.user', []);

angular.module('mapasColetivos.session', []);

angular.module('mapasColetivos.media', []);

angular.module('mapasColetivos.feature', []);

angular.module('mapasColetivos.layer', [
	'ngResource',
	'mapasColetivos.map',
	'mapasColetivos.feature',
	'mapasColetivos.media'
]);

angular
	.module('mapasColetivos', [
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
			authenticated: !! window.isAuthenticated
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
				return map;
			},
			setMap: function(val) {
				map = val;
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
				url: apiPrefix + '/layers/:layerId/features/:featureId'
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

angular.module('mapasColetivos').controller('IndexCtrl', [
	'$scope',
	'SessionService',
	function($scope, SessionService) {

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

					$scope.save = function() {

						Layer.update({layerId: layer._id}, $scope.layer, function(layer) {
							$location.path('/layers/' + layer._id);
						}, function(err){
							// TODO error handling
						});

					}

					$scope.delete = function() {

						Layer.delete({layerId: layer._id}, function(res) {
							if(res.success) {
								$location.path('/layers');
							} else {
								//TODO error handling
								console.log(res);
							}
						}, function(err) {
							// TODO error handling
							console.log(err);
						});

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
angular.module('mapasColetivos.feature').controller('FeatureCtrl', [
	'$scope',
	'LayerFeatures',
	'Feature',
	'MapService',
	function($scope, LayerFeatures, Feature, MapService) {

		LayerFeatures.getLayer().then(function(layer) {

			var map = MapService.getMap();

			$scope.features = layer.features;
			$scope.editing = false;

			$scope.new = function() {

				$scope.editing = true;

			}

			$scope.edit = function(featureId) {

				$scope.feature = $scope.features.filter(function(f) { return f._id == featureId; })[0];
				$scope.editing = true;

			}

			$scope.save = function() {

				$scope.feature.layer = layer._id;

				if($scope.feature && $scope.feature._id) {

					Feature.update({featureId: $scope.feature._id}, $scope.feature, function(feature) {

						// Disable editing ui
						$scope.editing = false;

						// Reset feature
						$scope.feature = null;

					}, function(err) {
						// TODO error handling
						console.log(err);
					});

				} else {

					var feature = new Feature($scope.feature);

					feature.$save(function(feature) {

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

				Feature.delete({featureId: $scope.feature._id}, function() {

					$scope.features = $scope.features.filter(function(f) {
						return f._id !== $scope.feature._id;
					});
					$scope.editingFeature = false;

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

				$scope.viewInMap = function($event) {

					var featureID = $event.currentTarget.dataset.feature;

					var feature = $scope.features.filter(function(f) { return f._id == featureID; })[0];

					map.setView(feature.geometry.coordinates, 14);

				};

			}

		});

	}
]);