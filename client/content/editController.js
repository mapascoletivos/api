'use strict';

require('angular/angular');

/*
 * Content edit controller
 */

exports.ContentEditCtrl = [
	'$scope',
	'$rootScope',
	'Content',
	'LayerSharedData',
	'MessageService',
	'SirTrevor',
	function($scope, $rootScope, Content, LayerSharedData, Message, SirTrevor) {

		var original = false;

		$scope.sharedData = LayerSharedData;

		$scope.sharedData.layer().then(function(layer) {

			$scope.$watch('sharedData.editingContent()', function(editing) {
				original = angular.copy(editing);
				$scope.tool = false;
				$scope.editing = editing;
			});

			$scope.$watch('sharedData.contents()', function(contents) {
				$scope.contents = contents;
			});

			$scope.$watch('editing.sirTrevor', function(val) {

				// Reinitialize Sir Trevor with some delay (enough to populate the model with new data)
				setTimeout(function() {
					$scope.sirTrevor.reinitialize();
				}, 20);

			});

			$scope.save = function() {

				// Trigger SirTrevor form submit 
				$scope.sirTrevor.onFormSubmit();

				// Fixed content type
				$scope.editing.type = 'Post';

				// Store content (SirTrevor data)
				$scope.editing.sirTrevorData = $scope.sirTrevor.dataStore.data;

				// Store stringified data
				$scope.editing.sirTrevor = $scope.sirTrevor.el.value;

				if($scope.editing && $scope.editing._id) {

					Content.resource.update({contentId: $scope.editing._id}, $scope.editing, function(content) {

						$scope.editing = angular.copy(content);
						original = angular.copy(content);

						// Replace content in local features
						angular.forEach($scope.contents, function(c, i) {
							if(c._id == $scope.editing._id)
								$scope.contents[i] = $scope.editing;
						});
						$scope.sharedData.contents($scope.contents);

						Message.message({
							status: 'ok',
							text: 'Conteúdo salvo.'
						});

					}, function(err) {

						if(err.status == 500)
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);
						else {
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);
						}


					});

				} else {

					$scope.editing.layer = layer._id;

					var content = new Content.resource($scope.editing);

					content.$save(function(content) {

						original = angular.copy(content);

						// Locally push new content
						$scope.contents.push(content);
						$scope.sharedData.contents($scope.contents);

						// Update editing content to saved data
						$scope.sharedData.editingContent(angular.copy(content));

						Message.message({
							status: 'ok',
							text: 'Conteúdo adicionado.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);

					});

				}

			}

			$scope.delete = function() {

				if(confirm('Você tem certeza que deseja remover este conteúdo?')) {

					Content.resource.delete({contentId: $scope.editing._id}, function() {

						$scope.sharedData.contents($scope.contents.filter(function(c) {
							return c._id !== $scope.editing._id;
						}));
						LayerSharedData.editingContent(false);

						Message.message({
							status: 'ok',
							text: 'Conteúdo removido.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);
					});

				}

			}

			$scope.close = function() {

				if($scope.editing) {
					$scope.sharedData.editingContent(false);
					$rootScope.$broadcast('closedContent');
				}

			}

			$scope.$on('$stateChangeStart', $scope.close);

			/*
			 * Features
			 */
			$scope.hasFeature = function(featureId) {
				if($scope.editing && $scope.editing.features) {
					return $scope.editing.features.filter(function(f) { return f == featureId }).length;
				}
				return false;
			}

			$scope.toggleFeature = function(featureId) {

				if(!$scope.editing.features)
					$scope.editing.features = [];

				var features = angular.copy($scope.editing.features);

				if($scope.hasFeature(featureId)) {
					features = features.filter(function(f) { return f !== featureId });
				} else {
					features.push(featureId);
				}

				$scope.editing.features = features;

			}

			$scope.clearFeatures = function() {

				$scope.editing.features = [];

			}

			/*
			 * Tools
			 */

			$scope.tool = false;

			$scope.setTool = function(tool) {
				if(tool == $scope.tool)
					$scope.tool = false;
				else
					$scope.tool = tool;
			}

			$scope.geocode = function() {

				Geocode.get($scope._data.geocode)
					.success(function(res) {
						$scope._data.geocodeResults = res;
					})
					.error(function(err) {
						$scope._data.geocodeResults = [];
					});

			}

			$scope.isRevertable = function() {

				return (!angular.equals($scope.editing, original) && $scope.editing && $scope.editing._id);

			}

			$scope.revert = function() {

				$scope.editing = angular.copy(original);

			}

		});

	}
];