/*! skylinkjs - v0.5.7 - 2015-02-13 */

var globals = {
  apiKey: null,

  region: 'us2',

  defaultRoom: null,

  roomServer: '//api.temasys.com.sg',

  enforceSSL: false,

  socketTimeout: 0,

  TURNServer: true,

  STUNServer: true,

  ICETrickle: true,

  TURNTransport: 'any',

  dataChannel: true,

  audioFallback: false,

  credentials: null
};

var fn = {
  isEmpty: function (data) {
    var isUnDefined = typeof data === 'undefined' || data === null;

    if (typeof data === 'object' && !isUnDefined) {
      if (data.constructor === Array) {
        return data.length === 0;

      } else {
        return Object.keys(data).length === 0;
      }
    }
    return isUnDefined;
  },

  isSafe: function (unsafeFn) {
    try {
      return unsafeFn();
    } catch (error){
      log.warn('Function', error);
      return false;
    }
  },

  runSync: function () {
    var args = Array.prototype.slice.call(arguments);
    var i;

    var run = function (fn) {
      setTimeout(fn, 1);

      args.splice(0, 1);

      if (args.length === 0) {
        return;
      }
      run(args[0]);
    };

    run(args[0]);
  },

  constant: function (main, property, value) {
    var obj = {};
    obj[property] = {
      value: value,
      enumerable: true
    };
    Object.defineProperties(main, obj);
  },

  generateUID: function() {
    return (new Date()).getTime().toString();
  },

  applyHandler: function (callee, params, args) {
    var item = callee;
    var i;

    for (i = 0; i < params.length; i += 1) {
      if (!fn.isEmpty(item[params[i]])) {
        item = item[params[i]];
      }
    }

    if (typeof item === 'function') {
      item.apply(this, args);
    }
  }

};

var log = {};

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

/**
 * The log key
 * @attribute LogKey
 * @type String
 * @readOnly
 * @for Debugger
 * @since 0.5.4
 */
var LogKey = 'Skylink - ';

var Debugger = {
  /**
   * The current log level of Skylink.
   * @property level
   * @type Integer
   * @for Debugger
   * @since 0.5.4
   */
  level: 2,

  trace: false,

  /**
   * The flag that indicates if Skylink should store the debug logs.
   * @property store
   * @type Boolean
   * @for Debugger
   * @since 0.5.4
   */
  store: false,

  logs: [],

  console: {
    log: window.console.log.bind(window.console, LogKey + '%s> %s'),

    error: window.console.error.bind(window.console, LogKey + '%s> %s'),

    info: window.console.info.bind(window.console,
      (window.webrtcDetectedBrowser === 'safari' ? 'INFO: ' : '') + LogKey + '%s> %s'),

    warn: window.console.warn.bind(window.console, LogKey + '%s> %s'),

    debug: window.console.newDebug.bind(window.console,
      (typeof window.console.debug !== 'function' ? 'DEBUG: ' : '') + LogKey + '%s> %s')
  },

  traceTemplate: {
    log: '==LOG== ' + LogKey + '%s',
    error: '==ERROR== ' + LogKey + '%s',
    info: '==INFO== ' + LogKey + '%s',
    warn: '==WARN== ' + LogKey + '%s',
    debug: '==DEBUG== ' + LogKey + '%s'
  },

  applyConsole: function (type) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    if (this.store) {
      logs.push(type, args, (new Date()));
    }

    if (this.trace) {
      return window.console.newTrace.bind(window.console, this.traceTemplate[type]);
    }
    return this.console[type];
  },

  setLevel: function (inputLevel) {
    // Debug level
    if (inputLevel > 3) {
      log.debug = this.applyConsole('debug');

    } else {
      log.debug = function () { };
    }

    // Log level
    if (inputLevel > 2) {
      log.log = this.applyConsole('log');

    } else {
      log.log = function () { };
    }

    // Info level
    if (inputLevel > 1) {
      log.info = this.applyConsole('info');

    } else {
      log.info = function () { };
    }

    // Warn level
    if (inputLevel > 0) {
      log.warn = this.applyConsole('warn');

    } else {
      log.warn = function () { };
    }

    // Error level
    if (inputLevel > -1) {
      log.error = this.applyConsole('error');

    } else {
      log.error = function () { };
    }

    this.level = inputLevel;
  },

  configure: function (options) {
    options = options || {};

    // Set if should store logs
    Debugger.store = !!options.store;

    // Set if should trace
    Debugger.trace = !!options.trace;

    // Set log level
    Debugger.setLevel( typeof options.level === 'number' ? options.level : 2 );
  }
};

Debugger.setLevel(4);

var Skylink = {};

var rooms = [];

var Config = function (options) {
  globals.apiKey = options.apiKey;
  
};

Skylink.init = function (apiKey, name, listener) {
  rooms[name] = new Room(name, listener);
  
  return rooms[name];
};
Skylink.DATA_CHANNEL_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error'
};

Skylink.DATA_TRANSFER_DATA_TYPE = {
  BINARY_STRING: 'binaryString',
  ARRAY_BUFFER: 'arrayBuffer',
  BLOB: 'blob'
};

Skylink.DATA_TRANSFER_TYPE = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download'
};

Skylink.DATA_TRANSFER_STATE = {
  UPLOAD_REQUEST: 'request',
  UPLOAD_STARTED: 'uploadStarted',
  DOWNLOAD_STARTED: 'downloadStarted',
  REJECTED: 'rejected',
  CANCEL: 'cancel',
  ERROR: 'error',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  UPLOAD_COMPLETED: 'uploadCompleted',
  DOWNLOAD_COMPLETED: 'downloadCompleted'
};

Skylink.CANDIDATE_GENERATION_STATE = {
  NEW: 'new',
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

Skylink.ICE_CONNECTION_STATE = {
  STARTING: 'starting',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected'
};

Skylink.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none'
};

Skylink.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  HAVE_LOCAL_PRANSWER: 'have-local-pranswer',
  HAVE_REMOTE_PRANSWER: 'have-remote-pranswer',
  CLOSED: 'closed'
};

Skylink.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

Skylink.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

Skylink.SYSTEM_ACTION_REASON = {
  FAST_MESSAGE: 'fastmsg',
  ROOM_LOCKED: 'locked',
  ROOM_FULL: 'roomfull',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  SERVER_ERROR: 'serverError',
  VERIFICATION: 'verification',
  EXPIRED: 'expired',
  ROOM_CLOSED: 'roomclose',
  ROOM_CLOSING: 'toclose',
  OVER_SEAT_LIMIT: 'seatquota'
};

Skylink.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

Skylink.READY_STATE_CHANGE_ERROR = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NOT_ENOUGH_CREDIT: 4007,
  API_NOT_ENOUGH_PREPAID_CREDIT: 4008,
  API_FAILED_FINDING_PREPAID_CREDIT: 4009,
  API_NO_MEETING_RECORD_FOUND: 4010,
  ROOM_LOCKED: 5001,
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  INVALID_XMLHTTPREQUEST_STATUS: 5,
  SCRIPT_ERROR: 6
};

Skylink.REGIONAL_SERVER = {
  APAC1: 'sg',
  US1: 'us2'
};

Skylink.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0
};

Skylink.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

Skylink.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};

Skylink.VIDEO_RESOLUTION = {
  QQVGA: { width: 160, height: 120, aspectRatio: '4:3' },
  HQVGA: { width: 240, height: 160, aspectRatio: '3:2' },
  QVGA: { width: 320, height: 180, aspectRatio: '4:3' },
  WQVGA: { width: 384, height: 240, aspectRatio: '16:10' },
  HVGA: { width: 480, height: 320, aspectRatio: '3:2' },
  VGA: { width: 640, height: 360, aspectRatio: '4:3' },
  WVGA: { width: 768, height: 480, aspectRatio: '16:10' },
  FWVGA: { width: 854, height: 480, aspectRatio: '16:9' },
  SVGA: { width: 800, height: 600, aspectRatio: '4:3' },
  DVGA: { width: 960, height: 640, aspectRatio: '3:2' },
  WSVGA: { width: 1024, height: 576, aspectRatio: '16:9' },
  HD: { width: 1280, height: 720, aspectRatio: '16:9' },
  HDPLUS: { width: 1600, height: 900, aspectRatio: '16:9' },
  FHD: { width: 1920, height: 1080, aspectRatio: '16:9' },
  QHD: { width: 2560, height: 1440, aspectRatio: '16:9' },
  WQXGAPLUS: { width: 3200, height: 1800, aspectRatio: '16:9' },
  UHD: { width: 3840, height: 2160, aspectRatio: '16:9' },
  UHDPLUS: { width: 5120, height: 2880, aspectRatio: '16:9' },
  FUHD: { width: 7680, height: 4320, aspectRatio: '16:9' },
  QUHD: { width: 15360, height: 8640, aspectRatio: '16:9' }
};
function DataChannel(channel, listener) {
  'use strict';

  // Prevent undefined listener error
  listener = listener || function (event, data) {};

  // Reference of instance
  var com = this;

  /**
   * The datachannel label.
   * @attribute id
   * @type String
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.id = channel.label || fn.generateUID();

  /**
   * The type of datachannel.
   * @attribute type
   * @type String
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.type = 'message';

  /**
   * The datachannel source origin.
   * There are two types of sources:
   * - <code>"local"</code> indicates that datachannel came from self user.
   * - <code>"remote</code> indicates that datachannel came from other users.
   * @attribute sourceType
   * @type String
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.sourceType = 'local';

  /**
   * The RTCDataChannel object.
   * @attribute RTCDataChannel
   * @type Object
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.RTCDataChannel = null;


  /**
   * Function to subscribe to when datachannel has opened.
   * @method onconnect
   * @eventhandler true
   * @for DataChannel
   * @since 0.6.0
   */
  com.onconnect = function () {};

  /**
   * Function to subscribe to when datachannel has closed.
   * @method ondisconnect
   * @eventhandler true
   * @for DataChannel
   * @since 0.6.0
   */
  com.ondisconnect = function () {};

  /**
   * Function to subscribe to when datachannel has an error.
   * @method onerror
   * @eventhandler true
   * @for DataChannel
   * @since 0.6.0
   */
  com.onerror = function () {};

  /**
   * The handler handles received events.
   * @method routeEvent
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.routeEvent = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.peerId = com.id;

    fn.applyHandler(DataChannelReceivedHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('DataChannel: Received event = ', event, data);
  };

  /**
   * The handler handles response events.
   * @method respond
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.id = com.name;

    fn.applyHandler(DataChannelResponseHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('DataChannel: Responding with event = ', event, data);
  };

  /**
   * Binds events to RTCDataChannel object.
   * @method bind
   * @param {Object} bindChannel The RTCDataChannel object to bind events to.
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.bind = function (bindChannel) {
    // Prevent re-trigger
    var onOpenFn = function () {
      com.handler('datachannel:connect', {});
    };

    if (bindChannel.readyState !== 'open') {
      bindChannel.onopen = onOpenFn;

    } else {
      onOpenFn();
    }

    bindChannel.onerror = function (error) {
      com.handler('datachannel:error', {
        error: error
      });
    };

    // NOTE: Older firefox might close the DataChannel earlier
    bindChannel.onclose = function () {
      com.handler('datachannel:disconnect', {});
    };

    bindChannel.onmessage = function (event) {
      com.handler('datachannel:message', {
        data: event.data
      });
    };

    com.RTCDataChannel = bindChannel;

    fn.runSync(function () {
      com.handler('datachannel:start', {});
    });
  };

  /**
   * Sends data over the datachannel.
   * @method send
   * @param {JSON|String} data The data to send.
   * @private
   * @for DataChannel
   * @since 0.6.0
   */
  com.send = function (data) {
    var sendingData = data;

    if (typeof data === 'object') {
      sendingData = JSON.stringify(data);
    }

    fn.isSafe(function () {
      com.RTCDataChannel.send(sendingData);
    });
  };

  if (fn.isEmpty(channel)) {
    throw new Error('Provided parameter channel is invalid.');
  }

  // Bind datachannel object
  com.bind(channel);
}

var DataChannelEventResponseHandler = {
  /**
   * Event fired when the datachannel object is ready to use.
   * @event datachannel:start
   * @for DataChannel
   * @since 0.6.0
   */
  start: function (com, data, listener) {
    if (typeof com.onstart === 'function') {
      com.onstart();
    }
  },
  
  /**
   * Event fired when the datachannel has opened.
   * @event datachannel:connect
   * @for DataChannel
   * @since 0.6.0
   */
  connect: function (com, data, listener) {
    if (typeof com.onconnect === 'function') {
      com.onconnect();
    }
  },
  
  /**
   * Event fired when the datachannel has an exception occurred.
   * @event datachannel:error
   * @param {Object} error The RTCDataChannel error.
   * @for DataChannel
   * @since 0.6.0
   */
  error: function (com, data, listener) {
    if (typeof com.onerror === 'function') {
      com.onerror(error);
    }
  },
  
  /**
   * Event fired when the datachannel receives data.
   * @event datachannel:message
   * @param {JSON|String} data The data received.
   * @for DataChannel
   * @since 0.6.0
   */
  message: function (com, data, listener) {
    
  },

  /**
   * Event fired when the datachannel has closed.
   * @event datachannel:disconnect
   * @for DataChannel
   * @since 0.6.0
   */
  disconnect: function (com, data, listener) {
    if (typeof com.ondisconnect === 'function') {
      com.ondisconnect();
    }
  }
};

/**
 * Handles the datachannel class events.
 * @attribute DataChannelHandler
 * @type JSON
 * @private
 * @for DataChannel
 * @since 0.6.0
 */
var DataChannelHandler = function (com, event, data, listener) {
  var params = event.split(':');

  // Class events
  data.id = com.id;

  fn.applyHandler(DataChannelEventResponseHandler, params, [com, data, listener]);

  listener(event, data);
};
var DataProcess = {
  
  chunkSize: 49152,
  
  mozChunkSize: 16384,
  
  chunk: function (blob) {
    var chunksArray = [],
    startCount = 0,
    endCount = 0;
    
    if (blobByteSize > this.chunkSize) {
      // File Size greater than Chunk size
      while ((blobByteSize - 1) > endCount) {
        endCount = startCount + this.chunkSize;
        chunksArray.push(blob.slice(startCount, endCount));
        startCount += this.chunkSize;
      }
      if ((blobByteSize - (startCount + 1)) > 0) {
        chunksArray.push(blob.slice(startCount, blobByteSize - 1));
      }
    } else {
      // File Size below Chunk size
      chunksArray.push(blob);
    }
    
    return chunksArray;
  },

  unchunk: function (data) {
    var byteString = atob(dataURL.replace(/\s\r\n/g, ''));
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    
    for (var j = 0; j < byteString.length; j++) {
      ia[j] = byteString.charCodeAt(j);
    }
    
    // write the ArrayBuffer to a blob, and you're done
    return new Blob([ab]);
  }
};
function DataTransfer(channel, config, listener) {
  'use strict';

}
var _Event = {
  listeners: {
    on: {},
    once: {}
  },
  
  timestamp: {
    now: Date.now() || function() { return + new Date(); }
  },
  
  on: function (event, listener) {
    this.listeners.on[event] = this.listeners.on[event] || [];
    this.listeners.on[event].push(listener);
  },
  
  once: function (event, listener) {
    this.listeners.once[event] = this.listeners.once[event] || [];
    this.listeners.once[event].push(listener);
  },
  
  off: function (event, listener) {
    if (fn.isEmpty(event)) {
      // Remove all listeners
      this.listeners.on = {};
      this.listeners.once = {};
      return;
    }
    
    if (typeof listener === 'function') {
      // Get all the listeners from event
      // Remove individual listeners
      // If signature is the same as provided callback, remove.
      this.remove( this.listeners.on[event] || {}, listener );
      this.remove( this.listeners.once[event] || {}, listener );

    } else {
      // Remove listeners attached to event
      this.listeners.on[event] = [];
      this.listeners.once[event] = [];
    }
  },
  
  respond: function (event) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    var on = this.listeners.on[event] || {};
    var once = this.listeners.once[event] || {};
    
    this.trigger(on, args);
    this.trigger(once, args);
    
    this.listeners.once[event] = [];
  },

  trigger: function (listeners, args) {
    var i;

    for (i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i].apply(this, args);
        
      } catch(error) {
        throw error;
      }
    }
  },
  
  remove: function(listeners, listener) {
    var i = 0;
    
    for (i = 0; i < listeners.length; i += 1) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
  },
  
  throttle: function(defer, wait){
    return function () {
      if (fn.isEmpty(this.timeStamp.func)){
        //First time run, need to force timestamp to skip condition
        this.timeStamp.func = this.timestamp.now - wait;
      }
      
      var now = Date.now();
      
      if (now - this.timestamp.func < wait) {
        return;
      }
      
      func.apply(this, arguments);
      this.timeStamp.func = now;
    };
  }
};

