/*
 * App modules
 */

angular.module('mapasColetivos.map', []);

angular.module('mapasColetivos.user', []);

angular.module('mapasColetivos.session', []);

angular.module('mapasColetivos.media', []);

angular.module('mapasColetivos.feature', []);

angular.module('mapasColetivos.layer', [
	'mapasColetivos.feature',
	'mapasColetivos.media'
]);

angular.module('mapasColetivos', [
	'ngRoute',
	'mapasColetivos.layer',
	'mapasColetivos.user'
]);

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
				controller: 'Index',
				templateUrl: '/template/home'
			})
			.when('/explore', {
				controller: 'Explore',
				templateUrl: '/template/explore'
			})
			.when('/dashboard', {
				controller: 'Dashboard',
				templateUrl: '/template/dashboard'
			})
			.when('/layers', {
				controller: 'LayerCtrl',
				templateUrl: '/template/layers'
			})
			.when('/layers/:layerId', {
				controller: 'LayerCtrl',
				templateUrl: '/template/layers/show'
			});

			/*
			.when('/layers/new', {
				controller: 'LayerNew',
				templateUrl: '/template/layers/new'
			})
			.when('/layers/new/features', {
				controller: 'FeatureCtrl',
				templateUrl: '/partials/map-editor/features'
			})
			.when('/layers/new/features/edit/:featureId', {
				controller: 'FeatureEdit',
				templateUrl: '/partials/map-editor/feature'
			})
			.when('/layers/new/features/new', {
				controller: 'FeatureNew',
				templateUrl: '/partials/map-editor/feature'
			})
			.when('/layers/new/media', {
				controller: 'MediaCtrl',
				templateUrl: '/partials/map-editor/media'
			});
			*/

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
	function($resource) {
		var _this = this;
			_this._data = {
				user: window.user,
				authenticated: !! window.user
		};
		return _this._data;
	}
]);

angular.module('mapasColetivos').controller('Index', [
	'$scope',
	'SessionService',
	function($scope, SessionService) {

		console.log(SessionService);

		$scope.global = SessionService;

	}
]);

angular.module('mapasColetivos').controller('Explore', [
	'$scope',
	function($scope) {

	}
]);

angular.module('mapasColetivos').controller('Dashboard', [
	'$scope',
	function($scope) {

	}
]);

angular.module('mapasColetivos').controller('LayerNew', [
	'$scope',
	'SessionService',
	function($scope, SessionService) {

		$scope.global = SessionService;

	}
]);

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
 * Layer Services
 */
angular.module('mapasColetivos.layer').factory('LayerService', [
	'$http',
	'$q',
	function($http, $q) {
		return {
			query: function(params) {
				return $http({
					url: '/api/v1/layers.json',
					params: params,
					method: 'GET'
				});
			},
			get: function(layerId) {
				return $http.get('/api/v1/layers/' + layerId + '.json');
			}
		}
	}
]);

/*
 * Layer controller
 */
angular.module('mapasColetivos.layer').controller('LayerCtrl', [
	'$scope',
	'$routeParams',
	'LayerService',
	function($scope, $routeParams, LayerService) {

		// Single layer
		if($routeParams.layerId) {

			LayerService.get($routeParams.layerId).success(function(layer) {

				$scope.layer = layer;

			});

		// All layers
		} else {

			LayerService.query({perPage: 5}).success(function(layers) {
				$scope.layers = layers;
			});

		}

	}
]);

/*
 * Get layer features
 */
angular.module('mapasColetivos.feature').factory('FeaturesService', [
	'$http',
	'$q',
	function($http, $q) {
		return {
			query: function() {
				return $http.get('/features');
			},
			get: function(featureId) {
				return $http.get('/api/v1/features/' + featureId);
			}
		}
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
	'FeaturesService',
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

			// Add feature layer to map
			if(layerEditor.featureLayer && !map.hasLayer(layerEditor.eatureLayer)) {

				//map.addLayer(layerEditor.featureLayer);

			}

			// fit bounds breaking map (leaflet issue)
			//map.fitBounds(featureLayer.getBounds());

			/*
			 * Feature click event
			 */

			$scope.viewInMap = function($event) {

				var featureID = $event.currentTarget.dataset.feature;

				var feature = features.filter(function(f) { return f._id == featureID })[0];

				map.setView(feature.geometry.coordinates, 10);

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