angular.module('ui.mention', [])
.directive('uiMention', function() {
  return {
    require: ['ngModel', 'uiMention'],
    controller: 'uiMentionController',
    controllerAs: '$mention',
    link: function($scope, $element, $attrs, [ngModel, uiMention]) {
      uiMention.init(ngModel);
    }
  };
});
