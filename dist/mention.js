'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

angular.module('ui.mention', []).directive('uiMention', function () {
  return {
    require: ['ngModel', 'uiMention'],
    controller: 'uiMention',
    controllerAs: '$mention',
    link: function link($scope, $element, $attrs, _ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var ngModel = _ref2[0];
      var uiMention = _ref2[1];

      uiMention.init(ngModel);
    }
  };
});
'use strict';

angular.module('ui.mention').controller('uiMention', ["$element", "$scope", "$attrs", "$q", "$timeout", "$document", function ($element, $scope, $attrs, $q, $timeout, $document) {
  var _this = this;

  // Beginning of input or preceeded by spaces: @sometext
  this.delimiter = '@';

  // this.pattern is left for backward compatibility
  this.searchPattern = this.pattern || new RegExp("(?:\\s+|^)" + this.delimiter + "(\\w+(?: \\w+)?)$");

  this.decodePattern = new RegExp(this.delimiter + "\[[\\s\\w]+:[0-9a-z-]+\]", "gi");

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
  this.init = function (model) {
    // Leading whitespace shows up in the textarea but not the preview
    $attrs.ngTrim = 'false';

    ngModel = model;

    ngModel.$parsers.push(function (value) {
      // Removes any mentions that aren't used
      _this.mentions = _this.mentions.filter(function (mention) {
        if (~value.indexOf(_this.label(mention))) {
          return value = value.split(_this.label(mention)).join(_this.encode(mention));
        }
      });

      _this.render(value);

      return value;
    });

    ngModel.$formatters.push(function () {
      var value = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      // In case the value is a different primitive
      value = value.toString();

      // Removes any mentions that aren't used
      _this.mentions = _this.mentions.filter(function (mention) {
        if (~value.indexOf(_this.encode(mention))) {
          value = value.split(_this.encode(mention)).join(_this.label(mention));
          return true;
        } else {
          return false;
        }
      });

      return value;
    });

    ngModel.$render = function () {
      $element.val(ngModel.$viewValue || '');
      $timeout(_this.autogrow, true);
      _this.render();
    };
  };

  var temp = document.createElement('span');
  function parseContentAsText(content) {
    try {
      temp.textContent = content;
      return temp.innerHTML;
    } finally {
      temp.textContent = null;
    }
  }

  /**
   * $mention.render()
   *
   * Renders the syntax-encoded version to an HTML element for 'highlighting' effect
   *
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        HTML string
   */
  this.render = function () {
    var html = arguments.length <= 0 || arguments[0] === undefined ? ngModel.$modelValue : arguments[0];

    html = (html || '').toString();
    // Convert input to text, to prevent script injection/rich text
    html = parseContentAsText(html);
    _this.mentions.forEach(function (mention) {
      html = html.split(_this.encode(mention)).join(_this.highlight(mention));
    });
    _this.renderElement().html(html);
    return html;
  };

  /**
   * $mention.renderElement()
   *
   * Get syntax-encoded HTML element
   *
   * @return {Element} HTML element
   */
  this.renderElement = function () {
    return $element.next();
  };

  /**
   * $mention.highlight()
   *
   * Returns a choice in HTML highlight formatting
   *
   * @param  {mixed|object} choice The choice to be highlighted
   * @return {string}              HTML highlighted version of the choice
   */
  this.highlight = function (choice) {
    return '<span>' + _this.label(choice) + '</span>';
  };

  /**
   * $mention.decode()
   *
   * @note NOT CURRENTLY USED
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        plaintext string with encoded labels used
   */
  this.decode = function () {
    var value = arguments.length <= 0 || arguments[0] === undefined ? ngModel.$modelValue : arguments[0];

    return value ? value.replace(_this.decodePattern, '$1') : '';
  };

  /**
   * $mention.label()
   *
   * Converts a choice object to a human-readable string
   *
   * @param  {mixed|object} choice The choice to be rendered
   * @return {string}              Human-readable string version of choice
   */
  this.label = function (choice) {
    return choice.first + ' ' + choice.last;
  };

  /**
   * $mention.encode()
   *
   * Converts a choice object to a syntax-encoded string
   *
   * @param  {mixed|object} choice The choice to be encoded
   * @return {string}              Syntax-encoded string version of choice
   */
  this.encode = function (choice) {
    return _this.delimiter + '[' + _this.label(choice) + ':' + choice.id + ']';
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
  this.replace = function (mention) {
    var search = arguments.length <= 1 || arguments[1] === undefined ? _this.searching : arguments[1];
    var text = arguments.length <= 2 || arguments[2] === undefined ? ngModel.$viewValue : arguments[2];

    // TODO: come up with a better way to detect what to remove
    // TODO: consider alternative to using regex match
    if (search === null) {
      return text;
    }
    text = text.substr(0, search.index + search[0].indexOf(_this.delimiter)) + _this.label(mention) + ' ' + text.substr(search.index + search[0].length);
    return text;
  };

  /**
   * $mention.select()
   *
   * Adds a choice to this.mentions collection and updates the view
   *
   * @param  {mixed|object} [choice] The selected choice (default: activeChoice)
   */
  this.select = function () {
    var choice = arguments.length <= 0 || arguments[0] === undefined ? _this.activeChoice : arguments[0];

    if (!choice) {
      return false;
    }

    var mentionExists = _this.mentions.some(function (mention) {
      return _this.encode(mention) === _this.encode(choice);
    });

    // Add the mention, unless its already been mentioned
    if (!mentionExists) {
      _this.mentions.push(choice);
    }

    // Replace the search with the label
    ngModel.$setViewValue(_this.replace(choice));

    // Close choices panel
    _this.cancel();

    // Update the textarea
    ngModel.$render();
  };

  /**
   * $mention.up()
   *
   * Moves this.activeChoice up the this.choices collection
   */
  this.up = function () {
    var index = _this.choices.indexOf(_this.activeChoice);
    if (index > 0) {
      _this.activeChoice = _this.choices[index - 1];
    } else {
      _this.activeChoice = _this.choices[_this.choices.length - 1];
    }
  };

  /**
   * $mention.down()
   *
   * Moves this.activeChoice down the this.choices collection
   */
  this.down = function () {
    var index = _this.choices.indexOf(_this.activeChoice);
    if (index < _this.choices.length - 1) {
      _this.activeChoice = _this.choices[index + 1];
    } else {
      _this.activeChoice = _this.choices[0];
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
  this.search = function (match) {
    _this.searching = match;

    return $q.when(_this.findChoices(match, _this.mentions)).then(function (choices) {
      _this.choices = choices;
      _this.activeChoice = choices[0];
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
  this.findChoices = function (match, mentions) {
    return [];
  };

  /**
   * $mention.cancel()
   *
   * Clears the choices dropdown info and stops searching
   */
  this.cancel = function () {
    _this.choices = [];
    _this.searching = null;
  };

  this.autogrow = function () {
    $element[0].style.height = 0; // autoshrink - need accurate scrollHeight
    var style = getComputedStyle($element[0]);
    if (style.boxSizing == 'border-box') {
      $element[0].style.height = $element[0].scrollHeight + 'px';
    }
  };

  // Interactions to trigger searching
  $element.on('keyup click focus', function (event) {
    // If event is fired AFTER activeChoice move is performed
    if (_this.moved) {
      return _this.moved = false;
    }
    // Don't trigger on selection
    if ($element[0].selectionStart != $element[0].selectionEnd) {
      return;
    }
    var text = $element.val();
    // text to left of cursor ends with `@sometext`
    var match = _this.searchPattern.exec(text.substr(0, $element[0].selectionStart));

    if (match) {
      _this.search(match);
    } else {
      _this.cancel();
    }

    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });

  $element.on('keydown', function (event) {
    if (!_this.searching) {
      return;
    }

    switch (event.keyCode) {
      case 13:
        // return
        _this.select();
        break;
      case 38:
        // up
        _this.up();
        break;
      case 40:
        // down
        _this.down();
        break;
      default:
        // Exit function
        return;
    }

    _this.moved = true;
    event.preventDefault();

    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });

  this.onMouseup = (function (event) {
    var _this2 = this;

    if (event.target == $element[0]) {
      return;
    }

    $document.off('mouseup', this.onMouseup);

    if (!this.searching) {
      return;
    }

    // Let ngClick fire first
    $scope.$evalAsync(function () {
      _this2.cancel();
    });
  }).bind(this);

  $element.on('focus', function (event) {
    $document.on('mouseup', _this.onMouseup);
  });

  // Autogrow is mandatory beacuse the textarea scrolls away from highlights
  $element.on('input', this.autogrow);

  // Initialize autogrow height
  $timeout(this.autogrow, true);
}]);