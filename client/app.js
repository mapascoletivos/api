'use strict';

require('jquery-ui-browserify');
require('angular/angular');
require('angular-route/angular-route');
require('angular-ui-router/release/angular-ui-router');
require('angular-animate/angular-animate');
require('angular-ui-utils/modules/keypress/keypress');

/*
 * Core modules
 */

require('./core/session');
require('./core/title');
require('./core/index');
require('./core/loading');
require('./core/message');
require('./core/explore');
require('./core/dashboard');

/*
 * Common modules
 */

require('angular-elastic/elastic');
require('./common/leaflet');
require('./common/directives');

/*
 * Apps
 */

require('./feature/app');
require('./content/app');
require('./layer/app');
require('./map/app');

var settings = angular.extend({
	server: 'local',
	apiPrefix: '/api/v1'
}, require('./config'));

/*
 * App
 */
angular.module('mapasColetivos', [
	'ui.router',
	'ui.keypress',
	'monospaced.elastic',
	'ngRoute',
	'ngAnimate',
	'mapasColetivos.pageTitle',
	'mapasColetivos.directives',
	'mapasColetivos.session',
	'mapasColetivos.index',
	'mapasColetivos.dashboard',
	'mapasColetivos.explore',
	'mapasColetivos.loadingStatus',
	'mapasColetivos.messageStatus',
	'mapasColetivos.map',
	'mapasColetivos.layer',
	'mapasColetivos.feature',
	'mapasColetivos.content'
])
.value('apiPrefix', (settings.server == 'local' ? '' : settings.server) + settings.apiPrefix)

/*
 * Core routes
 */

.config([
	'$stateProvider',
	'$urlRouterProvider',
	'$locationProvider',
	'$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

		$httpProvider.defaults.withCredentials = true;

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'IndexCtrl',
				templateUrl: '/home'
			});

		$locationProvider.html5Mode(true);

		var interceptor = ['$rootScope', '$q', '$location', function(scope, $q, $location) {

			function success(response) {
				return response;''
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