Skylink.Event = _Event;
var EventList = [
  /**
   * Event fired when the socket connection to the signaling
   * server is open.
   * @event channelOpen
   * @for Skylink
   * @since 0.1.0
   */
  'channelOpen',

  /**
   * Event fired when the socket connection to the signaling
   * server has closed.
   * @event channelClose
   * @for Skylink
   * @since 0.1.0
   */
  'channelClose',

  /**
   * Event fired when the socket connection received a message
   * from the signaling server.
   * @event channelMessage
   * @param {JSON} message
   * @for Skylink
   * @since 0.1.0
   */
  'channelMessage',

  /**
   * Event fired when the socket connection has occurred an error.
   * @event channelError
   * @param {Object|String} error Error message or object thrown.
   * @for Skylink
   * @since 0.1.0
   */
  'channelError',

  /**
   * Event fired when the socket re-tries to connection with fallback ports.
   * @event channelRetry
   * @param {String} fallbackType The type of fallback [Rel: Skylink.SOCKET_FALLBACK]
   * @param {Integer} currentAttempt The current attempt of the fallback re-try attempt.
   * @for Skylink
   * @since 0.5.6
   */
  'channelRetry',

  /**
   * Event fired when the socket connection failed connecting.
   * - The difference between this and <b>channelError</b> is that
   *   channelError triggers during the connection. This throws
   *   when connection failed to be established.
   * @event socketError
   * @param {String} errorCode The error code.
   *   [Rel: Skylink.SOCKET_ERROR]
   * @param {Integer|String|Object} error The reconnection attempt or error object.
   * @param {String} fallbackType The type of fallback [Rel: Skylink.SOCKET_FALLBACK]
   * @for Skylink
   * @since 0.5.5
   */
  'socketError',

  /**
   * Event fired whether the room is ready for use.
   * @event readyStateChange
   * @param {String} readyState [Rel: Skylink.READY_STATE_CHANGE]
   * @param {JSON} error Error object thrown.
   * @param {Integer} error.status Http status when retrieving information.
   *   May be empty for other errors.
   * @param {String} error.content Error message.
   * @param {Integer} error.errorCode Error code.
   *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
   * @for Skylink
   * @since 0.4.0
   */
  'readyStateChange',

  /**
   * Event fired when a peer's handshake progress has changed.
   * @event handshakeProgress
   * @param {String} step The handshake progress step.
   *   [Rel: Skylink.HANDSHAKE_PROGRESS]
   * @param {String} peerId PeerId of the peer's handshake progress.
   * @param {Object|String} error Error message or object thrown.
   * @for Skylink
   * @since 0.3.0
   */
  'handshakeProgress',

  /**
   * Event fired when an ICE gathering state has changed.
   * @event candidateGenerationState
   * @param {String} state The ice candidate generation state.
   *   [Rel: Skylink.CANDIDATE_GENERATION_STATE]
   * @param {String} peerId PeerId of the peer that had an ice candidate
   *    generation state change.
   * @for Skylink
   * @since 0.1.0
   */
  'candidateGenerationState',

  /**
   * Event fired when a peer Connection state has changed.
   * @event peerConnectionState
   * @param {String} state The peer connection state.
   *   [Rel: Skylink.PEER_CONNECTION_STATE]
   * @param {String} peerId PeerId of the peer that had a peer connection state
   *    change.
   * @for Skylink
   * @since 0.1.0
   */
  'peerConnectionState',

  /**
   * Event fired when a peer connection health has changed.
   * @event peerConnectionHealth
   * @param {String} health The peer connection health.
   *   [Rel: Skylink.PEER_CONNECTION_HEALTH]
   * @param {String} peerId PeerId of the peer that had a peer connection health
   *    change.
   * @since 0.5.5
   */
  'peerConnectionHealth',

  /**
   * Event fired when an ICE connection state has changed.
   * @iceConnectionState
   * @param {String} state The ice connection state.
   *   [Rel: Skylink.ICE_CONNECTION_STATE]
   * @param {String} peerId PeerId of the peer that had an ice connection state change.
   * @for Skylink
   * @since 0.1.0
   */
  'iceConnectionState',

  /**
   * Event fired when webcam or microphone media access fails.
   * @event mediaAccessError
   * @param {Object|String} error Error object thrown.
   * @for Skylink
   * @since 0.1.0
   */
  'mediaAccessError',

  /**
   * Event fired when webcam or microphone media acces passes.
   * @event mediaAccessSuccess
   * @param {Object} stream MediaStream object.
   * @for Skylink
   * @since 0.1.0
   */
  'mediaAccessSuccess',

  /**
   * Event fired when it's required to have audio or video access.
   * @event mediaAccessRequired
   * @for Skylink
   * @since 0.5.5
   */
  'mediaAccessRequired',

  /**
   * Event fired when media access to MediaStream has stopped.
   * @event mediaAccessStopped
   * @for Skylink
   * @since 0.5.6
   */
  'mediaAccessStopped',

  /**
   * Event fired when a peer joins the room.
   * @event peerJoined
   * @param {String} peerId PeerId of the peer that joined the room.
   * @param {JSON} peerInfo Peer's information.
   * @param {JSON} peerInfo.settings Peer's stream settings.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] Peer's audio stream
   *   settings.
   * @param {Boolean} [peerInfo.settings.audio.stereo=false] If peer has stereo
   *   enabled or not.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] Peer's video stream
   *   settings.
   * @param {JSON} [peerInfo.settings.video.resolution]
   *   Peer's video stream resolution [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Integer} [peerInfo.settings.video.resolution.width]
   *   Peer's video stream resolution width.
   * @param {Integer} [peerInfo.settings.video.resolution.height]
   *   Peer's video stream resolution height.
   * @param {Integer} [peerInfo.settings.video.frameRate]
   *   Peer's video stream resolution minimum frame rate.
   * @param {JSON} peerInfo.mediaStatus Peer stream status.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] If peer's audio
   *   stream is muted.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] If peer's video
   *   stream is muted.
   * @param {JSON|String} peerInfo.userData Peer's custom user data.
   * @param {JSON} peerInfo.agent Peer's browser agent.
   * @param {String} peerInfo.agent.name Peer's browser agent name.
   * @param {Integer} peerInfo.agent.version Peer's browser agent version.
   * @param {Boolean} isSelf Is the peer self.
   * @for Skylink
   * @since 0.5.2
   */
  'peerJoined',

  /**
   * Event fired when a peer's connection is restarted.
   * @event peerRestart
   * @param {String} peerId PeerId of the peer that is being restarted.
   * @param {JSON} peerInfo Peer's information.
   * @param {JSON} peerInfo.settings Peer's stream settings.
   * @param {Boolean|JSON} peerInfo.settings.audio Peer's audio stream
   *   settings.
   * @param {Boolean} peerInfo.settings.audio.stereo If peer has stereo
   *   enabled or not.
   * @param {Boolean|JSON} peerInfo.settings.video Peer's video stream
   *   settings.
   * @param {JSON} peerInfo.settings.video.resolution
   *   Peer's video stream resolution [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Integer} peerInfo.settings.video.resolution.width
   *   Peer's video stream resolution width.
   * @param {Integer} peerInfo.settings.video.resolution.height
   *   Peer's video stream resolution height.
   * @param {Integer} peerInfo.settings.video.frameRate
   *   Peer's video stream resolution minimum frame rate.
   * @param {JSON} peerInfo.mediaStatus Peer stream status.
   * @param {Boolean} peerInfo.mediaStatus.audioMuted If peer's audio
   *   stream is muted.
   * @param {Boolean} peerInfo.mediaStatus.videoMuted If peer's video
   *   stream is muted.
   * @param {JSON|String} peerInfo.userData Peer's custom user data.
   * @param {JSON} peerInfo.agent Peer's browser agent.
   * @param {String} peerInfo.agent.name Peer's browser agent name.
   * @param {Integer} peerInfo.agent.version Peer's browser agent version.
   * @param {Boolean} isSelfInitiateRestart Is it us who initiated the restart.
   * @since 0.5.5
   */
  'peerRestart',

  /**
   * Event fired when a peer information is updated.
   * @event peerUpdated
   * @param {String} peerId PeerId of the peer that had information updaed.
   * @param {JSON} peerInfo Peer's information.
   * @param {JSON} peerInfo.settings Peer's stream settings.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] Peer's audio stream
   *   settings.
   * @param {Boolean} [peerInfo.settings.audio.stereo=false] If peer has stereo
   *   enabled or not.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] Peer's video stream
   *   settings.
   * @param {JSON} [peerInfo.settings.video.resolution]
   *   Peer's video stream resolution [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Integer} [peerInfo.settings.video.resolution.width]
   *   Peer's video stream resolution width.
   * @param {Integer} [peerInfo.settings.video.resolution.height]
   *   Peer's video stream resolution height.
   * @param {Integer} [peerInfo.settings.video.frameRate]
   *   Peer's video stream resolution minimum frame rate.
   * @param {JSON} peerInfo.mediaStatus Peer stream status.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] If peer's audio
   *   stream is muted.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] If peer's video
   *   stream is muted.
   * @param {JSON|String} peerInfo.userData Peer's custom user data.
   * @param {JSON} peerInfo.agent Peer's browser agent.
   * @param {String} peerInfo.agent.name Peer's browser agent name.
   * @param {Integer} peerInfo.agent.version Peer's browser agent version.
   * @param {Boolean} isSelf Is the peer self.
   * @for Skylink
   * @since 0.5.2
   */
  'peerUpdated',

  /**
   * Event fired when a peer leaves the room
   * @event peerLeft
   * @param {String} peerId PeerId of the peer that left.
   * @param {JSON} peerInfo Peer's information.
   * @param {JSON} peerInfo.settings Peer's stream settings.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] Peer's audio stream
   *   settings.
   * @param {Boolean} [peerInfo.settings.audio.stereo=false] If peer has stereo
   *   enabled or not.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] Peer's video stream
   *   settings.
   * @param {JSON} [peerInfo.settings.video.resolution]
   *   Peer's video stream resolution [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Integer} [peerInfo.settings.video.resolution.width]
   *   Peer's video stream resolution width.
   * @param {Integer} [peerInfo.settings.video.resolution.height]
   *   Peer's video stream resolution height.
   * @param {Integer} [peerInfo.settings.video.frameRate]
   *   Peer's video stream resolution minimum frame rate.
   * @param {JSON} peerInfo.mediaStatus Peer stream status.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] If peer's audio
   *   stream is muted.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] If peer's video
   *   stream is muted.
   * @param {JSON|String} peerInfo.userData Peer's custom user data.
   * @param {JSON} peerInfo.agent Peer's browser agent.
   * @param {String} peerInfo.agent.name Peer's browser agent name.
   * @param {Integer} peerInfo.agent.version Peer's browser agent version.
   * @param {Boolean} isSelf Is the peer self.
   * @for Skylink
   * @since 0.5.2
   */
  'peerLeft',

  /**
   * Event fired when a peer joins the room
   * @event presenceChanged
   * @param {JSON} users The list of users
   * @private
   * @unsupported true
   * @for Skylink
   * @since 0.1.0
   */
  'presenceChanged',

  /**
   * Event fired when a remote stream has become available.
   * - This occurs after the user joins the room.
   * - This is changed from <b>addPeerStream</b> event.
   * - Note that <b>addPeerStream</b> is removed from the specs.
   * - There has been a documentation error whereby the stream it is
   *   supposed to be (stream, peerId, isSelf), but instead is received
   *   as (peerId, stream, isSelf) in 0.5.0.
   * @event incomingStream
   * @param {String} peerId PeerId of the peer that is sending the stream.
   * @param {Object} stream MediaStream object.
   * @param {Boolean} isSelf Is the peer self.
   * @param {JSON} peerInfo Peer's information.
   * @for Skylink
   * @since 0.5.5
   */
  'incomingStream',

  /**
   * Event fired when a message being broadcasted is received.
   * - This is changed from <b>chatMessageReceived</b>,
   *   <b>privateMessage</b> and <b>publicMessage</b> event.
   * - Note that <b>chatMessageReceived</b>, <b>privateMessage</b>
   *   and <b>publicMessage</b> is removed from the specs.
   * @event incomingMessage
   * @param {JSON} message Message object that is received.
   * @param {JSON|String} message.content Data that is broadcasted.
   * @param {String} message.senderPeerId PeerId of the sender peer.
   * @param {String} message.targetPeerId PeerId that is specifically
   *   targeted to receive the message.
   * @param {Boolean} message.isPrivate Is data received a private message.
   * @param {Boolean} message.isDataChannel Is data received from a
   *   data channel.
   * @param {String} peerId PeerId of the sender peer.
   * @param {JSON} peerInfo Peer's information.
   * @param {JSON} peerInfo.settings Peer's stream settings.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] Peer's audio stream
   *   settings.
   * @param {Boolean} [peerInfo.settings.audio.stereo=false] If peer has stereo
   *   enabled or not.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] Peer's video stream
   *   settings.
   * @param {JSON} [peerInfo.settings.video.resolution]
   *   Peer's video stream resolution [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Integer} [peerInfo.settings.video.resolution.width]
   *   Peer's video stream resolution width.
   * @param {Integer} [peerInfo.settings.video.resolution.height]
   *   Peer's video stream resolution height.
   * @param {Integer} [peerInfo.settings.video.frameRate]
   *   Peer's video stream resolution minimum frame rate.
   * @param {JSON} peerInfo.mediaStatus Peer stream status.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] If peer's audio
   *   stream is muted.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] If peer's video
   *   stream is muted.
   * @param {JSON|String} peerInfo.userData Peer's custom user data.
   * @param {JSON} peerInfo.agent Peer's browser agent.
   * @param {String} peerInfo.agent.name Peer's browser agent name.
   * @param {Integer} peerInfo.agent.version Peer's browser agent version.
   * @param {Boolean} isSelf Is the peer self.
   * @for Skylink
   * @since 0.5.2
   */
  'incomingMessage',

  /**
   * Event fired when connected to a room and the lock status has changed.
   * @event roomLock
   * @param {Boolean} isLocked Is the room locked.
   * @param {String} peerId PeerId of the peer that is locking/unlocking
   *   the room.
   * @param {JSON} peerInfo Peer's information.
   * @param {JSON} peerInfo.settings Peer's stream settings.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] Peer's audio stream
   *   settings.
   * @param {Boolean} [peerInfo.settings.audio.stereo=false] If peer has stereo
   *   enabled or not.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] Peer's video stream
   *   settings.
   * @param {JSON} [peerInfo.settings.video.resolution]
   *   Peer's video stream resolution [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Integer} [peerInfo.settings.video.resolution.width]
   *   Peer's video stream resolution width.
   * @param {Integer} [peerInfo.settings.video.resolution.height]
   *   Peer's video stream resolution height.
   * @param {Integer} [peerInfo.settings.video.frameRate]
   *   Peer's video stream resolution minimum frame rate.
   * @param {JSON} peerInfo.mediaStatus Peer stream status.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] If peer's audio
   *   stream is muted.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] If peer's video
   *   stream is muted.
   * @param {JSON|String} peerInfo.userData Peer's custom user data.
   * @param {JSON} peerInfo.agent Peer's browser agent.
   * @param {String} peerInfo.agent.name Peer's browser agent name.
   * @param {Integer} peerInfo.agent.version Peer's browser agent version.
   * @param {Boolean} isSelf Is the peer self.
   * @for Skylink
   * @since 0.5.2
   */
  'roomLock',

  /**
   * Event fired when a peer's datachannel state has changed.
   * @event dataChannelState
   * @param {String} state The datachannel state.
   *   [Rel: Skylink.DATA_CHANNEL_STATE]
   * @param {String} peerId PeerId of peer that has a datachannel
   *   state change.
   * @for Skylink
   * @since 0.1.0
   */
  'dataChannelState',

  /**
   * Event fired when a data transfer state has changed.
   * - Note that <u>transferInfo.data</u> sends the blob data, and
   *   no longer a blob url.
   * @event dataTransferState
   * @param {String} state The data transfer state.
   *   [Rel: Skylink.DATA_TRANSFER_STATE]
   * @param {String} transferId TransferId of the data.
   * @param {String} peerId PeerId of the peer that has a data
   *   transfer state change.
   * @param {JSON} transferInfo Data transfer information.
   * @param {JSON} transferInfo.percentage The percetange of data being
   *   uploaded / downloaded.
   * @param {JSON} transferInfo.senderPeerId PeerId of the sender.
   * @param {JSON} transferInfo.data The blob data. See the
   *   [createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL)
   *   method on how you can convert the blob to a download link.
   * @param {JSON} transferInfo.name Data name.
   * @param {JSON} transferInfo.size Data size.
   * @param {JSON} error The error object.
   * @param {String} error.message Error message thrown.
   * @param {String} error.transferType Is error from uploading or downloading.
   *   [Rel: Skylink.DATA_TRANSFER_TYPE]
   * @for Skylink
   * @since 0.4.1
   */
  'dataTransferState',

  /**
   * Event fired when the signaling server warns the user.
   * @event systemAction
   * @param {String} action The action that is required for
   *   the user to follow. [Rel: Skylink.SYSTEM_ACTION]
   * @param {String} message The reason for the action.
   * @param {String} reason The reason why the action is given.
   *   [Rel: Skylink.SYSTEM_ACTION_REASON]
   * @for Skylink
   * @since 0.5.1
   */
  'systemAction'
];
var ICE = {
  /**
   * The revised versions of ICE connection states to handle
   *   the differences cross-browsers of different states. This was to
   *   feedback to various users the completion state of the ICE connection.
   * @attribute newIceConnectionStates
   * @type JSON
   * @param {String} starting The ICE connection has just started.
   * @param {String} checking The ICE connection is in checking state.
   * @param {String} connected The ICE connection is established.
   * @param {String} completed The ICE connection is established.
   * @param {String} done The ICE connection is in complete state.
   * @param {String} disconnected The ICE connection has been disconnected.
   * @param {String} failed The ICE connection has failed.
   * @param {String} closed The ICE connection has closed.
   * @private
   * @for ICE
   * @since 0.6.0
   */
  newIceConnectionStates: {
    starting : 'starting',
    checking : 'checking',
    connected : 'connected',
    completed : 'connected',
    done : 'completed',
    disconnected : 'disconnected',
    failed : 'failed',
    closed : 'closed'
  },

  /**
   * Queues ICE candidates that is received before <var>setRemoteDescription</var> is called.
   * It stores in the <var>queueCandidate</var> property array in the peer connection object.
   * @method queueCandidate
   * @param {Object} peer The RTCPeerConnection object.
   * @param {Object} candidate The RTCIceCandidate object.
   * @private
   * @for ICE
   * @since 0.6.0
   */
  queueCandidate: function (peer, candidate) {
    peer.queueCandidate = peer.queueCandidate || [];
    peer.queueCandidate.push(candidate);
  },

  /**
   * Adds all ICE candidates that is received before <var>setRemoteDescription</var> is called.
   * It retrieves candidates from the <var>queueCandidate</var> property array in the peer connection object.
   * @method popCandidate
   * @param {Object} peer The RTCPeerConnection object.
   * @param {Function} defer The defer function that is fired when an ICE candidate is added.
   * @private
   * @for ICE
   * @since 0.6.0
   */
  popCandidate: function (peer, defer) {
    peer.queueCandidate = peer.queueCandidate || [];

    // To pass jshint errors
    var addCandidateFn = function (candidate, type) {
      peer.addIceCandidate(candidate, function () {
        defer('candidate:success', {
          candidate: candidate,
          type: type
        });
      }, function (error) {
        defer('candidate:error', {
          candidate: candidate,
          type: type,
          error: error
        });
      });
    };
    
    var i;
  
    for (i = 0; i < peer.queueCandidate.length; i += 1) {
      var candidate = peer.queueCandidate[i];
      var type = candidate.candidate.split(' ')[7];

      addCandidateFn(candidate, type);
    }
    peer.queueCandidate = [];
  },

  /**
   * Adds the ICE candidate or queues the candidate if it is received before
   *   <var>setRemoteDescription</var> is called.
   * @method addCandidate
   * @param {Object} peer The RTCPeerConnection object.
   * @param {Object} candidate The RTCIceCandidate object.
   * @param {Function} defer The defer function that is fired when an ICE candidate is added.
   * @private
   * @for ICE
   * @since 0.6.0
   */
  addCandidate: function (peer, candidate, defer) {
    if (fn.isEmpty(candidate.candidate)) {
      return;
    }

    if (!fn.isSafe(function () { return !!peer.remoteDescription.sdp; })) {
      this.queueCandidate(peer, candidate, defer);

    } else {
      var type = candidate.candidate.split(' ')[7];

      peer.addIceCandidate(candidate, function (success) {
        defer('candidate:success', {
          candidate: candidate,
          type: type
        });
      }, function (error) {
        defer('candidate:error', {
          candidate: candidate,
          type: type,
          error: error
        });
      });
    }
  },

  /**
   * Parses the received ICE connection state and updates to a new version
   *   to handle the differences received from cross-browsers.
   * State should go from <code>checking > connected > completed</code>.
   * @method parseIceConnectionState
   * @param {Object} peer The RTCPeerConnection object.
   * @private
   * @for ICE
   * @since 0.6.0
   */
  parseIceConnectionState: function (peer) {
    var state = peer.iceConnectionState;

    var checkState = this.newIceConnectionStates[state];

    if (!peer.iceConnectionFiredStates || checkState === 'disconnected' ||
        checkState === 'failed' || checkState === 'closed') {
      peer.iceConnectionFiredStates = [];
    }

    var newState = this.newIceConnectionStates[state];

    if (peer.iceConnectionFiredStates.indexOf(newState) < 0) {
      peer.iceConnectionFiredStates.push(newState);

      if (newState === 'connected') {
        setTimeout(function () {
          peer.iceConnectionFiredStates.push('done');

          peer.newIceConnectionState = 'completed';
          peer.oniceconnectionnewstatechange(peer);
        }, 1000);
      }
      peer.newIceConnectionState = newState;
      peer.oniceconnectionnewstatechange(peer);
    }
  },

  /**
   * Handles the ICE servers received based on the options set by user and parses
   * the differences for iceServer format for cross-browsers.
   * <br>Format of an ICE server:
   * - <code>STUN</code> is structured like <code>{ url: 'stun:hosturl' }</code>.
   * - <code>TURN</code> is structured like
   *    <code>{ url: 'turn:username@hosturl', credential: 'xxx' }</code> and
   *    <code>{ url: 'turn:hosturl', username: 'username', credential: 'xxx' }</code> for
   *    Firefox browsers.
   * @method parseICEServers
   * @param {Array} iceServers The list of ICE servers.
   * @param {JSON} iceServers.(#index) The ICE server.
   * @param {String} iceServers.(#index).credential The ICE server credential (password).
   * @param {String} iceServers.(#index).url The ICE server url. For TURN server,
   *   the format may vary depending on the support of the TURN url format.
   * @returns {Array} The updated ICE servers list.
   * - <code>(#index)</code> <var>: <b>type</b> JSON</var><br>
   *   The ICE server.
   * - <code>(#index).credential</code> <var>: <b>type</b> String</var><br>
   *   The ICE server credential (password). Only used in TURN servers.
   * - <code>(#index).url</code> <var>: <b>type</b> String</var><br>
   *   The ICE server url. For TURN server, the format may vary depending on the support of
   *   the TURN url format.
   * - <code>(#index).username</code> <var>: <b>type</b> String</var><br>
   *   The ICE server username. Only used in TURN servers for Firefox browsers.
   * @private
   * @for ICE
   * @since 0.6.0
   */
  parseICEServers: function (iceServers) {
    var newIceServers = [];
    var i;

    console.info('globals TURN', globals.TURNServer);
    console.info('globals STUN', globals.STUNServer);

    for (i = 0; i < iceServers.length; i += 1) {
      var iceServer = iceServers[i];
      var urlParts = iceServer.url.split(':');
      var serverType = urlParts[0];

      if (serverType === 'turn') {
        // Add TURN if needed
        if (globals.TURNServer === true) {
          // Firefox doesn't support turn:username@hosturl
          if (window.webrtcDetectedBrowser === 'firefox') {
            var subUrlParts = urlParts[1].split('@');
            var username = subUrlParts[0];
            var url = subUrlParts[1];

            urlParts[1] = url;

            iceServer.username = username;
            iceServer.url = urlParts.join(':');
          }
          // Add it to array
          newIceServers.push(iceServer);
        }

      } else {
        // Add STUN if needed
        if (globals.STUNServer === true) {
          // Add it to array
          newIceServers.push(iceServer);
        }
      }
    }

    return newIceServers;
  }
};
function Peer(config, listener) {
  'use strict';

  // Prevent undefined listener error
  listener = listener || function (event, data) {};

  // Reference of instance
  var com = this;

  /**
   * The shared peer connection id.
   * @attribute id
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.id = config.id || fn.generateUID();

  /**
   * The peer connection type.
   * @attribute type
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.type = config.id === 'main' ? 'user' : 'stream';

  /**
   * The RTCSessionDescription type that the peer connection would send.
   * Types are <code>"offer"</code> or <code>"answer"</code>.
   * @attribute SDPType
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.SDPType = config.SDPType;

  /**
   * The RTCPeerConnection ICE servers configuration.
   * @attribute ICEConfig
   * @param {Array} iceServers The list of ICE servers this peer connection
   *    would use.
   * @param {JSON} iceServers.(#index) The ICE server.
   * @param {String} iceServers.(#index).credential The ICE server credential (password).
   *    Only used in TURN servers.
   * @param {String} iceServers.(#index).url The ICE server url. For TURN server,
   *   the format may vary depending on the support of the TURN url format.
   * @param {String} iceServers.(#index).username The ICE server username.
   *    Only used in TURN servers for Firefox browsers.
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.ICEConfig = null;

  /**
   * The RTCPeerConnection optional configuration.
   * @attribute optionalConfig
   * @param {Array} optional The optional configuration.
   * @param {JSON} optional.(#index) The optional setting.
   * @param {Boolean} optional.(#index).DtlsSrtpKeyAgreement Required flag
   *    for Chrome and Firefox to interop.
   * @type JSON
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.optionalConfig = {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  };

  /**
   * The local RTCSessionDescription set for this peer connection.
   * @attribute localDescription
   * @type Object
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.localDescription = null;

  /**
   * The remote RTCSessionDescription set for this peer connection.
   * @attribute remoteDescription
   * @type Object
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.remoteDescription = null;

  /**
   * The datachannels connected to peer connection.
   * @attribute datachannels
   * @param {DataChannel} (#channelId) The datachannel connected to peer.
   * @type JSON
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.datachannels = {};

  /**
   * The flag that indicates if trickle ICE is enable for this peer connection.
   * @attribute iceTrickle
   * @type Boolean
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.iceTrickle = true;

  /**
   * The timeout that would be invoked when peer connection has expired without
   *   an established connection.
   * @attribute healthTimer
   * @type Function
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.healthTimer = null;

  /**
   * The remote stream received from this peer.
   * @attribute stream
   * @type Stream
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.stream = null;

  /**
   * Stores the streaming configuration for the peer connection.
   * @attribute streamingConfig
   * @param {JSON|Boolean} [audio=false] The audio stream configuration.
   *    If parsed as a boolean, other configuration settings under the audio
   *    configuration would be set as the default setting in the connection.
   * @param {Boolean} [audio.stereo=false] The flag that indiciates
   *    if stereo is enabled for this connection.
   * @param {String} [audio.sourceId] The source id of the audio MediaStreamTrack
     *    used for this connection.
   * @param {String|Boolean} [video=false] The video stream configuration.
   *    If parsed as a boolean, other configuration settings under the video
   *    configuration would be set as the default setting in the connection.
   * @param {JSON} [video.resolution] The video streaming resolution.
   * @param {Integer} video.resolution.width The video resolution width.
   * @param {Integer} video.resolution.height The video resolution height.
   * @param {Integer} video.frameRate The video stream framerate.
   * @param {String} [video.sourceId] The source id of the video MediaStreamTrack
   *    used for this connection.
   * @param {JSON} status The stream MediaStreamTrack status.
   * @param {Boolean} [status.audioMuted=false] The flag that indicates if audio is muted.
   *    If audio is set to false, this would be set as true.
   * @param {Boolean} [status.videoMuted=false] The flag that indicates if video is muted.
   *    If video is set to false, this would be set as true.
   * @type JSON
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.streamingConfig = config.streamingConfig || {
    audio: false,
    video: false,
    status: {
      audioMuted: true,
      videoMuted: true
    }
  };

  /**
   * The RTCPeerConnection createOffer and createAnswer.
   * @attribute sdpConstraints
   * @param {JSON} mandatory The mandatory constraints. This format is only
   *    for Chrome browsers.
   * @param {Boolean} mandatory.OfferToReceiveAudio The flag that indicates if
   *    this RTCPeerConnection should receive audio.
   * @param {Boolean} mandatory.OfferToReceiveVideo The flag that indicates if
   *    this RTCPeerConnection should receive video.
   * @param {Boolean} OfferToReceiveAudio The flag that indicates if
   *    this RTCPeerConnection should receive audio. This format is only
   *    for Firefox browsers (30+).
   * @param {Boolean} OfferToReceiveVideo The flag that indicates if
   *    this RTCPeerConnection should receive video. This format is only
   *    for Firefox browsers (30+).
   * @type JSON
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.sdpConstraints = {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
  };

  /**
   * The RTCSessionDescription session description modification configuration.
   * This uses the user's sent streaming configuration.
   * @attribute sdpConfig
   * @param {Boolean} stereo The flag that indicates if stereo is enabled for this connection.
   * @param {JSON} bandwidth The bandwidth configuration the peer connections.
   *    This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * @param {Integer} [bandwidth.audio] The bandwidth configuration for the audio stream.
   * @param {Boolean} [bandwidth.video] The bandwidth configuration for the video stream.
   * @param {Boolean} [bandwidth.data] The bandwidth configuration for the data stream.
   * @type JSON
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.sdpConfig = {
    stereo: false,
    bandwidth: config.bandwidth
  };

  /**
   * The RTCPeerConnection object.
   * @attribute RTCPeerConnection
   * @type JSON
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.RTCPeerConnection = null;

  /**
   * The generated weight for the "welcome" handshake priority.
   * @attribute weight
   * @type Integer
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.weight = parseInt(fn.generateUID(), 10);


  /**
   * Function to subscribe to when peer connection has been started.
   * @method onconnect
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.onconnect = function () {};

  /**
   * Function to subscribe to when peer connection is established.
   * @method onconnected
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.onconnected = function () {};

  /**
   * Function to subscribe to when ICE connection state changes.
   * @method oniceconnectionstatechange
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.oniceconnectionstatechange = function () {};

  /**
   * Function to subscribe to when ICE gathering state changes.
   * @method onicegatheringstatechange
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.onicegatheringstatechange = function () {};

  /**
   * Function to subscribe to when there is an incoming stream received.
   * @method onaddstream
   * @param {Stream} stream The stream object.
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.onaddstream = function () {};

  /**
   * Function to subscribe to when signaling state has changed.
   * @method onsignalingstatechange
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.onsignalingstatechange = function () {};

  /**
   * Function to subscribe to when peer connection has been restarted.
   * @method onreconnect
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.onreconnect = function () {};

  /**
   * Function to subscribe to when peer connection been disconnected.
   * @method onremoveconnection
   * @eventhandler true
   * @for Peer
   * @since 0.6.0
   */
  com.ondisconnect = function () {};



  /**
   * The handler handles received events.
   * @method routeEvent
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.routeEvent = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.peerId = com.id;

    fn.applyHandler(PeerEventReceivedHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Peer: Received event = ', event, data);
  };

  /**
   * The handler handles received socket message events.
   * @method routeMessage
   * @param {JSON} message The message data.
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.routeMessage = function (message) {
    // Messaging events
    var fn = PeerEventMessageHandler[message.type];

    if (typeof fn === 'function') {
      fn(com, message, listener);
    }

    log.debug('Peer: Received message = ', message.type, message);
  };

  /**
   * The handler handles response events.
   * @method respond
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.id = com.name;

    fn.applyHandler(PeerEventResponseHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Peer: Responding with event = ', event, data);
  };

  /**
   * Starts the connection and initializes the RTCPeerConnection object.
   * @method connect
   * @param {Stream} stream The stream object.
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.connect = function (stream) {
    var peer = new window.RTCPeerConnection(com.ICEConfig, com.optionalConfig);

    // Send stream
    if ((!fn.isEmpty(stream)) ? stream instanceof Stream : false) {

      // Set the data
      com.stereo = fn.isSafe(function () { return stream.audio.stereo; });

      // Check class type
      peer.addStream(stream.MediaStream);

      com.respond('peer:stream', {
        sourceType: 'local',
        stream: stream
      });
    }

    com.bind(peer);
  };

  /**
   * Restarts the connection and re-initialize the RTCPeerConnection object
   *   to restart the ICE connection.
   * @method reconnect
   * @param {Stream} stream The updated stream object.
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.reconnect = function (stream) {
    var hasStream = !!stream;

    stream = stream || fn.isSafe(function () {
      return com.RTCPeerConnection.getLocalStreams()[0]; });

    com.RTCPeerConnection.close();
    com.RTCPeerConnection = null;

    var peer = new window.RTCPeerConnection(com.ICEConfig, com.config);

    // Send stream
    if ((!fn.isEmpty(stream)) ? stream instanceof Stream : false) {

      // Adds the RTCMediaStream object to RTCPeerConnection
      peer.addStream(stream.MediaStream);

      if (hasStream) {
        com.respond('peer:stream', {
          stream: stream
        });
      }

      com.respond('peer:reconnect', {});
    }
    com.bind(peer);
  };

  /**
   * Stops and closes the RTCPeerConnection connection.
   * @method disconnect
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.disconnect = function () {
    if (com.RTCPeerConnection.newSignalingState !== 'closed') {
      com.RTCPeerConnection.close();
    }

    com.respond('peer:disconnect', {});
  };

  /**
   * Binds events to RTCPeerConnection object.
   * @method bind
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.bind = function (bindPeer) {
    bindPeer.iceConnectionFiredStates = [];
    bindPeer.queueCandidate = [];
    bindPeer.newSignalingState = 'new';
    bindPeer.newIceConnectionState = 'new';

    bindPeer.ondatachannel = function (event) {
      var eventChannel = event.channel || event;

      // Send the channel only when channel has started
      var channel = new DataChannel(eventChannel, function (event, data) {

        com.respond(event, data);

        if (event === 'datachannel:start') {
          com.respond('peer:datachannel', {
            channel: channel,
            sourceType: 'remote'
          });
        }
      });
    };

    bindPeer.onaddstream = function (event) {
      var eventStream = event.stream || event;

      // Send the stream only when stream has started
      var stream = new Stream(eventStream, config.streamingConfig, function (event, data) {

        com.routeEvent(event, data);

        if (event === 'stream:start') {
          com.respond('peer:stream', {
            sourceType: 'remote',
            stream: stream
          });
        }
      });
    };

    bindPeer.onicecandidate = function (event) {
      var eventCandidate = event.candidate || event;

      if (fn.isEmpty(eventCandidate.candidate)) {
        com.respond('candidate:gathered', {
          candidate: eventCandidate
        });
        return;
      }

      // Implement ice trickle disabling here

      com.respond('peer:icecandidate', {
        sourceType: 'local',
        candidate: eventCandidate
      });
    };

    bindPeer.oniceconnectionstatechange = function (event) {
      ICE.parseIceConnectionState(bindPeer);
    };

    bindPeer.oniceconnectionnewstatechange = function (event) {
      // Connection is successful
      if (com.RTCPeerConnection.newIceConnectionState === 'connected') {
        // Stop timer
        if (!fn.isEmpty(com.healthTimer)) {
          log.debug('Peer', com.id, 'Stopping health timer as connection is established.');

          clearInterval(com.healthTimer);
        }
      }

      com.respond('peer:iceconnectionstate', {
        state: com.RTCPeerConnection.newIceConnectionState
      });
    };

    bindPeer.onsignalingstatechange = function (event) {
      com.respond('peer:signalingstate', {
        state: com.RTCPeerConnection.newSignalingState
      });
    };

    bindPeer.onicegatheringstatechange = function () {
      com.respond('peer:icegatheringstate', {
        state: com.RTCPeerConnection.iceGatheringState
      });
    };

    com.RTCPeerConnection = bindPeer;

    fn.runSync(function () {
      com.respond('peer:connect', {
        weight: com.weight,
        SDPType: com.SDPType,
        streamingConfig: com.streamingConfig
      });
    });
  };

  /**
   * Creates a local offer RTCSessionDescription.
   * @method createOffer
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.createOffer = function () {
    // Create datachannel
    if (globals.dataChannel && com.type === 'user') {
      var eventChannel = com.RTCPeerConnection.createDataChannel('main');

      // Send the channel only when channel has started
      var channel = new DataChannel(eventChannel, function (event, data) {

        com.respond(event, data);

        com.respond('peer:datachannel', {
          sourceType: 'local',
          channel: channel
        });
      });
    }

    com.RTCPeerConnection.createOffer(function (offer) {
      offer.sdp = SDP.configure(offer.sdp, com.sdpConfig);

      com.localDescription = offer;

      com.respond('peer:offer', {
        offer: offer
      });

    }, function (error) {
      throw error;

    }, com.sdpConstraints);
  };

  /**
   * Creates a local answer RTCSessionDescription.
   * @method createAnswer
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.createAnswer = function () {
    com.RTCPeerConnection.createAnswer(function (answer) {
      answer.sdp = SDP.configure(answer.sdp, com.sdpConfig);

      com.localDescription = answer;

      com.respond('peer:answer', {
        answer: answer
      });

      com.setLocalDescription();

    }, function (error) {
      throw error;

    }, com.sdpConstraints);
  };

  /**
   * Sets local RTCSessionDescription to the RTCPeerConnection.
   * @method setLocalDescription
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.setLocalDescription = function () {
    var localDescription = com.localDescription;

    com.RTCPeerConnection.setLocalDescription(localDescription, function () {
      com.respond('peer:localdescription', {
        localDescription: localDescription.sdp,
        type: localDescription.type,
      });

      if (localDescription.type === 'answer') {
        com.RTCPeerConnection.newSignalingState = 'have-local-answer';

        com.respond('peer:signalingstate', {
          state: com.RTCPeerConnection.newSignalingState
        });

      } else {
        com.setRemoteDescription();
      }

    }, function (error) {
      throw error;
    });
  };

  /**
   * Sets remote RTCSessionDescription to the RTCPeerConnection.
   * @method setRemoteDescription
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.setRemoteDescription = function () {
    var remoteDescription = com.remoteDescription;

    com.RTCPeerConnection.setRemoteDescription(remoteDescription, function () {
      com.respond('peer:remotedescription', {
        remoteDescription: remoteDescription.sdp,
        type: remoteDescription.type
      });

      if (remoteDescription.type === 'answer') {
        com.RTCPeerConnection.newSignalingState = 'have-remote-answer';

        com.respond('peer:signalingstate', {
          state: com.RTCPeerConnection.newSignalingState
        });

      } else {
        com.createAnswer();
      }

      // Add all ICE Candidate generated before remote description of answer and offer
      ICE.popCandidate(com.RTCPeerConnection, com.handler);

    }, function (error) {
      throw error;
    });
  };

  // Throw an error if adapterjs is not loaded
  if (!window.RTCPeerConnection) {
    throw new Error('Required dependency adapterjs not found');
  }

  // Parse bandwidth
  com.streamingConfig.bandwidth = StreamParser.parseBandwidthConfig(com.streamingConfig.bandwidth);

  // Parse constraints ICE servers
  var iceServers = ICE.parseICEServers(config.iceServers);

  com.ICEConfig = {
    iceServers: iceServers
  };

  // Start timer
  /*com.healthTimer = setTimeout(function () {
    if (!fn.isEmpty(com.healthTimer)) {
      log.debug('Peer', com.id, 'Restarting negotiation as timer has expired');

      clearInterval(com.healthTimer);

      com.reconnect();
    }

  }, com.iceTrickle ? 10000 : 50000);*/

  fn.runSync(function () {
    // When peer connection is ready to use, the connection connect() can start
    com.respond('peer:start', {
      weight: com.weight,
      SDPType: com.SDPType,
      streamingConfig: com.streamingConfig
    });
  });
}

