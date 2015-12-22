/**
 * Handles logging for all classes.
 * @attribute Logger
 * @type JSON
 * @private
 * @for Skylink
 * @since 0.6.7
 */
// Logger module
var Logger = {
  // Stores the flags
  _flags: {
    // The current log level of Skylink.
    level: 0,

    // If trace is even needed
    trace: false,

    // The flag that indicates if Skylink should store the debug logs.
    store: true
  },

  // The header name that appears before every log
  _header: 'SkylinkJS',

  // Stores all the logs
  _storage: {
    debug: [],
    log: [],
    info: [],
    warn: [],
    error: []
  },

  // Stores the console methods
  _loggers: {},

  // Binds
  _appendLoggers: function () {
    var self = this;
    var templates = {
      debug: { template: '[DEBUG] :: ', fn: function () {} },
      log: { template: '[LOG  ] :: ', fn: function () {} },
      info: { template: '[INFO ] :: ', fn: function () {} },
      warn: { template: '[WARN ] :: ', fn: function () {} },
      error: { template: '[ERROR] :: ', fn: function () {} }
    };

    // Configure available consoles
    var consoleCopy = {};
    // Configure console.log copy
    consoleCopy.log = typeof console.log === 'function' ? window.console.log : function () {};
    // Point to console.debug function
    consoleCopy.debug = typeof console.debug === 'function' ? window.console.debug : consoleCopy.log;
    // Point to console.info function
    consoleCopy.info = typeof console.info === 'function' ? window.console.info : consoleCopy.log;
    // Point to console.warn function
    consoleCopy.warn = typeof console.warn === 'function' ? window.console.warn : consoleCopy.log;
    // Point to console.error function
    consoleCopy.error = typeof console.error === 'function' ? window.console.error : consoleCopy.log;
    // Point to console.trace function
    consoleCopy.trace = typeof console.trace === 'function' ? window.console.trace : consoleCopy.log;

    // Internal binding of console method
    var bind = function (m, displayConsole) {
      return function () {
        // Get the arguments
        var args = Array.prototype.slice.call(arguments);
        // Store the data
        if (self._flags.store) {
          self._storage[m].push([(new Date()).toISOString(), args]);
        }
        if (displayConsole) {
          var mn = m;
          var mt = '';
          // Preset to trace for that method
          if (self._flags.trace) {
            mn = 'trace';
            mt = '[' + m.toUpperCase() + '] :: ';
          }
          /*return Function.prototype.apply(
            consoleCopy[mn].bind(window.console, mt + self._header), this, arguments);*/
          return consoleCopy[mn].bind(window.console, mt + self._header);
        }
        return function () {};
      };
    };

    // Configure current loggers
    this._loggers = {};
    // Configure console.log, console.debug, console.info, console.warn and console.error defaults
    this._loggers.debug = bind('debug', false);
    this._loggers.log = bind('log', false);
    this._loggers.info = bind('info', false);
    this._loggers.warn = bind('warn', false);
    this._loggers.error = bind('error', false);



    // Configure the correct loggers based off the method
    switch (this._flags.level) {
      case 5:
        this._loggers.debug = bind('debug', true);
        /* falls through */
      case 4:
        this._loggers.log = bind('log', true);
        /* falls through */
      case 3:
        this._loggers.info = bind('info', true);
        /* falls through */
      case 2:
        this._loggers.warn = bind('warn', true);
        /* falls through */
      case 1:
        this._loggers.error = bind('error', true);
    }
  },

  // Appends the window console or else ignores based off level
  configure: function (options) {
    // Configure the flags and settings
    // [options === number]
    if (typeof options === 'number' && options > -1 && options < 6) {
      this._flags.level = options;
    // [options === {}]
    } else if (typeof options === 'object' && options !== null) {
      // Configure the level
      if (typeof options.level === 'number' && options.level > -1 && options.level < 6) {
        this._flags.level = options.level;
      }
      // Configure the trace
      if (typeof options.trace === 'boolean') {
        this._flags.trace = options.trace;
      }
      // Configure the store
      if (typeof options.store === 'boolean') {
        this._flags.store = options.store;
      }
    }

    // Bind the console methods
    this._appendLoggers();
  },

  // Mixin method for components to subscribe loggers to
  mixin: function (d, obj) {
    var self = this;
    var fn = function (type) {
      return function () {
        // Get logger parameters
        var args = Array.prototype.slice.call(arguments);
        // Extra params
        var data = d();
        for (var i = data.length; i > 0; i--) {
          args.splice(0, 0, data[i - 1]);
        }
        self._loggers[type].apply(this,args).apply(this,args);
        /*return function (cb) {
          return cb(self._loggers[type].apply(this,args), args);
        };*/
      };
    };
    obj._log = {
      debug: fn('debug'),
      log: fn('log'),
      info: fn('info'),
      warn: fn('warn'),
      error: fn('error')
    };
  }
};

Logger.configure();