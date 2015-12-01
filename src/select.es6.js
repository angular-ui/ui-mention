angular.module('ui.select', [''])
.directive('uiSelect', function() {
  return {
    require: ['ngModel', 'uiSelect'],
    controller: 'uiSelect',
    controllerAs: '$select',
    link: function($scope, $element, $attrs, [ngModel, uiSelect]) {
      uiSelect.init(ngModel);
    }
  };
})
.controller('uiSelect', function (
  $element, $scope, $attrs, $q, $document
) {

  this.$element = $element;
  this.choices = [];
  var ngModel;

  /**
   * $select.init()
   *
   * Initializes the plugin by setting up the ngModelController properties
   *
   * @param  {ngModelController} model
   */
  this.init = function(model) {
    ngModel = model;

    ngModel.$render = () => {
      $element.val(ngModel.$viewValue || '');
    };

    // Interactions to trigger searching
    $element.on('keyup click focus', this.onSearch.bind(this));

    $element.on('keydown', this.onMove.bind(this));

    $element.on('focus', event => {
      $document.on('mouseup', this.onMouseup);
    });
  };

  /**
   * $select.select()
   *
   * Sets the selected choice and updates the view
   *
   * @param  {mixed|object} [choice] The selected choice (default: activeChoice)
   */
  this.select = function(choice = this.activeChoice) {
    // Set the value
    ngModel.$setViewValue(choice);

    // Close choices panel
    this.close();

    // Update the input
    ngModel.$render();
  };

  /**
   * $select.up()
   *
   * Moves this.activeChoice up the this.choices collection
   */
  this.up = function() {
    let index = this.choices.indexOf(this.activeChoice);
    if (index > 0) {
      this.activeChoice = this.choices[index - 1];
    } else {
      this.activeChoice = this.choices[this.choices.length - 1];
    }
  };

  /**
   * $select.down()
   *
   * Moves this.activeChoice down the this.choices collection
   */
  this.down = function() {
    let index = this.choices.indexOf(this.activeChoice);
    if (index < this.choices.length - 1) {
      this.activeChoice = this.choices[index + 1];
    } else {
      this.activeChoice = this.choices[0];
    }
  };

  /**
   * $select.search()
   *
   * Searches for a list of choices and populates
   * $select.choices and $select.activeChoice
   *
   * @param  {regex.exec()} match The trigger-text regex match object
   * @todo Try to avoid using a regex match object
   */
  this.search = function(match) {
    this.searching = match;

    return $q.when( this.findChoices(match) )
      .then( choices => {
        this.choices = choices;
        this.activeChoice = choices[0];
        return choices;
      });
  };

  /**
   * $select.findChoices()
   *
   * @param  {regex.exec()} match    The trigger-text regex match object
   * @todo Try to avoid using a regex match object
   * @todo Make it easier to override this
   * @return {array[choice]|Promise} The list of possible choices
   */
  this.findChoices = function(match) {
    return [];
  };

  /**
   * $select.close()
   *
   * Clears the choices dropdown info and stops searching
   */
  this.close = function() {
    this.choices = [];
    this.searching = null;
  };

  /**
   * $select.onSearch()
   *
   * Fired whenever user focuses, clicks, or types into the input
   *
   * Used to begin searching for choices
   *
   * @NOTE Remember to $scope.$apply()
   *
   * @param  {event} event Keydown event object
   */
  this.onSearch = function(event) {
    // If event is fired AFTER activeChoice move is performed
    if (this.moved)
      return this.moved = false;
    // Don't trigger on selection
    if ($element[0].selectionStart != $element[0].selectionEnd)
      return;
    let text = $element.val();
    // text to left of cursor ends with `@sometext`
    let match = this.pattern.exec(text.substr(0, $element[0].selectionStart));
    if (match) {
      this.search(match);
    } else {
      this.close();
    }

    $scope.$apply();
  };

  /**
   * $select.onMove()
   *
   * Fired whenever user moves around input
   *
   * Used to navigate through choices
   *
   * @NOTE Remember to $scope.$apply()
   *
   * @param  {event} event Keydown event object
   */
  this.onMove = function(event) {
    if (!this.searching)
      return;

    switch (event.keyCode) {
      case 13: // return
        this.select();
        break;
      case 38: // up
        this.up();
        break;
      case 40: // down
        this.down();
        break;
      default:
        // Exit function
        return;
    }

    this.moved = true;
    event.preventDefault();

    $scope.$apply();
  };

  /**
   * $select.onMouseup()
   *
   * Fired whenever user clicks on the page
   *
   * Used to hide the choices when blurring. Using `blur` event is too early
   *
   * @NOTE Remember to let `ng-click="$select.select(choice)"` to propagate
   *
   * @param  {event} event Keydown event object
   */
  this.onMouseup = (function(event) {
    if (event.target == $element[0])
      return

    $document.off('mouseup', this.onMouseup);

    if (!this.searching)
      return;

    // Let ngClick fire first
    $scope.$evalAsync( () => {
      this.close();
    });
  }).bind(this); // Binding here so same callback can be unbound


});
