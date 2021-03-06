/**
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var reload = browserSync.reload;
var neat = require('node-neat').includePaths;
var config = require('./app/config.json');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Optimize Images
gulp.task('images', ['respond'], function () {
// gulp.task('images', 'resize', function () {
  return gulp.src(['app/images/**/*'])
    // .pipe($.cache($.imagemin({
    //   progressive: true,
    //   interlaced: true
    // })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}));
});

var imgSrc = 'app/images/@(projects|project-thumbnails)/**/*.@(png|jpg)';
var imgDest = gulp.dest('dist/images');
var addSuffix = function (suffix) {
  return $.rename(function (path) { path.basename += '-'+suffix; })
};

gulp.task('respond', function () {
  var config = {
    '**/*': [
      {
        width: 320,
        rename: {suffix: '-small'}
      }, {
        width: 750,
        rename: {suffix: '-medium'}
      }, {
        width: 1680,
        rename: {suffix: '-large'}
      }
      // TODO: figure out way to ignore project files in images task
      // so we can set a max size below.
      // }, {
      //   width: 2800
      //   // Keep old name
      // }
    ]
  };
  return gulp.src('app/images/@(projects|project-thumbnails)/**/*.@(png|jpg)')
    .pipe($.responsive(config, { errorOnEnlargement: false }))
    .pipe($.print())
    .pipe(imgDest);
});

// 'app/jade/_/layout.jade' uses these image sizes
gulp.task('images-small', function () {
  return gulp.src(imgSrc)
    .pipe($.imageResize({ width : 320 }))
    .pipe(addSuffix('small'))
    .pipe($.print())
    .pipe(imgDest);
});
gulp.task('images-medium', function () {
  return gulp.src(imgSrc)
    .pipe($.imageResize({ width : 750 }))
    .pipe(addSuffix('medium'))
    .pipe($.print())
    .pipe(imgDest);
});
gulp.task('images-large', function () {
  return gulp.src(imgSrc)
    .pipe($.imageResize({ width : 1680 }))
    .pipe(addSuffix('large'))
    .pipe($.print())
    .pipe(imgDest);
});

gulp.task('resize', function (cb) {
  runSequence('images-small', 'images-medium', 'images-large', cb);
});

// Copy All Files At The Root Level (app)
gulp.task('copy', function () {
  return gulp.src([
    'app/*',
    '!app/bower_components',
    '!app/jade',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

// Copy Web Fonts To Dist
gulp.task('fonts', function () {
  return gulp.src(['app/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({title: 'fonts'}));
});

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src('app/styles/main.scss')
    // .pipe($.changed('.tmp/styles', {extension: '.css'}))
    .pipe($.sass({
      precision: 10,
      onError: console.error.bind(console, 'Sass error:'),
      includePaths: ['styles', 'app/bower_components/reset-scss', 'app/bower_components/nanoscroller/bin/css'].concat(neat)
    }))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate And Minify Styles
    .pipe($.if('*.css', $.csso()))
    .pipe(gulp.dest('dist/styles'))
    .pipe($.size({title: 'styles'}));
});

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});
  var LOCALS = { CONFIG: config };

  return gulp.src([
      'app/jade/**/*.jade',
      '!app/jade/_/*'
    ])
    .pipe($.jade({ pretty: true, locals: LOCALS }))
    .pipe(assets)
    // Concatenate And Minify JavaScript
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    // Remove Any Unused CSS
    // Note: If not using the Style Guide, you can delete it from
    // the next line to only include styles your project uses.
    // .pipe($.if('*.css', $.uncss({
    //   html: [
    //     'app/index.html',
    //     'app/styleguide.html'
    //   ],
    //   // CSS Selectors for UnCSS to ignore
    //   ignore: [
    //     /.navdrawer-container.open/,
    //     /.app-bar.open/
    //   ]
    // })))
    // Concatenate And Minify Styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())

    // Make index pages for each html page
    .pipe($.rename(function (path) {
        if (path.extname !== '.html') return;
        if (path.basename !== 'index') path.dirname += '/' + path.basename;
        path.basename = 'index';
    }))
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

// Watch Files For Changes & Reload
gulp.task('serve', ['styles', 'html'], function () {
  browserSync({
    notify: false,
    // Customize the BrowserSync console logging prefix
    logPrefix: 'WSK',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['dist']
  });

  gulp.watch(['app/**/*.jade'], ['html', reload]);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['html', 'jshint']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence('styles', ['jshint', 'html', 'fonts', 'copy'], 'images', cb);
});

// Run PageSpeed Insights
gulp.task('pagespeed', function (cb) {
  // Update the below URL to the public URL of your site
  pagespeed.output('angelicagutierrez.net', {
    strategy: 'mobile',
    // By default we use the PageSpeed Insights free (no API key) tier.
    // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
    // key: 'YOUR_API_KEY'
  }, cb);
});

var options = {
    message: 'Update ' + new Date().toISOString() + ' [skip ci]',
    branch: 'master'
};

gulp.task('deploy', ['default'], function () {
// gulp.task('deploy', function () {
  return gulp.src('dist/**/*')
    .pipe($.ghPages(options));
});


// Load custom tasks from the `tasks` directory
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }

module.exports = gulp;
