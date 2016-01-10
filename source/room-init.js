/**
 * Handles the room sessions.
 * @class SkylinkRoom
 * @private
 * @since 0.6.8
 * @for Skylink
 */
function SkylinkRoom() {
  SkylinkEvent._mixin(this);
  this.reset();
}

/**
 * Stores the room session information.
 * @attribute session
 * @type JSON
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.session = null;

/**
 * Contains the default settings.
 * @attribute defaults
 * @type JSON
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.defaults = {
  server: '//api.temasys.com.sg',
  protocol: window.location.protocol
};

/**
 * The status of the room session.
 * @attribute readyState
 * @type Number
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.readyState = 0;

/**
 * Contains the application key.
 * To be modified by init().
 * @attribute appKey
 * @type String
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.appKey = null;

/**
 * Contains the default and selected room.
 * To be modified by init().
 * @attribute room
 * @type JSON
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.room = {
  selected: null,
  default: null
};

/**
 * Contains the API server url.
 * To be modified by init().
 * @attribute server
 * @type JSON
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.server = null;

/**
 * Contains the server region.
 * To be modified by init().
 * @attribute region
 * @type String
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.region = null;

/**
 * Contains the room session credentials.
 * To be modified by init().
 * @attribute credentials
 * @type JSON
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.credentials = null;

/**
 * Contains the room session protocol.
 * To be modified by init().
 * @attribute protocol
 * @type String
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.protocol = null;

/**
 * Contains the API server path connection information.
 * @attribute _connection
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._connection = {
  path: null,
  random: null
};

/**
 * Connects to the API server for a new room session.
 * @method fetchSession
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.fetchSession = function () {
  var self = this;
  var xhr = null;

  // Fetch the session
  self._constructPath();

  // Check if XDomainRequest is available (IE)
  if (typeof window.XDomainRequest === 'function' || typeof window.XDomainRequest === 'object') {
    xhr = new XDomainRequest();
    xhr.setContentType = function (contentType) {
      xhr.contentType = contentType;
    };

    log.warn([null, 'Room', null, 'XDomainRequest option is found. Using XDomainRequest for CORS']);
  // Else use XMLHttpRequest instead
  } else {
    xhr = new XMLHttpRequest();
    xhr.setContentType = function (contentType) {
      xhr.setRequestHeader('Content-type', contentType);
    };
  }

  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}');

    log.info([null, 'Room', null, 'Received response from API server ->'], response);

    if (!response.success) {
      self.readyState = -1;

      // STATUSES given from server
      // 403 - Room is locked
      // 401 - API Not authorized
      // 402 - run out of credits
      self._trigger('readyState', -1, {
        status: xhr.status || 200,
        errorCode: response.error,
        content: new Error(response.info)
      }, self.room.selected);
      return;
    }

    log.debug([null, 'Room', null, 'Session has been initialized']);

    self.session = response;

    self.readyState = 2;

    self._trigger('readyState', 2, response, self.room.selected);
  };

  xhr.onerror = function (error) {
    log.error([null, 'Room', null, 'Failed retrieving session from API server'], error);

    self.readyState = -1;

    self._trigger('readyState', -1, {
      status: 0,
      errorCode: -1,
      content: new Error('Failed retrieving response from API server')
    }, self.room.selected);
  };

  xhr.onprogress = function () {
    log.debug([null, 'Room', null, 'Retrieving session from API server in-progress']);

    self.readyState = 1;

    self._trigger('readyState', 1, null, self.room.selected);
  };

  log.debug([null, 'Room', null, 'Retrieving API credentials from server ->'], self._connection.path);

  xhr.open('GET', self._connection.path, true);
  xhr.send();
};

/**
 * Constructs the API server path to fetch session from.
 * @method _constructPath
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype._constructPath = function () {
  var self = this;

  // Random string for fetching
  self._connection.random = (new Date()).getTime();

  // Construct path
  var append = '?';

  self._connection.path = self.protocol + '//' + self.server + '/api/' +
    self.appKey + '/' + self.room.selected;

  // Add to path if there is credentials
  if (self.credentials) {
    self._connection.path += '/' + self.credentials.startDateTime + '/' +
      self.credentials.duration;

    self._connection.path += '?cred=' + self.credentials.credentials;

    append = '&';
  }

  // Add the random string to enforce a new fetch over cache
  self._connection.path += append + 'rand=' + self._connection.random;

  // Add to path if there is regional server
  if (self.region) {
    self._connection.path += append + 'rg=' + this.region;
  }

  log.debug([null, 'Room', null, 'Constructed path for fetching session']);
};

/**
 * Resets all the room session.
 * @method reset
 * @since 0.6.8
 * @for SkylinkRoom
 */
