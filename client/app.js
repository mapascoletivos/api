'use strict';

/*
 * Helpers
 */
require('./helpers');

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

require('./common/leaflet');
require('./common/directives');
require('./common/mapView');

/*
 * Apps
 */

require('./user/app');
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
	'infinite-scroll',
	'mapasColetivos.mapView',
	'mapasColetivos.user',
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
				controller: 'IndexCtrl'
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

		/*
		 * Trailing slash rule
		 */
		$urlRouterProvider.rule(function($injector, $location) {
			var path = $location.path(),
				search = $location.search(),
				params;

			// check to see if the path already ends in '/'
			if (path[path.length - 1] === '/') {
				return;
			}

			// If there was no search string / query params, return with a `/`
			if (Object.keys(search).length === 0) {
				return path + '/';
			}

			// Otherwise build the search string and return a `/?` prefix
			params = [];
			angular.forEach(search, function(v, k){
				params.push(k + '=' + v);
			});
			
			return path + '/?' + params.join('&');
		});

	}
]);