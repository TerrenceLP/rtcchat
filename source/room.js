/**
 * Contains the Room.
 * @attribute _room
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._room = {
  connected: false,
  locked: false,
  name: null,
  MCU: false,
  session: {
    path: null,
    protocol: null,
    random: null,
    data: null,
    useXDomainRequest: typeof window.XDomainRequest === 'function' ||
      typeof window.XDomainRequest === 'object'
  },
  config: {
    default: {
      appKey: null,
      defaultRoom: null,
      roomServer: '//api.temasys.com.sg',
      region: null,
      credentials: null,
      forceSSL: false,
      socketTimeout: 20000,
      enableIceTrickle: true,
      enableDataChannel: true,
      enableTURNServer: true,
      enableSTUNServer: true,
      usePublicSTUN: true,
      forceTURN: false,
      forceTURNSSL: false,
      TURNServerTransport: 'any',
      audioFallback: false,
      audioCodec: 'auto',
      videoCodec: 'auto'
    },
    current: {}
  }
};

/**
 * Contains the user session information.
 * @attribute _user
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._user = {
  agent: {
    name: window.webrtcDetectedBrowser,
    version: window.webrtcDetectedVersion,
    os: window.navigator.platform
  },
  data: null,
  session: {
    id: null,
    tieBreaker: null,
    ICE: {
      servers: [],
      useCandidates: {
        default: ['relay', 'host', 'srflx'],
        current: []
      }
    },
    stereo: true
  }
};

/**
 * Fetches for the Room session information.
 * @method _roomFetchSession
 * @param {Function} callback The callback triggered upon error or success.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomFetchSession = function (callback) {
  var _this = this;
  var xhr = null;

  _this._roomConstructSessionPath();

  // Use XDomainRequest
  if (_this._room.session.useXDomainRequest) {
    xhr = new XDomainRequest();
    xhr.setContentType = function (contentType) {
      xhr.contentType = contentType;
    };

    log.log([null, 'Room', _this._room.name, 'Using XDomainRequest to fetch Room session']);

  // Use XMLHttpRequest
  } else {
    xhr = new XMLHttpRequest();
    xhr.setContentType = function (contentType) {
      xhr.setRequestHeader('Content-type', contentType);
    };

    log.log([null, 'Room', _this._room.name, 'Using XMLHttpRequest to fetch Room session']);
  }

  // XMLHttpRequest.onload event
  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}');
    var status = xhr.status || 200;

    log.debug([null, 'Room', _this._room.name, 'Received response from API server ->'], response);

    if (!response.success) {
      log.debug([null, 'Room', _this._room.name, 'Failed initialising session ->'], response.message);

      // READY_STATE_ERROR -> API response
      callback({

        status: xhr.status || 200,
        errorCode: response.error,
        content: new Error(response.info)

      }, null);
      return;
    }

    _this._room.session.data = response;

    // Configure the socket connection
    _this._socket.config.current = _this._socket.config.default;

    // Configure the httpsPortsList
    if (Array.isArray(response.httpsPortList) && response.httpsPortList.length > 0) {
      _this._socket.config.current.ports['https:'] = response.httpsPortList;
    }

    // Configure the httpPortList
    if (Array.isArray(response.httpPortList) && response.httpPortList.length > 0) {
      _this._socket.config.current.ports['http:'] = response.httpPortList;
    }

    // Configure the ipSigserver
    if (typeof response.ipSigserver === 'string') {
      _this._socket.config.current.server = response.ipSigserver;
    }

    log.debug([null, 'Room', _this._room.name, 'Session has been initialized']);

    callback(null, response);
  };

  // XMLHttpRequest.onerror event
  xhr.onerror = function (error) {
    log.error([null, 'Room', _this._room.name, 'Failed retrieving response from API server ->'], error);

    callback({

      status: xhr.status || null,
      content: new Error('Network error occurred with HTTP status ' + xhr.status),
      errorCode: _this.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR

    }, null);
  };

  // XMLHttpRequest.onprogress
  xhr.onprogress = function () {
    log.debug([null, 'Room', _this._room.name, 'Retrieving response from API server']);
  };

  xhr.open('GET', _this._room.session.path, true);
  xhr.send();
};

/**
 * Constructs the Room session path.
 * @method _roomConstructSessionPath
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomConstructSessionPath = function () {
  var _this = this;
  var append = '?&';

  // Configure the session protocol
  _this._room.session.protocol = window.location.protocol;
  // Force set to "https:" for forceSSL
  if (_this._room.config.current.forceSSL) {
    _this._room.session.protocol = 'https:';
  }
  // Warn users using custom roomServer
  if (_this._room.config.current.roomServer !== _this._room.config.default.roomServer) {
    log.warn([null, 'Room', _this._room.name,
      'Room is using custom server and this may affect Skylink functionalities ->'],
      _this._room.config.current.roomServer);
  }

  // Construct the path
  _this._room.session.path =
  // Append the protocol
    _this._room.session.protocol + '//' +
  // Append the roomServer
    _this._room.config.current.roomServer + '/api/' +
  // Append the appKey and selected room
    _this._room.config.current.appKey + '/' + _this._room.name;

  // Check if credentials is needed
  if (_this._room.config.current.credentials) {
    _this._room.session.path +=
    // Append the credentials.startDateTime
      _this._room.config.current.credentials.startDateTime + '/' +
    // Append the credentials.duration
      _this._room.config.current.credentials.duration + append +
    // Append the credentials.credentials
      'cred=' + _this._room.config.current.credentials.credentials;
    // Update append
    append = '&';
  }

  // Check if region is needed
  if (_this._room.config.current.region) {
    _this._room.session.path += append +
    // Append the region
      'rg=' + _this._room.config.current.region;
    // Update append
    append = '&';
  }

  // Add the random string
  _this._room.session.random = (new Date()).getTime();
  _this._room.session.path += append + 'rand=' + _this._room.session.random;

  log.debug([null, 'Room', _this._room.name, 'Session path has been constructed']);
};

/**
 * Parses the init() configuration.
 * @method _initParseConfig
 * @param {JSON} config The configuration passed.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._initParseConfig = function (config) {
  var _this = this;

  // Preset to defaults
  _this._room.config.current = clone(_this._room.config.default);

  // init({} -> appKey)
  if (typeof config.appKey === 'string') {
    _this._room.config.current.appKey = config.appKey;
  // init({} -> apiKey)
  } else if (typeof config.apiKey === 'string') {
    _this._room.config.current.appKey = config.apiKey;
  // init({} -> ERROR - no key)
  } else {
    throw new Error('Failed initializing as appKey is not found');
  }

  // init({} -> defaultRoom)
  if (typeof config.defaultRoom === 'string') {
    _this._room.config.current.defaultRoom = config.defaultRoom;
  // Fallback to default
  } else {
    _this._room.config.current.defaultRoom = _this._room.config.current.appKey;
  }

  // Configure the selected room first
  _this._room.name = _this._room.config.current.defaultRoom;

  // init({} -> roomServer)
  if (typeof config.roomServer === 'string') {
    if (config.roomServer !== _this._room.config.default.roomServer) {
      _this._room.config.current.roomServer = config.roomServer;
    }
  }

  // init({} -> region)
  if (typeof config.region === 'string') {
    // Loop to check if option is valid in REGIONAL_SERVER list
    objForEach(_this.REGIONAL_SERVER, function (region) {
      if (config.region === region) {
        _this._room.config.current.region = region;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.region === null) {
      throw new Error('Provided region is invalid. ' +
        'Please select the list of options from REGIONAL_SERVER list');
    }
  }

  // init({} -> credentials)
  if (typeof config.credentials === 'object' && config.credentials !== null) {
    // init({} -> credentials.startDateTime)
    if (typeof config.credentials.startDateTime !== 'string') {
      throw new Error('Provided credentials.startDateTime DateTime string (ISO 8601) is invalid');
    }
    // init({} -> credentials.duration)
    if (typeof config.credentials.duration !== 'number') {
      throw new Error('Provided credentials.duration (in hours) is invalid');
    }
    // init({} -> credentials.credentials)
    if (typeof config.credentials.credentials !== 'string') {
      throw new Error('Provided credentials.credentials string is invalid');
    }

    _this._room.config.current.credentials = {
      startDateTime: config.credentials.startDateTime,
      duration: config.credentials.duration,
      credentials: config.credentials.credentials
    };
  }

  // init({} -> forceSSL)
  if (config.forceSSL === true) {
    _this._room.config.current.forceSSL = true;
  }

  // init({} -> socketTimeout)
  if (typeof config.socketTimeout === 'number') {
    if (config.socketTimeout < 5000) {
      throw new Error('Provided socketTimeout is less than mininum value of 5000');
    }
    _this._room.config.current.socketTimeout = config.socketTimeout;
  }

  // init({} -> enableTURNServer)
  if (config.enableTURNServer === false) {
    _this._room.config.current.enableTURNServer = false;
  }

  // init({} -> enableSTUNServer)
  if (config.enableSTUNServer === false) {
    _this._room.config.current.enableSTUNServer = false;
  }

  // init({} -> forceTURN)
  if (config.forceTURN === true) {
    _this._room.config.current.forceTURN = true;
  }

  // init({} -> forceTURNSSL)
  if (config.forceTURNSSL === true) {
    _this._room.config.current.forceTURNSSL = true;
  }

  // init({} -> usePublicSTUN)
  if (config.usePublicSTUN === false) {
    _this._room.config.current.usePublicSTUN = false;
  }

  // init({} -> enableDataChannel)
  if (config.enableDataChannel === false) {
    _this._room.config.current.enableDataChannel = false;
  }

  // init({} -> enableIceTrickle)
  if (config.enableIceTrickle === false) {
    _this._room.config.current.enableIceTrickle = false;
  }

  // init({} -> TURNServerTransport)
  if (typeof config.TURNServerTransport === 'string') {
    objForEach(_this.TURN_TRANSPORT, function (transport) {
      if (config.TURNServerTransport === transport) {
        _this._room.config.current.TURNServerTransport = transport;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.TURNServerTransport === null) {
      throw new Error('Provided TURNServerTransport is invalid. ' +
        'Please select the list of options from TURN_TRANSPORT list');
    }
  }

  // init({} -> audioCodec)
  if (typeof config.audioCodec === 'string') {
    objForEach(_this.AUDIO_CODEC, function (codec) {
      if (config.audioCodec === codec) {
        _this._room.config.current.audioCodec = codec;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.audioCodec === null) {
      throw new Error('Provided audioCodec is invalid. ' +
        'Please select the list of options from AUDIO_CODEC list');
    }
  }

  // init({} -> videoCodec)
  if (typeof config.videoCodec === 'string') {
    objForEach(_this.VIDEO_CODEC, function (codec) {
      if (config.videoCodec === codec) {
        _this._room.config.current.videoCodec = codec;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.videoCodec === null) {
      throw new Error('Provided videoCodec is invalid. ' +
        'Please select the list of options from VIDEO_CODEC list');
    }
  }

  // init({} -> audioFallback)
  if (config.audioFallback === true) {
    _this._room.config.current.audioFallback = true;
  }

  log.debug('init() configuration has been parsed');
};

/**
 * Checks and load the init() dependencies.
 * @method _initLoadDependencies
 * @param {Function} callback The callback triggered upon error or success.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._initLoadDependencies = function (callback) {
  var _this = this;

  // When AdapterJS is not loaded
  if (typeof window.AdapterJS !== 'object' || window.AdapterJS === null) {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('AdapterJS dependency is not loaded. ' +
        'Please load AdapterJS version @@adapterjs in https://github.com/Temasys/AdapterJS')

    });
    return;

  // When AdapterJS version is incorrect
  } else if (window.AdapterJS.VERSION !== '@@adapterjs') {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('Incorrect AdapterJS dependency loaded. ' +
        'Please load the AdapterJS version @@adapterjs in https://github.com/Temasys/AdapterJS')

    });
    return;
  }

  // When socket.io-client is not loaded
  // NOTE: We are unable to determine the version (or any proper documented way at least)
  if (typeof window.io !== 'function') {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT,
      content: new Error('XMLHttpRequest is not supported. ' +
        'Please upgrade your browser with the latest in http://browsehappy.com')

    });
    return;
  }

  // When XMLHttpRequest is not supported
  if (!window.XMLHttpRequest && !_this._room.session.useXDomainRequest) {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      content: new Error('socket.io-client dependency is not loaded. ' +
        'Please load socket.io-client version @@socketio in http://socket.io/download/')

    });
    return;
  }

  // Load AdapterJS
  AdapterJS.webRTCReady(function () {
    // When RTCPeerConnection is not loaded and supported with no plugin support
    if (!window.RTCPeerConnection) {
      callback({

        status: null,
        errorCode: _this.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT,
        content: new Error('Your browser does not support WebRTC. Please switch to Chrome, Firefox, Opera ' +
          'or install our Temasys free Plugin for IE and Safari')

      });
      return;
    }

    log.debug('init() WebRTC functions has been loaded');

    callback(null);
  });
};

/**
 * Reacts to the Room locked status.
 * @method _roomReactToLock
 * @param {String} peerId The Peer session ID.
 * @param {Boolean} locked The Room locked status.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomReactToLock = function (peerId, locked) {
  var _this = this;

  log.debug([peerId, 'Room', _this._room.name, 'Locked status ->'], locked);

  _this._room.locked = locked === true;

  _this._trigger('roomLock', locked, peerId, _this.getPeerInfo(peerId), false);
};

/**
 * Reacts to the Room server actions.
 * @method _roomReactToServerAction
 * @param {String} action The server action.
 * @param {String} reason The server action reason.
 * @param {String} message The server message.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomReactToServerAction = function (action, reason, message) {
  var _this = this;

  if (reason === _this.SYSTEM_ACTION_REASON.ROOM_LOCKED) {
    _this._room.locked = true;
  }

  if (action === _this.SYSTEM_ACTION.REJECT) {
    log.warn([null, 'Room', _this._room.name, 'Connection rejected from server ->'], message);

  } else {
    log.warn([null, 'Room', _this._room.name, 'Connection warning from server ->'], message);
  }

  // Destroy all Peer sessions.
  Object.keys(_this._peers).forEach(function (peerId) {
    _this._peerDestroy(peerId);
  });

  _this._trigger('systemAction', action, message, reason);
};

/**
 * Reacts to the Room connected.
 * @method _roomReactToConnect
 * @param {String} userId The user session ID.
 * @param {Number} tieBreaker The user session tieBreaker.
 * @param {Array} iceServers The ICE servers.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomReactToConnect = function (userId, tieBreaker, iceServers) {
  var _this = this;

  _this._user.session.id = userId;
  _this._user.session.tieBreaker = (new Date ()).getTime();
  _this._user.session.ICE.useCandidates.current = _this._user.session.ICE.useCandidates.default;

  if (typeof tieBreaker === 'number') {
    _this._user.session.tieBreaker = tieBreaker;
  }

  // Firefox connections should always be the answerer with other types of agents
  if (_this._user.agent.name === 'firefox') {
    _this._user.session.tieBreaker -= 100000000000;
  }

  // Parse the ICE servers
  if (Array.isArray(iceServers)) {
    _this._roomParseIceServers(iceServers);
  }

  // Set the ICE candidates if relay if force set
  if (_this._room.config.current.forceTURN) {
    _this._user.session.ICE.useCandidates.current = ['relay'];
  }

  _this._messageConstructEnter(null);
};

/**
 * Reacts to the Room message.
 * @method _roomReactToMessage
 * @param {String} peerId The Peer session ID.
 * @param {Any} message The message object received.
 * @param {Boolean} isPrivate The flag that indicates if this is a private or public message.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomReactToMessage = function (peerId, message, isPrivate) {
  var _this = this;

  // Check if Room session exists
  if (!_this._room.connected) {
    log.warn([peerId, 'Room', _this._room.name, 'Ignoring public message received as user is not connected in Room ->'], message);
    return;
  }

  log.debug([peerId, 'Room', _this._room.name, 'Received ' + (isPrivate ? 'private' : 'public') + ' message ->'], message);

  _this._trigger('incomingMessage', {

    content: message.message,
    isPrivate: isPrivate,
    targetPeerId: isPrivate ? peerId : null,
    isDataChannel: false,
    senderPeerId: peerId

  }, peerId, _this.getPeerInfo(peerId), false);
};

/**
 * Parses the RTCIceServers configuration.
 * @method _roomParseIceServers
 * @param {Array} iceServers The ICE servers received from signaling server.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomParseIceServers = function (passedIceServers) {
  var _this = this;
  var iceServersList = {};

  _this._user.session.ICE.servers = [];

  var pushURLFn = function (url, username, credential, index) {
    // username level
    if (!Array.isArray(iceServersList[username + '@' + credential])) {
      iceServersList[username + '@' + credential] = [];
    }

    if (iceServersList[username + '@' + credential].indexOf(url) === -1) {
      if (typeof index !== 'number') {
        iceServersList[username + '@' + credential].push(url);
      } else {
        iceServersList[username + '@' + credential].splice(index, url);
      }
    }
  };

  var processURLFn = function (url, passedUsername, credential) {
    var username = passedUsername;
    var serverUrl = url;
    var processAllTransports = false;

    // E.g. turn:test@erer.com.sg
    if (url.indexOf('@') > 0) {
      var urlParts = url.split(':');
      var url2Parts = urlParts[1].split('@');
      // Get the username
      username = url2Parts[0];
      // Set to so to join and get the server URL
      urlParts[1] = url2Parts[1];
      serverUrl = urlParts.join(':');
    }

    if (serverUrl.indexOf('turn') === 0) {
      // Check we require to configure turns:
      if (_this._room.config.current.forceTURNSSL) {
        if (serverUrl.indexOf('turns') === -1) {
          log.warn([null, 'Room', _this._room.name, 'Ignoring Skylink TURN servers for TURN without TLS connections ->'], serverUrl);
          return;
        }

        var urlSSLTransportsParts = serverUrl.split('?');
        var urlSSLParts = urlSSLTransportsParts[0].split(':');

        if (_this._user.agent.name === 'firefox') {
          log.warn([null, 'Room', _this._room.name, 'Current browser does not TURNS protocol, hence fallbacking to use port 443 ->'], serverUrl);

          urlSSLParts[2] = 443;

        } else {
          urlSSLParts[0] = 'turns';
        }

        urlSSLTransportsParts[0] = urlSSLParts.join(':');
        serverUrl = urlSSLTransportsParts.join('?');
      }

      // No transports for TURN
      if (_this._room.config.current.TURNServerTransport === _this.TURN_TRANSPORT.NONE) {
        serverUrl = serverUrl.split('?')[0];

      // TCP only transports for TURN
      } else if (_this._room.config.current.TURNServerTransport === _this.TURN_TRANSPORT.TCP) {
        serverUrl = serverUrl.split('?')[0] + '?transport=tcp';

      // UDP only transports for TURN
      } else if (_this._room.config.current.TURNServerTransport === _this.TURN_TRANSPORT.UDP) {
        serverUrl = serverUrl.split('?')[0] + '?transport=udp';

      // Both transports
      } else if (_this._room.config.current.TURNServerTransport === _this.TURN_TRANSPORT.ALL) {
        serverUrl = serverUrl.split('?')[0];
        processAllTransports = true;
      }
    } else {
      if (serverUrl.indexOf('temasys.com.sg') === -1) {
        // usePublicSTUN === false
        if (!_this._room.config.current.usePublicSTUN) {
          log.warn([null, 'Room', _this._room.name, 'Ignoring public STUN url ->'], serverUrl);
          return;
        }
        // usePublicSTUN === true but not firefox server
        if (_this._user.agent.name === 'firefox' && serverUrl.indexOf('google.com') > 0) {
          log.warn([null, 'Room', _this._room.name, 'Ignoring public Google STUN url for Firefox ->'], serverUrl);
          return;
        }
      }
    }

    pushURLFn(serverUrl, username, credential);

    // Add all the transports type
    if (processAllTransports) {
      pushURLFn(serverUrl + '?transport=tcp', username, credential);
      pushURLFn(serverUrl + '?transport=udp', username, credential);
    }
  };

  passedIceServers.forEach(function (server) {
    var credential = server.credential;

    if (typeof server.password === 'string') {
      credential = server.password;
    }

    if (Array.isArray(server.urls)) {
      servers.urls.forEach(function (url) {
        processURLFn(url, server.username, credential);
      });
    }

    if (typeof server.url === 'string') {
      processURLFn(server.url, server.username || 'none', credential || 'none');
    }
  });

  if (_this._user.agent.name === 'firefox' && _this._room.config.current.usePublicSTUN) {
    pushURLFn('stun:stun.services.mozilla.com', 'none', 'none', 0);
  }

  objForEach(iceServersList, function (urls, usernameAndCred) {
    var username = usernameAndCred.split('@')[0];
    var credential = usernameAndCred.split('@')[1];
    var RTCIceServer = {
      urls: urls
    };

    if (username !== 'none') {
      RTCIceServer.username = username;
    }

    if (credential !== 'none') {
      RTCIceServer.credential = credential;
    }

    _this._user.session.ICE.servers.push(RTCIceServer);
  });
};
