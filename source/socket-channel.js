/**
 * Handles the socket connection.
 * @class SkylinkSocket
 * @private
 * @since 0.6.8
 * @for Skylink
 */
function SkylinkSocket(config) {
  SkylinkEvent._mixin(this);

  // We are certain as the checks are done in the init()
  this._connection.timeout = config.timeout;

  // The data received from the signaling server is dynamic so double-check and fallback if required
  if (typeof config.server === 'string' && !!config.server) {
    this._connection.server = config.server;
  }

  if (Array.isArray(config.httpPortList) && config.httpPortList.length > 0) {
    this._ports['http:'] = config.httpPortList;
  }

  if (Array.isArray(config.httpsPortList) && config.httpsPortList.length > 0) {
    this._ports['https:'] = config.httpsPortList;
  }

  // Configure the first port
  this._connection.port = this._ports[this._connection.protocol][0];

  // Configure anything by default
  if (!window.WebSocket) {
    this._connection.transport = 'Polling';

    log.warn([null, 'Socket', null, 'Your browser does not support WebSocket transports ' +
      'hence Polling transports is selected'
    ]);
  }

  log.debug([null, 'Socket', null, 'Parsed configuration and ready for connection']);
}

/**
 * The flag that indicates if socket is connected.
 * @attribute connected
 * @type Boolean
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype.connected = false;

/**
 * The flag that indicates if socket connection is dead,
 *   unable to reconnect after all attempts.
 * @attribute dead
 * @type Boolean
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype.dead = false;

/**
 * Contains the socket ports.
 * To be modified by init().
 * @attribute ports
 * @type JSON
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._ports = {
  'http:': [6001, 80, 3000],
  'https:': [443, 3443]
};

/**
 * Contains the socket transports.
 * @attribute _transports
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._transports = {
  'WebSocket': ['websocket'],
  'Polling': ['xhr-polling', 'jsonp-polling', 'polling']
};

/**
 * Contains the socket connection information.
 * @attribute _connection
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._connection = {
  // SOCKET CONNECTION STATES
  // 0 - connecting / reconnecting
  // 1 - connected
  // -1 - disconnected
  // -2 - connection aborted
  state: 0,
  server: 'signaling.temasys.com.sg',
  protocol: window.location.protocol,
  path: null,
  retries: {
    max: 4,
    delay: 1000,
    current: 0
  },
  timeout: 20000,
  port: 80,
  transport: 'WebSocket',
  transportFallback: false
};

/**
 * Contains the socket.io-client object.
 * @attribute _io
 * @type io
 * @private
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._io = null;

/**
 * Contains the list of queued messages and intervals.
 * @attribute _messaging
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._messaging = {
  queue: [],
  timestamp: null,
  interval: 1000,
  throughput: 16,
  timer: null,
  typesToQueue: ['stream', 'updateUserEvent', 'roomLockEvent', 'muteAudioEvent', 'muteVideoEvent', 'public']
};

/**
 * Opens the socket connection to signaling.
 * @method connect
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype.connect = function() {
  var self = this;

  self._connection.path = self._connection.protocol + '//' +
    self._connection.server + ':' + self._connection.port;

  self.connected = false;
  self.dead = false;

  self._connection.state = 0;
  self._trigger('connectState', 0, null);

  log.debug([null, 'Socket', null, 'Connecting to signaling server with the ' +
    'following configuration :'
  ], self._connection);

  // Construct a new socket.io-client object
  self._socket = io.connect(self._connection.path, {
    forceNew: true,
    //'sync disconnect on unload' : true,
    reconnection: true,
    reconnectionAttempts: self._connection.retries.max,
    reconectionDelayMax: self._connection.retries.delay,
    timeout: self._connection.timeout,
    transports: self._transports[self._connection.transport]
  });

  self._listenToEvents();
};

/**
 * Closes the socket connection to signaling.
 * @method disconnect
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype.disconnect = function() {
  var self = this;

  if (self._socket) {
    log.debug([null, 'Socket', null, 'Disconnecting']);

    self._socket.disconnect();
  }
};

/**
 * Sends a message using the socket connection to the signaling.
 * @method send
 * @param {JSON} message The message object
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype.send = function(message) {
  var self = this;

  self._limitMessageInterval(function(groupMessage) {
    if (!self._socket) {
      log.warn([null, 'Socket', null, 'Dropping message as connection is not yet initialized ->'], groupMessage);
      return;
    }

    if (!self.connected) {
      log.warn([null, 'Socket', null, 'Dropping message as connection is not yet connected ->'], groupMessage);
      return;
    }

    log.debug([null, 'Socket', null, 'Sending message ->'], groupMessage);

    // Normal case when messages are sent not so rapidly
    var messageString = JSON.stringify(groupMessage);

    self._socket.send(messageString);
  }, message);
};

/**
 * Limits broadcasted socket messages and groups them when required
 *   to prevent messages from being dropped.
 * @method _limitMessageInterval
 * @param {Function} fn The function to send delayed messages.
 * @param {JSON} message The message object
 * @param {JSON} groupMessage The grouped (or not) message object.
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._limitMessageInterval = function(fn, message) {
  var self = this;

  var delayFn = function() {
    if (self._messaging.queue.length > 0) {
      var data = self._messaging.queue[0];

      if (self._messaging.queue.length < self._messaging.throughput) {
        log.debug([null, 'Socket', null, 'Sending delayed messages'], self._messaging.queue);

        fn({
          type: 'group',
          lists: self._messaging.queue.splice(0, self._messaging.queue.length),
          mid: data.mid,
          rid: data.rid
        });

        clearTimeout(self._messaging.timer);

        self._messaging.timer = null;

      } else {
        log.debug([null, 'Socket', null, 'Sending delayed first 16 messages'], self._messaging.queue);

        fn({
          type: 'group',
          lists: self._messaging.queue.splice(0, self._messaging.throughput),
          mid: data.mid,
          rid: data.rid
        });

        // To send later after sending the first 16
        clearTimeout(self._messaging.timer);

        self._messaging.timer = null;
        self._messaging.timer = setTimeout(delayFn, self._messaging.interval);
      }

      self._messaging.timestamp = Date.now() || function() {
        return +new Date();
      };
    }
  };

  //Delay when messages are sent too rapidly
  if ((Date.now() || function() {
      return +new Date();
    }) - self._messaging.timestamp < self._messaging.interval &&
    self._messaging.typesToQueue.indexOf(message.type) > -1) {

    log.warn([null, 'Socket', null, 'Messages has been fired too rapidly. Delaying messages with queue']);

    self._messaging.queue.push(message);

    if (!self._messaging.timer) {
      self._messaging.timer = setTimeout(delayFn,
        self._messaging.interval - ((Date.now() || function() {
          return +new Date();
        }) - self._messaging.timestamp));
    }
    return;
  }

  fn(message);

  self._messaging.timestamp = Date.now() || function() {
    return +new Date();
  };
};

/**
 * Retry the socket connection to signaling.
 * @method _reconnect
 * @private
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._reconnect = function() {
  var self = this;

  // Remove all listeners to socket.io-client object
  if (self._socket) {
    self._socket.removeAllListeners('connect_error');
    self._socket.removeAllListeners('reconnect_attempt');
    self._socket.removeAllListeners('reconnect_error');
    self._socket.removeAllListeners('reconnect_failed');
    self._socket.removeAllListeners('connect');
    self._socket.removeAllListeners('reconnect');
    self._socket.removeAllListeners('error');
    self._socket.removeAllListeners('disconnect');
    self._socket.removeAllListeners('message');

    self.disconnect();
  }

  // Select the current port
  var ports = self._ports[self._connection.protocol];
  var index = ports.indexOf(self._connection.port);
  var fallbackType = 'nonfallback';

  // When index is still within the range and not the last port
  if (index < ports.length - 1) {
    self._connection.port = ports[index + 1];

    // When index is the final port
    // To now check the transport type to determine if we want to terminate connection
  } else {
    // Restart from WebSocket to Polling after failure
    if (self._connection.transport === 'WebSocket') {
      self._connection.transport = 'Polling';
      self._connection.port = ports[0];
      self._connection.transportFallback = true;

      // Abort reconnections because it failed
    } else {
      log.error([null, 'Socket', null, 'Aborting reconnection after many failed retries and attempts']);
      self.dead = true;
      var abortError = new Error('Socket reconnection is aborted as all transports type and ports have been attempted');
      self._trigger('connectError', -3, abortError, self._connection.transport);
      self._trigger('connectState', -2, abortError);
      return;
    }
  }

  // Restart socket connection
  log.debug([null, 'Socket', null, 'Retrying for successful connection']);

  // If port index is not the first..
  if (index > 0 || self._connection.transportFallback) {
    // https: protocol connections
    if (self._connection.protocol === 'http:') {
      // transports with WebSocket and https: protocol connections
      if (self._connection.transport === 'WebSocket') {
        fallbackType = 'fallbackPortNonSSL';
      // transports with Polling and https: protocol connections
      } else {
        fallbackType = 'fallbackLongPollingNonSSL';
      }
    // http: protocol connections
    } else {
      // transports with WebSocket and http: protocol connections
      if (self._connection.transport === 'WebSocket') {
        fallbackType = 'fallbackPortSSL';
      // transports with Polling and http: protocol connections
      } else {
        fallbackType = 'fallbackLongPollingSSL';
      }
    }
  }

  self._trigger('connectRetry', fallbackType, self._connection.retries.current);

  self.connect();
};

/**
 * Listens to socket.io-client events.
 * @method _listenToEvents
 * @private
 * @since 0.6.8
 * @for SkylinkSocket
 */
