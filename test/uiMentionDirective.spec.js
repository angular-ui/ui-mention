describe('uiMentionDirective', () => {
  let Subject, $scope, compileDir, ctrlInstance;

  beforeEach(() => {
    ctrlInstance = function () {
      ctrlInstance.init = this.init = sinon.stub();
    };

    module('ui.mention', ($controllerProvider) => {
      $controllerProvider.register('uiMention', ctrlInstance);
    });

    inject(($injector) => {
      Subject = $injector.get('uiMentionDirective');
      $scope  = $injector.get('$rootScope').$new();

      compileDir = (template) => {
        return $injector.get('$compile')(template)($scope);
      };
    });
  });

  context('DDO', () => {
    let DDO;

    beforeEach(() => {
      DDO = Subject[0];
    });

    it('is named uiMention', () => {
      expect(DDO.name).to.eq('uiMention');
    });

    it('has a priority of 0', () => {
      expect(DDO.priority).to.eq(0);
    });

    it('requires ngModel', () => {
      expect(DDO.require).to.include('ngModel');
    });

    it('requires uiMention', () => {
      expect(DDO.require).to.include('uiMention');
    });

    it('exposes controllerAs $mention', () => {
      expect(DDO.controllerAs).to.eq('$mention');
    });

    it('is restricted to EA', () => {
      expect(DDO.restrict).to.eq('EA');
    });
  });

  context('.link()', () => {
    it('calls the controller.init method with the given ngModel', () => {
      $scope.model = 'wat';
      compileDir('<span ui-mention ng-model="model"></span>');
      $scope.$digest();
      expect(ctrlInstance.init).to.have.been.calledOnce.and.calledWithMatch({
        $modelValue: 'wat'
      });
    });
  });
});