var PeerEventReceivedHandler = {
  
  // Handles the stream events */
  stream: {
    // Handles the stream stop event */
    stop: function (com, data, listener) {
      // When receiving stream stops and it is not the main peer connection, it means
      // that connection has stopped
      // If stream is not the main, disconnect the peer connection.
      if (com.id !== 'main') {
        com.disconnect();
      }
    }
  }
  
};

/**
 * Handles all the events to respond to other parent classes.
 * @attribute PeerEventResponseHandler
 * @private
 * @for Peer
 * @since 0.6.0
 */
var PeerEventResponseHandler = {
  
  /**
   * Event fired when peer connection has started.
   * This happens when RTCPeerConnection object has just
   *   been initialized and local MediaStream has been added.
   * @event peer:connect
   * @private
   * @for Peer
   * @since 0.6.0
   */
  connect: function (com, data, listener) {
    if (typeof com.onconnect === 'function') {
      com.onconnect(com.id);
    }
  },
  
  /**
   * Event fired when peer connection is reconnecting.
   * This happens when RTCPeerConnection object is
   *   re-initialized and the ICE connection restarts again.
   * It adds the re-updated local MediaStream.
   * @event peer:reconnect
   * @private
   * @for Peer
   * @since 0.6.0
   */
  reconnect: function (com, data, listener) {
    if (typeof com.onreconnect === 'function') {
      com.onreconnect();
    }
  },
  
  /**
   * Event fired when peer connection is established and connected.
   * This happens when RTCPeerConnection ICE connection state is
   *  connected and completed.
   * @event peer:connected
   * @private
   * @for Peer
   * @since 0.6.0
   */
  connected: function (com, data, listener) {
    if (typeof com.onconnect === 'function') {
      com.onconnect(com.id);
    }
  },
  
  /**
   * Event fired when peer connection has been disconnected.
   * This happens when RTCPeerConnection close is invoked and 
   *  connection stops.
   * @event peer:disconnect
   * @private
   * @for Peer
   * @since 0.6.0
   */
  disconnect: function (com, data, listener) {
    if (typeof com.ondisconnect === 'function') {
      com.ondisconnect();
    }
  },
  
  /**
   * Event fired when peer connection adds or receives a stream object.
   * This happens when user sends a local MediaStream to peer or receives
   *   a remote MediaStream from onaddstream event.
   * @event peer:disconnect
   * @private
   * @for Peer
   * @since 0.6.0
   */
  stream: function (com, data, listener) {
    data.stream.sourceType = data.sourceType;

    if (data.sourceType === 'remote') {
      com.stream = data.stream;
    }
    
    if (typeof com.onaddstream === 'function') {
      com.onaddstream(data.stream);
    }
  },

  /**
   * Event fired when peer connection ICE connection state has changed.
   * @property iceconnectionstate
   * @type Function
   * @private
   * @since 0.6.0
   */
  iceconnectionstate: function (com, data, listener) {
    if (typeof com.oniceconnectionstatechange === 'function') {
      com.oniceconnectionstatechange(data.state);
    }  
  },

  /**
   * Event fired when peer connection ICE gathering state has changed.
   * @property icegatheringstate
   * @type Function
   * @private
   * @since 0.6.0
   */
  icegatheringstate: function (com, data, listener) {
    if (typeof com.onicegatheringstatechange === 'function') {
      com.onicegatheringstatechange(data.state);
    }
  },

  /**
   * Event fired when peer connection ICE candidate is received.
   * @property icecandidate
   * @type Function
   * @private
   * @since 0.6.0
   */
  icecandidate: function (com, data, listener) {},

  /**
   * Event fired when peer connection signaling state changes.
   * This happens when RTCPeerConnection receives local or remote offer.
   * @property signalingstate
   * @type Function
   * @private
   * @since 0.6.0
   */
  signalingstate: function (com, data, listener) {
    if (typeof com.onsignalingstatechange === 'function') {
      com.onsignalingstatechange(data.state);
    }
  },

  /**
   * Event fired when peer connection datachannel is received.
   * This happens when RTCPeerConnection receives a local or remote RTCDataChannel.
   * @property datachannel
   * @type Function
   * @private
   * @since 0.6.0
   */
  datachannel: function (com, data, listener) {
    data.channel.sourceType = data.sourceType;

    com.datachannels[data.channel.id] = data.channel;
    
    if (typeof com.ondatachannel === 'function') {
      com.ondatachannel(data.channel);
    }
  }
};

/**
 * Handles all the message events received from socket.
 * @attribute PeerEventMessageHandler
 * @private
 * @for Peer
 * @since 0.6.0
 */