SkylinkRoom.prototype.reset = function () {
  var self = this;

  self.readyState = 0;
  self.session =
  self.appKey =
  self.room.default =
  self.room.selected =
  self.region =
  self.protocol =
  self.server =
  self.credentials =
  self._connection.path =
  self._connection.random = null;
};

/**
 * Contains the room session information.
 * @attribute _room
 * @type SkylinkRoom
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._room = null;

/**
 * Contains the room connection information.
 * @attribute _connection
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._connection = {
  recvonly: false,
  datachannel: true,
  ICE: {
    servers: [],
    trickle: true,
    TURN: {
      force: false,
      ssl: null,
      transport: 'any'
    },
    STUN: {
      public: true
    }
  },
  SDP: {
    codecs: {
      audio: 'auto',
      video: 'auto'
    },
    stereo: true,
    bandwidth: {}
  }
};

/**
 * Parses the init() configuration.
 * @method _initParseConfig
 * @param {JSON} options The init() configuration.
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._initParseConfig = function (options) {
  var self = this;

  // init({} -> appKey)
  self._room.appKey =  null;

  if (typeof options.appKey === 'string' && !!options.appKey) {
    self._room.appKey = options.appKey;
  // init({} -> apiKey)
  } else if (typeof options.apiKey === 'string' && !!options.apiKey) {
    self._room.appKey = options.apiKey;
  // ERROR: init({} -> !(no key found))
  } else {
    throw new Error('Provided appKey is invalid');
  }

  // init({} -> defaultRoom)
  if (typeof options.defaultRoom === 'string' && !!options.defaultRoom) {
    self._room.room.default = options.defaultRoom;
  } else {
    self._room.room.default = self._room.appKey;
  }

  // init({} -> selectedRoom)
  if (typeof options.selectedRoom === 'string' && !!options.selectedRoom) {
    self._room.room.selected = options.selectedRoom;
  } else {
    self._room.room.selected = self._room.room.default;
  }

  self._room.server = self._room.defaults.server;

  // init({} -> roomServer)
  if (typeof options.roomServer === 'string') {
    if (options.roomServer !== self._room.defaults.server) {
      log.warn('Note that the roomServer url is overriden with custom URL (' + options.roomServer +
        ') and this may affect Skylink functionalities');
    }
    self._room.server = options.roomServer;
  }

  self._room.credentials = null;

  // init({} -> credentials)
  if (typeof options.credentials === 'object' && options.credentials !== null) {
    // init({} -> credentials.startDateTime) - Starting DateTime stamp in (ISO String)
    if (typeof options.credentials.startDateTime !== 'string') {
      throw new Error('Provided credentials.startDateTime DateTime string (ISO 8601) is invalid');
    }

    // init({} -> credentials.duration) - Duration in (hours)
    if (typeof options.credentials.duration !== 'number') {
      throw new Error('Provided credentials.duration (in hours) is invalid');
    }

    // init({} -> credentials.credentials) - Generated credentials based of DateTime stamp and duration
    if (typeof options.credentials.credentials !== 'string') {
      throw new Error('Provided credentials.credentials string is invalid');
    }

    self._room.credentials = {
      startDateTime: options.credentials.startDateTime,
      duration: options.credentials.duration,
      credentials: options.credentials.credentials
    };
  }

  // init({} -> region)
  self._room.region = null;

  if (typeof options.region === 'string') {
    for (var r in self.REGIONAL_SERVER) {
      if (self.REGIONAL_SERVER.hasOwnProperty(r)) {
        if (options.region === self.REGIONAL_SERVER[r]) {
          self._room.region = options.region;
          break;
        }
      }
    }

    if (self._room.region === null) {
      throw new Error('Provided region is invalid. ' +
        'Please select the list of options from REGIONAL_SERVER list');
    }
  }

  self._socket.protocol = self._socket.defaults.protocol;
  self._room.protocol = self._room.defaults.protocol;

  // init({} -> forceSSL)
  if (typeof options.forceSSL === 'boolean') {
    if (options.forceSSL) {
      self._socket.protocol = self._room.protocol = 'https:';
    }
  }

  self._connection.ICE.TURN = {
    force: false
  };

  // init({} -> enableTURNServer)
  if (typeof options.enableTURNServer === 'boolean') {
    if (!options.enableTURNServer) {
      self._connection.ICE.TURN = null;
    }
  }

  self._connection.ICE.STUN = {};

  // init({} -> enableSTUNServer)
  if (typeof options.enableSTUNServer === 'boolean') {
    if (!options.enableSTUNServer) {
      self._connection.ICE.STUN = null;
    }
  }

  // init({} -> forceTURN)
  if (typeof options.forceTURN === 'boolean') {
    if (options.forceTURN) {
      self._connection.ICE.TURN = {
        force: true
      };
      self._connection.ICE.STUN = null;
    }
  }

  // Configure TURN settings if enabled
  if (self._connection.ICE.TURN) {
    // init({} -> forceTURNSSL)
    self._connection.ICE.TURN.ssl = window.location.protocol === 'https:' ? {} : null;

    if (typeof options.forceTURNSSL === 'boolean') {
      if (options.forceTURNSSL) {
        self._connection.ICE.TURN.ssl = {};
      }
    }

    // Configure the TURN SSL options
    if (self._connection.ICE.TURN.ssl) {
      self._connection.ICE.TURN.ssl.protocol = ['chrome', 'opera', 'safari', 'IE']
        .indexOf(window.webrtcDetectedBrowser) > -1;
      self._connection.ICE.TURN.ssl.port = ['firefox'].indexOf(window.webrtcDetectedBrowser) > -1;
    }

    self._connection.ICE.TURN.transport = null;

    // init({} -> TURNServerTransport)
    if (typeof options.TURNServerTransport === 'string') {
      for (var ts in self.TURN_TRANSPORT) {
        if (self.TURN_TRANSPORT.hasOwnProperty(ts)) {
          if (options.TURNServerTransport === self.TURN_TRANSPORT[ts]) {
            self._connection.ICE.TURN.transport = options.TURNServerTransport;
            break;
          }
        }
      }

      if (self._connection.ICE.TURN.transport === null) {
        throw new Error('Provided TURNServerTransport is invalid. ' +
          'Please select the list of options from TURN_TRANSPORT list');
      }
    } else {
      self._connection.ICE.TURN.transport = self.TURN_TRANSPORT.ANY;
    }
  }

  // Configure STUN settings if enabled
  if (self._connection.ICE.STUN) {
    // init({} -> usePublicSTUN)
    self._connection.ICE.STUN.public = true;

    if (typeof options.usePublicSTUN === 'boolean') {
      if (!options.usePublicSTUN) {
        self._connection.ICE.STUN.public = false;
      }
    }
  }

  self._connection.ICE.trickle = true;

  // init({} -> enableIceTrickle)
  if (typeof options.enableIceTrickle === 'boolean') {
    if (!options.enableIceTrickle) {
      self._connection.ICE.trickle = false;
    }
  }

  self._connection.datachannel = true;

  // init({} -> enableDataChannel)
  if (typeof options.enableDataChannel === 'boolean') {
    if (!options.enableDataChannel) {
      self._connection.dataChannel = false;
    }
  }

  self._connection.SDP.codecs.audio = null;

  // init({} -> audioCodec)
  if (typeof options.audioCodec === 'string') {
    for (var ac in self.AUDIO_CODEC) {
      if (self.AUDIO_CODEC.hasOwnProperty(ac)) {
        if (options.audioCodec === self.AUDIO_CODEC[ac]) {
          self._connection.SDP.codecs.audio = options.audioCodec;
          break;
        }
      }
    }

    if (self._connection.SDP.codecs.audio === null) {
      throw new Error('Provided audioCodec is invalid. ' +
        'Please select the list of options from AUDIO_CODEC list');
    }
  } else {
    self._connection.SDP.codecs.audio = self.AUDIO_CODEC.AUTO;
  }

  self._connection.SDP.codecs.video = null;

  // init({} -> videoCodec)
  if (typeof options.videoCodec === 'string') {
    for (var vc in self.VIDEO_CODEC) {
      if (self.VIDEO_CODEC.hasOwnProperty(vc)) {
        if (options.videoCodec === self.VIDEO_CODEC[vc]) {
          self._connection.SDP.codecs.video = options.videoCodec;
          break;
        }
      }
    }

    if (self._connection.SDP.codecs.video === null) {
      throw new Error('Provided videoCodec is invalid. ' +
        'Please select the list of options from VIDEO_CODEC list');
    }
  } else {
    self._connection.SDP.codecs.video = self.VIDEO_CODEC.AUTO;
  }

  // init({} -> audioFallback)
  self._audioFallback = false;

  if (typeof options.audioFallback === 'boolean') {
    if (options.audioFallback) {
      self._audioFallback = true;
    }
  }

  // init({} -> socketTimeout)
  self._socket.timeout = 20000;

  if (typeof options.socketTimeout === 'number') {
    if (options.socketTimeout < 5000) {
      throw new Error('Provided socket timeout is lesser than minimum value of 5000. ' +
        'Please configure a timeout higher than 5000');
    }
    self._socket.timeout = options.socketTimeout;
  }
};

/**
 * Loads and checks the dependencies from init().
 * @method _initCheckDependencies
 * @param {Function} callback The callback function triggered after the
 *   dependencies have loaded successfully.
 * @param {Error} [callback.error=null] The error object received in callback
 *   when loading dependencies have failed.
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._initCheckDependencies = function (callback) {
  var self = this;

  // When AdapterJS is not loaded
  if (typeof window.AdapterJS !== 'object' || window.AdapterJS === null) {
    return callback({
      status: null,
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('AdapterJS dependency is not loaded. ' +
        'Please load AdapterJS version @@adapterjs in ' +
        'https://github.com/Temasys/AdapterJS/releases/@@adapterjs')
    });
  } else if (window.AdapterJS.VERSION !== '@@adapterjs') {
    return callback({
      status: null,
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('Incorrect AdapterJS dependency loaded. ' +
        'Please load the AdapterJS version @@adapterjs in ' +
        'https://github.com/Temasys/AdapterJS/releases/@@adapterjs')
    });
  }

  // When socket.io-client is not loaded
  // NOTE: We are unable to determine the version (or any proper documented way at least)
  if (typeof window.io !== 'function') {
    return callback({
      status: null,
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      content: new Error('XMLHttpRequest is not supported. ' +
        'Please upgrade your browser with the latest in http://browsehappy.com')
    });
  }

  // When XMLHttpRequest is not supported
  if (!window.XMLHttpRequest && !self._room.useXDomainRequest) {
    return callback({
      status: null,
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT,
      content: new Error('socket.io-client dependency is not loaded. ' +
        'Please load socket.io-client version @@socketio in ' +
        'https://cdn.socket.io/socket.io-@@socketio.js (or http://socket.io/download/)')
    });
  }

  AdapterJS.webRTCReady(function () {
    if (!window.RTCPeerConnection) {
      return callback({
        status: null,
        errorCode: self.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT,
        content: new Error('Your browser does not support WebRTC. Please switch to Chrome, Firefox, Opera ' +
          'or install our Temasys free Plugin for IE and Safari')
      });
    }
    log.debug('WebRTC functions has been loaded');
    callback(null);
  });
};

/**
 * Starts initializing connection based on the selected room given.
 * @method _initSelectedRoom
 * @param {String} [room] The selected room to initialize (not the defaultRoom).
 * @param {Function} callback The callback triggered after room has loaded.
 * @param {Object} [callback.error=null] The error object received in callback.
 * @private
 * @since 0.5.5
 * @for Skylink
 */
