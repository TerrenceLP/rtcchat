var fs = require('fs');
var config = require('./config.js');

module.exports = function(gruntConfig) {
  var gruntTask = ['clean:test'];

  // Prevent undefined errors
  config = config || {};
  config.run = config.run || {};
  config.run.browsers = config.run.browsers || [];
  config.run.webDriver = config.run.webDriver || {};

  if (typeof config.run.webDriver.host !== 'string') {
    config.run.webDriver.host = '';
  }

  if (typeof config.run.webDriver.port !== 'number') {
    config.run.webDriver.port = 4444;
  }

  // Get the list of test units
  var units = fs.readdirSync(__dirname + '/tests/units/');
  // The list of browsers
  var browsers = (function () {
    var list = {
      'IE': 'IE',
      'chrome': 'ChromeCustom',
      'firefox': 'FirefoxCustom',
      'opera': 'Opera',
      'safari': 'Safari',
      'webdriver': 'IEWebDriver'
    };
    var array = [];
    for (var b = 0; b < config.run.browsers.length; b++) {
      var brows = config.run.browsers[b];
      if (list.hasOwnProperty(brows)) {
        array.push(list[brows]);
      }
    }
    return array;
  })();

  // Dependencies
  var dependencies = [{
      pattern: __dirname + '/../node_modules/adapterjs/publish/adapter.screenshare.js',
      included: true
    }, {
      pattern: __dirname + '/../node_modules/socket.io-client/socket.io.js',
      included: true
    }, {
      pattern: __dirname + '/../source/debugger.js',
      included: true
    }, {
      pattern: __dirname + '/../source/event.js',
      included: true
    }, {
      pattern: __dirname + '/../source/util.js',
      included: true
    }, {
      pattern: __dirname + '/tests/util.js',
      included: true
  }];

  // grunt-clean task
  gruntConfig.clean = gruntConfig.clean || {};
  gruntConfig.clean.test = ['tests/karma/gen/*', 'tests/reporters/*', 'tests/coverage/*'];

  // grunt-replace task
  gruntConfig.replace = gruntConfig.replace || {};

  // grunt-concat task
  gruntConfig.concat = gruntConfig.concat || {};

  // add-on grunt-replace-tasks
  // loop through every unit test
  for (var i = 0; i < units.length; i++) {
    // Test unit
    var tUnit = units[i].split('.js')[0];

    var tFiles = dependencies.concat([{
        pattern: __dirname + '/../source/' + tUnit + '.js',
        included: true
      }, {
        pattern: __dirname + '/tests/units/' + tUnit + '.js',
        included: true
    }]);

    var tPreprocessor = {};
    tPreprocessor[__dirname + '/tests/units/' + tUnit + '.js'] = ['browserify'];

    // Replace the information and output to a temp folder for this test key
    gruntConfig.replace[tUnit] = {
      options: {
        variables: {
          port: parseInt('50' + i + /*j*/ '0', 10),
          browser: browsers,
          files: tFiles,
          preprocessor: tPreprocessor,
          htmlReporter: {
            outputFile: __dirname + '/reporters/' + tUnit + '.html',
            pageTitle: 'Unit tests for ' + tUnit, //+ ' in ' + tBrowser.id,
            subPageTitle: 'Tested browsers: ' + browsers.join(', ')
          },
          coverage: __dirname + '/coverage/',
          driverhost: config.run.webDriver.host,
          driverport: config.run.webDriver.port
        },
        prefix: '@@'
      },
      files: [{
        expand: true,
        flatten: true,
        src: ['tests/karma/template.conf.js'],
        dest: 'tests/karma/gen/' + tUnit + '-temp'
      }]
    };
    gruntTask.push('replace:' + tUnit);

    // "Concat" to output to the actual generated dir
    gruntConfig.concat[tUnit] = {
      files: {}
    };
    gruntConfig.concat[tUnit].files['tests/karma/gen/' + tUnit + '.conf.js'] =
      ['tests/karma/gen/' + tUnit + '-temp/template.conf.js'];
    gruntTask.push('concat:' + tUnit);

    // Clean away and destroy the temp folder
    gruntConfig.clean[tUnit] = ['tests/karma/gen/' + tUnit + '-temp/'];
    gruntTask.push('clean:' + tUnit);
  }

  // add-on grunt-shell-tasks
  gruntConfig.shell = {
    clicker: {
      command: 'osascript tests/bash/mac-clicker.scpt',
      options: {
        execOptions: {
          setsid: true
        },
        async: true
      }
    },
    runner: {
      command: 'sh tests/bash/run.sh',
      options: {
        stdin: false,
        execOptions: {
          setsid: true
        },
        async: false
      }
    }
  };

  gruntTask.push('shell:clicker');
  gruntTask.push('shell:runner');

  return gruntTask;
};