var PeerEventMessageHandler = {

  offer: function (com, data, listener) {
    com.remoteDescription = new window.RTCSessionDescription(data);

    com.handler('peer:offer', {
      sourceType: 'remote',
      offer: com.remoteDescription
    });
        
    com.setRemoteDescription();
  },
  
  answer: function (com, data, listener) {
    com.remoteDescription = new window.RTCSessionDescription(data);

    com.handler('peer:answer', {
      sourceType: 'remote',
      answer: com.remoteDescription
    });

    com.setLocalDescription();
  },

  candidate: function (com, data, listener) {
    var candidate = new window.RTCIceCandidate({
      sdpMLineIndex: data.label,
      candidate: data.candidate,
      sdpMid: data.id,
      label: data.label,
      id: data.id
    });

    ICE.addCandidate(com.RTCPeerConnection, candidate, com.handler);

    com.handler('peer:icecandidate', {
      sourceType: 'remote',
      candidate: candidate
    });
  },
  
  restart: function (com, data, listener) {
    
  },
  
  muteAudioEvent: function (com, data, listener) {
    if (data.muted) {
      com.stream.muteAudio();
    } else {
      com.stream.muteVideo();
    }
  },
    
  muteVideoEvent: function (com, data, listener) {
    if (data.muted) {
      com.stream.unmuteAudio();
    } else {
      com.stream.unmuteVideo();
    }
  }
};

/**
 * Handles the peer class events.
 * @method PeerHandler
 * @param {Object} com The reference to the class object.
 * @param {String} event The event name.
 * @param {JSON} data The event data response.
 * @param {Function} listener The listener function.
 * @private
 * @for Peer
 * @since 0.6.0
 */
var PeerHandler = function (com, event, data, listener) {
  var params = event.split(':');

  // Messaging events
  if (event.indexOf('message:') === 0) {
    
    fn.applyHandler(PeerEventMessageHandler, params, [com, data, listener]);
  
  } else {
    // Class events
    if (event.indexOf('peer:') === 0) {
      data.id = com.id;

      fn.applyHandler(PeerEventResponseHandler, params, [com, data, listener]);

    } else {
      data.peerId = com.id;

      fn.applyHandler(PeerEventReceivedHandler, params, [com, data, listener]);
    }
    
    listener(event, data);
  }
  
  //log.debug('PeerHandler', event, data);
};
var Request = {
  /**
   * The api server.
   * @property server
   * @type String
   * @private
   * @since 0.6.0
   */
  server: globals.roomServer || '//api.temasys.this.sg',

  /**
   * The flag to check if request should use XDomainRequest.
   * @property isXDomainRequest
   * @type Boolean
   * @private
   * @since 0.6.0
   */
  isXDomainRequest: window.webrtcDetectedBrowser === 'IE' &&
    (window.webrtcDetectedVersion === 9 || window.webrtcDetectedVersion === 8) &&
    typeof window.XDomainRequest === 'function',

  /**
   * The protocol the request uses to connect to.
   * @property protocol
   * @type String
   * @private
   * @since 0.6.0
   */
  protocol: (globals.enforceSSL) ? 'https:' : window.location.protocol,

  /**
   * Starts the connection to the room.
   * @property load
   * @type Function
   * @param {Function} callback The callback triggered once request has been completed.
   * @trigger peerJoined, mediaAccessRequired
   * @for Request
   * @since 0.6.0
   */
  load: function (path, deferSuccess, deferError, deferLoad) {
    var xhr = null;

    if (this.isXDomainRequest) {
      xhr = new XDomainRequest();

      xhr.setContentType = function (contentType) {
        xhr.contentType = contentType;
      };

    } else {
      xhr = new window.XMLHttpRequest();

      xhr.setContentType = function (contentType) {
        xhr.setRequestHeader('Content-type', contentType);
      };
    }

    xhr.onload = function () {
      var response = xhr.responseText || xhr.response;
      var status = xhr.status || 200;
      
      log.info('Request', 'Received response from API server', response, status);
      
      try {
        response = JSON.parse( response || '{}' );
      } catch (error) {
        throw error;
      }
  
      if (status === 200) {
        deferSuccess(status, response);
      
      } else {
        deferError(status, response);
      }
    };

    xhr.onerror = function (error) {
      throw error;
    };

    xhr.onprogress = function () {
      log.log('Request', 'Request load in progress');
      
      deferLoad();
    };

    xhr.open('GET', this.protocol + this.server + path, true);

    // xhr.setContentType('application/json;charset=UTF-8');

    xhr.send();
  }
};
function Room(name, listener) {
  'use strict';

  // Prevent undefined listener error
  listener = listener || function (event, data) {};

  // Reference of instance
  var com = this;

  /**
   * The room name.
   * @attribute name
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.name = name;

  /**
   * The room id.
   * @attribute id
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.id = null;

  /**
   * The room token.
   * @attribute token
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.token = null;

  /**
   * The room key.
   * @attribute key
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.key = null;

  /**
   * The room start date timestamp (ISO format) for persistent mode.
   * @attribute startDateTime
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.startDateTime = null;

  /**
   * The room duration for persistent mode.
   * @attribute duration
   * @type Integer
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.duration = null;

  /**
   * The request path to the api server.
   * @attribute apiPath
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.apiPath = null;

  /**
   * The room api owner.
   * @attribute owner
   * @type String
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.owner = null;

  /**
   * The user set settings for the room.
   * @attribute credentials
   * @param {Integer} duration The room duration set by user.
   * @param {String} hash The hashed secret generated by user.
   * @param {String} startDateTime The room start date timestamp (ISO format) set by user.
   * @type JSON
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.credentials = globals.credentials;

  /**
   * The self user connection.
   * @attribute self
   * @type Self
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.self = null;

  /**
   * The list of users connected to room.
   * @attribute users
   * @param {User} (#userId) The user connected to room.
   * @type JSON
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.users = {};

  /**
   * The list of components connected to room.
   * This could be <var>MCU</var> or <var>Recording</var> peers.
   * @attribute components
   * @param {Component} (#index) The component connected to room.
   * @type JSON
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.components = {};

  /**
   * The room duration.
   * @attribute startDateTime
   * @type Socket
   * @required
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.socket = null;

  /**
   * The room TURN/STUN servers connection.
   * @attribute iceServers
   * @param {JSON} (#index) The ICE server.
   * @param {String} (#index).credential The ICE server credential (password).
   * @param {String} (#index).url The ICE server url. The current format
   *    for TURN servers is <code>turn:username@urlhost</code>. It may be
   *    required to parse it differently in
   *    <code>{ username: 'username', credential: 'xxx', url: 'turn:urlhost' }</code>
   *    format for unsupported browsers like firefox.
   * @type Array
   * @required
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.iceServers = [];

  /**
   * The flag that indicates if the self user has joined the room.
   * @attribute connected
   * @type Boolean
   * @required
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.connected = false;

  /**
   * The flag that indicates if the room is locked.
   * @attribute locked
   * @type Boolean
   * @required
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.locked = false;


  /**
   * Function to subscribe to when room is initializating the configuration.
   * @method oninit
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.oninit = function () {};

  /**
   * Function to subscribe to when room object has loaded and is ready to use.
   * @method onready
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onready = function () {};

  /**
   * Function to subscribe to when self has joined the room.
   * @method onjoin
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onjoin = function () {};

  /**
   * Function to subscribe to when a user has joined the room.
   * @method onuserjoin
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onuserjoin = function () {};

  /**
   * Function to subscribe to when self has been kicked out of room.
   * @method onkick
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onkick = function () {};

  /**
   * Function to subscribe to when self is warned by server before kicking self user.
   * @method onwarn
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onwarn = function () {};

  /**
   * Function to subscribe to when room has been locked.
   * @method onlock
   * @for Room
   * @since 0.6.0
   */
  com.onlock = function () {};

  /**
   * Function to subscribe to when room has been unlocked.
   * @method onunlock
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onunlock = function () {};

  /**
   * Function to subscribe to when self has leave the room.
   * @method onleave
   * @eventhandler true
   * @for Room
   * @since 0.6.0
   */
  com.onleave = function () {};


  /**
   * The handler handles received events.
   * @method routeEvent
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.routeEvent = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.roomName = com.name;

    fn.applyHandler(RoomEventReceivedHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Room: Received event = ', event, data);
  };

  /**
   * The handler handles received socket message events.
   * @method routeMessage
   * @param {JSON} message The message data.
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.routeMessage = function (message) {
    // Messaging events
    var fn = RoomEventMessageHandler[message.type];

    if (typeof fn === 'function') {
      fn(com, message, listener);
    }

    log.debug('Room: Received message = ', message.type, message);
  };

  /**
   * The handler handles response events.
   * @method respond
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.name = com.name;

    fn.applyHandler(RoomEventResponseHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Room: Responding with event = ', event, data);
  };

  /**
   * Loads the connection information of the room.
   * @method init
   * @private
   * @for Room
   * @since 0.6.0
   */
  com.init = function () {
    // Start loading the room information
    var path = '/api/' + globals.apiKey + '/' + com.name;

    // Set credentials if there is
    if (com.credentials !== null) {
      path += com.credentials.startDateTime + '/' +
        com.credentials.duration + '?&cred=' + com.credentials.hash;
    }

    // Check if there is a other query parameters or not
    if (globals.region) {
      path += (path.indexOf('?&') > -1 ? '&' : '?&') + 'rg=' + globals.region;
    }

    // Start connection
    Request.load(path, function (status, content) {
      // Store the path information
      com.apiPath = path;

      // Room configuration settings from server
      com.key = content.cid;
      com.id = content.room_key;
      com.token = content.roomCred;
      com.startDateTime = content.start;
      com.duration = content.len;
      com.owner = content.apiOwner;

      // User configuration settings from server
      var userConfig = {
        id: null,
        username: content.username,
        token: content.userCred,
        timeStamp: content.timeStamp,
        data: null
      };

      com.self = new Self(userConfig, com.routeEvent);

      //com.constraints = JSON.parse(content.pc_constraints);

      // Signalling information
      var socketConfig = {
        server: content.ipSigserver,
        httpPortList: content.httpPortList,
        httpsPortList: content.httpsPortList
      };
      com.socket = new Socket(socketConfig, com.routeEvent);

      com.respond('room:ready');

    }, function (status, error) {
      com.respond('room:error', {
        error: error
      });

    }, function () {
      com.respond('room:init');
    });
  };

  /**
   * Starts the connection to the room.
   * @method join
   * @param {Stream} stream The stream object to send. <mark>Stream</mark> object must
   *   be ready before sending. Look at <var>stream:start</var> event.
   *   Set as <code>null</code> for non-stream connection.
   * @param {JSON} [config] The configuration settings.
   * @param {JSON} [config.bandwidth] The bandwidth configuration for the connection.
   *    This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * @param {Integer} [config.bandwidth.audio] The audio banwidth configuration.
   * @param {Integer} [config.bandwidth.video] The video banwidth configuration.
   * @param {Integer} [config.bandwidth.data] The data banwidth configuration.
   * @param {JSON|String} [config.userData] The self user's custom data.
   * @for Room
   * @since 0.6.0
   */
  com.join = function (stream, config) {
    if (com.connected) {
      throw new Error('You are already connected to this "' + com.name +'" room');
    }

    config = config || {};

    // Parse self configuration first
    com.self.bandwidth = StreamParser.parseBandwidthConfig(config.bandwidth);
    com.self.data = config.userData;

    // Add stream if stream is not empty
    if (typeof stream === 'object' ? stream instanceof Stream : false) {
      com.self.addStreamConnection(stream, 'main');
    }

    // Start socket connection
    com.socket.connect();
  };

  /**
   * Stops the connection to the room.
   * @method leave
   * @for Room
   * @since 0.6.0
   */
  com.leave = function () {
    // Disconnect socket connection
    com.socket.disconnect();
  };

  /**
   * Locks the room.
   * @method lock
   * @for Room
   * @since 0.6.0
   */
  com.lock = function () {
    var message = {
      type: 'roomLockEvent',
      mid: com.self.id,
      rid: com.id,
      lock: true
    };

    com.socket.send(message);

    com.respond('room:lock', {
      selfId: com.self.id
    });
  };

  /**
   * Unlocks the room.
   * @method unlock
   * @for Room
   * @since 0.6.0
   */
  com.unlock = function () {
    var message = {
      type: 'roomLockEvent',
      mid: com.self.id,
      rid: com.id,
      lock: false
    };

    com.socket.send(message);

    com.respond('room:unlock', {
      userId: com.self.id
    });
  };

  /**
   * Sends a stream to users.
   * @method sendStream
   * @param {Stream} stream The stream object. <mark>Stream</mark> object must
   *   be ready before sending. Look at <var>stream:start</var> event.
   * @for Room
   * @since 0.6.0
   */
  com.sendStream = function (stream, targetUsers) {
    var peerId = fn.generateUID();
    var key;

    // Do a check of targetUsers to send
    com.self.addStreamConnection(stream, peerId);

    for (key in com.users) {
      if (com.users.hasOwnProperty(key)) {
        var message = {
          type: 'enter',
          mid: com.self.id,
          rid: com.id,
          prid: peerId,
          stream: com.self.getStreamingInfo('main')
        };

        com.users[key].routeMessage('message:enter', message);
      }
    }
  };

  // Start the room connection information
  com.init();
}

var RoomEventReceivedHandler = {

  // Handles the stream events */
  socket: {

    // When socket is connected, join the room
    connect: function (com, data, listener) {
      var message = {
        type: 'joinRoom',
        uid: com.self.username,
        cid: com.key,
        rid: com.id,
        userCred: com.self.token,
        timeStamp: com.self.timeStamp,
        apiOwner: com.owner,
        roomCred: com.token,
        start: com.startDateTime,
        len: com.duration
      };

      log.log('Room', 'Socket is connected, now sending joinRoom message');

      com.socket.send(message);
    },

    // When socket is disconnected, trigger that leave
    disconnect: function (com, data, listener) {
      log.log('Room', 'Socket is disconnected, now triggering leave');

      com.respond('room:leave', {});
    },

    // When socket sends or receives a message
    message: function (com, data, listener) {
      if (data.sourceType === 'remote') {
        console.log('respond', data.message);
        com.routeMessage(data.message);
      }
    },

    // When socket has exception, room has exception
    error: function (com, data, listener) {
      com.respond('room:error', {
        error: data,
        state: -2
      });
    }

  },

  // Handles the user events */
  user: {

    // When user object is initialized, start the "main" peer connection
    ready: function (com, data, listener) {
      // Get user object
      var user = com.users[data.id];

      // Get self local MediaStream
      var stream = com.self.streamConnections.main;

      // If stream exists, append it as streamObject
      if (!fn.isEmpty(stream)) {
        data.streamObject = stream;
      }

      // Set the ICE servers
      data.iceServers = com.iceServers;

      // Relay it to the userhandler
      user.routeMessage(data);
    }

  },

  // Handles the self user events */
  self: {

    // When self user custom data is updated, send to socket to update other users
    update: function (com, data, listener) {
      var message = {
        type: 'updateUserEvent',
        mid: data.id,
        rid: com.id,
        userData: data.userData
      };

      com.socket.send(message);
    },

    // When self user is connected to the room (after setting the self user id and
    // relevant information) start to send the enter
    connect: function (com, data, listener) {
      // Send and start the "main" peer connection
      var message = com.self.getInfo('main');

      message.type = 'enter';
      message.mid = com.self.id;
      message.rid = com.id;
      message.prid = 'main';

      com.socket.send(message);
    }

  },

  // Handles the peer events */
  peer: {

    // When peer connection object is initialized, we can start sending the welcome
    // to start the O/A handshake
    connect: function (com, data, listener) {
      // Retrieve the user
      var user = com.users[data.userId];

      // Check if user exists
      if (!fn.isEmpty(user)) {
        // Retrieve the user for this peer only
        var userInfo = user.getInfo(data.id);

        // Send welcome after creating object for answerer
        if (data.SDPType === 'answer') {
          var message = {
            type: 'welcome',
            mid: com.self.id,
            rid: com.id,
            prid: data.id,
            agent: window.webrtcDetectedBrowser,
            version: window.webrtcDetectedVersion,
            webRTCType: window.webrtcDetectedType,
            userInfo: com.self.getInfo(data.id),
            target: data.userId,
            weight: data.weight
          };
          com.socket.send(message);
        }

      } else {
        throw new Error('User "' + data.userId + '" does not exists');
      }
    },

    // When peer connection starts creating an offer, send to the user
    offer: function (com, data, listener) {
      var message = {
        type: 'offer',
        sdp: data.offer.sdp,
        prid: data.id,
        mid: com.self.id,
        target: data.userId,
        rid: com.id
      };

      com.socket.send(message);
    },

    // When peer connection starts creating an answer to offer, send to the user
    answer: function (com, data, listener) {
      var message = {
        type: 'answer',
        sdp: data.answer.sdp,
        prid: data.id,
        mid: com.self.id,
        target: data.userId,
        rid: com.id
      };

      com.socket.send(message);
    },

    // When peer connection generates an ice candidate send to user
    icecandidate: function (com, data, listener) {
      // For generated candidate not received candidate
      if (data.sourceType === 'local') {
        var message = {
          type: 'candidate',
          label: data.candidate.sdpMLineIndex,
          id: data.candidate.sdpMid,
          candidate: data.candidate.candidate,
          mid: com.self.id,
          prid: data.id,
          target: data.userId,
          rid: com.id
        };

        com.socket.send(message);
      }
    }

  }

};

/**
 * Handles all the events to respond to other parent classes.
 * @attribute RoomEventResponseHandler
 * @private
 * @for Room
 * @since 0.6.0
 */
var RoomEventResponseHandler = {

  /**
   * Event fired when room is initializing configuration information
   * from API server.
   * @event room:init
   * @for Room
   * @since 0.6.0
   */
  init: function (com, data, listener) {
    if (typeof com.oninit === 'function') {
      com.oninit();
    }
  },

  /**
   * Event fired when room object to ready to use.
   * @event room:ready
   * @for Room
   * @since 0.6.0
   */
  ready: function (com, data, listener) {
    if (typeof com.onready === 'function') {
      com.onready();
    }
  },

  /**
   * Event fired when there is room connection problems.
   * @event room:error
   * @for Room
   * @since 0.6.0
   */
  error: function (com, data, listener) {
    com.respond('room:error', {
      error: data.error,
      state: data.state
    });

    if (typeof com.onerror === 'function') {
      com.onerror(data);
    }
  },

  /**
   * Event fired when room object to ready to use.
   * @event room:join
   * @for Room
   * @since 0.6.0
   */
  join: function (com, data, listener) {
    if (typeof com.onjoin === 'function') {
      com.onjoin(com.self);
    }
  },

  /**
   * Event fired when self user is disconnect from the room.
   * @event room:leave
   * @for Room
   * @since 0.6.0
   */
  leave: function (com, data, listener) {
    if (typeof com.onleave === 'function') {
      com.onleave();
    }
  },

  /**
   * Event fired when self user is kicked out from the room.
   * @event room:kick
   * @for Room
   * @since 0.6.0
   */
  kick: function (com, data, listener) {
    if (typeof com.onkick === 'function') {
      com.onkick({
        message: data.info,
        reason: data.reason
      });

      com.leave();
    }
  },

  /**
   * Event fired when self user is warned regarding an action.
   * @event room:warn
   * @for Room
   * @since 0.6.0
   */
  warn: function (com, data, listener) {
    if (typeof com.onwarn === 'function') {
      com.onwarn({
        message: data.info,
        reason: data.reason
      });
    }
  }
};


/*
 * Handles all the Skylink SDK messaging protocols.
 * @class Messaging
 * @private
 * @isDocument true
 * @for Skylink
 * @since 0.6.0
 */
/**
 * Handles all the message events received from socket.
 * @attribute RoomEventMessageHandler
 * @private
 * @for Room
 * @since 0.6.0
 */
