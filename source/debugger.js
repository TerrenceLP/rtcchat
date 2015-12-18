/**
 * Handles logging for all classes.
 * @attribute Logger
 * @type JSON
 * @private
 * @for Skylink
 * @since 0.6.7
 */
// Global variable within skylink
var log = {};
// Logger module
var Logger = {

  // Stores the flags
  _flags: {
    // The current log level of Skylink.
    level: 5,

    // If trace is even needed
    trace: false,

    // The flag that indicates if Skylink should store the debug logs.
    store: false
  },

  // Stores all the logs
  _storage: [],

  // Stores the templates
  _templates: {},

  // Appends the window console or else ignores based off level
  append: function (level, trace, store) {
    var key = 'SkylinkJS - ';
    var logBinder = {};

    if (typeof level === 'number' && level > -1 && level < 6) {
      this._flags.level = level;
    }

    if (typeof trace === 'boolean') {
      this._flags.trace = trace;
    }

    if (typeof store === 'boolean') {
      this._flags.store = store;
    }

    var logTemplate = '';

    if (this._flags.trace) {
      this._templates = {
        debug: '[DEBUG]  ' + key,
        log: '[LOG  ]  ' + key,
        info: '[INFO ]  ' + key,
        warn: '[WARN ]  ' + key,
        error: '[ERROR]  ' + key
      };

      logBinder = {
        // console.debug
        debug: window.console.newTrace.bind(window.console, this._templates.debug + logTemplate),
        // console.log
        log: window.console.newTrace.bind(window.console, this._templates.log + logTemplate),
        // console.info
        info: window.console.newTrace.bind(window.console, this._templates.info + logTemplate),
        // console.warn
        warn: window.console.newTrace.bind(window.console, this._templates.warn + logTemplate),
        // console.error
        error: window.console.newTrace.bind(window.console, this._templates.error + logTemplate),
      };
    } else {
      this._templates = {
        debug: key,
        log: key,
        info: key,
        warn: key,
        error: key
      };

      if (typeof window.console.debug !== 'function') {
        this._templates.debug = '[DEBUG]  ' + key;
      }

      if (window.webrtcDetectedBrowser === 'safari') {
        this._templates.info = '[INFO ]  ' + key;
      }

      logBinder = {
        // console.debug
        debug: window.console.newDebug.bind(window.console, this._templates.debug + logTemplate),
        // console.log
        log: window.console.log.bind(window.console, this._templates.log + logTemplate),
        // console.info
        info: window.console.info.bind(window.console, this._templates.info + logTemplate),
        // console.warn
        warn: window.console.warn.bind(window.console, this._templates.warn + logTemplate),
        // console.error
        error: window.console.error.bind(window.console, this._templates.error + logTemplate)
      };
    }

    // Store the data
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    if (this._flags.store) {
      this.storage.push(type, args, (new Date()));
    }

    switch (this._flags.level) {
      case 5:
        log.debug = logBinder.debug;
        log.log = logBinder.log;
        log.info = logBinder.info;
        log.warn = logBinder.warn;
        log.error = logBinder.error;
        break;
      case 4:
        log.debug = function () {};
        log.log = logBinder.log;
        log.info = logBinder.info;
        log.warn = logBinder.warn;
        log.error = logBinder.error;
        break;
      case 3:
        log.debug = function () {};
        log.log = function () {};
        log.info = logBinder.info;
        log.warn = logBinder.warn;
        log.error = logBinder.error;
        break;
      case 2:
        log.debug = function () {};
        log.log = function () {};
        log.info = function () {};
        log.warn = logBinder.warn;
        log.error = logBinder.error;
        break;
      case 1:
        log.debug = function () {};
        log.log = function () {};
        log.info = function () {};
        log.warn = function () {};
        log.error = logBinder.error;
        break;
      default:
        log.debug = function () {};
        log.log = function () {};
        log.info = function () {};
        log.warn = function () {};
        log.error = function () {};
    }
  }
};

// Initialise the fallbacks for debug / trace
(function () {
  // Parse if debug is not defined
  if (typeof window.console.debug !== 'function') {
    window.console.newDebug = window.console.log;

  } else {
    window.console.newDebug = window.console.debug;
  }

  // Parse if trace is not defined
  if (typeof window.console.trace !== 'function') {
    window.console.newTrace = window.console.log;

  } else {
    window.console.newTrace = window.console.trace;
  }
  // Append object
  Logger.append();
})();