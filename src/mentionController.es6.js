angular.module('ui.mention')
.controller('uiMention', function (
  $element, $scope, $attrs, $q, $timeout, $document
) {

  // Beginning of input or preceeded by spaces: @sometext
  this.pattern = this.pattern || /(?:\s+|^)@(\w+(?: \w+)?)$/;
  this.$element = $element;
  this.choices = [];
  this.mentions = [];
  var ngModel;

  /**
   * $mention.init()
   *
   * Initializes the plugin by setting up the ngModelController properties
   *
   * @param  {ngModelController} model
   */
  this.init = function(model) {
    // Leading whitespace shows up in the textarea but not the preview
    $attrs.ngTrim = 'false';

    ngModel = model;

    ngModel.$parsers.push( value => {
      // Removes any mentions that aren't used
      this.mentions = this.mentions.filter( mention => {
       if (~value.indexOf(this.label(mention)))
          return value = value.replace(this.label(mention), this.encode(mention));
      });

      this.render(value);

      return value;
    });

    ngModel.$formatters.push( (value = '') => {
      // In case the value is a different primitive
      value = value.toString();

      // Removes any mentions that aren't used
      this.mentions = this.mentions.filter( mention => {
        if (~value.indexOf(this.encode(mention))) {
          value = value.replace(this.encode(mention), this.label(mention));
          return true;
        } else {
          return false;
        }
      });

      return value;
    });

    ngModel.$render = () => {
      $element.val(ngModel.$viewValue || '');
      $timeout(this.autogrow, true);
      this.render();
    };
  };

  /**
   * $mention.render()
   *
   * Renders the syntax-encoded version to an HTML element for 'highlighting' effect
   *
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        HTML string
   */
  this.render = (html = ngModel.$modelValue) => {
    html = (html || '').toString();
    this.mentions.forEach( mention => {
      html = html.replace(this.encode(mention), this.highlight(mention));
    });
    $element.next().html(html);
    return html;
  };

  /**
   * $mention.highlight()
   *
   * Returns a choice in HTML highlight formatting
   *
   * @param  {mixed|object} choice The choice to be highlighted
   * @return {string}              HTML highlighted version of the choice
   */
  this.highlight = function(choice) {
    return `<span>${this.label(choice)}</span>`;
  };

  /**
   * $mention.decode()
   *
   * @note NOT CURRENTLY USED
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        plaintext string with encoded labels used
   */
  this.decode = function(value = ngModel.$modelValue) {
    return value ? value.replace(/@\[([\s\w]+):[0-9a-z-]+\]/gi, '$1') : '';
  };

  /**
   * $mention.label()
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
   * $mention.encode()
   *
   * Converts a choice object to a syntax-encoded string
   *
   * @param  {mixed|object} choice The choice to be encoded
   * @return {string}              Syntax-encoded string version of choice
   */
  this.encode = function(choice) {
    return `@[${this.label(choice)}:${choice.id}]`;
  };

  /**
   * $mention.replace()
   *
   * Replaces the trigger-text with the mention label
   *
   * @param  {mixed|object} mention  The choice to replace with
   * @param  {regex.exec()} [search] A regex search result for the trigger-text (default: this.searching)
   * @param  {string} [text]         String to perform the replacement on (default: ngModel.$viewValue)
   * @return {string}                Human-readable string
   */
  this.replace = function(mention, search = this.searching, text = ngModel.$viewValue) {
    // TODO: come up with a better way to detect what to remove
    // TODO: consider alternative to using regex match
    text = text.substr(0, search.index + search[0].indexOf('@')) +
           this.label(mention) + ' ' +
           text.substr(search.index + search[0].length);
    return text;
  };

  /**
   * $mention.select()
   *
   * Adds a choice to this.mentions collection and updates the view
   *
   * @param  {mixed|object} [choice] The selected choice (default: activeChoice)
   */
  this.select = function(choice = this.activeChoice) {
    // Add the mention
    this.mentions.push(choice);

    // Replace the search with the label
    ngModel.$setViewValue(this.replace(choice));

    // Close choices panel
    this.cancel();

    // Update the textarea
    ngModel.$render();
  };

  /**
   * $mention.up()
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
   * $mention.down()
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
   * $mention.search()
   *
   * Searches for a list of mention choices and populates
   * $mention.choices and $mention.activeChoice
   *
   * @param  {regex.exec()} match The trigger-text regex match object
   * @todo Try to avoid using a regex match object
   */
  this.search = function(match) {
    this.searching = match;

    return $q.when( this.findChoices(match, this.mentions) )
      .then( choices => {
        this.choices = choices;
        this.activeChoice = choices[0];
        return choices;
      });
  };

  /**
   * $mention.findChoices()
   *
   * @param  {regex.exec()} match    The trigger-text regex match object
   * @todo Try to avoid using a regex match object
   * @todo Make it easier to override this
   * @return {array[choice]|Promise} The list of possible choices
   */
  this.findChoices = function(match, mentions) {
    return [];
  };

  /**
   * $mention.cancel()
   *
   * Clears the choices dropdown info and stops searching
   */
  this.cancel = function() {
    this.choices = [];
    this.searching = null;
  };

  this.autogrow = function() {
    $element[0].style.height = 0; // autoshrink - need accurate scrollHeight
    let style = getComputedStyle($element[0]);
    if (style.boxSizing == 'border-box')
    $element[0].style.height = $element[0].scrollHeight + 'px';
  };

  // Interactions to trigger searching
  $element.on('keyup click focus', event => {
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
      this.cancel();
    }

    $scope.$apply();
  });

  $element.on('keydown', event => {
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
  });



  this.onMouseup = (function(event) {
    if (event.target == $element[0])
      return

    $document.off('mouseup', this.onMouseup);

    if (!this.searching)
      return;

    // Let ngClick fire first
    $scope.$evalAsync( () => {
      this.cancel();
    });
  }).bind(this);

  $element.on('focus', event => {
    $document.on('mouseup', this.onMouseup);
  });

  // Autogrow is mandatory beacuse the textarea scrolls away from highlights
  $element.on('input', this.autogrow);
  // Initialize autogrow height
  $timeout(this.autogrow, true);
});