var RoomEventMessageHandler = {

  /**
   * The message that indicates that self user is in the room.
   * @event inRoom
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.sid The self user id.
   * @param {JSON} message.pc_config The RTCPeerConnection configuration.
   * @param {Array} message.pc_config.iceServers The list of ICE servers.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  inRoom: function (com, data, listener) {
    // Respond to self user that self user is in the room
    // and set the relevant data to self user.
    com.self.routeMessage(data);

    // The ICE servers received when "inRoom"
    com.iceServers = fn.isSafe(function () {
      return data.pc_config.iceServers;
    }) || [];

    // Notify to trigger onjoin event
    com.respond('room:join', {
      user: com.self
    });
  },

  /**
   * The message that indicates that a user has joined the room.
   * This is sent when user has just started a connection to the room.
   * @event enter
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.mid The user id.
   * @param {String} message.prid The shared peer connection id.
   * @param {JSON} message.stream The peer connection streaming configuration.
   * @param {JSON|Boolean} [message.stream.audio=false] The audio stream configuration.
   *    If parsed as a boolean, other configuration settings under the audio
   *    configuration would be set as the default setting in the connection.
   * @param {Boolean} [message.stream.audio.stereo=false] The flag that indiciates
   *    if stereo is enabled for this connection.
   * @param {String} [message.stream.audio.sourceId] The source id of the audio MediaStreamTrack
   *    used for this connection.
   * @param {String|Boolean} [message.stream.video=false] The video stream configuration.
   *    If parsed as a boolean, other configuration settings under the video
   *    configuration would be set as the default setting in the connection.
   * @param {JSON} [message.stream.video.resolution] The video streaming resolution.
   * @param {Integer} message.stream.video.resolution.width The video resolution width.
   * @param {Integer} message.stream.video.resolution.height The video resolution height.
   * @param {Integer} message.stream.video.frameRate The video stream framerate.
   * @param {String} [message.stream.video.sourceId] The source id of the video MediaStreamTrack
   *    used for this connection.
   * @param {JSON} message.stream.status The stream MediaStreamTrack status.
   * @param {Boolean} [message.stream.status.audioMuted=false] The flag that indicates if audio is muted.
   *    If audio is set to false, this would be set as true.
   * @param {Boolean} [message.stream.status.videoMuted=false] The flag that indicates if video is muted.
   *    If video is set to false, this would be set as true.
   * @param {Integer} message.userData The user custom data. Only given for "main" peer connections.
   * @param {JSON} message.agent The user's browser agent information. Only given for "main" peer connections.
   * @param {String} message.agent.name The user's browser agent name. For other SDKs, it's indicated
   *    by their type of device <code>E.g. ios, android</code>. For components, it's indicated
   *    by their type <code>E.g. MCU, Recording</code>.
   * @param {Integer} message.agent.version The user's browser agent version. For other SDKs, it's indicated
   *    by their version of device OS <code>ios8 = 8. android kitkat = 4.4</code>. For components, it's indicated
   *    by their version <code>E.g. 0.1.0, 0.2.0</code>.
   * @param {String} message.agent.webRTCType The user's browser agent webrtc implementation type. For other SDKs or
   *    components, use <code>other</code>.
   * @param {JSON} message.bandwidth The peer connection bandwidth configuration.
   *    This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * @param {Integer} [message.bandwidth.audio] The bandwidth configuration for the audio stream.
   * @param {Boolean} [message.bandwidth.video] The bandwidth configuration for the video stream.
   * @param {Boolean} [message.bandwidth.data] The bandwidth configuration for the data stream.
   * @param {String} message.rid The room id.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  enter: function (com, data, listener) {
    // A user has just joined the room
    var user = com.users[data.mid];

    // If the user is empty (which is supposed to be that case),
    // create a user which will create a peer connection when
    // the user object is ready
    if (fn.isEmpty(user)) {
      var config = {
        id: data.mid,
        stream: data.stream,
        agent: data.agent,
        bandwidth: data.bandwidth,
        data: data.userData,
        SDPType: 'answer'
      };

      user = new User(config, com.routeEvent);

      com.users[data.mid] = user;

      // Invoke function that user has joined
      if (typeof com.onuserjoin === 'function') {
        com.onuserjoin(user);
      }
    }
  },

  /**
   * The message that indicates that a user has joined the room.
   * This is sent as a response to user's "enter" message.
   * @event welcome
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.mid The user id.
   * @param {String} message.prid The shared peer connection id.
   * @param {JSON} message.stream The peer connection streaming configuration.
   * @param {JSON|Boolean} [message.stream.audio=false] The audio stream configuration.
   *    If parsed as a boolean, other configuration settings under the audio
   *    configuration would be set as the default setting in the connection.
   * @param {Boolean} [message.stream.audio.stereo=false] The flag that indiciates
   *    if stereo is enabled for this connection.
   * @param {String} [message.stream.audio.sourceId] The source id of the audio MediaStreamTrack
   *    used for this connection.
   * @param {String|Boolean} [message.stream.video=false] The video stream configuration.
   *    If parsed as a boolean, other configuration settings under the video
   *    configuration would be set as the default setting in the connection.
   * @param {JSON} [message.stream.video.resolution] The video streaming resolution.
   * @param {Integer} message.stream.video.resolution.width The video resolution width.
   * @param {Integer} message.stream.video.resolution.height The video resolution height.
   * @param {Integer} message.stream.video.frameRate The video stream framerate.
   * @param {String} [message.stream.video.sourceId] The source id of the video MediaStreamTrack
   *    used for this connection.
   * @param {JSON} message.stream.status The stream MediaStreamTrack status.
   * @param {Boolean} [message.stream.status.audioMuted=false] The flag that indicates if audio is muted.
   *    If audio is set to false, this would be set as true.
   * @param {Boolean} [message.stream.status.videoMuted=false] The flag that indicates if video is muted.
   *    If video is set to false, this would be set as true.
   * @param {Integer} message.userData The user custom data. Only given for "main" peer connections.
   * @param {JSON} message.agent The user's browser agent information. Only given for "main" peer connections.
   * @param {String} message.agent.name The user's browser agent name. For other SDKs, it's indicated
   *    by their type of device <code>E.g. ios, android</code>. For components, it's indicated
   *    by their type <code>E.g. MCU, Recording</code>.
   * @param {Integer} message.agent.version The user's browser agent version. For other SDKs, it's indicated
   *    by their version of device OS <code>ios8 = 8. android kitkat = 4.4</code>. For components, it's indicated
   *    by their version <code>E.g. 0.1.0, 0.2.0</code>.
   * @param {String} message.agent.webRTCType The user's browser agent webrtc implementation type. For other SDKs or
   *    components, use <code>other</code>.
   * @param {Integer} message.weight The priority weight of the message. In use-cases where both users receives each
   *    others "enter" message during the first handshake, the priority would indicate which user gets to do
   *    the offer.
   * @param {JSON} message.bandwidth The peer connection bandwidth configuration.
   *    This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * @param {Integer} [message.bandwidth.audio] The bandwidth configuration for the audio stream.
   * @param {Boolean} [message.bandwidth.video] The bandwidth configuration for the video stream.
   * @param {Boolean} [message.bandwidth.data] The bandwidth configuration for the data stream.
   * @param {String} message.rid The room id.
   * @param {String} message.target The targeted user id to receive welcome.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  welcome: function (com, data, listener) {
    var user = com.users[data.mid];

    if (fn.isEmpty(user)) {
      var config = {
        id: data.mid,
        stream: data.stream,
        agent: data.agent,
        bandwidth: data.bandwidth,
        data: data.userData,
        SDPType: 'offer'
      };

      user = new User(config, com.routeEvent);

      com.users[data.mid] = user;

      // Invoke function when user has joined
      if (typeof com.onuserjoin === 'function') {
        com.onuserjoin(user);
      }
    }
  },

  /**
   * The message that starts a user's peer connection offer and answer handshake.
   * @event offer
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.sdp The offer session description.
   * @param {String} message.prid The peer connection id.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.target The targeted user id to receive offer.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  offer: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.routeMessage(data);
    }
  },

  /**
   * The message that responses to a user's peer connection offer.
   * @event answer
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.sdp The answer session description.
   * @param {String} message.prid The peer connection id.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.target The targeted user id to receive answer.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  answer: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.routeMessage(data);
    }
  },

  /**
   * The message that is received when candidate is generated from the user's peer connection.
   * It's recommend to add all the relevant information when instianting a new <var>RTCIceCandidate</var>
   *   object.
   * @event candidate
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.candidate The candidate's candidate session description.
   * @param {String} message.id The candidate's sdpMid.
   * @param {Integer} message.label The candidate's sdpMLineIndex.
   * @param {String} message.prid The peer connection id.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.target The targeted user id to receive generated candidate.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  candidate: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.routeMessage(data);
    }
  },

  /**
   * The message that is received when user's custom data is updated.
   * @event updateUserEvent
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {JSON|String} message.userData The updated custom user data.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  updateUserEvent: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.routeMessage(data.userData);
    }
  },

  /**
   * The message that is received when user's peer connection audio stream mute status
   *   have changed. This is inline with <var>MediaStreamTrack</var> API's <code>enabled = true/false</code>.
   * @event muteAudioEvent
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {Boolean} message.muted The updated audio stream mute status.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.prid The shared peer connection id.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  muteAudioEvent: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.routeMessage(data);
    }
  },

  /**
   * The message that is received when user's peer connection video stream mute status
   *   have changed. This is inline with <var>MediaStreamTrack</var> API's <code>enabled = true/false</code>.
   * @event muteVideoEvent
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {Boolean} message.muted The updated video stream mute status.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.prid The shared peer connection id.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  muteVideoEvent: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.routeMessage(data);
    }
  },

  /**
   * The message that is received when the current room lock status have changed.
   * @event roomLockEvent
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {Boolean} message.locked The updated room lock status.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  roomLockEvent: function (com, data, listener) {
    com.locked = data.lock;

    if (com.locked) {
      if (typeof com.onlock === 'function') {
        com.onlock(data.mid);
      }

    } else {
      if (typeof com.onunlock === 'function') {
        com.onunlock(data.mid);
      }
    }
  },

  /**
   * The message that is received when user's peer connection is going through a refresh.
   * @event restart
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.prid The shared peer connection id.
   * @param {String} message.SDPType The handshake SDP type. <code>"offer"</code> is for the peer
   *   connection that initiated the restart. <code>"answer"</code> is for the peer
   *   connection that is responding to the restart.
   * @param {JSON} message.sdp The session description message for restart.
   * @param {String} message.sdp.type The <var>RTCSessionDescription</var> type.
   * @param {String} message.sdp.sdp The <var>RTCSessionDescription</var> session description.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  restart: function (com, data, listener) {
    var user = com.users[data.mid];

    if (!fn.isEmpty(user)) {
      user.respondMessage(data);

    } else {
      throw new Error('User "' + data.mid + '" does not exists');
    }
  },

  /**
   * The message that is received when user is receiving a rejection or warning from signaling server.
   * @event redirect
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @param {String} message.action The action received that indicates if user is warned or rejected.
   *    <code>"warning"</code> is when signaling is warning user of the action and comply accordingly.
   *    <code>"reject"</code> is when signaling has kicked user out of the room.
   * @param {JSON} message.info The signaling message for the redirect message.
   * @param {String} message.reason The reason for the action taken by signaling.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  redirect: function (com, data, listener) {
    if (data.action === 'reject') {
      // User is kicked out of the room
      com.respond('room:kick', {});
    }

    if (data.action === 'warning') {
      // User is warned
      com.respond('room:warn', {});
    }
  },

  /**
   * The message that is received when user has left the room.
   * @event bye
   * @param {JSON} message The message received.
   * @param {String} message.type The type of message.
   * @param {String} message.mid The user id.
   * @param {String} message.rid The room id.
   * @private
   * @for Messaging
   * @since 0.6.0
   */
  bye: function (com, data, listener) {
    var user = com.users[data.mid];

    // Disconnect user
    if (!fn.isEmpty(user)) {
      user.disconnect();

    } else {
      throw new Error('User "' + data.mid + '" does not exists');
    }
  }

};

var SDP = {
  /**
   * Finds a line in the sdp based on the condition provided
   * @property SDP.find
   * @type Function
   * @param {Array} sdpLines The sdp in array.
   * @param {Array} condition The beginning part of the sdp line. E.g. a=fmtp
   * @return {Array} [index, line] The sdp line.
   * @private
   * @for Skylink
   * @since 0.6.0
   */
  find: function(sdpLines, condition) {
    var i, j;
    
    for (i = 0; i < sdpLines.length; i += 1) {
      for (j = 0; j < condition.length; j += 1) {
        sdpLines[i] = sdpLines[i] || '';

        if (sdpLines[i].indexOf(condition[j]) === 0) {
          return [i, sdpLines[i]];
        }
      }
    }
    
    return [];
  },
  
  /**
   * Enables the stereo feature if OPUS is enabled.
   * @property SDP.addStereo
   * @type Function
   * @param {Array} sdpLines Sdp received.
   * @return {Array} Updated version with Stereo feature
   * @private
   * @for Skylink
   * @since 0.6.0
   */
  addStereo: function(sdpLines) {
    var opusLineFound = false, opusPayload = 0;
    // Check if opus exists
    var rtpmapLine = this.find(sdpLines, ['a=rtpmap:']);
    if (rtpmapLine.length) {
      if (rtpmapLine[1].split(' ')[1].indexOf('opus/48000/') === 0) {
        opusLineFound = true;
        opusPayload = (rtpmapLine[1].split(' ')[0]).split(':')[1];
      }
    }
    // Find the A=FMTP line with the same payload
    if (opusLineFound) {
      var fmtpLine = this.find(sdpLines, ['a=fmtp:' + opusPayload]);
      if (fmtpLine.length) {
        sdpLines[fmtpLine[0]] = fmtpLine[1] + '; stereo=1';
      }
    }
    return sdpLines;
  },
  
  /**
   * Sets the audio, video and DataChannel data bitrate in the sdp.
   * - In low-environment cases, bandwidth is managed by the browsers
   *   and the quality of the resolution or audio may change to suit.
   * @property SDP.setBitrate
   * @type Function
   * @param {Array} sdpLines Sdp received.
   * @return {Array} Updated version with custom Bandwidth settings
   * @private
   * @for Skylink
   * @since 0.6.0
   */
  setBitrate: function (sdpLines, bandwidth) {
    // Find if user has audioStream
    var maLineFound = this.find(sdpLines, ['m=', 'a=']).length;
    var cLineFound = this.find(sdpLines, ['c=']).length;

    // Find the RTPMAP with Audio Codec
    if (maLineFound && cLineFound) {
      if (bandwidth.audio) {
        var audioLine = this.find(sdpLines, ['a=audio', 'm=audio']);
        
        if (!fn.isEmpty(audioLine)) {
          sdpLines.splice(audioLine[0], 1, audioLine[1], 'b=AS:' + bandwidth.audio);
        }
      }
      
      if (bandwidth.video) {
        var videoLine = this.find(sdpLines, ['a=video', 'm=video']);
        
        if (!fn.isEmpty(videoLine)) {
          sdpLines.splice(videoLine[0], 1, videoLine[1], 'b=AS:' + bandwidth.video);
        }
      }
      
      if (bandwidth.data && this._enableDataChannel) {
        var dataLine = this.find(sdpLines, ['a=application', 'm=application']);
        
        if (!fn.isEmpty(dataLine)) {
          sdpLines.splice(dataLine[0], 1, dataLine[1], 'b=AS:' + bandwidth.data);
        }
      }
    }
    return sdpLines;
  },
    
  /**
   * Set video stream resolution in the sdp.
   * - As noted, this is not working.
   * @property SDP.setResolution
   * @type Function
   * @param {Array} sdpLines Sdp received.
   * @return {Array} Updated version with custom Bandwidth settings
   * @private
   * @for Skylink
   * @since 0.6.0
   */
  setResolution: function (sdpLines) {
    var video = this._streamSettings.video;
    var frameRate = video.frameRate || 50;
    var resolution = video.resolution || {};
    var fmtpLine = this.find(sdpLines, ['a=fmtp:']);
    if (fmtpLine.length){
        sdpLines.splice(fmtpLine[0], 1,fmtpLine[1] + ';max-fr=' + frameRate +
        ';max-recv-width=' + (resolution.width ? resolution.width : 640) +
        ';max-recv-height=' + (resolution.height ? resolution.height : 480));
    }
    return sdpLines;
  },
    
  /**
   * Removes the H264 preference in sdp because other browsers does not support it yet.
   * @property SDP.removeH264Support
   * @type Function
   * @param {Array} sdpLines Sdp received.
   * @return {Array} Updated version removing Firefox h264 pref support.
   * @private
   * @for Skylink
   * @since 0.6.0
   */
  removeH264Support: function (sdpLines) {
    var invalidLineIndex = sdpLines.indexOf(
      'a=fmtp:0 profile-level-id=0x42e00c;packetization-mode=1');
    if (invalidLineIndex > -1) {
      log.debug('Firefox H264 invalid pref found:', invalidLineIndex);
      sdpLines.splice(invalidLineIndex, 1);
    }
    return sdpLines;
  },
  
  /**
   * Modifies a local session description with the configuration provided
   * @property SDP.configure
   * @type Function
   * @param {Array} sdpLines Sdp received.
   * @return {String} Updated local session description.
   * @private
   * @for Skylink
   * @since 0.6.0
   */
  configure: function (sdp, config) {
    var sdpLines = sdp.split('\r\n');
    
    sdpLines = this.removeH264Support(sdpLines);

    if (config.stereo) {
      sdpLines = this.addStereo(sdpLines);
    }

    if (config.bandwidth) {
      sdpLines = this.setBitrate(sdpLines, config.bandwidth);
    }

    return sdpLines.join('\r\n');
  }
  
};
function Self (config, listener) {
  // Reference of instance
  var com = this;

  /**
   * The self user id.
   * @attribute id
   * @type String
   * @private
   * @required
   * @for Self
   * @since 0.6.0
   */
  com.id = null;

  /**
   * The self user data.
   * @attribute data
   * @type String | JSON
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.data = config.data;

  /**
   * The self user username.
   * @attribute username
   * @type String
   * @private
   * @required
   * @for Self
   * @since 0.6.0
   */
  com.username = config.username;

  /**
   * The self user timestamp (ISO format).
   * @attribute timeStamp
   * @type String
   * @private
   * @required
   * @for Self
   * @since 0.6.0
   */
  com.timeStamp = config.timeStamp;

  /**
   * The self user credential.
   * @attribute token
   * @type String
   * @private
   * @required
   * @for Self
   * @since 0.6.0
   */
  com.token = config.token;

  /**
   * The self user local stream connection.
   * @attribute streamConnections
   * @param {Stream} (#peerId) The stream to send for this shared peer connection id.
   * @type JSON
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.streamConnections = {};

  /**
   * The self user browser agent information.
   * @attribute agent
   * @param {String} name The user's browser agent name. For other SDKs, it's indicated
   *    by their type of device <code>E.g. ios, android</code>. For components, it's indicated
   *    by their type <code>E.g. MCU, Recording</code>.
   * @param {Integer} version The user's browser agent version. For other SDKs, it's indicated
   *    by their version of device OS <code>ios8 = 8. android kitkat = 4.4</code>. For components, it's indicated
   *    by their version <code>E.g. 0.1.0, 0.2.0</code>.
   * @param {String} webRTCType The user's browser agent webrtc implementation type. For other SDKs or
   *    components, use <code>other</code>.
   * @type JSON
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.agent = {
    name: window.webrtcDetectedBrowser,
    version: window.webrtcDetectedVersion,
    webRTCType: window.webrtcDetectedType
  };

  /**
   * The self user bandwidth configuration. This does fixes
   *   the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * @attribute bandwidth
   * @param {Integer} [audio] The audio bandwidth configuration.
   * @param {Integer} [video] The video bandwidth configuration.
   * @param {Integer} [data] The data bandwidth configuration.
   * @type JSON
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.bandwidth = {};

  /**
   * The handler handles received events.
   * @method routeEvent
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.routeEvent = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.roomName = com.name;

    fn.applyHandler(SelfEventReceivedHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Self: Received event = ', event, data);
  };

  /**
   * The handler handles received socket message events.
   * @method routeMessage
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.routeMessage = function (message) {
    // Messaging events
    var fn = SelfEventMessageHandler[message.type];

    if (typeof fn === 'function') {
      fn(com, message, listener);
    }

    log.debug('Self: Received message = ', event, message);
  };

  /**
   * The handler handles response events.
   * @method respond
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.name = com.name;

    fn.applyHandler(SelfEventResponseHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Self: Responding with event = ', event, data);
  };

  /**
   * Function to subscribe to when self user object is ready to use.
   * @method onready
   * @eventhandler true
   * @for Self
   * @since 0.6.0
   */
  com.onready = function () {};

  /**
   * Function to subscribe to when self user custom user is connected to room.
   * @method onconnect
   * @eventhandler true
   * @for Self
   * @since 0.6.0
   */
  com.onconnect = function () {};

  /**
   * Function to subscribe to when self user custom user data is updated.
   * @method onupdate
   * @eventhandler true
   * @for Self
   * @since 0.6.0
   */
  com.onupdate = function () {};

  /**
   * Function to subscribe to when self has added a stream connection.
   * @method onaddstreamconnection
   * @eventhandler true
   * @for Self
   * @since 0.6.0
   */
  com.onaddstreamconnection = function () {};

  /**
   * Function to subscribe to when self has stopped a stream connection.
   * @method onremovestreamconnection
   * @eventhandler true
   * @for Self
   * @since 0.6.0
   */
  com.onremovestreamconnection = function () {};

  /**
   * Function to subscribe to when self has been disconnected from the room.
   * @method ondisconnect
   * @eventhandler true
   * @for Self
   * @since 0.6.0
   */
  com.ondisconnect = function () {};


  /**
   * Updates the self user data.
   * @method update
   * @for Self
   * @since 0.6.0
   */
  com.update = function (data) {
    com.data = data;

    com.respond('self:update', {
      userData: com.data
    });
  };

  /**
   * Starts a new stream connection.
   * @method addStreamConnection
   * @param {Stream} stream The stream object.
   * @param {String} peerId The shared peer connection id.
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.addStreamConnection = function (stream, peerId) {
    stream.sourceType = 'local';

    stream.routeEventToParent = com.routeEvent;

    com.streamConnections[peerId] = stream;

    com.respond('self:addstreamconnection', {
      peerId: peerId,
      stream: stream
    });
  };

  /**
   * Finds the shared peer connection id from the stream id provided.
   * @method addStreamConnection
   * @param {Stream} stream The stream object.
   * @param {String} peerId The shared peer connection id.
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.findStreamConnectionId = function (streamId) {
    var key;

    for (key in com.streamConnections) {
      if (com.streamConnections.hasOwnProperty(key)) {
        // If matches
        if (com.streamConnections[key].id === streamId) {
          return key;
        }
      }
    }
  };

  /**
   * Stops a stream connection.
   * @method removeStreamConnection
   * @param {String} [peerId] The shared peer connection id. If no
   *    shared peer connection id is provided, it will destroy all streams.
   *    Providing the <code>"main"</code> peer connection id will also result in
   *    destroying all streams.
   * @private
   * @for Self
   * @since 0.6.0
   */
  com.removeStreamConnection = function (peerId) {
    if (fn.isEmpty(peerId) || peerId === 'main') {
      var key;

      for (key in com.streamConnections) {
        if (com.streamConnections.hasOwnProperty(key)) {
          com.streamConnections[key].stop();
        }
      }

    } else {
      var stream = com.streamConnections[peerId];

      if (typeof stream === 'object' ? stream instanceof Stream : false) {
        stream.stop();

      } else {
        log.error('Unable to remove stream connection as there is not existing ' +
          'stream connection to the peer connection', peerId);
      }
    }
  };

  /**
   * Gets the self user info.
   * @method getInfo
   * @param {String} [peerId] The shared peer connection id.
   *   If no shared peer connection id is provided, it will return as
   *   <code>"stream"</code> instead of <code>"streams".(#peerId)</code>.
   * @returns {JSON} The self user streaming configuration and custom data.
   * - <code>userData</code> <var>: <b>type</b> String | JSON</var><br>
   *   The custom data.
   * - <code>agent</code> <var>: <b>type</b> JSON</var><br>
   *   The user's browser agent information.
   * - <code>agent.name</code> <var>: <b>type</b> String</var><br>
   *   The user's browser agent name.
   * - <code>agent.version</code> <var>: <b>type</b> Integer</var><br>
   *   The user's browser agent version.
   * - <code>agent.webRTCType</code> <var>: <b>type</b> String</var><br>
   *   The user's browser webrtc implementation type.
   * - <code>streams</code> <var>: <b>type</b> JSON</var><br>
   *   The list of peer connections streaming.
   * - <code>streams.(#peerId)</code> <var>: <b>type</b> JSON</var><br>
   *   The peer connection streaming information.
   * - <code>streams.(#peerId).audio</code> <var>: <b>type</b> JSON|Boolean</var><br>
   *   The audio streaming information. If there is no stream connection with the peer,
   *   it's <code>false</code>.
   * - <code>streams.(#peerId).audio.stereo</code> <var>: <b>type</b> Boolean</var><br>
   *   The flag that indicates if stereo is enabled for this connection. By default,
   *   it's <code>false</code>.
   * - <code>streams.(#peerId).audio.sourceId</code> <var>: <b>type</b> String</var><br>
   *   The audio MediaStreamTrack source used for this connection.
   * - <code>streams.(#peerId).video</code> <var>: <b>type</b> JSON|Boolean</var><br>
   *   The video streaming information. If there is no stream connection with the peer,
   *   it's <code>false</code>.
   * - <code>streams.(#peerId).video.resolution</code> <var>: <b>type</b> JSON</var><br>
   *   The video stream resolution.
   * - <code>streams.(#peerId).video.resolution.width</code> <var>: <b>type</b> Integer</var><br>
   *   The video stream resolution height.
   * - <code>streams.(#peerId).video.resolution.height</code> <var>: <b>type</b> Integer</var><br>
   *   The video stream resolution width.
   * - <code>streams.(#peerId).video.frameRate</code> <var>: <b>type</b> Integer</var><br>
   *   The video stream resolution framerate.
   * - <code>streams.(#peerId).video.sourceId</code> <var>: <b>type</b> String</var><br>
   *   The video MediaStreamTrack source used for this connection.
   * - <code>streams.(#peerId).status</code> <var>: <b>type</b> JSON</var><br>
   *   The MediaStreamTracks enabled status (muted/unmuted).
   * - <code>streams.(#peerId).status.audioMuted</code> <var>: <b>type</b> Boolean</var><br>
   *   The audio MediaStreamTrack enabled status (muted/unmuted).
   * - <code>streams.(#peerId).status.audioMuted</code> <var>: <b>type</b> Boolean</var><br>
   *   The video MediaStreamTrack enabled status (muted/unmuted).
   * - <code>bandwidth</code> <var>: <b>type</b> JSON</var><br>
   *   The bandwidth configuration for the peer connections.
   *   This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * - <code>bandwidth.data</code> <var>: <b>type</b> Integer</var><br>
   *   The bandwidth configuration for data stream.
   * - <code>bandwidth.video</code> <var>: <b>type</b> Integer</var><br>
   *   The bandwidth configuration for video stream.
   * - <code>bandwidth.audio</code> <var>: <b>type</b> Integer</var><br>
   *   The bandwidth configuration for audio stream.
   * @for Self
   * @since 0.6.0
   */
  com.getInfo = function (peerId) {
    var data = {};

    // Pass jshint error
    var getStreamSettingsFn = function (stream) {
      stream = stream || {};

      return stream.config || {
        audio: false,
        video: false,
        status: {
          audioMuted: true,
          videoMuted: true
        }
      };
    };

    data.userData = com.data;
    data.agent = com.agent;
    data.bandwidth = com.bandwidth;

    // Get all stream connections
    if (!fn.isEmpty(peerId)) {
      data.stream = getStreamSettingsFn(com.streamConnections[peerId]);

    // Get that stream connection only
    } else {
      data.streams = {};

      var key;

      for (key in com.streamConnections) {
        if (com.streamConnections.hasOwnProperty(key)) {
          data.streams[key] = getStreamSettingsFn(com.streamConnections[key]);
        }
      }
    }

    return data;
  };

  com.respond('self:ready', config);
}

