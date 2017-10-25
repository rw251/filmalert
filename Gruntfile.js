module.exports = function(grunt) {

    grunt.initConfig({
        uncss: {
            dist: {
                files: [{
                    src: 'src/main.html',
                    dest: 'dist/public_html/css/tidy.css'
                }]
            }
        },
        cssmin: {
            dist: {
                files: [{
                    src: 'dist/public_html/css/tidy.css',
                    dest: 'dist/public_html/css/tidy.min.css'
                }]
            }
        },
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            dist: {
                // the files to concatenate
                src: ['src/js/*.js'],
                // the location of the resulting JS file
                dest: 'dist/public_html/js/aggregated.js'
            }
        },
        uglify: {
            options: {
                //banner: '/*! aggregated <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/public_html/js/aggregated.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        processhtml: {
            dist: {
                files: {
                    'dist/public_html/main.html': ['src/main.html']
                }
            }
        },
        cacheBust: {
            options: {
                encoding: 'utf8',
                algorithm: 'md5',
                length: 16,
                deleteOriginals: false
            },
            assets: {
                files: [{
                    src: ['dist/public_html/main.html']
                }]
            }
        },
        copy: {
            default: {
                files: [
                    // includes files within path
                    {
                        expand: true,
                        src: ['src/*'],
                        dest: 'dist/public_html',
                        filter: 'isFile',
                        flatten: true,
                        dot: true
                    },

                    // includes files within path and its sub-directories
                    {
                        expand: true,
                        src: ['src/img/*'],
                        dest: 'dist/public_html/img',
                        filter: 'isFile',
                        flatten: true
                    },
                    {
                        expand: true,
                        src: ['src/fonts/*'],
                        dest: 'dist/public_html/fonts',
                        filter: 'isFile',
                        flatten: true
                    },
                    //service worker code
                    {
                        expand: true,
                        src: ['src/sw/*'],
                        dest: 'dist/public_html/sw',
                        filter: 'isFile',
                        flatten: true
                    }
                ]
            },
            dev: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'dist/public_html/css',
                    dest: 'dist/public_html/css/',
                    src: [
                        'tidy.css'
                    ],
                    rename: function(dest, src) {
                        return dest + src.replace('.css', '.min.css');
                    }
                }, {
                    expand: true,
                    dot: true,
                    cwd: 'dist/public_html/js',
                    dest: 'dist/public_html/js/',
                    src: [
                        'aggregated.js'
                    ],
                    rename: function(dest, src) {
                        return dest + src.replace('.js', '.min.js');
                    }
                }]
            }
        },
        clean: ["dist/public_html"],
        minifyHtml: {
    		options: {
    			cdata: true
    		},
    		dist: {
    			files: {
    				'dist/public_html/main.html': 'dist/public_html/main.html'
    			}
    		}
    	}
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-uncss');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-cache-bust');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-minify-html');

    // Default tasks.
    grunt.registerTask('default', ['clean','copy', 'uncss', 'cssmin', 'concat', 'uglify', 'processhtml', 'cacheBust', 'minifyHtml']);
    grunt.registerTask('dev', ['copy', 'uncss', 'cssmin', 'concat', 'uglify', 'processhtml', 'copy:dev', 'cacheBust']);

};