/*!
 * This gruntfile can run a local server and watch/compile your theme.less file.
 */
'use strict';

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        less: {
            themeCompile: {
                files: {
                    // target.css file: source.less file
                    "assets/css/less-compiled.css": "assets/less/less-compiled.less"
                }
            }
        },
        connect: {
          all: {
            options: {
              port: 3000,
            }
          }
        },
        watch: {
            themeFile: {
                files: ['theme.less'],
                tasks: ['less'],
                options: {
                    livereload: false,
                }
            },
            livereload: {
                files: ['assets/css/less-compiled.css'],
                options: {
                    livereload: true,
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Default task(s).
    grunt.registerTask('default', ['less']);

    // run server and watch
    grunt.registerTask('server', ['connect', 'watch']);
};