var SelfEventReceivedHandler = {

  stream: {
    stop: function (com, data, listener) {
      // Trigger the event
      var peerId = com.findStreamConnectionId(data.id);

      com.respond('self:removestreamconnection', {
        streamId: data.id,
        peerId: key
      });
    }
  }
};


/**
 * Handles all the events to respond to other parent classes.
 * @attribute SelfEventResponseHandler
 * @private
 * @for Self
 * @since 0.6.0
 */
var SelfEventResponseHandler = {
  /**
   * Event fired when self object to ready to use.
   *   At this stage, the self user id is empty as user has not joined the room.
   * @event self:ready
   * @for Self
   * @since 0.6.0
   */
  ready: function (com, data, listener) {
    if (typeof com.onready === 'function') {
      com.onready();
    }
  },

  /**
   * Event fired when self has updated data.
   * @event self:update
   * @param {JSON|String} userData The updated self custom data.
   * @for Self
   * @since 0.6.0
   */
  update: function (com, data, listener) {
    if (typeof com.onupdate === 'function') {
      com.onupdate(data);
    }
  },

  /**
   * Event fired when self has added a new stream for connection.
   * @event self:addstreamconnection
   * @for Self
   * @since 0.6.0
   */
  addstreamconnection: function (com, data, listener) {
    if (typeof com.onaddstreamconnection === 'function') {
      com.onaddstreamconnection(data);
    }
  },

  /**
   * Event fired when self has removed a stream connection.
   * @event self:removestreamconnection
   * @for Self
   * @since 0.6.0
   */
  removestreamconnection: function (com, data, listener) {
    delete com.streamConnections[data.peerId];

    if (typeof com.onremovestreamconnection === 'function') {
      com.onremovestreamconnection(data);
    }
  },

  /**
   * Event fired when self user is connected to room.
   * @event self:connect
   * @for Self
   * @since 0.6.0
   */
  connect: function (com, data, listener) {
    if (typeof com.onconnect === 'function') {
      com.onconnect();
    }
  },

  /**
   * Event fired when self user is disconnected from room.
   * @event self:disconnect
   * @for Self
   * @since 0.6.0
   */
  disconnect: function (com, data, listener) {
    if (typeof com.ondisconnect === 'function') {
      com.ondisconnect(data);
    }
  }
};

/**
 * Handles all the message events received from socket.
 * @attribute SelfEventMessageHandler
 * @private
 * @for Self
 * @since 0.6.0
 */
var SelfEventMessageHandler = {

  inRoom: function (com, data, listener) {
    com.id = data.sid;
    com.respond('self:connect');
  }
};

/**
 * Handles the self class events.
 * @method SelfHandler
 * @param {Object} com The reference to the class object.
 * @param {String} event The event name.
 * @param {JSON} data The event data response.
 * @param {Function} listener The listener function.
 * @private
 * @for Self
 * @since 0.6.0
 */
var SelfHandler = function (com, event, data, listener) {
  var params = event.split(':');
  data = data || {};

  // Messaging events
  if (event.indexOf('message:') === 0) {

    fn.applyHandler(SelfEventMessageHandler, params, [com, data, listener]);

  } else {
    // Class events
    if (event.indexOf('self:') === 0) {
      data.id = com.id;

      fn.applyHandler(SelfEventResponseHandler, params, [com, data, listener]);

    } else {
      data.selfId = com.selfId;

      fn.applyHandler(SelfEventReceivedHandler, params, [com, data, listener]);
    }

    listener(event, data);
  }
};

function Socket(config, listener) {
  'use strict';

  // Prevent undefined listener error
  listener = listener || function (event, data) {};

  // Reference of instance
  var com = this;

  /**
   * The signalling server.
   * @attribute server
   * @type String
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.server = config.server;

  /**
   * The signalling server protocol to connect with.
   * @attribute protocol
   * @type String
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.protocol = globals.enforceSSL ? 'https:' : window.location.protocol;

  /**
   * The signalling server port that is connecting with.
   * @attribute server
   * @type Integer
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.port = null;

  /**
   * The timeout the Socket should wait for before throwing an error.
   * @attribute timeout
   * @type Integer
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.timeout = globals.socketTimeout || 0;

  /**
   * The interval to wait before sending the next message.
   * @attribute messageInterval
   * @type Integer
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.messageInterval = 1000;

   /**
   * The queue of messages (throttle) before sending the next
   * @attribute messageQueue
   * @type Array
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.messageQueue = [];

  /**
   * The list of available signalling server ports.
   * @attribute ports
   * @param {Array} http: The list of HTTP ports.
   * @param {Integer} http:.(#index) The port number.
   * @param {Array} https: The list of HTTPS ports.
   * @param {Integer} https:.(#index) The port number.
   * @type JSON
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.ports = {
    'https:': config.httpsPortList,
    'http:': config.httpPortList
  };

  /**
   * The socket configuration passed into the <code>io.socket</code>.
   * @attribute config
   * @param {Boolean} forceNew The flag to indicate if socket.io should
   *   force a new connection everytime.
   * @param {Boolean} [reconnection=false] The flag to indicate if socket.io
   *   should reconnect if connection attempt fails. Reconnection is set to
   *   <code>true</code> only when it's reconnecting the last port of the fallback
   *   XHRPolling connection.
   * @param {Array} transports The transports that are used for the socket.io connection.
   * - <code>['websocket']</code> is used for WebSocket connection.
   * - <code>['xhr-polling', 'jsonp-polling', 'polling']</code> is used for XHRPoling connection.
   * @param {Integer} [timeout] The socket.io timeout to wait for an established connection before
   *   throwing an exception.
   * @type JSON
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.config = {};

  /**
   * The type of socket connection. There are two types:
   * - <code>"WebSocket"</code> indicates a WebSocket connection.
   * - <code>"XHRPolling"</code> indicates a LongPolling connection.
   * @attribute type
   * @type String
   * @default "WebSocket"
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.type = config.type || 'WebSocket';

  /**
   * The socket.io object.
   * @attribute Socket
   * @type Object
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.Socket = null;


  /**
   * Function to subscribe to when socket object is ready to use.
   * @method onready
   * @eventhandler true
   * @for Socket
   * @since 0.6.0
   */
  com.onready = function () {};

  /**
   * Function to subscribe to when socket has been connected.
   * @method onconnect
   * @eventhandler true
   * @for Socket
   * @since 0.6.0
   */
  com.onconnect = function () {};

  /**
   * Function to subscribe to when socket has been disconnected.
   * @method ondisconnect
   * @eventhandler true
   * @for Socket
   * @since 0.6.0
   */
  com.ondisconnect = function () {};

  /**
   * Function to subscribe to when socket has connection error.
   * @method onconnecterror
   * @eventhandler true
   * @for Socket
   * @since 0.6.0
   */
  com.onconnecterror = function () {};

  /**
   * Function to subscribe to when socket attempts to reconnect.
   * @method onreconnect
   * @eventhandler true
   * @for Socket
   * @since 0.6.0
   */
  com.onreconnect = function () {};

  /**
   * Function to subscribe to when socket has an exception.
   * @method onerror
   * @eventhandler true
   * @for Socket
   * @since 0.6.0
   */
  com.onerror = function () {};


  /**
   * The handler that manages all triggers or relaying events.
   * @method handler
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');
    data = data || {};

    // Class events
    data.server = com.server;
    data.port = com.port;
    data.type = com.type;
    data.protocol = com.protocol;

    fn.applyHandler(SocketEventResponseHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('Socket: Responding with event = ', event, data);
  };

  /**
   * Starts the connection to the signalling server.
   * @method connect
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.connect = function () {
    com.port = com.ports[window.location.protocol][0];

    if (com.type === 'XHRPolling') {
      com.Socket = new com.XHRPolling();
    } else {
      com.Socket = new com.WebSocket();
    }
  };

  /**
   * Stops the connection to the signalling server.
   * @method disconnect
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.disconnect = function () {
    com.Socket.disconnect();
  };

  /**
   * Sends data to the signaling server for relaying.
   * NOTE to Thanh: Please implement the throttle for messaging here.
   * @method send
   * @param {JSON} data The data to send.
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.send = function (data) {
    /*var interval = com.messageInterval;

    if (data.type === 'enter') {
      interval = 0;
    }
    setTimeout(function () {*/
      com.Socket.send(JSON.stringify(data));
      com.respond('socket:message', {
        message: data,
        sourceType: 'local'
      });
    //}, interval);
  };

  /**
   * Handles the event when socket is connected to signaling.
   * @method bindOnConnect
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.bindOnConnect = function () {
    com.respond('socket:connect');

    com.Socket.removeAllListeners();

    com.Socket.on('disconnect', function () {
      com.respond('socket:disconnect');

      if (typeof com.onerror === 'function') {
        com.ondisconnect();
      }
    });

    com.Socket.on('message', function (result) {
      var data = JSON.parse(result);

      // Check if bulk message
      if (data.type === 'group') {
        log.info('Received a group message. Breaking down messages into individual messages', data);

        var i;

        for (i = 0; i < data.list.length; i++) {
          var message = data.list[i];
          com.respond('socket:message', {
            message: message,
            sourceType: 'remote'
          });
        }

      } else {
        com.respond('socket:message', {
          message: data,
          sourceType: 'remote'
        });
      }
    });

    com.Socket.on('error', function (error) {
      com.respond('socket:error', {
        error: error
      });

      if (typeof com.onerror === 'function') {
        com.onerror(error);
      }
    });

    if (typeof com.onconnect === 'function') {
      com.onconnect();
    }
  };

  /**
   * Handles the event when socket have a connection error.
   * @method bindOnConnectError
   * @param {Object} error The socket.io connection error.
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.bindOnConnectError = function (error) {
    com.respond('socket:connecterror', {
      error: error
    });

    var ports = com.ports[window.location.protocol];
    var i;

    for (i = 0; i < ports.length; i += 1) {
      // Get current port
      if (ports[i] === com.port) {
        // Check if reach the end
        if ((i + 1) < ports.length) {
          // Set if there is still the next port
          com.port = ports[i + 1];
          com.reconnect();

        } else {
          if (com.type === 'WebSocket') {
            com.type = 'XHRLongPolling';
            com.port = ports[0];
            com.reconnect();
          }
        }
        break;
      }
    }

    if (typeof com.onconnecterror === 'function') {
      com.onconnecterror(error);
    }
  };

  /**
   * Restarts the connection to the signaling server when attempt to
   *   establish socket connection failed.
   * @method reconnect
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.reconnect = function () {
    com.Socket.removeAllListeners();

    switch (com.type) {
    case 'WebSocket':
      com.Socket = com.WebSocket();
      break;
    //case 'XHRPolling':
    default:
      com.Socket = com.XHRPolling();
    }

    com.respond('socket:reconnect');
  };

  /**
   * Creates a WebSocket connection in socket.io.
   * @method WebSocket
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.WebSocket = function () {
    var options = {
      forceNew: true,
      reconnection: false,
      transports: ['websocket']
    };

    if (com.timeout !== 0) {
      options.timeout = com.timeout;
    }

    var server = com.protocol + '//' + com.server + ':' + com.port;

    var socket = io.connect(server, options);

    com.config = options;

    socket.on('connect', com.bindOnConnect);
    socket.on('connect_error', com.bindOnConnectError);

    return socket;
  };

  /**
   * Creates a XHR Long-polling connection in socket.io.
   * @method XHRPolling
   * @private
   * @for Socket
   * @since 0.6.0
   */
  com.XHRPolling = function () {
    var ports = com.ports[window.location.protocol];

    var options = {
      forceNew: true,
      reconnection: com.port === ports[ports.length - 1],
      transports: ['xhr-polling', 'jsonp-polling', 'polling']
    };

    if (com.timeout !== 0) {
      options.timeout = com.timeout;
    }

    var server = com.protocol + '//' + com.server + ':' + com.port;

    var socket = io.connect(server, options);

    com.config = options;

    socket.on('connect', com.bindOnConnect);
    socket.on('reconnect', com.bindOnConnect);
    socket.on('connect_error', com.bindOnConnectError);
    socket.on('reconnect_failed', com.bindOnConnectError);

    return socket;
  };

  // Throw an error if socket.io is not loaded
  if (!window.io) {
    throw new Error('Required dependency socket.io not found');
  }

  fn.runSync(function () {
    com.respond('socket:ready', config);
  });
}

var SocketEventResponseHandler = {

  /**
   * Event fired when the socket object is ready to use.
   * @event socket:ready
   * @for Socket
   * @since 0.6.0
   */
  ready: function (com, data, listener) {
    if (typeof com.onstart === 'function') {
      com.onstart(data);
    }
  },

  /**
   * Event fired when socket occurs an exception during connection.
   * @event socket:error
   * @param {Object} error The getUserMedia or event error.
   * @for Socket
   * @since 0.6.0
   */
  error: function (com, data, listener) {
    if (typeof com.onerror === 'function') {
      com.onerror(data);
    }
  },

  /**
   * Event fired when socket connection has been established to the signaling server.
   * @event socket:connect
   * @param {Object} error The getUserMedia or event error.
   * @for Socket
   * @since 0.6.0
   */
  connect: function (com, data, listener) {
    if (typeof com.onconnect === 'function') {
      com.onconnect(data);
    }
  },

  /**
   * Event fired when socket connection fails to connect to the signaling server.
   * @event socket:connecterror
   * @param {Object} error The getUserMedia or event error.
   * @for Socket
   * @since 0.6.0
   */
  connecterror: function (com, data, listener) {
    if (typeof com.onconnecterror === 'function') {
      com.onconnecterror(data);
    }
  },

  /**
   * Event fired when socket attempts to reconnect with signaling server when attempt
   *  to establish connection fails.
   * @event socket:reconnect
   * @for Socket
   * @since 0.6.0
   */
  reconnect: function (com, data, listener) {
    if (typeof com.onreconnect === 'function') {
      com.onreconnect(data);
    }
  },

  /**
   * Event fired when socket sends a message to the signaling server.
   * @event socket:message
   * @param {String} event The message event type.
   * @param {JSON} data The data received from server.
   * @param {String} sourceType The source type of the message received.
   * @for Socket
   * @since 0.6.0
   */
  message: function (com, data, listener) {},

  /**
   * Event fired when socket connection with signaling server has been disconnected.
   * @event socket:disconnect
   * @for Socket
   * @since 0.6.0
   */
  disconnect: function (com, data, listener) {
    if (typeof com.ondisconnect === 'function') {
      com.ondisconnect(data);
    }
  }
};

