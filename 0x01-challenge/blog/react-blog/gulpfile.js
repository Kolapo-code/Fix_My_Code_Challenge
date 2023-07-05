const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const reactify = require('reactify');
const packageJson = require('./package.json');
const nodemon = require('nodemon');
const minifyCss = require('gulp-minify-css');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const fs = require('fs');
const print = require('gulp-print');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');

const getIncludesByType = function(type, includePublicPath) {
  const allIncludes = [];
  const data = fs.readFileSync('./public/static/posts.json', 'utf8');

  const posts = JSON.parse(data).posts;
  let post;
  for (let i = 0; i < posts.length; i++) {
    post = posts[i];
    const includes = post.includes;
    if (!!includes) {
      includes
        .filter((include) => include.type === type)
        .forEach((include) => {
          const path = includePublicPath === true ? `./public${include.path}` : include.path;
          allIncludes.push(path);
        });
    }
  }

  const paths = {};
  const filteredIncludes = allIncludes.filter((path) => {
    if (!!paths[path]) {
      return false;
    }
    paths[path] = true;
    return true;
  });

  return filteredIncludes;
};

function generateJsxIncludes() {
  const includes = getIncludesByType('jsx', false);
  let includesString = '//This file was auto-generated. Updating it will have no effect\n';
  includesString += 'var JsxIncludes = {};\n';

  if (includes.length > 0) {
    includes.forEach((include) => {
      const path = `../../public${include}`;
      includesString += `JsxIncludes["${include}"] = require("${path}");\n`;
    });
  }

  includesString += '\nmodule.exports = JsxIncludes;\n';

  fs.writeFileSync('./src/components/JsxIncludes.js', includesString, 'utf8');
}

gulp.task('jsIncludes', function() {
  const allIncludes = getIncludesByType('js', true);

  return gulp
    .src(allIncludes)
    .pipe(print())
    .pipe(concat('includes.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('react', function() {
  generateJsxIncludes();

  return browserify(packageJson.paths.app)
    .transform('reactify', { stripTypes: true, es6: true })
    .bundle()
    .pipe(source(packageJson.dest.app))
    .pipe(clean({ force: true }))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(packageJson.dest.dist));
});

gulp.task('bundle', gulp.series('react', 'jsIncludes'));

gulp.task('cssIncludes', function() {
  const allIncludes = getIncludesByType('css', true);

  return gulp
    .src(allIncludes)
    .pipe(print())
    .pipe(minifyCss({ keepSpecialComments: 0 }))
    .pipe(concat('includes.min.css'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('appStyles', function() {
  return gulp
    .src('sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCss({ keepSpecialComments: 0 }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('public/css/'));
});

gulp.task('styles', gulp.parallel('appStyles', 'cssIncludes'));

gulp.task('build-all', gulp.parallel('bundle', 'styles'));

gulp.task('watch', function () {
  gulp.watch(['src/**/*.js', 'src/**/*.jsx', 'public/static/**/*.js', 'public/static/**/*.jsx', 'public/static/**/*.json', 'app.js', 'config.js'], gulp.series('bundle'));
  gulp.watch(['sass/**/*.scss', 'public/static/**/*.css'], gulp.series('styles'));
});

gulp.task('nodemon', function () {
  nodemon({ script: 'bin/www', ext: 'js jsx jade', ignore: ['public/scripts/react/*'] });
});
