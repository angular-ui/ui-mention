angular.module('ui.multiselect', ['ui.select'])
.directive('uiMultiselect', function() {
  return {
    require: ['ngModel', 'uiSelect', 'uiMultiselect'],
    controller: 'uiMultiselect',
    controllerAs: '$multiselect',
    link: function($scope, $element, $attrs, [ngModel, uiSelect, uiMultiselect]) {
      uiMultiselect.init(ngModel, uiSelect);
    }
  };
})
.controller('uiMultiselect', function (
  $element, $scope, $attrs
) {

  this.selected = [];
  var ngModel;
  var $select;

  /**
   * $multiselect.init()
   *
   * Initializes the plugin by setting up the ngModelController properties
   *
   * @param  {ngModelController} model
   */
  this.init = function(model, uiSelect) {
    ngModel = model;
    $select = uiSelect;

    ngModel.$render = () => {
      this.render();
    };
  };

  /**
   * $multiselect.render()
   *
   * Renders the syntax-encoded version to an HTML element for 'highlighting' effect
   *
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        HTML string
   */
  this.render = function(html = ngModel.$modelValue) {
    // @TODO
  };

  /**
   * $multiselect.label()
   *
   * Converts a choice object to a human-readable string
   *
   * @param  {mixed|object} choice The choice to be rendered
   * @return {string}              Human-readable string version of choice
   */
  this.label = function(choice) {
    return `${choice.first} ${choice.last}`;
  };

  /**
   * $multiselect.select()
   *
   * Adds a choice to this.mentions collection and updates the view
   *
   * @param  {mixed|object} [choice] The selected choice (default: activeChoice)
   */
  this.select = function(choice = this.activeChoice) {
    // Add the mention
    this.selected.push(choice);
  };

  /**
   * $multiselect.remove()
   *
   * Removes a selected item
   *
   * @param  {object|int} item A reference to the object or the index
   */
  this.remove = function(item) {
    let index = this.selected.indexOf(item);
    if (!~index)
      index = item;
    this.selected.splice(index, 1);
  }
});