function Stream(stream, config, listener) {
  'use strict';

  // Prevent undefined listener error
  listener = listener || function (event, data) {};

  // Reference of instance
  var com = this;

  /**
   * The stream id.
   * @attribute id
   * @type String
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.id = null;

  /**
   * The getUserMedia constraints.
   * @attribute constraints
   * @type JSON
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.constraints = null;

  /**
   * The streaming configuration.
   * @attribute config
   * @type JSON
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.config = config;

  /**
   * The stream source origin.
   * There are two types of sources:
   * - <code>"local"</code> indicates that the stream came from self user.
   * - <code>"remote</code> indicates that the stream came from other users.
   * @attribute sourceType
   * @type String
   * @default "local"
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.sourceType = 'local';

  /**
   * The MediaStream object.
   * @attribute MediaStream
   * @type Object
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.MediaStream = null;


  /**
   * Function to subscribe to when stream object is ready to use.
   * @method onstart
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.onstart = function () { };

  /**
   * Function to subscribe to when getUserMedia throws an exception or event has error.
   * @method onerror
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.onerror = function () { };

  /**
   * Function to subscribe to when MediaStreamTrack of the MediaStream object has started.
   * @method ontrackstart
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.ontrackstart = function () { };

  /**
   * Function to subscribe to when MediaStreamTrack of the MediaStream object has stopped.
   * @method ontrackstop
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.ontrackstop = function () { };

  /**
   * Function to subscribe to when MediaStreamTrack of the MediaStream object has been disabled (muted).
   * @method ontrackmute
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.ontrackmute = function () { };

  /**
   * Function to subscribe to when MediaStreamTrack of the MediaStream object has been enabled (unmuted).
   * @method ontrackunmute
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.ontrackunmute = function () { };

  /**
   * Function to subscribe to when MediaStream object has ended.
   * @method onstop
   * @eventhandler true
   * @for Stream
   * @since 0.6.0
   */
  com.onstop = function () { };


  /**
   * The handler that the parent classes utilises to listen to events.
   * @method routeEventToParent
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.routeEventToParent = function () {};

  /**
   * The handler handles response events.
   * @method respond
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.id = com.id;

    fn.applyHandler(StreamEventResponseHandler, params, [com, data, listener]);

    listener(event, data);

    if (typeof com.routeEventToParent === 'function') {
      com.routeEventToParent(event, data);
    }

    log.debug('Stream: Responding with event = ', event, data);
  };

  /**
   * Starts a MediaStream connection with getUserMedia.
   * @method start
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.start = function () {
    window.getUserMedia(com.constraints, com.bind, function (error) {
      com.respond('stream:error', {
        error: error,
        sourceType: com.sourceType
      });
    });
  };

  /**
   * Binds events to MediaStream object.
   * @method bind
   * @param {Object} bindStream The MediaStream object to bind events to.
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.bind = function (bindStream) {
    // Set a MediaStream id if Firefox or Chrome doesn't
    com.id = fn.generateUID();

    // Bind events to MediaStream
    // bindStream.onaddtrack = com.onAddTrack;
    // bindStream.onremovetrack = com.onRemoveTrack;
    bindStream.onended = com.bindOnStreamEnded(bindStream);
    bindStream.newId = com.id;

    // Bind track events
    com.bindTracks(bindStream.getAudioTracks());
    com.bindTracks(bindStream.getVideoTracks());

    com.MediaStream = bindStream;

    com.respond('stream:start', {
      label: bindStream.label,
      constraints: com.constraints,
      sourceType: com.sourceType
    });
  };

  /**
   * Binds events to MediaStreamTrack object.
   * @method bindTracks
   * @param {Array} bindTracks The MediaStreamTracks from the MediaStream object.
   * @param {Object} bindTracks.n The MediaStreamTrack object to bind events to.
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.bindTracks = function (bindTracks) {
    var i;

    // Pass jshint error
    var bindOnEnded = function () {
      com.respond('stream:track:stop', {
        trackId: track.newId,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        sourceType: com.sourceType
      });
    };

    // Pass jshint error
    var bindOnMute = function () {
      com.respond('stream:track:mute', {
        trackId: track.newId,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        sourceType: com.sourceType
      });
    };

    // Pass jshint error
    var bindOnUnmute = function () {
      com.respond('stream:track:unmute', {
        trackId: track.newId,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        sourceType: com.sourceType
      });
    };

    for (i = 0; i < bindTracks.length; i += 1) {
      var track = bindTracks[i];

      track.newId = track.id || fn.generateUID();

      // Bind events to MediaStreamTrack
      // bindTracks[i].onstarted = com.onStarted;
      track.onended = bindOnEnded;

      // Un-implemented events functions
      track.onmute = bindOnMute;
      track.onunmute = bindOnUnmute;
      // track.onoverconstrained = function(event) {};

      // Set the mute status
      var isEnabled = true;

      if (track.kind === 'audio') {
        isEnabled = (typeof com.config.audio === 'object') ?
          !!!com.config.status.audioMuted : !!com.config.audio;
      } else {
        isEnabled = (typeof com.config.video === 'object') ?
          !!!com.config.status.videoMuted : !!com.config.video;
      }

      track.enabled = isEnabled;

      com.respond('stream:track:start', {
        trackId: track.newId,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        sourceType: com.sourceType
      });
    }
  };

  /**
   * Attaches the MediaStream object to a video element.
   * @method attachElement
   * @param {DOM} element The video DOM element to bind the MediaStream to.
   * @for Stream
   * @since 0.6.0
   */
  com.attachElement = function (element) {
    if (window.webrtcDetectedBrowser === 'firefox' &&
      (com.MediaStream instanceof LocalMediaStream) === false) {
      window.reattachMediaStream(element, com.MediaStream.checkingVideo);

    } else {
      window.attachMediaStream(element, com.MediaStream);
    }
  };

  /**
   * Handles the differences for non-implemented onended event for MediaStream.
   * @method bindOnStreamEnded
   * @param {Object} bindStream The MediaStream object to bind the event to.
   * @return {Function|Object} The interval object workaround for Firefox or the
   *   event handler function for supported browsers.
   * @private
   * @for Stream
   * @since 0.6.0
   */
  com.bindOnStreamEnded = function (bindStream) {
    var fn = function () {
      com.respond('stream:stop', {
        label: stream.label,
        constraints: com.constraints,
        sourceType: com.sourceType
      });

      if (typeof com.onended === 'function') {
        com.onended(bindStream);
      }
    };

    // Firefox browsers
    if (window.webrtcDetectedBrowser === 'firefox') {
      // LocalMediaStream
      if (bindStream.constructor === LocalMediaStream) {
        return setInterval(function () {
          if (bindStream.hasEnded) {
            clearInterval(bindStream.onended);
            // trigger that it has ended
            fn();
          }

          if (typeof bindStream.recordedTime === 'undefined') {
            bindStream.recordedTime = 0;
          }

          if (bindStream.recordedTime === bindStream.currentTime) {
            clearInterval(bindStream.onended);
            // trigger that it has ended
            fn();

          } else {
            bindStream.recordedTime = bindStream.currentTime;
          }
        }, 1000);

        // Remote MediaStream
      } else {
        return (function () {
          // Use a video to attach to check if stream has ended
          var video = document.createElement('video');
          video.onstreamended = setInterval(function () {
            if (bindStream.hasEnded) {
              clearInterval(video.onstreamended);
              fn();
            }

            if (!fn.isEmpty(video.mozSrcObject)) {
              if (video.mozSrcObject.ended === true) {
                clearInterval(video.onstreamended);
                fn();
              }
            }
          }, 1000);

          bindStream.checkingVideo = video;

          window.attachMediaStream(video, bindStream);
          return video;
        })();
      }
    }
    // Non-firefox browsers
    return fn;
  };

  /**
   * Mutes all audio MediaStreamTracks of the MediaStream object.
   * @method muteAudio
   * @for Stream
   * @since 0.6.0
   */
  com.muteAudio = function () {
    var tracks = com.MediaStream.getAudioTracks();
    var i;

    for (i = 0; i < tracks.length; i += 1) {
      var track = tracks[i];

      track.enabled = false;

      track.onmute();
    }
  };

  /**
   * Unmutes all audio MediaStreamTracks of the MediaStream object.
   * @method unmuteAudio
   * @for Stream
   * @since 0.6.0
   */
  com.unmuteAudio = function () {
    var tracks = com.MediaStream.getAudioTracks();
    var i;

    for (i = 0; i < tracks.length; i += 1) {
      var track = tracks[i];

      track.enabled = true;

      track.onunmute();
    }
  };

  /**
   * Stops all audio MediaStreamTracks streaming in the MediaStream object.
   * @method stopAudio
   * @for Stream
   * @since 0.6.0
   */
  com.stopAudio = function () {
    var tracks = com.MediaStream.getAudioTracks();
    var i;

    for (i = 0; i < tracks.length; i += 1) {
      var track = tracks[i];

      track.stop();

      // Workaround for firefox as it does not have stop events
      if (window.webrtcDetectedBrowser === 'firefox') {
        if (track.hasEnded !== true) {
          track.onended(track);
          track.hasEnded = true;
        }
      }
    }

    // Workaround for firefox as it does not have stop stream when all track ends
    if (window.webrtcDetectedBrowser === 'firefox') {
      if (com.MediaStream.videoEnded === true) {
        com.MediaStream.hasEnded = true;
      }
      com.MediaStream.audioEnded = true;
    }
  };

  /**
   * Mutes all video MediaStreamTracks of the MediaStream object.
   * @method muteVideo
   * @for Stream
   * @since 0.6.0
   */
  com.muteVideo = function () {
    var tracks = com.MediaStream.getVideoTracks();
    var i;

    for (i = 0; i < tracks.length; i += 1) {
      var track = tracks[i];

      track.enabled = false;

      track.onmute();
    }
  };

  /**
   * Unmutes all video MediaStreamTracks of the MediaStream object.
   * @method unmuteVideo
   * @for Stream
   * @since 0.6.0
   */
  com.unmuteVideo = function () {
    var tracks = com.MediaStream.getVideoTracks();
    var i;

    for (i = 0; i < tracks.length; i += 1) {
      var track = tracks[i];

      track.enabled = true;

      track.onunmute();
    }
  };

  /**
   * Stops all video MediaStreamTracks streaming of the MediaStream object.
   * @method stopVideo
   * @for Stream
   * @since 0.6.0
   */
  com.stopVideo = function () {
    var tracks = com.MediaStream.getVideoTracks();
    var i;

    for (i = 0; i < tracks.length; i += 1) {
      var track = tracks[i];

      track.stop();

      // Workaround for firefox as it does not have stop events
      if (window.webrtcDetectedBrowser === 'firefox') {
        if (track.hasEnded !== true) {
          track.onended(tracks[i]);
          track.hasEnded = true;
        }
      }
    }

    // Workaround for firefox as it does not have stop stream when all track ends
    if (window.webrtcDetectedBrowser === 'firefox') {
      if (com.MediaStream.audioEnded === true) {
        com.MediaStream.hasEnded = true;
      }
      com.MediaStream.videoEnded = true;
    }
  };

  /**
   * Stops MediaStream object streaming.
   * @method stop
   * @for Stream
   * @since 0.6.0
   */
  com.stop = function () {
    // Stop MediaStream tracks
    com.stopVideo();
    com.stopAudio();
    // Stop MediaStream
    com.MediaStream.stop();
  };


  // Throw an error if adapterjs is not loaded
  if (!window.attachMediaStream) {
    throw new Error('Required dependency adapterjs not found');
  }

  // Bind or start MediaStream
  if (fn.isEmpty(stream)) {
    var audioSettings = StreamParser.parseAudioConfig(config.audio);
    var videoSettings = StreamParser.parseVideoConfig(config.video);
    var statusSettings = StreamParser.parseMutedConfig(config);

    com.constraints = {
      audio: audioSettings.userMedia,
      video: videoSettings.userMedia
    };

    com.config = {
      audio: audioSettings.settings,
      video: audioSettings.settings,
      status: statusSettings
    };

    com.start();

  } else {
    // Allow javascript to return object before code execution
    fn.runSync(function () {
      com.config = {
        audio: fn.isSafe(function () { return stream.getAudioTracks().length > 0; }),
        video: fn.isSafe(function () { return stream.getVideoTracks().length > 0; })
      };
      com.bind(stream);
    });
  }
}

var StreamEventResponseHandler = {
  /**
   * Event fired when the MediaStream has started and that the stream object is ready to use.
   * @event stream:start
   * @for Stream
   * @since 0.6.0
   */
  start: function (com, data, listener) {
    if (typeof com.onstart === 'function') {
      com.onstart(data.MediaStream);
    }
  },
  
  /**
   * Event fired when usually getUserMedia fails or an exception has occurred during the
   *   MediaStream object handling.
   * @event stream:error
   * @param {Object} error The getUserMedia or event error.
   * @for Stream
   * @since 0.6.0
   */
  error: function (com, data, listener) {
    if (typeof com.onerror === 'function') {
      com.onerror(data);
    }
  },

  track: {
    /**
     * Event fired when the MediaStreamTrack of the MediaStream object has started and
     *   that the track is ready to use.
     * @event stream:track:start
     * @for Stream
     * @since 0.6.0
     */
    start: function (com, data, listener) {
      if (typeof com.ontrackstart === 'function') {
        com.ontrackstart(data);
      }
    },
    
    /**
     * Event fired when the MediaStreamTrack of the MediaStream object has stopped.
     * @event stream:track:stop
     * @for Stream
     * @since 0.6.0
     */
    stop: function (com, data, listener) {
      if (typeof com.ontrackstop === 'function') {
        com.ontrackstop(data);
      }
    },
    
    /**
     * Event fired when the MediaStreamTrack of the MediaStream object has been disabled (muted).
     * @event stream:track:mute
     * @for Stream
     * @since 0.6.0
     */
    mute: function (com, data, listener) {
      if (typeof com.ontrackmute === 'function') {
        com.ontrackmute(data);
      }
    },
    
    /**
     * Event fired when the MediaStreamTrack of the MediaStream object has been enabled (unmuted).
     * @event stream:track:unmute
     * @for Stream
     * @since 0.6.0
     */
    unmute: function (com, data, listener) {
      if (typeof com.ontrackunmute === 'function') {
        com.ontrackunmute(data);
      }
    },
  },
  
  /**
   * Event fired when the MediaStream object has stopped.
   * @event stream:stop
   * @for Stream
   * @since 0.6.0
   */
  stop: function (com, data, listener) {
    if (typeof com.onstop === 'function') {
      com.onstop(data);
    }
  }
};

/**
 * Handles the stream class events.
 * @method StreamHandler
 * @param {Object} com The reference to the class object.
 * @param {String} event The event name.
 * @param {JSON} data The event data response.
 * @param {Function} listener The listener function.
 * @private
 * @for Stream
 * @since 0.6.0
 */
