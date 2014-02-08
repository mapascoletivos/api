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
	'LayerSharedData',
	'MapService',
	'featureToMapObj',
	function($scope, $rootScope, $stateParams, SirTrevor, Content, LayerSharedData, MapService, featureToMapObj) {

		$scope.objType = 'content';
		
		$scope.sharedData = LayerSharedData;

		$scope.contents = [];

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		var viewing = false;

		$scope.view = function(content) {

			if(!content)
				return false;

			viewing = true;

			$scope.sharedData.activeSidebar(true);

			var features = Content.getFeatures(content);
			if(features) {
				$scope.sharedData.features(features);
			}

			$scope.content = content;
			$scope.content.featureObjs = features;

		}

		$scope.close = function() {

			$scope.sharedData.features($scope.layer.features);
			$scope.content = false;
			$scope.sharedData.activeSidebar(false);
			MapService.fitMarkerLayer();

			viewing = false;

		}

		$scope.sharedData.layer().then(function(layer) {

			var viewState = function() {
				if($stateParams.contentId) {
					var content = layer.contents.filter(function(c) { return c._id == $stateParams.contentId; })[0];
					$scope.view(content);
					return true;
				}
				return false;
			}

			viewState();

			$rootScope.$on('$stateChangeSuccess', function() {

				if(!viewState() && viewing) {
					$scope.close();
				}

			});

			$scope.layer = layer;

			$scope.sharedData.contents(layer.contents);

			$rootScope.$broadcast('layerContentsReady');

			$scope.$watch('sharedData.contents()', function(contents) {
				$scope.contents = contents;
			});

			$scope.new = function() {

				$scope.sharedData.editingContent({});

			};

			$scope.edit = function(contentId) {

				$scope.sharedData.editingContent(angular.copy($scope.contents.filter(function(c) { return c._id == contentId; })[0]));

				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
					document.getElementById('content-edit-body').scrollTop = 0;
				}, 100);

			};

			$scope.$on('layerObjectChange', $scope.close);
			$scope.$on('$stateChangeStart', $scope.close);

		});

		$scope.$on('closedContent', function() {

			// Fix map size after 200ms (animation safe)
			setTimeout(function() {
				MapService.fitMarkerLayer();
			}, 200);

		});

	}
];