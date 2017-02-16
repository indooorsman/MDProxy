let gulp = require('gulp');
let zip = require('gulp-zip');
let runSeq = require('run-sequence');
let rename = require('gulp-rename');
let version = require('./package.json').version;
let versionCode = require('./package.json').versionCode;

gulp.task('backup-config', () => {
  return gulp.src('backend/config.js')
    .pipe(rename('config.js.my'))
    .pipe(gulp.dest('backend'))
});

gulp.task('rename-config', () => {
  return gulp.src('backend/config.blank.js')
  .pipe(rename('config.js'))
  .pipe(gulp.dest('backend'))
});

gulp.task('patch', () => {
  return gulp
  .src([
    'package.json',
    'backend/*',
    '!backend/config.*',
    'backend/**/*',
    'gui/*',
    'gui/**/*',
    'libs/*',
    'libs/**/*',
    'node_modules/*',
    'node_modules/**/*'
  ], {base: '.'})
  .pipe(zip(`patch-${version}-${versionCode}.zip`))
  .pipe(gulp.dest('.'))
});

gulp.task('restore-config', () => {
  return gulp.src('backend/config.js.my')
  .pipe(rename('config.js'))
  .pipe(gulp.dest('backend'))
});

gulp.task('default', callback => {
  runSeq(/*'backup-config', 'rename-config',*/ 'patch', /*'restore-config',*/ callback);
});