"use strict";

var gulp = require("gulp"),
    debug = require('gulp-debug'),
    autoprefixer = require("gulp-autoprefixer"),
    cssbeautify = require("gulp-cssbeautify"),
    removeComments = require('gulp-strip-css-comments'),
    rename = require("gulp-rename"),
    ngrok = require('ngrok'),
    webserver = require("browser-sync"),
    sass = require("gulp-sass"), //плагин препроцессора
    cssnano = require("gulp-cssnano"),
    rigger = require("gulp-rigger"),
    uglify = require("gulp-uglify"),
    watch = require("gulp-watch"),
    plumber = require("gulp-plumber"),
    imagemin = require("gulp-imagemin"),
    imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    pngquant = require('imagemin-pngquant'),
    run = require("run-sequence").use(gulp),
    rimraf = require("rimraf"),
    cached = require('gulp-cached'),
    cache = require('gulp-cache'),
    newer = require('gulp-newer'),
    gutil = require('gulp-util');



/* Paths to source/build/watch files
=========================*/

var path = {
    build: {
        html: "build/",
        js: "build/assets/js/",
        css: "build/assets/css/",
        img: "build/assets/i/",
        fonts: "build/assets/fonts/"
    },
    src: {
        html: "src/*.{htm,html}",
        js: "src/assets/js/*.js",
        css: "src/assets/sass/style.scss",
        img: "src/assets/i/**/*.*",
        fonts: "src/assets/fonts/**/*.*"
    },
    watch: {
        html: "src/**/*.{htm,html}",
        js: "src/assets/js/**/*.js",
        css: "src/assets/sass/**/*.scss",
        img: "src/assets/i/**/*.*",
        fonts: "src/assets/fonts/**/*.*"
    },
    clean: "./build"
};



/* Webserver config
=========================*/
//
// var config = {
//     server: "build/",
//     notify: false,
//     open: true,
//     ui: false
// };
var config = {
    server: {
        baseDir: "build/"
    },
    tunnel: true,
    host: 'localhost',
    port: 3000,
    directoryListing: true,
    logPrefix: ''
};



/* Tasks
=========================*/

gulp.task("webserver", function () {
    webserver(config, function (err, bs) {
           ngrok.connect({
                    proto: 'http', // http|tcp|tls
                    addr: bs.options.get('port'), // port or network address
                }, function (err, url) {
                    gutil.log('[ngrok]', ' => ', gutil.colors.magenta.underline(url));
                });
        });
});

/* Build HTML
==================================*/
gulp.task("html:build", function () {
    return gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(webserver.reload({stream: true}));
});


/* Build CSS
==================================*/

gulp.task("css:build", function () {
    return gulp.src(path.src.css)
        // .pipe(cached('sass'))
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ["last 5 versions"],
            cascade: true
        }))
        .pipe(removeComments())
        .pipe(cssbeautify())
        .pipe(gulp.dest(path.build.css))
        .pipe(cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(rename("style.min.css"))
        .pipe(gulp.dest(path.build.css))
        .pipe(webserver.reload({stream: true}));
});

/* Build JS
==================================*/

gulp.task("js:build", function () {
    return gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(gulp.dest(path.build.js))
        .pipe(uglify())
        .pipe(removeComments())
        .pipe(rename("main.min.js"))
        .pipe(gulp.dest(path.build.js))
        .pipe(webserver.reload({stream: true}));
});

/* Build fonts
==================================*/

gulp.task("fonts:build", function() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

/* Build IMG
==================================*/

gulp.task("image:build", function () {
    return gulp.src(path.src.img)
        .pipe(cache(imagemin([
            imagemin.jpegtran({progressive: true}),
            imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality:'medium'
            }),
            imagemin.svgo(),
            imagemin.optipng({optimizationLevel: 3}),
            pngquant({quality: '65-70', speed: 5})
        ],{
                verbose: true
            })))
        .pipe(gulp.dest(path.build.img));
    });

gulp.task("clean", function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('build', function (cb) {
    run(
        "clean",
        "html:build",
        "css:build",
        "js:build",
        "fonts:build",
        "image:build"
    , cb);
});


gulp.task("watch", function() {
    watch([path.watch.html], function(event, cb) {
        gulp.start("html:build");
    });
    watch([path.watch.css], function(event, cb) {
        gulp.watch('src/assets/i/**/*.*', ['image:build']);
        gulp.start("css:build");
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start("js:build");
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start("image:build");
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start("fonts:build");
    });
});


gulp.task("default", function (cb) {
   run(
       "clean",
       "build",
       "webserver",
       "watch"
   , cb);
});
