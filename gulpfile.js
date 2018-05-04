var gulp = require('gulp'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  plugins = gulpLoadPlugins({
    DEBUG: true,
    pattern: ['gulp-*', 'gulp.*', 'postcss-*', 'cssnext', 'imagemin*']
  });
var bs = require('browser-sync').create();
var gulp_webpack = require('webpack-stream');
var webpack = require('webpack');
var runSequence = require('run-sequence');

var onError = function(err) {
  plugins.notify.onError({
    title: 'Gulp error in ' + err.plugin,
    message: err.message
  })(err);

  this.emit('end');
};

//Convert SCSS to CSS and minify it
gulp.task('css', function() {
  var processors = [plugins.postcssCssnext()];
  return gulp.src('src/assets/css/*.scss')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass())
    .pipe(plugins.postcss(processors))
    .pipe(plugins.cleanCss())
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('build/assets/css'))
    .pipe(bs.stream())
    .pipe(plugins.notify({ title: 'CSS changed', sound: false}));
});

// Minifiy Images and create Webp
gulp.task('imagemin', function () {
  return gulp.src('src/assets/img/*')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.changed('build/assets/img'))
    .pipe(
      plugins.imagemin(
        [
          plugins.imageminMozjpeg({ quality: 85, progressive: true }),
          plugins.imageminPngquant({ quality: 65 - 85 })
        ],
        { verbose: true }
      )
    )
    .pipe(gulp.dest('build/assets/img'))
    .pipe(bs.stream());
});

gulp.task('webp', function () {
  return gulp
    .src('src/assets/img/*')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.changed('build/assets/img'))
    .pipe(plugins.webp({ quality: 100 }))
    .pipe(gulp.dest('build/assets/img'));
});

gulp.task('images', function () {
  runSequence('webp', 'imagemin');
});

// Javascript Tasks
gulp.task('js', function() {
  return gulp.src('src/assets/js/app.js')
    .pipe(
      plugins.plumber({
        errorHandler: onError
      })
    )
    .pipe(gulp_webpack(require('./webpack.config.js'), webpack))
    .pipe(
      plugins.babel({
        presets: ['env']
      })
    )
    .pipe(plugins.uglify())
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(gulp.dest('build/assets/js'))
    .pipe(bs.stream())
    .pipe(plugins.notify({ title: 'JavaScript changed', sound: false}));
});

//BrowserSync Task
gulp.task('browser-sync', function() {
  bs.init({
    server: 'build/',
    browser: 'C:\\firefoxdev\\firefox.exe',
    ghostMode: {
      scroll: true,
      clicks: true
    }
  });
  gulp.watch('src/assets/css/**/*.scss', ['css']);
  gulp.watch('src/assets/img/*', ['images']);
  gulp.watch('src/assets/js/**/*.js', ['js']).on('change', bs.reload);
  gulp.watch('build/*html').on('change', bs.reload);
});

gulp.task('serve', ['browser-sync']);
