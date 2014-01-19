var map = L.map('map', {
	center: [0, 0],
	zoom: 2
});
map.addLayer(L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png'));

var apiPrefix = '/api/v1';

var layerEditor = angular.module('layerEditor', ['ngRoute']);

layerEditor.value('features', []);
layerEditor.value('markers', []);
layerEditor.value('media', []);

layerEditor.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$routeProvider
		.when('/features', {
			controller: 'FeatureCtrl',
			templateUrl: '/partials/map-editor/features'
		})
		.when('/features/edit/:featureId', {
			controller: 'FeatureEdit',
			templateUrl: '/partials/map-editor/feature'
		})
		.when('/features/new', {
			controller: 'FeatureEdit',
			templateUrl: '/partials/map-editor/feature'
		})
		.when('/media', {
			controller: 'MediaCtrl',
			templateUrl: '/partials/map-editor/media'
		})
		.otherwise({
			redirectTo: '/features'
		});

}]);

/*
 * Get layer features
 */
layerEditor.factory('Features', ['$http', '$q', 'features', function($http, $q, features) {

	var deferred = $q.defer();

	$http.get('/js/infoamazonia.json')
		.success(function(data) {

			features = data;

			deferred.resolve({

				query: function() {
					return features;
				},
				get: function(featureId) {
					return features.filter(function(f) { return f.properties.id == featureId; })[0];
				}

			});

		});

	return deferred.promise;

}]);

/*
 * Add feature ID data to item in DOM
 */
layerEditor.directive('registerLayerData', function() {
	return function(scope, element, attrs) {
		element[0].setAttribute('data-feature', scope.feature.properties.id);
	};
});

/*
 * Map of features
 */
layerEditor.controller('FeatureMap', function() { });

/*
 * Feature controller
 */
layerEditor.controller('FeatureCtrl', ['$scope', '$http', 'Features', 'markers', function($scope, $http, Features, markers) {

	Features.then(function(features) {

		$scope.features = features.query();

		markers = [];

		layerEditor.featureLayer = L.geoJson(
			{
				// Format GeoJSON with obtained data
				type: "FeatureCollection",
				features: features.query()
			},
			{
				// Store feature marker to module global value
				pointToLayer: function(feature, LatLng) {
					var marker = L.marker(LatLng);
					markers.push(marker);
					return marker;
				}
			}
		);

		// Add feature layer to map
		if(layerEditor.featureLayer && !map.hasLayer(layerEditor.eatureLayer)) {

			map.addLayer(layerEditor.featureLayer);

		}

		// fit bounds breaking map (leaflet issue)
		//map.fitBounds(featureLayer.getBounds());

		/*
		 * Feature click event
		 */

		$scope.click = function($event) {

			var featureID = $event.currentTarget.dataset.feature;

			var marker = markers.filter(function(m) { return m.toGeoJSON().properties.id == featureID })[0];

			map.setView(marker.getLatLng(), 10);

		};

	});

}]);

layerEditor.controller('FeatureEdit', ['$scope', '$routeParams', '$location', 'Features', function($scope, $routeParams, $location, Features) {

	if($routeParams.featureId) {

		Features.then(function(feature) {
			$scope.feature = feature.get($routeParams.featureId);
		});

	}

	$scope.save = function() {
		feature = $scope.feature;
		$location.path('/features');
	}

	$scope.delete = function() {
		$location.path('/features');
	}

}]);

layerEditor.controller('FeatureNew', ['$scope', '$location', 'features', function($scope, $location, features) {

	$scope.save = function() {
		features.push($scope.feature);
	}

	$scope.delete = function() {
		$location.path('/features');
	}

}]);

layerEditor.controller('MediaCtrl', ['$scope', '$http', function($scope, $http) {

	$scope.media = [
		{
			title: 'Media 01'
		},
		{
			title: 'Media 02'
		}
	];

}]);