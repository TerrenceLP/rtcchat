var fs = require('fs');
//var UAParser = require('ua-parser-js');

module.exports = function(config) {
  config.set({
    // the host name
    hostname: '@@hostname',

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
          hostname: '@@driverhost', // supply with your own IP
          port: @@driverport
        },
        browserName: 'internet explorer'
      },
      ChromeCustom: {
        base: 'Chrome',
        flags: [
          '--use-fake-ui-for-media-stream',
          // no longer works. removed
          //'--disable-user-media-security',
          '--unsafely-treat-insecure-origin-as-secure="@@hostname"'
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

    /*protocol: 'http:',

    httpsServerOptions: {
      key: fs.readFileSync('@@certificateKey', 'utf-8'),
      cert: fs.readFileSync('@@certificateCert', 'utf-8')
    },*/

    coverageReporter: {
      type : 'html',
      dir : '@@coverageDir',
      file: '@@coverageFile'
    },

    autoWatch: false,

    /*client: {
      captureConsole: false
    },*/

    files: @@files,

    preprocessors: @@preprocessor,

    browsers: @@browser,

    port: @@port,

    htmlReporter: @@htmlReporter
  });
}
