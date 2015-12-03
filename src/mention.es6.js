angular.module('ui.mention', ['ui.select'])
.directive('uiMention', function() {
  return {
    require: ['ngModel', 'uiSelect', 'uiMention'],
    controller: 'uiMention',
    controllerAs: '$mention',
    link: function($scope, $element, $attrs, [ngModel, uiSelect, uiMention]) {
      uiMention.init(ngModel, uiSelect);
    }
  };
})
.controller('uiMention', function (
  $element, $scope, $attrs, $timeout
) {

  // Beginning of input or preceeded by spaces: @sometext
  this.pattern = this.pattern || /(?:\s+|^)@(\w+(?: \w+)?)$/;
  this.choices = [];
  this.mentions = [];
  var ngModel;
  var $select;

  /**
   * $mention.init()
   *
   * Initializes the plugin by setting up the ngModelController properties
   *
   * @param  {ngModelController} model
   */
  this.init = function(model, uiSelect) {
    // Leading whitespace shows up in the textarea but not the preview
    $attrs.ngTrim = 'false';

    ngModel = model;
    $select = uiSelect;

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
      $timeout(this.autogrow, true);
      this.render();
    };

    // Autogrow is mandatory beacuse the textarea scrolls away from highlights
    $element.on('input', this.autogrow);
    // Initialize autogrow height
    // @TODO Maybe don't need to defer this?
    $timeout(this.autogrow, true);
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
  };

  /**
   * $mention.autogrow()
   *
   * Resizes the <textarea> $element to fit the contents of it's text
   */
  this.autogrow = function() {
    $element[0].style.height = 0; // autoshrink - need accurate scrollHeight
    let style = getComputedStyle($element[0]);
    if (style.boxSizing == 'border-box')
    $element[0].style.height = $element[0].scrollHeight + 'px';
  };
});
