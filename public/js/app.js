/*
 * App modules
 */

angular.module('mapasColetivos.map', []);

angular.module('mapasColetivos.user', []);

angular.module('mapasColetivos.media', []);

angular.module('mapasColetivos.feature', []);

angular.module('mapasColetivos.layer', [
	'ngRoute',
	'mapasColetivos.feature',
	'mapasColetivos.media'
]);

angular.module('mapasColetivos', [
	'mapasColetivos.layer',
	'mapasColetivos.user'
]);

/*
 * App routes
 */

angular.module('mapasColetivos').config([
	'$routeProvider',
	'$locationProvider',
	function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				controller: 'Index',
				templateUrl: '/app/home'
			})
			.when('/explore', {
				controller: 'Explore',
				templateUrl: '/app/explore'
			})
			.when('/dashboard', {
				controller: 'Dashboard',
				templateUrl: '/app/dashboard'
			})
			.when('/layers/new', {
				controller: 'LayerNew',
				templateUrl: '/app/layers/new'
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

		$locationProvider.html5Mode(true);
	}
]);

angular.module('mapasColetivos').controller('Index', [
	'$scope',
	function($scope) {

	}
]);

angular.module('mapasColetivos').controller('Explore', [
	'$scope',
	function($scope) {

	}
]);

angular.module('mapasColetivos').controller('LayerNew', [
	'$scope',
	function() {

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
 * Get layer features
 */
angular.module('mapasColetivos.feature').factory('FeaturesService', [
	'$http',
	'$q',
	'features',
	function($http, $q, features) {
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