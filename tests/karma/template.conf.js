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
          hostname: '@@driverhost', // supply with your own IP
          port: @@driverport
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
      dir : '@@coverage'
    },


    files: @@files,

    preprocessors: @@preprocessor,

    browsers: @@browser,

    port: @@port,

    htmlReporter: @@htmlReporter
  });
}
