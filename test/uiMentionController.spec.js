describe('uiMention', () => {
  let $scope, $attrs, $q, $timeout, $document, createController, ngModelController;

  beforeEach(() => {
    module('ui.mention');

    inject(($injector, $controller) => {
      $scope    = $injector.get('$rootScope').$new();
      $q        = $injector.get('$q');
      $timeout  = $injector.get('$timeout');
      $document = $injector.get('$document');
      $attrs    = {};

      createController = (el) => {
        return $controller('uiMention', {
          $scope:    $scope,
          $attrs:    $attrs,
          $element:  el,
          $q:        $q,
          $timeout:  $timeout,
          $document: $document
        });
      };
    });
  });

  context('on invocation', () => {
    let ctrlInstance, $element;

    beforeEach(() => {
      $element = angular.element('<span ui-mention ng-model="xyz"></span>');
      ctrlInstance = createController($element);
    });

    it('exposes a delimiter', () => {
      expect(ctrlInstance.delimiter).to.eql('@');
    });

    it('exposes a searchPattern', () => {
      expect(ctrlInstance.searchPattern).to.eql(/(?:\s+|^)@(\w+(?: \w+)?)$/);
    });

    it('exposes a decodePattern', () => {
      expect(ctrlInstance.decodePattern).to.eql(/@[[\s\w]+:[0-9a-z-]+]/gi);
    });

    it('exposes the given $element', () => {
      expect(ctrlInstance.$element).to.eq($element);
    });

    it('exposes an array of choices', () => {
      expect(ctrlInstance.choices).to.eql([]);
    });

    it('exposes an array of mentions', () => {
      expect(ctrlInstance.mentions).to.eql([]);
    });
  });

  context('public API', function () {
    let ctrlInstance, $element;

    beforeEach(function () {
      $scope.model = 'bar';
      $element = angular.element('<span ui-mention ng-model="model"></span><span></span>');
      ctrlInstance = createController($element);
      $scope.$digest();
    });

    [
      'init', 'render', 'renderElement', 'highlight', 'decode', 'label', 'encode', 'replace',
      'select', 'up', 'down', 'search', 'findChoices', 'cancel', 'autogrow'
    ].forEach((fn) => {
      it(fn + ' is a public API method on ' + ctrlInstance, () => {
        expect(ctrlInstance).to.have.property(fn).that.is.a('function');
      });
    });

    context('.init()', () => {
      let ngModel, mentions;

      beforeEach(() => {
        ngModel = { $parsers: [], $formatters: [] };
        mentions = [{ id: 1, first: 'foo', last: 'bar' }, { id: 2, first: 'k', last: 'v' }];
        ctrlInstance.init(ngModel);
        ctrlInstance.mentions = mentions;
      });

      it('sets $attrs.ngTrim to false', () => {
        expect($attrs.ngTrim).to.eq('false');
      });

      context('ngModel.$parsers', () => {
        let $parsers, mentionParser;

        beforeEach(() => {
          $parsers = ngModel.$parsers;
          mentionParser = $parsers[0];
        });

        it('received a new $parser', () => {
          expect($parsers.length).to.eq(1);
        });

        it('sets up a mentions property on the controller instance', () => {
          mentionParser('');
          expect(ctrlInstance).to.have.property('mentions').that.is.an('array');
        });

        it('returns the given value', () => {
          expect(mentionParser('foo bar')).to.eq('@[foo bar:1]');
        });

        it('filters out non matching mentions', () => {
          mentionParser('foo bar');
          expect(ctrlInstance.mentions).to.eql(mentions.slice(0,1));
        });

        it('updates the HTML content of the adjacent DOM element', () => {
          mentionParser('foo bar');
          expect($element.next().html()).to.eq('<span>foo bar</span>');
        });
      });

      context('ngModel.$formatters', () => {
        let $formatters, formatter;

        beforeEach(() => {
          $formatters = ngModel.$formatters;
          formatter = $formatters[0];
        });

        it('received a new $formatter', () => {
          expect($formatters.length).to.eq(1);
        });

        it('returns an empty string by default', () => {
          expect(formatter()).to.eq('');
        });

        it('casts any non-string argument to a string', () => {
          expect(formatter(123)).to.eq('123');
          expect(formatter(false)).to.eq('false');
          expect(formatter(true)).to.eq('true');
          expect(formatter({})).to.eq('[object Object]');
          expect(formatter([])).to.eq('');
        });

        it('filters out non matching mentions', () => {
          expect(ctrlInstance.mentions).to.include(mentions[1]);
          formatter('@[foo bar:1]');
          expect(ctrlInstance.mentions).to.not.include(mentions[1]);
        });

        it('returns an encoded version of the passed value', () => {
          expect(formatter('@[foo bar:1]')).to.eq('foo bar');
        });
      });

      context('ngModel.$render', () => {
        it('sets the val property of $element to ngModel.$viewValue', () => {
          ngModel.$viewValue = 'wat';
          ngModel.$render();
          expect($element.val()).to.eq('wat');
        });

        it('defaults to an empty string', () => {
          ngModel.$render();
          expect($element.val()).to.eq('');
        });

        it('updates the HTML content of the adjacent DOM element', () => {
          ngModel.$modelValue = '@[foo bar:1]';
          ngModel.$render();
          expect($element.next().html()).to.eq('<span>foo bar</span>');
        });
      });
    });

    context('.render()', () => {
      let ngModel, mentions;

      beforeEach(() => {
        ngModel  = { $parsers: [], $formatters: [] };
        mentions = [{ id: 1, first: 'foo', last: 'bar' }, { id: 2, first: 'k', last: 'v' }];

        $element = angular.element('<span ui-mention ng-model="model"></span><span></span>');
        ctrlInstance = createController($element);
        $scope.$digest();

        ctrlInstance.init(ngModel);
        ctrlInstance.mentions = mentions;
      });

      it('the default argument is ngModel.$modelValue if no other was passed', () => {
        ngModel.$modelValue = 'nope';
        expect(ctrlInstance.render()).to.eq('nope');
      });

      it('casts the given argument to a string', () => {
        expect(ctrlInstance.render(123)).to.eq('123');
      });

      it('converts a syntax encoded string to HTML', () => {
        ngModel.$modelValue = '@[foo bar:1] @[k v:2]';
        expect(ctrlInstance.render()).to.eq('<span>foo bar</span> <span>k v</span>');
      });

      it('does not convert non-mentions', () => {
        ngModel.$modelValue = '@[wat nope:123]';
        expect(ctrlInstance.render()).to.not.eq('<span>wat nope</span>');
      });

      it('checks the render html element', () => {
        expect(ctrlInstance.renderElement()).to.have.property('html');
      });

      it('replaces the html of $element.next with the converted value', () => {
        ngModel.$modelValue = '@[foo bar:1] @[k v:2]';
        ctrlInstance.render();
        expect(ctrlInstance.renderElement().html()).to.eq('<span>foo bar</span> <span>k v</span>')
      });
    });

    context('.highlight()', () => {
      let choice;

      beforeEach(() => {
        choice = { first: 'x', last: 'y' };
      });

      it('returns an HTML formatted version of the given argument', () => {
        expect(ctrlInstance.highlight(choice)).to.eq('<span>x y</span>');
      });
    });

    context.skip('.decode()', () => {
      /** Untested - NOT CURRENTLY USED **/
    });

    context('.label()', () => {
      it('converts the given object to a readable string', () => {
        expect(ctrlInstance.label({ first: 0, last: 1 })).to.eq('0 1');
      });
    });

    context('.encode()', () => {
      it('encodes the given object to a syntax encoded string', () => {
        let choice = { first: 'x', last: 'y', id: 123 };
        expect(ctrlInstance.encode(choice)).to.eq('@[x y:123]');
      });
    });

    context.skip('.replace()', () => {
      /** Untested - marked with @TODO's **/
    });

    context('.select()', () => {
      let ngModel, mentions;

      beforeEach(() => {
        ngModel = { $parsers: [], $formatters: [], $setViewValue: sinon.stub() };
        ctrlInstance.init(ngModel);
        ctrlInstance.searching = [''];
        ngModel.$viewValue = 'foo';
      });

      it('adds a mention to the current mentions', () => {
        expect(ctrlInstance.mentions.length).to.eq(0);
        ctrlInstance.select({ first: 'foo', last: 'bar' });
        expect(ctrlInstance.mentions[0]).to.eql({ first: 'foo', last: 'bar' });
      });

      it('clears the controller choices', () => {
        ctrlInstance.select({ first: 'foo', last: 'bar' });
        expect(ctrlInstance.choices).to.eql([]);
      });

      it('sets the searching regex to null', () => {
        ctrlInstance.select({ first: 'foo', last: 'bar' });
        expect(ctrlInstance.searching).to.eq(null);
      });

      it('returns nothing', () => {
        expect(ctrlInstance.select({ first: 'foo', last: 'bar' })).to.eq(undefined);
      });
    });

    context('.up()', () => {
      it('moves the activeChoice up in the choices collection', () => {
        let choices = [{ id: 1 }, { id: 2 }, { id: 3 }];
        ctrlInstance.choices = choices;
        ctrlInstance.activeChoice = choices[1];

        ctrlInstance.up();
        expect(ctrlInstance.activeChoice).to.eq(choices[0]);

        ctrlInstance.up();
        expect(ctrlInstance.activeChoice).to.eq(choices[2]);

        ctrlInstance.up();
        expect(ctrlInstance.activeChoice).to.eq(choices[1]);
      });
    });

    context('.down()', () => {
      it('moves the activeChoice down in the choices collection', () => {
        let choices = [{ id: 1 }, { id: 2 }, { id: 3 }];
        ctrlInstance.choices = choices;
        ctrlInstance.activeChoice = choices[1];

        ctrlInstance.down();
        expect(ctrlInstance.activeChoice).to.eq(choices[2]);

        ctrlInstance.down();
        expect(ctrlInstance.activeChoice).to.eq(choices[0]);

        ctrlInstance.down();
        expect(ctrlInstance.activeChoice).to.eq(choices[1]);
      });
    });

    context('.search()', () => {
      it('sets the controller searching property to the passed argument', () => {
        ctrlInstance.search('foo');
        expect(ctrlInstance.searching).to.eq('foo');
      });

      it('returns a promise', () => {
        expect(ctrlInstance.search('')).to.have.property('$$state');
      });

      it('resolves with the possible choices', () => {
        function fn () {
          return ctrlInstance.search('');
        }

        fn().then(function (res) {
          expect(res).to.be.an('array');
        });

        $timeout.flush();
      });
    });

    context('.findChoices', () => {
      it('returns an array', () => {
        expect(ctrlInstance.findChoices()).to.be.an('array');
      });
    });

    context('.cancel()', () => {
      it('clears the controller choices', () => {
        ctrlInstance.choices = [{}, {}];
        ctrlInstance.cancel();
        expect(ctrlInstance.choices).to.eql([]);
      });

      it('sets the searching regex to null', () => {
        ctrlInstance.searching = /x/.exec('y');
        ctrlInstance.cancel();
        expect(ctrlInstance.searching).to.eq(null);
      });
    });

    context('.autogrow()', () => {
      it('sets the $element height to 0', () => {
        ctrlInstance.autogrow();
        expect($element[0].style.height).to.eq('0px');
      });

      it('sets the $element height to scrollHeight if box-sizing is borderBox', () => {
        $element[0].style.boxSizing = 'border-box';
        ctrlInstance.autogrow();
        expect($element[0].style.height).to.eq($element[0].scrollHeight + 'px');
      });
    });
  });

  context('DOM listeners', () => {
    let ctrlInstance, $element;

    beforeEach(function () {
      $scope.model = 'bar';
      $element = angular.element('<span ui-mention ng-model="model"></span>');
      ctrlInstance = createController($element);
      $scope.$digest();
    });

    ['keyup', 'click', 'focus'].forEach((ev) => {
      context('on ' + ev, () => {
        it('sets moved to false if moved is truthy', () => {
          ctrlInstance.moved = true;
          trigger($element, ev);
          expect(ctrlInstance.moved).to.eq(false);
        });

        it('does nothing if the selectionStart does not match selectionEnd', () => {
          let spy = sinon.spy($scope, '$apply');
          $element[0].selectionStart = 0;
          $element[0].selectionEnd = 1;

          trigger($element, ev);

          expect(spy).to.not.have.been.calledOnce;
        });

        it('searches if there is a match', () => {
          let spy = sinon.spy(ctrlInstance, 'search');
          ctrlInstance.searchPattern = /foo/;
          $element.val('@foo');
          $element[0].selectionStart = $element[0].selectionEnd = 4;

          trigger($element, ev);

          expect(spy).to.have.been.calledOnce;
        });

        it('cancels if there is no match', () => {
          let spy = sinon.spy(ctrlInstance, 'cancel');
          ctrlInstance.searchPattern = /foo/;
          $element.val('@bar');
          $element[0].selectionStart = $element[0].selectionEnd = 4;

          trigger($element, ev);

          expect(spy).to.have.been.calledOnce;
        });

        it('triggers scope.$apply regardless', () => {
          let spy = sinon.spy($scope, '$apply');
          $element[0].selectionStart = $element[0].selectionEnd = 0;
          $element.val('');

          trigger($element, ev);

          expect(spy).to.have.been.calledOnce;
        });
      });
    });

    /**
     * TODO: Get ev.keyCode working.
     * QT5 ain't cool with KeyBoardEvent constructors.
     */
    context.skip('on keydown', () => {
      let ev = 'keydown';

      it('does nothing if not searching', () => {
        let spy = sinon.spy($scope, '$apply');
        trigger($element, ev);
        expect(spy).to.not.have.been.calledOnce;
      });

      it('selects if keycode 13 (return)', () => {
        let spy = sinon.spy(ctrlInstance, 'select');
        ctrlInstance.searching = true;
        trigger($element, ev, 13);
        expect(spy).to.have.been.calledOnce;
      });

      it('goes up if keycode 38 (up)', () => {
        let spy = sinon.spy(ctrlInstance, 'up');
        ctrlInstance.searching = true;
        trigger($element, ev, 38);
        expect(spy).to.have.been.calledOnce;
      });

      it('goes down if keycode 40 (down)', () => {
        let spy = sinon.spy(ctrlInstance, 'down');
        ctrlInstance.searching = true;
        trigger($element, ev, 40);
        expect(spy).to.have.been.calledOnce;
      });

      context('if keycode is either 13, 38 or 40', () => {
        it('sets moved to true ', () => {
          ctrlInstance.searching = true;
          trigger($element, ev, 13);
          expect(ctrlInstance.moved).to.eq(true);
        });

        it('cancels the default of event', () => {
          ctrlInstance.searching = true;
          let evt = trigger($element, ev, 13);
          let spy = sinon.spy(evt, 'preventDefault');
          expect(spy).to.have.been.calledOnce;
        });

        it('triggers scope.$apply', () => {
          ctrlInstance.searching = true;
          trigger($element, ev, 13);
          let spy = sinon.spy($scope, '$apply');
          expect(spy).to.have.been.calledOnce;
        });
      });
    });

    function trigger (el, ev, code) {
      let evt;

      evt = $document[0].createEvent('KeyboardEvent');
      evt.initKeyboardEvent(ev, true, true);
      evt.keyCode = code;

      el[0].dispatchEvent(evt);

      return evt;
    }
  });
});