var StreamHandler = function (com, event, data, listener) {
  var params = event.split(':');

  // Class events
  data.id = com.id;

  fn.applyHandler(StreamEventResponseHandler, params, [com, data, listener]);

  listener(event, data);
};
var StreamParser = {
  /**
   * Stores the default Stream / Bandwidth settings.
   * @property defaultConfig
   * @param {JSON} audio The default audio settings.
   * @param {Boolean} audio.stereo The default flag to indicate if stereo is enabled.
   * @param {JSON} video The default video settings.
   * @param {JSON} video.resolution The default video resolution.
   * @param {Integer} video.resolution.width The default video resolution width.
   * @param {Integer} video.resolution.height The default video resolution height.
   * @param {Integer} video.frameRate The default video maximum framerate.
   * @param {JSON} bandwidth The default bandwidth streaming settings.
   * @param {Integer} bandwidth.audio The default audio bandwidth bitrate.
   * @param {Integer} bandwidth.video The default video bandwidth bitrate.
   * @param {Integer} bandwidth.data The default DataChannel data bandwidth bitrate.
   * @type JSON
   * @private
   * @since 0.6.0
   */
  defaultConfig: {
    audio: {
      stereo: false
    },
    video: {
      resolution: {
        width: 640,
        height: 480
      },
      frameRate: 50
    },
    bandwidth: {
      audio: 50,
      video: 256,
      data: 1638400
    }
  },
  
  /**
   * Parses the audio configuration for the getUserMedia constraints.
   * @property parseAudioConfig
   * @param {JSON|Boolean} options The audio settings or flag if audio is enabled.
   * @param {Boolean} options.stereo The flag to indicate if stereo is enabled.
   * @type Function
   * @return {JSON}
   * - options: The configuration.
   * - userMedia: The getUserMedia constraints.
   * @private
   * @since 0.6.0
   */
  parseAudioConfig: function (options) {
    options = (typeof options === 'object') ? options : !!options;

    var userMedia = false;
    var tempOptions = {};
  
    // Cleaning of unwanted keys
    if (options !== false) {
      options = (typeof options === 'boolean') ? {} : options;
      tempOptions.stereo = !!options.stereo;
      tempOptions.sourceId = options.sourceId;

      options = tempOptions;
    }

    userMedia = (typeof options === 'object') ?
      true : options;

    // Add video sourceId
    if (tempOptions.sourceId && tempOptions.audio !== false) {
      userMedia = { optional: [{ sourceId: tempOptions.sourceId }] };
    }

    return {
      settings: options,
      userMedia: userMedia
    };
  },
  
  /**
   * Parses the video configuration for the getUserMedia constraints.
   * @property parseVideoConfig
   * @param {JSON} options The video settings.
   * @param {JSON} options.resolution The video resolution.
   * @param {Integer} options.resolution.width The video resolution width.
   * @param {Integer} options.resolution.height The video resolution height.
   * @param {Integer} options.frameRate The video maximum framerate.
   * @type Function
   * @return {JSON}
   * - options: The configuration.
   * - userMedia: The getUserMedia constraints.
   * @private
   * @since 0.6.0
   */
  parseVideoConfig: function (options) {
    options = (typeof options === 'object') ?
    options : !!options;

    var userMedia = false;
    var tempOptions = {};

    // Cleaning of unwanted keys
    if (options !== false) {
      options = (typeof options === 'boolean') ?
        { resolution: {} } : options;
      
      // set the resolution parsing
      options.resolution = options.resolution || {};
      
      tempOptions.resolution = tempOptions.resolution || {};
      
      // set resolution
      tempOptions.resolution.width = options.resolution.width ||
        this.defaultConfig.video.resolution.width;
      
      tempOptions.resolution.height = options.resolution.height ||
        this.defaultConfig.video.resolution.height;
      
      // set the framerate
      tempOptions.frameRate = options.frameRate ||
        this.defaultConfig.video.frameRate;
      
      // set the sourceid
      tempOptions.sourceId = options.sourceId;
      
      options = tempOptions;

      userMedia = {
        mandatory: {
          //minWidth: tempOptions.resolution.width,
          //minHeight: tempOptions.resolution.height,
          maxWidth: tempOptions.resolution.width,
          maxHeight: tempOptions.resolution.height,
          //minFrameRate: tempOptions.frameRate,
          maxFrameRate: tempOptions.frameRate
        },
        optional: []
      };
      
      // Add video sourceId
      if (tempOptions.sourceId) {
        userMedia.optional[0] = { sourceId: tempOptions.sourceId };
      }

      //Remove maxFrameRate for AdapterJS to work with Safari
      if (window.webrtcDetectedType === 'plugin') {
        delete userMedia.mandatory.maxFrameRate;
      }
    }

    return {
      settings: options,
      userMedia: userMedia
    };
  },
  
  /**
   * Parses the bandwidth configuration.
   * - In low-bandwidth environment, it's mostly managed by the browser.
   *   However, this option enables you to set low bandwidth for high-bandwidth
   *   environment whichever way is possible.
   * @property parseBandwidthConfig
   * @param {JSON} options The bandwidth streaming settings.
   * @param {Integer} options.audio The audio bandwidth bitrate.
   * @param {Integer} options.video The video bandwidth bitrate.
   * @param {Integer} options.data The DataChannel data bandwidth bitrate.
   * @type Function
   * @return {JSON}
   * - options: The configuration.
   * - userMedia: The getUserMedia constraints.
   * @private
   * @since 0.6.0
   */
  parseBandwidthConfig: function (options) {
    options = (typeof options === 'object') ? options : {};

    // set audio bandwidth
    options.audio = (typeof options.audio === 'number') ?
      options.audio : this.defaultConfig.bandwidth.audio;
    
    // set video bandwidth
    options.video = (typeof options.video === 'number') ?
      options.video : this.defaultConfig.bandwidth.video;
    
    // set data bandwidth
    options.data = (typeof options.data === 'number') ?
      options.data : this.defaultConfig.bandwidth.data;

    // set the settings
    return options;
  },
  
  /**
   * Parses the stream muted configuration.
   * @property parseMutedConfig
   * @param {JSON} options The stream muted settings.
   * @param {Integer} options.audioMuted The flag to indicate if audio stream is muted.
   * @param {Integer} options.videoMuted The flag to indicate if video stream is muted.
   * @type Function
   * @return {JSON}
   * - options: The configuration.
   * - userMedia: The getUserMedia constraints.
   * @private
   * @since 0.6.0
   */
  parseMutedConfig: function (options) {
    // the stream options
    options = (typeof options === 'object') ?
      options : { audio: false, video: false };

    var updateAudioMuted = (typeof options.audio === 'object') ?
      !!options.audio.mute : !options.audio;
    var updateVideoMuted = (typeof options.video === 'object') ?
      !!options.video.mute : !options.video;

    return {
      audioMuted: updateAudioMuted,
      videoMuted: updateVideoMuted
    };
  },

  parseDefaultConfig: function (options) {
    var hasMediaChanged = false;

    // prevent undefined error
    options = options || {};

    log.debug('Parsing stream settings. Default stream options:', options);

    options.maxWidth = (typeof options.maxWidth === 'number') ? options.maxWidth :
      640;
    options.maxHeight = (typeof options.maxHeight === 'number') ? options.maxHeight :
      480;

    // parse video resolution. that's for now
    this.defaultConfig.video.resolution.width = options.maxWidth;
    this.defaultConfig.video.resolution.height = options.maxHeight;

    log.debug('Parsed default media stream settings', this.defaultConfig);
  }
};
var StreamTrackList = {
  audio: [],
  
  video: [],
  
  get: function (defer) {
    // Firefox does not support MediaStreamTrack.getSources yet
    if (window.webrtcDetectedBrowser === 'firefox') {
      StreamTrackList.readyState = 'done';

    // Chrome / Plugin / Opera supports MediaStreamTrack.getSources
    } else {
      // Retrieve list
      MediaStreamTrack.getSources(function (trackList) {
        var i;
        
        for (i = 0; i < trackList.length; i += 1) {
          var track = trackList[i];
          var data = {};

          // MediaStreamTrack label - FaceHD Camera
          data.label = track.label || (track.kind + '_' + (i + 1));
          // MediaStreamTrack kind - audio / video
          data.kind = track.kind;
          // MediaStreamTrack id - The identifier
          data.id = track.id;
          // The facing environment
          data.facing = track.facing;

          if (track.kind === 'audio') {
            StreamTrackList.audio.push(data);
          } else {
            StreamTrackList.video.push(data);
          }
        }
        
        defer({
          audio: StreamTrackList.audio,
          video: StreamTrackList.video
        });
      });
    }
  } 
};
function User (config, listener) {
  'use strict';

  // Prevent undefined listener error
  listener = listener || function (event, data) {};

  // Reference of instance
  var com = this;

  /**
   * The user id.
   * @attribute id
   * @type String
   * @readOnly
   * @for User
   * @since 0.6.0
   */
  com.id = config.id;

  /**
   * The user type.
   * @attribute type
   * @type String
   * @default "user"
   * @readOnly
   * @for User
   * @since 0.6.0
   */
  com.type = 'user';

  /**
   * Stores the user data.
   * @attribute data
   * @type JSON
   * @private
   * @for User
   * @since 0.6.0
   */
  com.data = config.data || {};

  /**
   * Stores the browser agent information.
   * @attribute agent
   * @param {String} name The browser agent name.
   * @param {Integer} version The browser agent version.
   * @param {String} webRTCType The browser agent WebRTC type of implementation.
   * @type JSON
   * @private
   * @for User
   * @since 0.6.0
   */
  com.agent = config.agent || {};

  /**
   * Stores the user's bandwidth configuration.
   * @attribute bandwidth
   * @param {Integer} audio The bandwidth audio configuration.
   * @param {Integer} data The bandwidth data configuration.
   * @param {Integer} video The bandwidth video configuration.
   * @type JSON
   * @private
   * @for User
   * @since 0.6.0
   */
  com.bandwidth = config.bandwidth || {};

  /**
   * Stores the list of peer connections to user.
   * @attribute peers
   * @type JSON
   * @private
   * @for User
   * @since 0.6.0
   */
  com.peers = {};


  /**
   * Function to subscribe to when the user object is ready to use.
   * @method onready
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.onready = function () {};

  /**
   * Function to subscribe to when user's custom data is updated.
   * @method onupdate
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.onupdate = function () {};

  /**
   * Function to subscribe to when user has an established "main" peer connection.
   * @method onconnect
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.onconnect = function () {};

  /**
   * Function to subscribe to when user is disconnected from the room.
   * @method ondisconnect
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.ondisconnect = function () {};

  /**
   * Function to subscribe to when a new peer connection is established to user.
   * @method onaddconnection
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.onaddconnection = function () {};

  /**
   * Function to subscribe to when a peer connection to user has added.
   * @method onremoveconnection
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.onremoveconnection = function () {};

  /**
   * Function to subscribe to when a new data transfer request is initialized from user.
   * @method ondatarequest
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.ondatarequest = function () {};

  /**
   * Function to subscribe to when a new data is received after transfer is completed from user.
   * @method ondata
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.ondata = function () {};

  /**
   * Function to subscribe to when a new message is received from user.
   * @method onmessage
   * @eventhandler true
   * @for User
   * @since 0.6.0
   */
  com.onmessage = function () {};


  /**
   * The handler handles received events.
   * @method routeEvent
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for User
   * @since 0.6.0
   */
  com.routeEvent = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.userId = com.id;

    fn.applyHandler(UserEventReceivedHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('User: Received event = ', event, data);
  };

  /**
   * The handler handles received socket message events.
   * @method routeMessage
   * @param {JSON} message The message received.
   * @private
   * @for User
   * @since 0.6.0
   */
  com.routeMessage = function (message) {
    // Messaging events
    var fn = UserEventMessageHandler[message.type];

    if (typeof fn === 'function') {
      fn(com, message, listener);
    }

    log.debug('User: Received message = ', event, message);
  };

  /**
   * The handler handles response events.
   * @method respond
   * @param {String} event The event name.
   * @param {JSON} data The response data.
   * @private
   * @for User
   * @since 0.6.0
   */
  com.respond = function (event, data) {
    var params = event.split(':');

    data = data || {};
    data.id = com.id;

    fn.applyHandler(UserEventResponseHandler, params, [com, data, listener]);

    listener(event, data);

    log.debug('User: Responding with even = ', event, data);
  };

  /**
   * Starts a new peer connection to user.
   * @method addConnection
   * @param {JSON} data The shared peer connection streaming configuration.
   * @param {JSON} data.prid The shared peer connection id.
   * @param {Array} data.iceServers The ICE servers the connection should use.
   * @param {JSON} data.stream The streamming configuration for the shared peer connection.
   * @param {JSON|Boolean} [data.stream.audio=false] The audio stream configuration.
   *    If parsed as a boolean, other configuration settings under the audio
   *    configuration would be set as the default setting in the connection.
   * @param {Boolean} [data.stream.audio.stereo=false] The flag that indiciates
   *    if stereo is enabled for this connection.
   * @param {String} [data.stream.audio.sourceId] The source id of the audio MediaStreamTrack
     *    used for this connection.
   * @param {String|Boolean} [data.stream.video=false] The video stream configuration.
   *    If parsed as a boolean, other configuration settings under the video
   *    configuration would be set as the default setting in the connection.
   * @param {JSON} [data.stream.video.resolution] The video streaming resolution.
   * @param {Integer} data.stream.video.resolution.width The video resolution width.
   * @param {Integer} data.stream.video.resolution.height The video resolution height.
   * @param {Integer} data.stream.video.frameRate The video stream framerate.
   * @param {String} [data.stream.video.sourceId] The source id of the video MediaStreamTrack
   *    used for this connection.
   * @param {JSON} data.stream.status The stream MediaStreamTrack status.
   * @param {Boolean} [data.stream.status.audioMuted=false] The flag that indicates if audio is muted.
   *    If audio is set to false, this would be set as true.
   * @param {Boolean} [data.stream.status.videoMuted=false] The flag that indicates if video is muted.
   *    If video is set to false, this would be set as true.
   * @param {JSON} data.bandwidth The bandwidth configuration the peer connections.
   *    This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * @param {Integer} [data.bandwidth.audio] The bandwidth configuration for the audio stream.
   * @param {Boolean} [data.bandwidth.video] The bandwidth configuration for the video stream.
   * @param {Boolean} [data.bandwidth.data] The bandwidth configuration for the data stream.
   * @param {String} data.SDPType The session description type that the peer connection would send.
   *    Types are <code>"offer"</code> or <code>"answer"</code>.
   * @param {Stream} [stream] The stream object.
   * @private
   * @for User
   * @since 0.6.0
   */
  com.addConnection = function (data, stream) {
    var peerConfig = {
      id: data.prid,
      iceServers: data.iceServers,
      sdpConfig: {
        bandwidth: data.bandwidth,
        stereo: fn.isSafe(function () {
          return !!data.settings.audio.stereo;
        }),
        SDPType: data.SDPType
      },
      streamingConfig: data.settings
    };

    // Add the main streaming config
    com.streamingConfigs[data.stream.prid] = data.settings;

    var peer = new Peer(peerConfig, com.routeEvent);

    peer.connect(stream);

    com.peers[peer.id] = peer;

    com.respond('user:addconnection', {
      peerId: data.prid,
      config: peerConfig
    });
  };

  /**
   * Stops a peer connection to user.
   * @method removeConnection
   * @param {String} peerId The shared peer connection id.
   * @private
   * @for User
   * @since 0.6.0
   */
  com.removeConnection = function (peerId) {
    var peer = com.peers[peerId];

    if (!fn.isEmpty(peer)) {
      peer.disconnect();
    }

    com.respond('user:removeconnection', {
      peerId: peerId
    });
  };

  /**
   * Disconnects this user connection.
   * @method disconnect
   * @for User
   * @since 0.6.0
   */
  com.disconnect = function () {
    fn.forEach(com.peers, function (peer, id) {
      peer.disconnect();
    });
  };

  /**
   * Gets this user information.
   * @method getInfo
   * @param {String} [peerId] The shared peer connection id to retrieve
   *    that streaming information only.
   * @returns {JSON} The user streaming configuration and custom data.
   * - <code>userData</code> <var>: <b>type</b> String | JSON</var><br>
   *   The custom data.
   * - <code>agent</code> <var>: <b>type</b> JSON</var><br>
   *   The user's browser agent information.
   * - <code>agent.name</code> <var>: <b>type</b> String</var><br>
   *   The user's browser agent name.
   * - <code>agent.version</code> <var>: <b>type</b> Integer</var><br>
   *   The user's browser agent version.
   * - <code>agent.webRTCType</code> <var>: <b>type</b> String</var><br>
   *   The user's browser webrtc implementation type.
   * - <code>streams</code> <var>: <b>type</b> JSON</var><br>
   *   The list of peer connections streaming.
   * - <code>streams.(#peerId)</code> <var>: <b>type</b> JSON</var><br>
   *   The peer connection streaming information.
   * - <code>streams.(#peerId).audio</code> <var>: <b>type</b> JSON|Boolean</var><br>
   *   The audio streaming information. If there is no stream connection with the peer,
   *   it's <code>false</code>.
   * - <code>streams.(#peerId).audio.stereo</code> <var>: <b>type</b> Boolean</var><br>
   *   The flag that indicates if stereo is enabled for this connection. By default,
   *   it's <code>false</code>.
   * - <code>streams.(#peerId).audio.sourceId</code> <var>: <b>type</b> String</var><br>
   *   The audio MediaStreamTrack source used for this connection.
   * - <code>streams.(#peerId).video</code> <var>: <b>type</b> JSON|Boolean</var><br>
   *   The video streaming information. If there is no stream connection with the peer,
   *   it's <code>false</code>.
   * - <code>streams.(#peerId).video.resolution</code> <var>: <b>type</b> JSON</var><br>
   *   The video stream resolution.
   * - <code>streams.(#peerId).video.resolution.width</code> <var>: <b>type</b> Integer</var><br>
   *   The video stream resolution height.
   * - <code>streams.(#peerId).video.resolution.height</code> <var>: <b>type</b> Integer</var><br>
   *   The video stream resolution width.
   * - <code>streams.(#peerId).video.frameRate</code> <var>: <b>type</b> Integer</var><br>
   *   The video stream resolution framerate.
   * - <code>streams.(#peerId).video.sourceId</code> <var>: <b>type</b> String</var><br>
   *   The video MediaStreamTrack source used for this connection.
   * - <code>streams.(#peerId).status</code> <var>: <b>type</b> JSON</var><br>
   *   The MediaStreamTracks enabled status (muted/unmuted).
   * - <code>streams.(#peerId).status.audioMuted</code> <var>: <b>type</b> Boolean</var><br>
   *   The audio MediaStreamTrack enabled status (muted/unmuted).
   * - <code>streams.(#peerId).status.audioMuted</code> <var>: <b>type</b> Boolean</var><br>
   *   The video MediaStreamTrack enabled status (muted/unmuted).
   * - <code>bandwidth</code> <var>: <b>type</b> JSON</var><br>
   *   The bandwidth configuration for the peer connections.
   *   This does fixes the bandwidth but doesn't prevent alterations done by browser for smoother streaming.
   * - <code>bandwidth.data</code> <var>: <b>type</b> Integer</var><br>
   *   The bandwidth configuration for data stream.
   * - <code>bandwidth.video</code> <var>: <b>type</b> Integer</var><br>
   *   The bandwidth configuration for video stream.
   * - <code>bandwidth.audio</code> <var>: <b>type</b> Integer</var><br>
   *   The bandwidth configuration for audio stream.
   * @for User
   * @since 0.6.0
   */
  com.getInfo = function (peerId) {
    var data = {};

    // Pass jshint error
    var getStreamSettingsFn = function (peer) {
      var stream = peer.stream || {};
      return stream.config || {
        audio: false,
        video: false,
        status: {
          audioMuted: true,
          videoMuted: true
        }
      };
    };

    data.userData = com.data;
    data.agent = com.agent;
    data.bandwidth = com.bandwidth;


    // If it's retrieving on peer connection streaming information or not
    if (!fn.isEmpty(peerId)) {
      var onepeer = com.peers[peerId];

      // If the peer connection is empty, throw an exception
      if (!fn.isEmpty(onepeer)) {
        data.stream = getStreamSettingsFn(onepeer);

      } else {
        throw new Error('Peer connection for "' + peerId + '" does not exist');
      }


    } else {
      data.streams = {};

      var key;

      for (key in com.peers) {
        if (com.peers.hasOwnProperty(key)) {
          var peer = com.peers[key];

          var settings = getStreamSettingsFn(peer);

          settings.bandwidth = peer.bandwidth || {};

          data.streams[peer.id] = settings;
        }
      }
    }
    return data;
  };

  fn.runSync(function () {
    com.respond('user:ready', config);
  });
}

var UserEventReceivedHandler = {

  peer: {

    connect: function (com, data, listener) {
      var peer = com.peers[data.id];

      if (typeof com.onaddconnection === 'function') {
        com.onaddconnection(peer);
      }

      if (peer.SDPType === 'offer') {
        peer.createOffer();
      }
    },

    iceconnectionstate: function (com, data, listener) {
      if (data.id === 'main' && data.state === 'connected') {
        com.handler('user:connect', {});
      }
    },

    disconnect: function (com, data, listener) {
      var peer = com.peers[data.id];

      delete com.peers[data.id];

      if (typeof com.onremoveconnection === 'function') {
        com.onremoveconnection(peer);
      }

      if (Object.keys(com.peers).length === 0) {
        com.handler('user:disconnect', {});
      }
    }
  },

  transfer: {

    complete: function (com, data, listener) {
      com.handler('user:data', data);
    },

    request: function (com, data, listener) {
      com.handler('user:datarequest', data);
    }
  }

};

/**
 * Handles all the events to respond to other parent classes.
 * @attribute UserHandlerResponseHandler
 * @private
 * @for User
 * @since 0.6.0
 */
var UserEventResponseHandler = {

  /**
   * Event fired when the user object is ready to use.
   * @event user:ready
   * @for User
   * @since 0.6.0
   */
  ready: function (com, data, listener) {
    if (typeof com.onready === 'function') {
      com.onready();
    }
  },

  /**
   * Event fired when the user has an established "main" peer connection.
   * @event user:connect
   * @for User
   * @since 0.6.0
   */
  connect: function (com, data, listener) {
    if (typeof com.onconnect === 'function') {
      com.onconnect();
    }
  },

  /**
   * Event fired when the user has transferred a data successfully.
   * @event user:data
   * @for User
   * @since 0.6.0
   */
  data: function (com, data, listener) {
    if (typeof com.ondata === 'function') {
      com.ondata();
    }
  },

  /**
   * Event fired when the user is initiating a data transfer request.
   * @event user:datarequest
   * @for User
   * @since 0.6.0
   */
  datarequest: function (com, data, listener) {
    if (typeof com.ondatarequest === 'function') {
      com.ondatarequest();
    }
  },

  /**
   * Event fired when the user's custom data has been updated.
   * @event user:data
   * @for User
   * @since 0.6.0
   */
  update: function (com, data, listener) {
    if (typeof com.onupdate === 'function') {
      com.onupdate(data.data);
    }
  },

  /**
   * Event fired when the user has started a peer connection.
   * @event user:addconnection
   * @for User
   * @since 0.6.0
   */
  addconnection: function (com, data, listener) {
    if (typeof com.onaddconnection === 'function') {
      com.onaddconnection();
    }
  },

  /**
   * Event fired when the user has ended a peer connection
   * @event user:removeconnection
   * @for User
   * @since 0.6.0
   */
  removeconnection: function (com, data, listener) {
    if (typeof com.onremoveconnection === 'function') {
      com.onremoveconnection(data.data);
    }
  },

  /**
   * Event fired when the user sends an incoming message.
   * @event user:message
   * @for User
   * @since 0.6.0
   */
  message: function (com, data, listener) {
    if (typeof com.onmessage === 'function') {
      com.onmessage();
    }
  },

  /**
   * Event fired when the user's peer connections has been disconnected.
   * Usually fired when user leaves the room.
   * @event user:disconnect
   * @for User
   * @since 0.6.0
   */
  disconnect: function (com, data, listener) {
    if (typeof com.ondisconnect === 'function') {
      com.ondisconnect();
    }
  }

};

/**
 * Handles all the message events received from socket.
 * @attribute UserEventMessageHandler
 * @private
 * @for User
 * @since 0.6.0
 */
var UserEventMessageHandler = {

  enter: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      return;
    }

    // Adds a peer connection
    com.addConnection({
      id: data.prid,
      iceServers: data.iceServers,
      bandwidth: com.bandwidth,
      stream: data.stream,
      SDPType: 'answer'

    }, data.streamObject);
  },

  welcome: function (com, data, listener) {
    var peer = com.peers[data.prid];

    // If peer has been created because of duplicate enter,
    // Check which weight received is higher first
    if (!fn.isEmpty(peer)) {
      if (peer.weight < data.weight) {
        return;
      }

      peer.SDPType = 'offer';
      data.type = 'start';

    // New peer
    } else {
      // Adds a peer connection
      com.addConnection({
        id: data.prid,
        iceServers: data.iceServers,
        bandwidth: com.bandwidth,
        stream: data.stream,
        SDPType: 'offer'

      }, data.streamObject);
    }
  },

  offer: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      peer.handler('message:offer', data);
    }
  },

  answer: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      peer.handler('message:answer', data);
    }
  },

  candidate: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      peer.handler('message:candidate', data);
    }
  },

  restart: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      peer.handler('message:restart', data);
    }
  },

  updateUserEvent: function (com, data, listener) {
    com.data = data.data;

    com.handler('user:update', {
      data: data.userData
    });
  },

  muteAudioEvent: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      peer.handler('message:muteAudioEvent', data);
    }
  },

  muteVideoEvent: function (com, data, listener) {
    var peer = com.peers[data.prid];

    if (!fn.isEmpty(peer)) {
      peer.handler('message:muteVideoEvent', data);
    }
  }
};
