//// HANDLES THE PEER CONNECTIONS AND SESSIONS
//// -- PRIVATE METHODS -----------------------------------------------------
/**
 * Contains the user session information.
 * @attribute _user
 * @param {String} id The user session ID.
 * @param {Any} data Ther user custom data.
 * @param {Number} tieBreaker The user tieBreaker that would be used
 *   for comparison.
 * @param {JSON} stream The user MediaStream object information.
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._user = {
  id: null,
  data: null,
  agent: {
    name: window.webrtcDetectedBrowser,
    version: window.webrtcDetectedVersion,
    os: window.navigator.platform
  },
  tieBreaker: 0,
  stream: null
};

/*
 * Contains the list of peers.
 * @attribute _peers
 * @param {JSON} (#peerId) The peer session information.
 * @param {RTCPeerConnection} (#peerId).connection The peer RTCPeerConnection object.
 * @param {JSON} (#peerId).settings The peer connection settings.
 * @param {Boolean} [(#peerId).settings.trickleICE=true] The flag that indicates if
 *   RTCPeerConnection object should trickle ICE.
 * @param {Boolean} [(#peerId).settings.recvOnly=false] The flag that indicates if
 *   RTCPeerConnection object should receive only.
 * @param {Boolean} [(#peerId).settings.dataChannel=true] The flag that indicates if
 *   RTCPeerConnection object should enable RTCDataChannel functionality.
 * @param {JSON} (#peerId).connection.bandwidth Stores the bandwidth information to modify the SDP with.
 * @param {Number} (#peerId).settings.bandwidth.audio The audio bandwidth allocation.
 * @param {Number} (#peerId).settings.bandwidth.video The video bandwidth allocation.
 * @param {Number} (#peerId).settings.bandwidth.data The data transfers bandwidth allocation.
 * @param {Boolean} (#peerId).settings.stereo The flag that indicates if the SDP should be modified with
 *   stereo flag when in a OPUS call.
 * @param {JSON} (#peerId).settings.codecs The media codecs used.
 * @param {String} (#peerId).settings.codecs.audio The audio codec used.
 * @param {String} (#peerId).settings.codecs.video The video codec used.
 * @param {Number} (#peerId).ICEFailures Stores the number of ICE failures.
 * @param {JSON} (#peerId).agent The peer agent information.
 * @param {String} (#peerId).agent.name The peer agent name.
 * @param {Number} (#peerId).agent.version The peer agent version.
 * @param {String} (#peerId).agent.os The peer agent platform.
 * @param {Any} (#peerId).data The peer custom data.
 * @param {JSON} (#peerId).channels The peer RTCDataChannels list.
 * @param {JSON} (#peerId).stream The peer MediaStream object information.
 * @param {JSON} (#peerId).health The peer connection status health checker.
 * @param {Function} (#peerId).health.timer The timeout checker for the RTCPeerConnection.
 * @param {Boolean} (#peerId).health.connected The flag that indicates if RTCPeerConnection is connected.
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peers = {};

/**
 * Creates the peer session object.
 * @method _createPeer
 * @param {String} peerId The peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._createPeer = function (peerId, options) {
  var self = this;

  if (self._peers[peerId]) {
    log.warn(peerId, 'Ignoring creation for peer object as it exists');
    return;
  }

  var audioBandwidth = 0;
  var videoBandwidth = 0;
  var dataBandwidth = 0;

  // Parse bandwidth options
  if (typeof options.connection.bandwidth === 'object') {
    // Parse audio bandwidth
    if (typeof options.connection.bandwidth.audio === 'number' &&
      options.connection.bandwidth.audio > 0) {
      audioBandwidth = options.connection.bandwidth.audio;
    }
    // Parse video bandwidth
    if (typeof options.connection.bandwidth.video === 'number' &&
      options.connection.bandwidth.video > 0) {
      videoBandwidth = options.connection.bandwidth.video;
    }
    // Parse data bandwidth
    if (typeof options.connection.bandwidth.data === 'number' &&
      options.connection.bandwidth.data > 0) {
      dataBandwidth = options.connection.bandwidth.data;
    }
  }

  self._peers[peerId] = {
    // RTCPeerConnection object
    connection: null,
    // Browser (or SDK) agent info
    agent: {
      name: options.user.agent.name,
      version: options.user.agent.version,
      os: options.user.agent.os || ''
    },
    // SDP connection settings
    settings: {
      trickleICE: !!options.connection.trickleICE,
      recvOnly: !!options.connection.recvOnly,
      dataChannel: !!options.connection.dataChannel,
      bandwidth: {
        audio: audioBandwidth,
        video: videoBandwidth,
        data: dataBandwidth,
        stereo: !!options.connection.stereo
      }
    },
    data: options.user.data,
    ICEFailures: 0,
    channels: [],
    stream: options.user.stream,
    // The timer information
    health: {
      timer: null,
      ok: false,
      timeout: 10000,
      channelsOk: false
    },
    // When closing connection, timers ignore this because this peer has left and is dead
    dead: false
  };

  self._createConnection(peerId);

  log.log(peerId, 'Peer session object has been initialized', options);
};

/**
 * Destroys the peer session object.
 * @method _destroyPeer
 * @param {String} peerId The peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.protoype._destroyPeer = function (peerId) {

  self._destroyConnection(peerId);

};

/**
 * Creates the peer RTCPeerConnection object.
 * @method _createConnection
 * @param {String} peerId The peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._createConnection = function (peerId) {
  var self = this;

  if (!self._peers[peerId]) {
    log.error(peerId, 'Ignoring creation of peer RTCPeerConnection object as peer session is missing');
    return;
  }

  var RTCConfig = {
    iceServers: self._iceServers || []
  };

  var RTCConstraints = {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  };

  // Create RTCPeerConnection object
  var peer = new RTCPeerConnection(RTCConfig, RTCConstraints);

  // RTCPeerConnection.ondatachannel
  peer.ondatachannel = function (event) {
    var channel = event.channel || event;
    log.debug(peerId, 'Received RTCDataChannel object from peer ->', channel);
  };

  // RTCPeerConnection.onaddstream
  peer.onaddstream = function (event) {
    var stream = event.stream || event;
    log.debug(peerId, 'Received MediaStream object from peer ->', stream);
  };

  // RTCPeerConnection.oniceconnectionstatechange
  peer.oniceconnectionstatechange = function () {
    log.debug(peerId, 'RTCPeerConnection ICE connection state ->', peer.iceConnectionState);
  };

  // RTCPeerConnection.onicegatheringstatechange
  peer.onicegatheringstatechange = function () {
    log.debug(peerId, 'RTCPeerConnection ICE gathering state ->', peer.iceGatheringState);
  };

  // RTCPeerConnection.onsignalingstatechange
  peer.onsignalingstatechange = function () {
    log.debug(peerId, 'RTCPeerConnection signaling state ->', peer.signalingState);
  };

  // Implement RTCPeerConnection.removeStream polyfill
  if (window.webrtcDetectedBrowser === 'firefox') {
    peer.removeStream = function (stream) {
      var senders = peer.getSenders();
      for (var s = 0; s < senders.length; s++) {
        var tracks = stream.getTracks();
        for (var t = 0; t < tracks.length; t++) {
          if (tracks[t] === senders[s].track) {
            peer.removeTrack(senders[s]);
          }
        }
      }
    };
  }

  self._peers[peerId].connection = peer;

  self._monitorConnection(peerId);

  log.log(peerId, 'Peer RTCPeerConnection object has been created');
};

/**
 * Destroys the peer RTCPeerConnection object.
 * @method _destroyConnection
 * @param {String} peerId The peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._destroyConnection = function (peerId) {
  var self = this;

  if (!self._peers[peerId]) {
    log.warn(peerId, 'Ignoring destroying of peer RTCPeerConnection object as peer session is missing');
    return;
  }

  if (!self._peers[peerId].connection) {
    log.warn(peerId, 'Ignoring destroying of peer RTCPeerConnection object as it does not exists');
    return;
  }

  self._peers[peerId].close();
  self._destroyChannels(peerId);

  log.log(peerId, 'Peer RTCPeerConnection object have been destroyed');
};

/**
 * Monitors the peer RTCPeerConnection object connection status.
 * This restarts the connection if connection is not yet established.
 * @method _monitorConnection
 * @param {String} peerId The peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._monitorConnection = function (peerId) {
  var self = this;

  if (!self._peers[peerId]) {
    log.warn(peerId, 'Ignoring destroying of peer RTCPeerConnection object as peer session is missing');
    return;
  }

  self._peers[peerId].health.timer = setTimeout(function () {
    var isHealthy = false;

    if (self._peers[peerId].connection) {

      var iceConnectionStateHealthy =
        ['connected', 'completed'].indexOf(self._peers[peerId].connection.iceConnectionState));

      var signalingStateHealthy = self._peers[peerId].connection.signalingState === 'stable';

      var dataChannelStateHealthy = self._peers[peerId].health.channelsOk;

      isHealthy = iceConnectionStateHealthy && signalingStateHealthy && dataChannelStateHealthy;
    }

    self._peers[peerId].health.ok = isHealthy;

    if (!self._peers[peerId].dead) {
      if (!isHealthy) {
        self._restartConnection(peerId);
      }

      log.debug('Peer RTCPeerConnection object monitor timer has expired. Should restart ->', !isHealthy);

    } else {
      log.debug('Peer RTCPeerConnection object monitor timer has expired. Ignoring any restarts. ' +
        'Should actually restart ->', !isHealthy);
    }
  }, self._peers[peerId].health.timeout);

  log.log('Peer RTCPeerConnection object is monitored');
};

/**
 * Restarts the peer RTCPeerConnection object.
 * @method _restartConnection
 * @param {String} peerId The peer session ID.
 * @param {Boolean} [hardRestart=false] The flag that indicates if
 *   connection should do a cleanup of RTCPeerConnection object and
 *   re-initialize.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.protoype._restartConnection = function (peerId, hardRestart) {
  var self = this;

  if (!self._peers[peerId]) {
    log.warn(peerId, 'Ignoring restarting of peer RTCPeerConnection object as peer session is missing');
    return;
  }

  if (hardRestart) {
    self._destroyConnection(peerId);

    self._createConnection(peerId);
  }






};

//// -- PUBLIC METHODS -----------------------------------------------------
/**
 * Contains the list of available peer connection states.
 * @attribute PEER_CONNECTION_STATE
 * @param {String} STABLE <small>Value <code>"stable"</code></small>
 *   The state when there is no handshaking in progress and when
 *   handshaking has just started or close.<br>
 * This state occurs when peer connection has just been initialised and after
 *   <code>HAVE_LOCAL_OFFER</code> or <code>HAVE_REMOTE_OFFER</code>.
 * @param {String} HAVE_LOCAL_OFFER <small>Value <code>"have-local-offer"</code></small>
 *   The state when the local session description <code>"offer"</code> is generated and to be sent.<br>
 * This state occurs after <code>STABLE</code> state.
 * @param {String} HAVE_REMOTE_OFFER <small>Value <code>"have-remote-offer"</code></small>
 *   The state when the remote session description <code>"offer"</code> is received.<br>
 * At this stage, this indicates that the peer connection signaling handshaking has been completed, and
 *   likely would go back to <code>STABLE</code> after local <code>"answer"</code> is received by Peer.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when the peer connection is closed.<br>
 * This state occurs when connection with peer has been closed, usually when peer leaves the room.
 * @type JSON
 * @readOnly
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
};

/**
 * These are the types of server peers that Skylink would connect with.
 * - Different server peers that serves different functionalities.
 * - The server peers functionalities are only available depending on the
 *   Application Key configuration.
 * - Eventually, this list will be populated as there are more server peer
 *   functionalities provided by the Skylink platform.
 * @attribute SERVER_PEER_TYPE
 * @param {String} MCU <small>Value <code>"mcu"</code></small>
 *   This server peer is a MCU server connection.
 * @type JSON
 * @readOnly
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype.SERVER_PEER_TYPE = {
  MCU: 'mcu'
};

/**
 * Gets any peer information based on the peer session ID provided.
 * @method getPeerInfo
 * @param {String} peerId
 */
