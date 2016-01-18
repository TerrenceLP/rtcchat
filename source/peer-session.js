/**
 * Contains the list of Peers.
 * @attribute _peers
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peers = {};

/**
 * Stores the Peer session information.
 * @method _peerCreate
 * @param {String} peerId The Peer session ID.
 * @param {JSON} config The message object that contains the Peer session information.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCreate = function (peerId, config) {
  var _this = this;

  if (_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring starting of session as it does exists']);
    return;
  }

  var peerMonitorOfferer = config.tieBreaker > _this._user.session.tieBreaker;

  // Construct the peer object
  _this._peers[peerId] = {
    // The RTCPeerConnection object
    peer: null,

    // The agent information
    agent: {
      name: config.user.agent.name,
      version: config.user.agent.version,
      os: config.user.agent.os
    },

    // The custom data
    data: config.user.data,

    // The stream information
    stream: config.stream,

    // Dead status when destroying session
    dead: false,

    // The connection information
    connection: {
      // The flag if connection should allow RTCDataChannel connections
      datachannel: config.connection.dataChannel && _this._room.config.current.enableDataChannel,
      // The flag if connection should allow stereo for OPUS audio streaming
      stereo: config.connection.stereo && _this._user.session.stereo,
      // The flag if connection should trickle ICE
      trickleICE: config.connection.trickleICE && _this._room.config.current.enableIceTrickle,
      // The flag if RTCDataChannel connections should be reliable or not
      reliableTransfers: false
    },

    // The ICE connection status
    ICEStatus: {},

    // The connection monitor
    monitor: {
      connected: false,
      timer: null,
      timeout: peerMonitorOfferer ? 12500 : 10000,
      retries: 0,
      offerer: peerMonitorOfferer
    },

    // The RTCDataChannels list
    channels: {}
  };

  _this._peerConnect(peerId);
  _this._peerConnectMonitor(peerId);

  log.debug([peerId, 'Peer', null, 'Session information has been initialized']);
};

/**
 * Updates the Peer session custom data information.
 * @method _peerUpdateData
 * @param {String} peerId The Peer session ID.
 * @param {Any} data The updated custom data.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerUpdateData = function (peerId, data) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring updating of session custom data as it does not exists']);
    return;
  }

  log.debug([peerId, 'Peer', null, 'Session custom data has been updated ->'], data);

  _this._peers[peerId].data = data;

  _this._trigger('peerUpdated', peerId, _this.getPeerInfo(peerId), false);
};

/**
 * Updates the Peer session stream information.
 * @method _peerUpdateStream
 * @param {String} peerId The Peer session ID.
 * @param {JSON} stream The updated stream information.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerUpdateStream = function (peerId, stream) {
  var _this = this;

  // Check if Peer session exists
  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring updating of session stream information as it does not exists']);
    return;
  }

  log.debug([peerId, 'Peer', null, 'Session stream information has been updated ->'], stream);

  _this._peers[peerId].stream = stream;

  //_this._trigger('streamEnded', message.mid, _this.getPeerInfo(message.mid), false);
  //_this._trigger('streamMuted', message.mid, _this.getPeerInfo(message.mid), false);
};

/**
 * Destroys the Peer session information.
 * @method _peerDestroy
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerDestroy = function (peerId) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring destroying of session as it does not exists']);
    return;
  }

  log.debug([peerId, 'Peer', null, 'Destroying session']);

  _this._peerDisconnect(peerId);

  // Configure as session dead
  _this._peers[peerId].dead = true;

  // Trigger "left" event
  if (peerId !== 'MCU') {
    this._trigger('peerLeft', peerId, _this.getPeerInfo(peerId), false);

  } else {
    _this._room.MCU = false;

    this._trigger('serverPeerLeft', peerId, _this.SERVER_PEER_TYPE.MCU);
  }

  // Our "garbage collector"
  // To ensure all the "closed" events gets triggered
  // NOTE: We don't know if this is the best solution though ...
  var dustbin = setInterval(function () {
    var cleanup = function () {
      clearInterval(dustbin);

      // Clear Peer session if exists
      if (_this._peers[peerId]) {
        log.debug([peerId, 'Peer', null, 'Garbage is destroying session']);
        delete _this._peers[peerId];
      }

      log.debug([peerId, 'Peer', null, 'Garbage has destroyed session']);
    };

    if (!_this._peers[peerId].peer) {
      cleanup();
      return;
    }

    // No matter if it's current state is "failed" or "disconnected",
    //   as long as RTCPeerConnection.close() is invoked, it always goes to "closed"
    var iceConnectionStateClosed = _this._peers[peerId].peer.iceConnectionState === 'closed';
    // Should always be "closed" when RTCPeerConnection.close() is invoked
    var signalingStateClosed = _this._peers[peerId].peer.signalingState === 'closed';
    var dataChannelClosed = false;

    if (!_this._peers[peerId].connection.datachannel || Object.keys(_this._peers[peerId].channels).length === 0) {
      dataChannelClosed = true;

    } else {
      objForEach(_this._peers[peerId].channels, function (channel) {
        // No matter what state -> "connecting", "open", when RTCDataChannel.close() is invoked,
        //   it always goes to "closed"
        // Plugin 0.8.863 version readyState is empty "" when invoking .close()
        dataChannelClosed = channel.channel.readyState === 'closed' || !channel.channel.readyState;
      });
    }

    if (iceConnectionStateClosed && signalingStateClosed && dataChannelClosed) {
      cleanup();
    }
  }, 100);
};

/**
 * Checks if the Peer session exists.
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCheckExists = function (peerId) {
  var _this = this;

  // Check if Peer session exists
  if (!_this._peers[peerId]) {
    return false;
  }

  // Check if Peer session is dead
  if (_this._peers[peerId].dead) {
    return false;
  }

  // Check if Peer connection exists
  if (!_this._peers[peerId].peer) {
    return false;
  }

  return true;
};