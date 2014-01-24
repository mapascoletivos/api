/**
 * angular-breadcrumb.js - A better AngularJS service to help with breadcrumb-style navigation between views.
 * Based on breadcrumb.js (https://github.com/angular-app/angular-app/blob/master/client/src/common/services/breadcrumbs.js)
 *
 * @author Ian Kennington Walter (http://www.iankwalter.com)
 */
angular.module('services.breadcrumbs', []);
angular.module('services.breadcrumbs').factory('breadcrumbs', ['$rootScope', '$location', '$route', function($rootScope, $location, $route) {

    var breadcrumbs = [],
        breadcrumbsService = {},
        routes = $route.routes;

    var generateBreadcrumbs = function() {
        breadcrumbs = [];
        var pathElements = $location.path().split('/'),
            path = '';

        var getRoute = function(route) {
            angular.forEach($route.current.params, function(value, key) {
                var re = new RegExp(value);
                route = route.replace(re, ':' + key);
            });
            return route;
        };
        if (pathElements[1] == '') delete pathElements[1];
        angular.forEach(pathElements, function(el) {
            path += path === '/' ? el : '/' + el;
            var route = getRoute(path);
            if (routes[route] && routes[route].label) {
                breadcrumbs.push({ label: routes[route].label, path: path });
            }
        });
    };

    // We want to update breadcrumbs only when a route is actually changed
    // as $location.path() will get updated immediately (even if route change fails!)
    $rootScope.$on('$routeChangeSuccess', function(event, current) {
        generateBreadcrumbs();
    });

    breadcrumbsService.getAll = function() {
        return breadcrumbs;
    };

    breadcrumbsService.getFirst = function() {
        return breadcrumbs[0] || {};
    };

    return breadcrumbsService;
}]);