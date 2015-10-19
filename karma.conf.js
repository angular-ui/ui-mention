module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'chai-sinon'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/phantomjs-polyfill/bind-polyfill.js',
      'src/**/*.js',
      'test/**/*.spec.js'
    ],
    preprocessors: {
      'src/**/*.js': 'babel',
      'test/**/*.js': 'babel'
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true
  });
};
