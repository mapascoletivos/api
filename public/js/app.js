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
		var features = [];
		return {
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

			var deferred = $q.defer();
			LayerFeatures.setFeatures(deferred.promise);

			Layer.get({layerId: $routeParams.layerId}, function(layer) {

				// Set layer features using service
				deferred.resolve(layer.features);

				//console.log(LayerFeatures.getFeatures());

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

		LayerFeatures.getFeatures().then(function(features) {

			var map = MapService.getMap();

			$scope.features = features;


			$scope.edit = function(featureId) {

				$scope.feature = features.filter(function(f) { return f._id == featureId; })[0];
				$scope.editingFeature = true;

			}

			$scope.cancel = function() {

				$scope.editingFeature = false;

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

					var feature = features.filter(function(f) { return f._id == featureID; })[0];

					map.setView(feature.geometry.coordinates, 14);

				};

			}

		});

	}
]);