Skylink.prototype._initSelectedRoom = function(room, callback) {
  var self = this;

  self.init({
    appKey: self._room.appKey,
    roomServer: self._room.server,
    defaultRoom: self._room.room.default,
    selectedRoom: room,
    serverRegion: self._room.region,
    enableDataChannel: self._connection.datachannel,
    enableIceTrickle: self._connection.ICE.trickle,
    enableTURNServer: !!self._connection.ICE.TURN,
    enableSTUNServer: !!self._connection.ICE.STUN,
    TURNTransport: self._connection.ICE.TURN ? self._connection.ICE.TURN.transport : self.TURN_TRANSPORT.ANY,
    audioFallback: self._audioFallback,
    forceSSL: self._socket.protocol === 'https:',
    socketTimeout: self._socket.timeout,
    forceTURNSSL: self._connection.ICE.TURN ? !!self._connection.ICE.TURN.ssl :
      window.location.protocol === 'https:',
    audioCodec: self._connection.SDP.codecs.audio,
    videoCodec: self._connection.SDP.codecs.video,
    forceTURN: self._connection.ICE.TURN ? self._connection.ICE.TURN.force : false,
    usePublicSTUN: self._connection.ICE.STUN ? self._connection.ICE.STUN.public : false

  }, function (error, success) {
    if (error) {
      return callback(error);
    }

    callback(null);
  });
};