SkylinkSocket.prototype._listenToEvents = function() {
  var self = this;

  if (!self._socket) {
    log.error([null, 'Socket', null, 'Unable to listen to events as connection object is not initialized']);
    return;
  }

  // io.on('connect_error') event
  self._socket.on('connect_error', function(error) {
    log.debug([null, 'Socket', null, 'Connection error state -> connect_error'], error);

    if (self._connection.retries.current === 0) {
      self._trigger('connectError', 0, error, self._connection.transport);
    }
  });

  // io.on('connect_timeout') event
  self._socket.on('connect_timeout', function () {
    log.debug([null, 'Socket', null, 'Connection error state -> connect_timeout']);
  });

  // io.on('reconnect_attempt') event
  self._socket.on('reconnect_attempt', function(attempt) {
    log.debug([null, 'Socket', null, 'Connection error state -> reconnect_attempt'], attempt);

    self._connection.retries.current++;

    self._trigger('connectError', -4, null, self._connection.transport);
  });

  // io.on('reconnect_error') event
  self._socket.on('reconnect_error', function(error) {
    log.debug([null, 'Socket', null, 'Connection error state -> reconnect_error'], error);

    self._trigger('connectError', -1, error, self._connection.transport);
  });

  // io.on('reconnect_failed') event
  self._socket.on('reconnect_failed', function() {
    log.debug([null, 'Socket', null, 'Connection error state -> reconnect_failed']);

    self._trigger('connectError', -1,
      new Error('Socket reeconnection attempts have failed for port ' + self._connection.port +
        ' and transport "' + self._connection.transport + '"'), self._connection.transport);

    self._reconnect();
  });

  // io.on('reconnecting') event
  self._socket.on('reconnecting', function (attempt) {
    log.debug([null, 'Socket', null, 'Connection error state -> reconnecting'], attempt);
  });

  var connectHandler = function() {
    self.connected = true;
    log.debug([null, 'Socket', null, 'Connection to signaling server has been opened']);
    self._trigger('connect');
    self._trigger('connectState', 1, null);
  };

  // io.on('connect') event
  self._socket.on('connect', connectHandler);
  // io.on('reconnect') event
  self._socket.on('reconnect', connectHandler);

  // io.on('error') event
  self._socket.on('error', function(error) {
    log.error([null, 'Socket', null, 'Connection has caught an exception ->'], error);
    self._trigger('error', error);
  });

  // io.on('disconnect') event
  self._socket.on('disconnect', function() {
    log.debug([null, 'Socket', null, 'Connection to signaling server has been closed']);
    self.connected = false;
    self._trigger('disconnect');
    self._trigger('connectState', -1, null);
  });

  // io.on('message') event
  self._socket.on('message', function(messageString) {
    var message = JSON.parse(messageString);
    log.debug([null, 'Socket', null, 'Received message ->'], message);
    self._trigger('message', message);
  });
};
