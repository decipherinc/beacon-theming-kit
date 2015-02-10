/*!
 * This gruntfile can compile and watch your theme.less file.
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
        open: {
            theIndex: {
                path: 'http://localhost:3000/'
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
                files: ['theme.less', 'temp-button-select.less'],
                tasks: ['less'],
                options: {
                    livereload: true
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');

    // Default task(s).
    grunt.registerTask('default', ['less']);

    // run server and watch
    grunt.registerTask('server', ['open', 'connect', 'watch']);
};