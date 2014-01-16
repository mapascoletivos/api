var mapEditor = angular.module('mapEditor', []);
var apiPrefix = '/api/v1';
var map;
var featureLayer;

(function($) {

	map = L.map('map', {
		center: [0, 0],
		zoom: 2
	});
	map.addLayer(L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png'));

	mapEditor.controller('FeatureCtrl', function($scope, $http) {

		$http.get('/js/infoamazonia.json').success(function(features) {

			$scope.features = features;

			featureLayer = L.geoJson({
				type: "FeatureCollection",
				features: features
			});

			map.addLayer(featureLayer);

			//map.fitBounds(featureLayer.getBounds());

		});

	});

})(jQuery);