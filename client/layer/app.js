'use strict';

require('angular/angular');
require('../common/geocode');

angular
	.module('mapasColetivos.layer', [
		'ngResource',
		'mapasColetivos.geocode',
		'mapasColetivos.feature',
		'mapasColetivos.content'
	])
	.config([
		'$stateProvider',
		'$urlRouterProvider',
		'$locationProvider',
		'$httpProvider',
		function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

			$httpProvider.defaults.withCredentials = true;

			$stateProvider
				.state('dashboard.layers', {
					url: '/layers',
					templateUrl: '/views/dashboard/layers.html'
				})
				.state('layers', {
					url: '/layers',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/index.html'
				})
				.state('newLayer', {
					url: '/layers/new',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/index.html'
				})
				.state('singleLayer', {
					url: '/layers/:layerId',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/show.html'
				})
				.state('singleLayer.content', {
					url: '/content/:contentId'
				})
				.state('singleLayer.feature', {
					url: '/feature/:featureId'
				})
				.state('editLayer', {
					url: '/layers/:layerId/edit',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/edit.html'
				});
		}
	])
	.factory('Layer', require('./service.js').Layer)
	.factory('LayerSharedData', require('./sharedDataService.js').LayerSharedData)
	.controller('LayerCtrl', require('./controller.js').LayerCtrl);