/*

var map = L.map('map', {
	center: [0, 0],
	zoom: 2
});
map.addLayer(L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png'));

var apiPrefix = '/api/v1';

layerEditor.value('features', []);
layerEditor.value('markers', []);
layerEditor.value('media', []);

*/

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

angular.module('mapasColetivos').factory('SessionService', [
	function() {
		var _this = this;
		_this._data = {
			authenticated: !! window.isAuthenticated
		};
		return _this._data;
	}
]);

angular.module('mapasColetivos').controller('IndexCtrl', [
	'$scope',
	'SessionService',
	function($scope, SessionService) {

		$scope.global = SessionService;

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
 * Layer Services
 */
angular.module('mapasColetivos.layer').factory('Layer', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/layers/:layerId', {'_csrf': window.token}, {
			'update': {
				method: 'PUT'
			}
		});

	}
]);

/*
 * Layer controller
 */
angular.module('mapasColetivos.layer').controller('LayerCtrl', [
	'$scope',
	'$location',
	'$routeParams',
	'Layer',
	function($scope, $location, $routeParams, Layer) {

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

			Layer.get({layerId: $routeParams.layerId}, function(layer) {

				$scope.layer = layer;

				if($routeParams.action == 'edit') {

					$scope.submit = function() {

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

			Layer.query(function(layers) {
				$scope.layers = layers;
			});

		}

	}
]);

/*
 * Feature Services
 */
angular.module('mapasColetivos.layer').factory('Feature', [
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
 * Feature directive
 * Add feature ID data to DOM item
 */
angular.module('mapasColetivos.feature').directive('FeatureData', function() {
	return function(scope, element, attrs) {
		if(scope.feature._id) {
			element[0].setAttribute('data-feature', scope.feature._id);
		}
	};
});

/*
 * Feature controllers
 */
angular.module('mapasColetivos.feature').controller('FeatureCtrl', [
	'$scope',
	'$http',
	'FeatureService',
	'markers',
	function($scope, $http, Features, markers) {

		Features.query().success(function(features) {

			$scope.features = features;

			markers = [];

			angular.forEach(features, function(value) {

				var marker = L.marker(value.geometry.coordinates);
				markers.push(marker);

			});

			layerEditor.featureLayer = L.featureGroup(markers);

			$scope.viewInMap = function($event) {

				var featureID = $event.currentTarget.dataset.feature;

				var feature = features.filter(function(f) { return f._id == featureID })[0];

				//map.setView(feature.geometry.coordinates, 10);

			};

		});

	}
]);

angular.module('mapasColetivos.feature').controller('FeatureEdit', [
	'$scope',
	'$routeParams',
	'$location',
	'FeaturesService',
	function($scope, $routeParams, $location, Features) {

		if($routeParams.featureId) {

			Features.get($routeParams.featureId).success(function(feature) {
				$scope.feature = feature;
			});

		}

		$scope.save = function() {
			feature = $scope.feature;
			$location.path('/features');
		}

		$scope.delete = function() {
			$location.path('/features');
		}

	}
]);

angular.module('mapasColetivos.feature').controller('FeatureNew', [
	'$scope',
	'$location',
	'features',
	function($scope, $location, features) {

		$scope.save = function() {
			features.push($scope.feature);
		}

		$scope.delete = function() {
			$location.path('/features');
		}

	}
]);

angular.module('mapasColetivos.media').controller('MediaCtrl', [
	'$scope',
	'$http',
	function($scope, $http) {

		$scope.media = [
			{
				title: 'Media 01'
			},
			{
				title: 'Media 02'
			}
		];

	}
]);