var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    Karma = require('karma').Server
    ngAnnotate = require('gulp-ng-annotate');

var paths = {
  scripts: {
    src: ['src/**/*.js'],
    dest: 'dist',
    file: 'mention.js'
  },
  styles: {
    src: ['src/**/*.scss'],
    dest: 'dist',
    file: 'mention.css'
  },
  example: {
    scripts: {
      src: ['example/**/*.es6.js'],
      dest: 'example',
      file: 'example.js'
    },
    styles: {
      src: ['example/**/*.scss'],
      dest: 'example'
    }
  }
};

gulp.task('default', ['scripts']);

gulp.task('example', ['scripts:example', 'styles:example']);

gulp.task('watch', function(){
  gulp.watch(paths.scripts.src, 'scripts');
  gulp.watch(paths.styles.src, 'styles');
});

gulp.task('watch:example', function(){
  gulp.watch(paths.example.scripts.src, 'scripts:example');
  gulp.watch(paths.example.styles.src, 'styles:example');
});

gulp.task('scripts', scripts(paths.scripts));
gulp.task('scripts:example', scripts(paths.example.scripts));
function scripts(path, concat) {
  return function() {
    return gulp.src(path.src)
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.babel())
      .pipe(plugins.angularFilesort())
      .pipe(plugins.concat(path.file))
      .pipe(ngAnnotate())
      .pipe(gulp.dest(path.dest))
      .pipe(plugins.uglify({ mangle: false }))
      .pipe(plugins.extReplace('.min.js'))
      .pipe(gulp.dest(path.dest))
      .pipe(plugins.sourcemaps.write('.'));
  }
}

gulp.task('styles', styles(paths.styles));
gulp.task('styles:example', styles(paths.example.styles));
function styles(path) {
  return function() {
    return gulp.src(path.src)
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sass())
      .pipe(gulp.dest(path.dest))
      .pipe(plugins.sourcemaps.write('.'));
  }
}

gulp.task('karma', karma());
gulp.task('watch:karma', karma({ singleRun: false, autoWatch: true }));
function karma (opts) {
  opts = opts || {};
  opts.configFile = __dirname + '/karma.conf.js';

  return function (done) {
    return new Karma(opts, done).start();
  }
}
