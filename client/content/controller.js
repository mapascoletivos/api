'use strict';

/*
 * Content controller
 */

exports.ContentCtrl = [
	'$scope',
	'$rootScope',
	'$stateParams',
	'SirTrevor',
	'Content',
	'Feature',
	'MapService',
	function($scope, $rootScope, $stateParams, SirTrevor, Content, Feature, MapService) {

		$scope.objType = 'content';

		$scope.$content = Content;

		var contents,
			features;

		$rootScope.$on('data.ready', function(event, parent) {

			contents = Content.get();
			features = Feature.get();

			$scope.$watch('features.updated', function(features) {
				features = features;
			});

			$scope.$watch('contents.updated', function(contents) {
				contents = contents;
			});

			var init = true;

			$scope.$watch('$content.get()', function(contents) {

				if(typeof contents !== 'undefined' && contents) {

					$scope.contents = contents;
					$rootScope.$broadcast('contents.updated', contents);

					if(init) {

						viewState();
						init = false;

					}

				}
			});

		});

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		var viewState = function() {
			if($stateParams.contentId && $scope.contents) {
				var content = $scope.contents.filter(function(c) { return c._id == $stateParams.contentId; })[0];
				$scope.view(content);
				return true;
			}
			return false;
		}

		var viewing = false;

		$scope.view = function(content) {

			viewing = true;

			if(!content)
				return false;

			var contentFeatures = Content.getFeatures(content, features);

			if(contentFeatures) {
				Feature.set(contentFeatures);
			}

			$rootScope.$broadcast('content.filtering.started', content, contentFeatures);

			$scope.content = content;
			$scope.content.featureObjs = contentFeatures;

		}

		$scope.close = function() {

			if(typeof features !== 'undefined')
				Feature.set(features);

			$scope.content = false;

			viewing = false;

			$rootScope.$broadcast('content.filtering.closed');

		}

		$scope.new = function() {

			Content.edit({});

		};

		$scope.edit = function(contentId) {

			Content.edit(angular.copy($scope.contents.filter(function(c) { return c._id == contentId; })[0]));

			setTimeout(function() {
				window.dispatchEvent(new Event('resize'));
				document.getElementById('content-edit-body').scrollTop = 0;
			}, 100);

		};

		$rootScope.$on('$stateChangeSuccess', function() {

			if(!viewState() && viewing) {
				$scope.close();
			}

		});

		$scope.templates = {
			list: '/views/content/list-item.html',
			show: '/views/content/show.html'
		};

		$scope.$on('$stateChangeStart', $scope.close);

	}
];