/**
 * Initialises and configures Skylink to begin any connection.
 * <b>NOTE</b> that this is the first method that has to be called before
 *   using any other functionalities other than debugging features like
 *   {{#crossLink "Skylink/setLogLevel:method"}}setLogLevel(){{/crossLink}} and
 *   {{#crossLink "Skylink/setDebugMode:method"}}setDebugMode(){{/crossLink}} and
 *   after all event subscriptions like {{#crossLink "Skylink/on:method"}}on(){{/crossLink}}
 *   or {{#crossLink "Skylink/once:method"}}once(){{/crossLink}} has been made.
 * This is where the Application Key is configured and attached to Skylink for usage.
 * @method init
 * @param {String|JSON} options The configuration settings for Skylink.
 *   If provided options is a <var>typeof</var> <code>string</code>, it will
 *   be interpreted as the Application Key being provided.
 * @param {String} options.appKey Previously known as <code>apiKey</code>.
 *   The Application Key that Skylink uses for initialising and connecting rooms.
 * @param {String} [options.defaultRoom=options.appKey] The default room that
 *   Skylink should connect to if there is no room provided in
 *   {{#crossLink "Skylink/joinRoom:method"}}joinRoom(){{/crossLink}}.
 *   If this value is not provided, the default room value would be
 *   the Application Key provided.
 * @param {String} [options.roomServer] The platform server URL that Skylink makes a
 *   <code>HTTP /GET</code> to retrieve the connection information required.
 *   This is a debugging feature, and it's not advisable to manipulate
 *     this value unless you are using a beta platform server.
 * @param {String} [options.region] <i>Deprecated feature</i>. The regional server that Skylink
 *    should connect to for fastest connectivity. [Rel: Skylink.REGIONAL_SERVER]
 * @param {Boolean} [options.enableIceTrickle=true] <i>Debugging Feature</i>.
 *    The flag that indicates if PeerConnections
 *    should enable trickling of ICE to connect the ICE connection. Configuring
 *    this value to <code>false</code> may result in a slower connection but
 *    a more stable connection.
 * @param {Boolean} [options.enableDataChannel=true] <i>Debugging feature</i>.
 *   The flag that indicates if PeerConnections
 *   should have any DataChannel connections. Configuring this value to <code>false</code>
 *   may result in failure to use features like
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}},
 *   {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}} and
 *   {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}} or any
 *   DataChannel connection related services.
 * @param {Boolean} [options.enableTURNServer=true] <i>Debugging feature</i>.
 *   The flag that indicates if PeerConnections connection should use any TURN server connection.
 *   Tampering this flag may disable any successful Peer connection
 *   that is behind any firewalls, so set this value at your own risk.
 * @param {Boolean} [options.enableSTUNServer=true] <i>Debugging feature</i>.
 *   The flag that indicates if PeerConnections connection should use any STUN server connection.
 *   Tampering this flag may cause issues to connections, so set this value at your own risk.
 * @param {Boolean} [options.forceTURN=false] The flag that indicates if PeerConnections connection
 *   should only use TURN server connection which enables a quicker connectivity.
 *   This configuration will override the settings for <code>enableTURNServer</code>
 *   and <code>enableSTUNServer</code> and set <code>enableTURNServer</code> as <code>true</code> and
 *   <code>enableSTUNServer</code> as <code>false</code> if the value is set to <code>true</code>.
 * @param {Boolean} [options.usePublicSTUN=true] The flag that indicates if PeerConnections connection
 *   should enable usage of public STUN server connection connectivity.
 *   This configuration would not work if <code>enableSTUNServer</code> is set to <code>false</code>
 *   or <code>forceTURN</code> is set to <code>true</code>.
 * @param {Boolean} [options.TURNServerTransport=Skylink.TURN_TRANSPORT.ANY] <i>Debugging feature</i>.
 *   The TURN server transport to enable for TURN server connections.
 *   Tampering this flag may cause issues to connections, so set this value at your own risk.
 *   [Rel: Skylink.TURN_TRANSPORT]
 * @param {JSON} [options.credentials] The credentials configured for starting a new persistent
 *   room meeting or connecting with Application Keys that do not use CORS authentication.
 *   Setting the <code>startDateTime</code> or the <code>duration</code> will not affect
 *   the actual duration for non persistent rooms. This feature would only affect connections with
 *   Application Keys that is configured for persistent room feature.
 *   To enable persistent room or disable CORS, you may set it in the developer console.
 *   CORS may be disabled by setting the platform to <code>"Other"</code>.
 * @param {String} options.credentials.startDateTime The room start datetime stamp in
 *   <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.
 *   This will start a new meeting based on the starting datetime stamp
 *   in the room that was selected to join for Application Key that is configured
 *   with persistent room feature. You may use
 *   <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString">
 *   Date.toISOString()</a> to retrieve ISO 8601 formatted date time stamp.
 *   The start date time of the room will not affect non persistent room connection.
 * @param {Number} options.credentials.duration The duration (in hours)
 *   that the room duration should be in. This will set the duration starting from
 *   the provided <code>startDateTime</code> onwards and after the duration is over,
 *   the meeting is over and the room is closed for Application Key that is
 *   configured with persistent room feature.
 *   The duration will not affect non persistent room connection.The duration of the meeting in hours.<br>
 *   <small>E.g. <code>0.5</code> for half an hour, <code>1.4</code> for 1 hour and 24 minutes</small>
 * @param {String} options.credentials.credentials The room credentials for Application Key.
 *   This is required for rooms connecting without CORS verification or starting a new persistent room meeting.<br><br>
 *   <u>To generate the credentials:</u><br>
 *   <ol>
 *   <li>Concatenate a string that consists of the room name
 *     the room meeting duration (in hours) and the start date timestamp (in ISO 8601 format).<br>
 *     <small>Format <code>room + "_" + duration + "_" + startDateTimeStamp</code></small></li>
 *   <li>Hash the concatenated string with the Application Key token using
 *     <a href="https://en.wikipedia.org/wiki/SHA-1">SHA-1</a>.
 *     You may use the <a href="https://code.google.com/p/crypto-js/#HMAC">CryptoJS.HmacSHA1</a> function to do so.<br>
 *     <small>Example <code>var hash = CryptoJS.HmacSHA1(concatenatedString, token);</code></small></li>
 *   <li>Convert the hash to a <a href="https://en.wikipedia.org/wiki/Base64">Base64</a> encoded string. You may use the
 *     <a href="https://code.google.com/p/crypto-js/#The_Cipher_Output">CryptoJS.enc.Base64</a> function
 *     to do so.<br><small>Example <code>var base64String = hash.toString(CryptoJS.enc.Base64); </code></small></li>
 *   <li>Encode the Base64 encoded string to a URI component using UTF-8 encoding with
 *     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent()</a>.<br>
 *     <small>Example <code>var credentials = encodeURIComponent(base64String);</code></small></li>
 *   </ol><br>
 * @param {Boolean} [options.audioFallback=false] The flag that indicates if there is a failure in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}} in retrieving user media
 *   video stream, it should fallback to retrieve audio stream only. This would not work for
 *   {{#crossLink "Skylink/joinRoom:method"}}joinRoom(){{/crossLink}} except
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @param {Boolean} [options.forceSSL=false] The flag to enforce an SSL platform signaling and platform server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used. This flag is mostly used for self domain accessing protocol
 *   that is <code>http:</code> and enforcing the SSL connections for
 *   platform signaling and platform server connection.
 * @param {String} [options.audioCodec=Skylink.AUDIO_CODEC.AUTO] <i>Debugging Feature</i>.
 *   The preferred audio codec that Peer connection
 *   streaming audio codec should use in the connection when available. If not available, the default
 *   codec would be the browser generated session description selected codec. [Rel: Skylink.AUDIO_CODEC]
 * @param {String} [options.videoCodec=Skylink.VIDEO_CODEC.AUTO] <i>Debugging Feature</i>.
 *   The preferred video codec that Peer connection
 *   streaming video codec should use in the connection when available. If not available, the default
 *   codec would be the browser generated session description selected codec. [Rel: Skylink.VIDEO_CODEC]
 * @param {Number} [options.socketTimeout=20000] The timeout that the socket connection should throw a
 *   timeout exception when socket fails to receive a response from connection. Depending on
 *   the max retries left based on the availability of ports given by the platform server,
 *   the socket will reattempt to establish a socket connection with the signaling server.<br>
 *   The mininum timeout value is <code>5000</code>.
 * @param {Boolean} [options.forceTURNSSL=false] The flag to enforce an SSL TURN server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used. This flag is mostly used for self domain accessing protocol
 *   that is <code>http:</code> and enforcing the SSL connections for
 *   TURN server connection.
 * This will configure TURN server connection using port <code>443</code> only and
 *   if <code>turns:</code> protocol is supported, it will use <code>turns:</code> protocol.
 * @param {Function} [callback] The callback fired after Skylink has been
 *   initialised successfully or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Number} callback.error.errorCode The
 *   <a href="#attr_READY_STATE_CHANGE_ERROR">READY_STATE_CHANGE_ERROR</a>
 *   if there is an <a href="#event_readyStateChange">readyStateChange</a>
 *   event error that caused the failure for initialising Skylink.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @param {Object} callback.error.error The exception thrown that caused the failure
 *   for initialising Skylink.
 * @param {Number} callback.error.status The XMLHttpRequest status code received
 *   when exception is thrown that caused the failure for initialising Skylink.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} callback.success.appKey Previously known as <code>apiKey</code>.
 *   The Application Key that Skylink uses for initialising and connecting rooms.
 * @param {String} callback.success.defaultRoom The default room that
 *   Skylink should connect to if there is no room provided in
 *   <a href="#method_joinRoom">joinRoom()</a>.
 * @param {String} callback.success.roomServer The platform server URL that Skylink makes a
 *   <code>HTTP /GET</code> to retrieve the connection information required.
 * @param {Boolean} callback.success.enableIceTrickle The flag that indicates if PeerConnections
 *    should enable trickling of ICE to connect the ICE connection.
 * @param {Boolean} callback.success.enableDataChannel The flag that indicates if PeerConnections
 *   should have any DataChannel connections.
 * @param {Boolean} callback.success.enableTURNServer The flag that indicates if
 *   PeerConnections connection should use any TURN server connection.
 * @param {Boolean} callback.success.enableSTUNServer The flag that indicates if
 *   PeerConnections connection should use any STUN server connection.
 * @param {Boolean} callback.success.TURNServerTransport The TURN server transport
 *   to enable for TURN server connections.
 *   [Rel: Skylink.TURN_TRANSPORT]
 * @param {String} [callback.success.serverRegion] The regional server that Skylink
 *    should connect to for fastest connectivity. [Rel: Skylink.REGIONAL_SERVER]
 * @param {Boolean} callback.success.audioFallback The flag that indicates if there is a failure in
 *   <a href="#method_getUserMedia">getUserMedia()</a> in retrieving user media
 *   video stream, it should fallback to retrieve audio stream only.
 * @param {Boolean} callback.success.forceSSL The flag to enforce an SSL platform signaling and platform server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used.
 * @param {String} callback.success.audioCodec The preferred audio codec that Peer connection
 *   streaming audio codec should use in the connection when available. [Rel: Skylink.AUDIO_CODEC]
 * @param {String} callback.success.videoCodec The preferred video codec that Peer connection
 *   streaming video codec should use in the connection when available. [Rel: Skylink.VIDEO_CODEC]
 * @param {Number} callback.success.socketTimeout The timeout that the socket connection should throw a
 *   timeout exception when socket fails to receive a response from connection. Depending on
 *   the max retries left based on the availability of ports given by the platform server,
 *   the socket will reattempt to establish a socket connection with the signaling server.
 * @param {Boolean} callback.success.forceTURNSSL The flag to enforce an SSL TURN server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used.
 * This will configure TURN server connection using port <code>443</code> only and
 *   if <code>turns:</code> protocol is supported, it will use <code>turns:</code> protocol.
 * @param {Boolean} callback.success.forceTURN The flag that indicates if PeerConnections connection
 *   should only use TURN server connection which enables a quicker connectivity.
 *   This configuration will override the settings for <code>enableTURNServer</code>
 *   and <code>enableSTUNServer</code> and set <code>enableTURNServer</code> as <code>true</code> and
 *   <code>enableSTUNServer</code> as <code>false</code> if the value is set to <code>true</code>.
 * @param {Boolean} callback.success.usePublicSTUN The flag that indicates if PeerConnections connection
 *   should enable usage of public STUN server connection connectivity.
 *   This configuration would not work if <code>enableSTUNServer</code> is set to <code>false</code>
 *   or <code>forceTURN</code> is set to <code>true</code>.
 * @example
 *   // Note: Default room is appKey when no room
 *   // Example 1: To initalize without setting any default room.
 *   SkylinkDemo.init("YOUR_APP_KEY_HERE");
 *
 *   // Example 2: To initialize with appKey and defaultRoom
 *   SkylinkDemo.init({
 *     appKey: "YOUR_APP_KEY_HERE",
 *     defaultRoom: "mainHangout"
 *   });
 *
 *   // Example 3: To initialize with credentials to set startDateTime and
 *   // duration of the room
 *   var hash = CryptoJS.HmacSHA1(roomname + "_" + duration + "_" +
 *     (new Date()).toISOString(), token);
 *   var credentials = encodeURIComponent(hash.toString(CryptoJS.enc.Base64));
 *   SkylinkDemo.init({
 *     appKey: "YOUR_APP_KEY_HERE",
 *     defaultRoom: "mainHangout"
 *     credentials: {
 *        startDateTime: (new Date()).toISOString(),
 *        duration: 500,
 *        credentials: credentials
 *     }
 *   });
 *
 *   // Example 4: To initialize with callback
 *   SkylinkDemo.init("YOUR_APP_KEY_HERE", function(error,success){
 *     if (error){
 *       console.error("Init failed:", error);
 *     }
 *     else{
 *       console.info("Init succeed:", success);
 *     }
 *   });
 *
 * @trigger readyStateChange
 * @required
 * @component Room
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.init = function(passedOptions, passedCallback) {
  var self = this;

  var options = null;
  var callback = null;

  // init("appKey")
  if (typeof passedOptions === 'string') {
    options = { appKey: passedOptions };
  // init({})
  } else if (typeof passedOptions === 'object' && passedOptions !== null) {
    options = clone(passedOptions);
  // init(null) or init(function () {})
  } else {
    options = {};

    if (typeof passedOptions === 'function') {
      callback = passedOptions;
    }
  }

  // init(..., function)
  if (typeof passedCallback === 'function') {
    callback = passedCallback;
  }

  // Handles error case
  var handleErrorCase = function (content, room) {
    self._trigger('readyStateChange', -1, content, room);

    if (typeof callback === 'function') {
      callback({
        errorCode: content.errorCode,
        error: content.content,
        status: content.status
      }, null);
    } else {
      throw content.content;
    }
  };

  // Handles success case
  var handleSuccessCase = function (session, room) {
    self._socket.reset();
    self._socket.server = session.ipSigserver;

    if (Array.isArray(session.httpPortList) && session.httpPortList.length > 0) {
      self._socket.ports['http:'] = session.httpPortList;
    } else {
      self._socket.ports['http:'] = self._socket.defaults.ports['http:'];
    }

    if (Array.isArray(session.httpsPortList) && session.httpsPortList.length > 0) {
      self._socket.ports['https:'] = session.httpsPortList;
    } else {
      self._socket.ports['https:'] = self._socket.defaults.ports['https:'];
    }

    self._trigger('readyStateChange', 2, null, room);

    if (typeof callback === 'function') {
      callback(null, {
        serverUrl: self._room._connection.path,
        readyState: self._room.readyState,
        appKey: self._room.appKey,
        roomServer: self._room.server,
        defaultRoom: self._room.room.default,
        selectedRoom: self._room.room.selected,
        serverRegion: self._room.region,
        enableDataChannel: self._connection.datachannel,
        enableIceTrickle: self._connection.ICE.trickle,
        enableTURNServer: !!self._connection.ICE.TURN,
        enableSTUNServer: !!self._connection.ICE.STUN,
        // Preconfig one even though it doesnt matter for fallback
        TURNTransport: self._connection.ICE.TURN ? self._connection.ICE.TURN.transport : self.TURN_TRANSPORT.ANY,
        audioFallback: self._audioFallback,
        forceSSL: self._socket.protocol === 'https:',
        socketTimeout: self._socket.timeout,
        // Preconfig one even though it doesnt matter for fallback
        forceTURNSSL: self._connection.ICE.TURN ? !!self._connection.ICE.TURN.ssl : window.location.protocol === 'https:',
        audioCodec: self._connection.SDP.codecs.audio,
        videoCodec: self._connection.SDP.codecs.video,
        // Preconfig one even though it doesnt matter for fallback
        forceTURN: self._connection.ICE.TURN ? self._connection.ICE.TURN.force : false,
        // Preconfig one even though it doesnt matter for fallback
        usePublicSTUN: self._connection.ICE.STUN ? self._connection.ICE.STUN.public : false
      });
    }
  };

  try {
    // Reset to defaults
    self._room.reset();
    self._trigger('readyStateChange', 0, null, null);

    self._initParseConfig(options);
    self._initCheckDependencies(function (error) {
      if (error) {
        return handleErrorCase(error, self._room.room.selected);
      }

      self._room.readyState = 1;
      self._trigger('readyStateChange', 1, null, self._room.room.selected);

      self._room.once('readyState', function (state, content, room) {
        if (state === -1) {
          return handleErrorCase(content, room);
        }

        handleSuccessCase(content, room);
      }, function (state, content, room) {
        return state === -1 || state === 2;
      });

      self._room.fetchSession();
    });

  } catch (error) {
    handleErrorCase({
      status: null,
      content: error,
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH
    }, self._room.room.selected);
  }
};





