/*! skylinkjs - v0.6.4 - Fri Dec 18 2015 21:33:26 GMT+0800 (SGT) */

var fs = require('fs');
var UAParser = require('ua-parser-js');

module.exports = function(config) {
  config.set({
    // the host name
    hostname: '192.168.1.183',

    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    autoWatch: true,

    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage', 'html'],

    colors: true,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,

    singleRun: true,

    //browserNoActivityTimeout: 100000,

    transports: ['websocket', 'flashsocket', 'xhr-polling', 'jsonp-polling', 'polling'],

    concurrency: 1,

    customLaunchers: {
      IEWebDriver: {
        base: 'WebDriver',
        config: {
          hostname: '192.168.1.171', // supply with your own IP
          port: 4444
        },
        browserName: 'internet explorer'
      },
      ChromeCustom: {
        base: 'Chrome',
        flags: [
          '--use-fake-ui-for-media-stream',
          // no longer works. removed
          //'--disable-user-media-security',
          '--unsafely-treat-insecure-origin-as-secure="192.168.1.183"'
        ]
      },
      FirefoxCustom: {
        base: 'Firefox',
        prefs: {
          'media.navigator.permission.disabled': true,
          'media.getusermedia.screensharing.enabled': true
        }
      }
    },

    protocol: 'http:',

    httpsServerOptions: {
      key: fs.readFileSync('/Users/leticiachoo/Workspace/SkylinkJS/tests/../certificates/5164343-192.168.1.183.key', 'utf-8'),
      cert: fs.readFileSync('/Users/leticiachoo/Workspace/SkylinkJS/tests/../certificates/5164343-192.168.1.183.crt', 'utf-8')
    },

    coverageReporter: {
      type : 'html',
      dir : '/Users/leticiachoo/Workspace/SkylinkJS/tests/coverage/stream/',
      file: 'index.html'
    },

    client: {
      captureConsole: false
    },

    files: [{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../node_modules/adapterjs/publish/adapter.screenshare.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../node_modules/socket.io-client/socket.io.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../source/debugger.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../source/event.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../source/util.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/tests/util.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/../source/stream.js","included":true},{"pattern":"/Users/leticiachoo/Workspace/SkylinkJS/tests/tests/units/stream.js","included":true}],

    preprocessors: {"/Users/leticiachoo/Workspace/SkylinkJS/tests/tests/units/stream.js":["coverage"]},

    browsers: [],

    port: 5000,

    htmlReporter: {"outputFile":"/Users/leticiachoo/Workspace/SkylinkJS/tests/reporters/stream.html","pageTitle":"Unit tests for stream","subPageTitle":"Tested browsers: "}
  });
}
