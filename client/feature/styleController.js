'use strict';

exports.FeatureStyleController = [
	'$scope',
	'Feature',
	'Maki',
	'Layer',
	function($scope, Feature, Maki) {

		/*
		 * Style editor
		 */

		$scope.maki = Maki.maki;

		$scope.makiSprite = Maki.makiSprite;

		var settings = {
			Point: [
				{
					key: 'markerColor',
					property: 'marker-color',
					_default: '#333'
				},
				{
					key: 'markerSize',
					property: 'marker-size',
					_default: 'medium'
				},
				{
					key: 'markerSymbol',
					property: 'marker-symbol',
					_default: ''
				}
			],
			Polygon: [
				{
					key: 'fill',
					property: 'fill',
					_default: '#555'
				},
				{
					key: 'fillOpacity',
					property: 'fill-opacity',
					_default: 0.5
				},
				{
					key: 'stroke',
					property: 'stroke',
					_default: '#555'
				},
				{
					key: 'strokeOpacity',
					property: 'stroke-opacity',
					_default: 1
				},
				{
					key: 'strokeWidth',
					property: 'stroke-width',
					_default: 2
				}
			],
			LineString: [
				{
					key: 'stroke',
					property: 'stroke',
					_default: '#555'
				},
				{
					key: 'strokeOpacity',
					property: 'stroke-opacity',
					_default: 1
				},
				{
					key: 'strokeWidth',
					property: 'stroke-width',
					_default: 2
				}
			]
		};

	};
];