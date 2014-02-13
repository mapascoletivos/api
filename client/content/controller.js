'use strict';

require('angular/angular');

/*
 * Content controller
 */

exports.ContentCtrl = [
	'$scope',
	'$rootScope',
	'$stateParams',
	'SirTrevor',
	'Content',
	'MapService',
	function($scope, $rootScope, $stateParams, SirTrevor, Content, MapService) {

		$scope.objType = 'content';

		$scope.$content = Content;

		$scope.$watch('$content.get()', function(contents) {
			$scope.contents = contents;
		});

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		var viewState = function() {
			if($stateParams.contentId) {
				var content = $scope.contents.filter(function(c) { return c._id == $stateParams.contentId; })[0];
				$scope.view(content);
				return true;
			}
			return false;
		}

		var viewing = false;

		$scope.view = function(content) {

			if(!content)
				return false;

			viewing = true;

			//$scope.sharedData.activeSidebar(true);

			var features = Content.getFeatures(content);
			if(features) {
				//$scope.sharedData.features(features);
			}

			$scope.content = content;
			$scope.content.featureObjs = features;

		}

		$scope.close = function() {

			//$scope.sharedData.features($scope.layer.features);
			$scope.content = false;
			//$scope.sharedData.activeSidebar(false);
			MapService.fitMarkerLayer();

			viewing = false;

		}

		$scope.$on('layer.data.ready', function(event, layer) {

			$scope.contents = layer.contents;

		});

		$scope.$watch('contents', function(contents) {

			viewState();

		});

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

		$scope.$on('layerObjectChange', $scope.close);
		$scope.$on('$stateChangeStart', $scope.close);

	}
];