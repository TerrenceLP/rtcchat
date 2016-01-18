/**
 * Contains the Socket.
 * @attribute _socket
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socket = {
  connected: false,
  socket: null,
  session: {
    path: null,
    protocol: null,
    transport: 'WebSocket',
    port: null,
    retries: {
      max: 3,
      delay: 1000,
      current: 0
    },
    dead: false
  },
  config: {
    default: {
      server: 'signaling.temasys.com.sg',
      ports: {
        'http:': [80, 3000],
        'https:': [443, 3443]
      }
    },
    current: {}
  },
  transports: {
    'WebSocket': ['websocket'],
    'Polling': ['xhr-polling', 'jsonp-polling', 'polling']
  },
  messaging: {
    queue: [],
    timestamp: null,
    interval: 1000,
    throughput: 16,
    timer: null,
    typesToQueue: ['stream', 'updateUserEvent', 'roomLockEvent', 'muteAudioEvent', 'muteVideoEvent', 'public']
  }
};

/**
 * Starts a socket connection to the signaling.
 * @method _socketConnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketConnect = function () {
  var _this = this;

  // Connection is not connected
  _this._socket.connected = false;

  // Construct session path
  _this._socketConstructConnectPath();

  log.debug([null, 'Socket', _this._room.name, 'Connecting to signaling server ->'],
    _this._socket.session.path);

  // Create the socket.io-client io object
  _this._socket.socket = io.connect(_this._socket.session.path, {

    forceNew: true,
    //'sync disconnect on unload' : true,
    reconnection: true,
    reconnectionAttempts: _this._socket.session.retries.max,
    reconectionDelayMax: _this._socket.session.retries.delay,
    timeout: _this._room.config.current.socketTimeout,
    transports: _this._socket.transports[_this._socket.session.transport]

  });

  // io.on('connect_error') event
  _this._socket.socket.on('connect_error', _this._socketReactToConnectError());

  // io.on('reconnect_attempt') event
  _this._socket.socket.on('reconnect_attempt', _this._socketReactToReconnectAttempt());

  // io.on('reconnect_error') event
  _this._socket.socket.on('reconnect_error', _this._socketReactToReconnectError());

  // io.on('reconnect_failed') event
  _this._socket.socket.on('reconnect_failed', _this._socketReactToReconnectFailed());

  // io.on('connect') event
  _this._socket.socket.on('connect', _this._socketReactToConnect());

  // io.on('reconnect') event
  _this._socket.socket.on('reconnect', _this._socketReactToConnect());

  // io.on('error') event
  _this._socket.socket.on('error', _this._socketReactToError());

  // io.on('disconnect') event
  _this._socket.socket.on('disconnect', _this._socketReactToDisconnect());

  // io.on('message') event
  _this._socket.socket.on('message', _this._socketReactToMessage());

  log.debug([null, 'Socket', _this._room.name, 'Listening to events']);
};

/**
 * Constructs the socket connection path.
 * @method _socketConstructConnectPath
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketConstructConnectPath = function () {
  var _this = this;

  // Configure the session protocol
  _this._socket.session.protocol = window.location.protocol;

  if (_this._room.config.current.forceSSL) {
    _this._socket.session.protocol = 'https:';
  }

  // Configure the first port if not selected
  if (!_this._socket.session.port) {
    _this._socket.session.port = _this._socket.config.current.ports[_this._socket.session.protocol][0];
  }

  // Configure to set as Polling first if WebSocket is not supported
  if (!window.WebSocket) {
    _this._socket.session.transport = 'Polling';

    log.warn([null, 'Socket', null, 'Your browser does not support WebSocket transports, ' +
      'hence defaulting to Polling transports']);
  }

  // Construct the path
  _this._socket.session.path =
  // Append the protocol
    _this._socket.session.protocol + '//' +
  // Append the url and port
    _this._socket.config.current.server + ':' + _this._socket.session.port;

  log.debug([null, 'Socket', null, 'Session path has been constructed']);
};

/**
 * Restarts the socket connection to the signaling.
 * @method _socketReconnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReconnect = function () {
  var _this = this;

  // Remove all listeners to socket.io-client object
  if (_this._socket) {
    _this._socket.socket.removeAllListeners('connect_error');
    _this._socket.socket.removeAllListeners('reconnect_attempt');
    _this._socket.socket.removeAllListeners('reconnect_error');
    _this._socket.socket.removeAllListeners('reconnect_failed');
    _this._socket.socket.removeAllListeners('connect');
    _this._socket.socket.removeAllListeners('reconnect');
    _this._socket.socket.removeAllListeners('error');
    _this._socket.socket.removeAllListeners('disconnect');
    _this._socket.socket.removeAllListeners('message');

    _this._socketDisconnect();
  }

  // Select the current port
  var ports = _this._socket.config.current.ports[_this._socket.session.protocol];
  var portIndex = ports.indexOf(_this._socket.session.port);

  if (portIndex < ports.length - 1) {
    _this._socket.session.port = ports[portIndex + 1];
    // Final port, now check the transport type to determine if we want to terminate connection
  } else {
    // Restart from WebSocket to Polling after failure
    if (_this._socket.session.transport === 'WebSocket') {
      _this._socket.session.transport = 'Polling';
      _this._socket.session.port = ports[0];
      // Abort reconnections because it failed
    } else {
      log.error([null, 'Socket', _this._room.name,
        'Failed connecting to server with Socket connection. Retries and transports have been maxed out']);

      _this._socket.session.dead = true;

      _this._trigger('socketError',_this.SOCKET_ERROR.RECONNECTION_ABORTED,
        new Error('Reconnection is aborted as all transports type and ports have been attempted'),
        _this._socket.session.transport);
      return;
    }
  }

  // Restart socket connection
  log.debug([null, 'Socket', _this._room.name,
    'Attempting to reconnect with a different port and transport ->'], {
      port: _this._socket.session.port,
      transport: _this._socket.session.transport
  });

  _this._socketConnect();
};

/**
 * Stops the socket connection with the signaling.
 * @method _socketDisconnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketDisconnect = function () {
  var _this = this;

  if (_this._socket.socket) {
    _this._socket.socket.disconnect();
  }

  log.debug([null, 'Socket', _this._room.name, 'Disconnecting']);
};

/**
 * Reacts to io.on("connect_error") event.
 * @method _socketReactToConnectError
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToConnectError = function () {
  var _this = this;

  return function(error) {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> connect_error'], error);

    if (_this._socket.session.retries.current === 0) {
      _this._trigger('socketError', _this.SOCKET_ERROR.CONNECTION_FAILED,
        error, _this._socket.session.transport);
    }
  };
};

/**
 * Reacts to io.on("reconnect_attempt") event.
 * @method _socketReactToReconnectAttempt
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToReconnectAttempt = function () {
  var _this = this;

  return function(attempt) {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> reconnect_attempt'], attempt);

    _this._socket.session.retries.current++;

    _this._trigger('socketError', _this.SOCKET_ERROR.RECONNECTION_ATTEMPT,
      null, _this._socket.session.transport);
    _this._trigger('channelRetry', _this._socket.session.transport,
      _this._socket.session.retries.current);
  };
};

/**
 * Reacts to io.on("reconnect_error") event.
 * @method _socketReactToReconnectError
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToReconnectError = function () {
  var _this = this;

  return function(error) {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> reconnect_error'], error);

    _this._trigger('socketError', _this.SOCKET_ERROR.RECONNECTION_FAILED,
      error, _this._socket.session.transport);
  };
};

/**
 * Reacts to io.on("reconnect_failed") event.
 * @method _socketReactToReconnectFailed
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToReconnectFailed = function () {
  var _this = this;

  return function() {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> reconnect_failed']);

    _this._trigger('socketError', _this.SOCKET_ERROR.RECONNECTION_FAILED,
      new Error('Reconnection attempts have failed for port ' + _this._socket.session.port +
      ' and transport "' + _this._socket.session.transport + '"'), _this._socket.session.transport);

    _this._socketReconnect();
  };
};

/**
 * Reacts to io.on("connect") event.
 * @method _socketReactToConnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToConnect = function () {
  var _this = this;

  return function () {
    _this._socket.connected = true;

    log.debug([null, 'Socket', _this._room.name, 'Connection to signaling server connection has been opened']);

    _this._trigger('channelOpen');
  };
};

/**
 * Reacts to io.on("error") event.
 * @method _socketReactToError
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToError = function () {
  var _this = this;

  return function(error) {
    log.error([null, 'Socket', _this._room.name, 'Connection has caught an exception ->'], error);

    _this._trigger('channelError', error);
  };
};

/**
 * Reacts to io.on("disconnect") event.
 * @method _socketReactToDisconnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToDisconnect = function () {
  var _this = this;

  return function() {
    log.debug([null, 'Socket', _this._room.name, 'Connection to signaling server connection has been closed']);

    _this._socket.connected = false;
    _this._trigger('channelClose');
  };
};

/**
 * Reacts to io.on("message") event.
 * @method _socketReactToMessage
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReactToMessage = function () {
  var _this = this;

  return function(messageString) {
    var message = JSON.parse(messageString);

    log.debug([null, 'Socket', _this._room.name, 'Received message ->'], message);
    _this._trigger('channelMessage', message);

    _this._messageReactRouter(message);
  };
};