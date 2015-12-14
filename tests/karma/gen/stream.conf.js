/*! skylinkjs - v0.6.4 - Tue Dec 15 2015 05:04:16 GMT+0800 (SGT) */

module.exports = function(config) {
  config.set({
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'tap'],

    autoWatch: true,

    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['coverage', 'html', 'story'],

    colors: true,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    singleRun: true,

    //browserNoActivityTimeout: 100000,

    transports: ['websocket', 'flashsocket', 'xhr-polling', 'jsonp-polling', 'polling'],

    concurrency: 1,

    customLaunchers: {
      IEWebDriver: {
        base: 'WebDriver',
        config: {
          hostname: '192.168.1.171', // supply with your own IP
          port: 4445
        },
        browserName: 'internet explorer'
      },
      ChromeCustom: {
        base: 'Chrome',
        flags: ['--use-fake-ui-for-media-stream', '--disable-user-media-security']
      },
      FirefoxCustom: {
        base: 'Firefox',
        prefs: {
          'media.navigator.permission.disabled': true,
          'media.getusermedia.screensharing.enabled': true
        }
      }
    },

    coverageReporter: {
      type : 'html',
      dir : '/Users/leticiachoo/Workspace/SkylinkJS/tests/coverage/'
    },


    files: [{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../node_modules/adapterjs/publish/adapter.screenshare.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../node_modules/socket.io-client/socket.io.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../source/debugger.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/tests/util.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../source/stream.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/tests/units/stream.js","included":true}],

    preprocessors: {"/Users/leticiachoo/Workspace/SkylinkJS/tests/tests/units/stream.js":["browserify"]},

    browsers: ["Safari","ChromeCustom","FirefoxCustom","Opera"],

    port: 5000,

    htmlReporter: {"outputFile":"/Users/leticiachoo/Workspace/SkylinkJS/tests/reporters/stream.html","pageTitle":"Unit tests for stream","subPageTitle":"Tested browsers: Safari, ChromeCustom, FirefoxCustom, Opera"}
  });
}
