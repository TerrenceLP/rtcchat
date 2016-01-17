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
    // The connection information
    connection: {
      // Dead status when destroying session
      dead: false,
      // ICE connection
      ICE: {
        trickle: config.connection.trickleICE && _this._room.config.current.enableIceTrickle,
        failures: 0,
        candidates: {
          completed: false,
          incoming: {
            queue: [],
            failed: [],
            success: []
          },
          outgoing: []
        }
      },
      // The flag if should allow RTCDataChannel connections
      datachannel: config.connection.datachannel && _this._room.config.current.enableDataChannel,
      // The flag if should allow stereo for OPUS connections
      stereo: config.connection.stereo && _this._user.session.stereo,
      // Health timer
      health: {
        timer: null,
        ok: false,
        retries: 0
      },
      tieBreaker: config.tieBreaker
    },
    // The RTCDataChannels
    channels: {}

  };

  _this._peerConnect(peerId);
  _this._peerConnectMonitor(peerId);

  // RTCPeerConnection.onremovestream
  // RTCPeerConnection.ontrack - not implemented yet

  log.debug([peerId, 'Peer', null, 'Session information has been initialized']);
};

/**
 * Starts the Peer connection.
 * @method _peerConnect
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnect = function (peerId) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring starting of connection as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.debug([peerId, 'Peer', null, 'Ignoring starting of connection as session is dead']);
    return;
  }

  // Construct RTCPeerConnection object
  _this._peers[peerId].peer = new RTCPeerConnection({
    iceServers: _this._user.session.ICE.servers,
    // iceTransportPolicy: "all",
    // bundlePolicy: "balanced",
    // rtcpMuxPolicy: "require",
    // iceCandidatePoolSize: 0,
    // certificates: []
  } , {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  });

  // Reset to defaults
  _this._peers[peerId].connection.ICE.failures = 0;
  _this._peers[peerId].connection.ICE.candidates.completed = false;
  _this._peers[peerId].connection.ICE.candidates.outgoing = [];
  _this._peers[peerId].connection.ICE.candidates.incoming.queue = [];
  _this._peers[peerId].connection.ICE.candidates.incoming.failed = [];
  _this._peers[peerId].connection.ICE.candidates.incoming.success = [];
  _this._peers[peerId].connection.health.timer = null;
  _this._peers[peerId].connection.health.ok = false;


  // RTCPeerConnection.onconnectionstatechange - not implemented yet
  // RTCPeerConnection.onicecandidateerror - not implemented yet
  // RTCPeerConnection.onicecandidate
  _this._peers[peerId].peer.onicecandidate =
    _this._peerConnectReactToOnicecandidate(peerId);

  // RTCPeerConnection.oniceconnectionstatechange
  _this._peers[peerId].peer.oniceconnectionstatechange =
    _this._peerConnectReactToOniceconnectionstatechange(peerId);

  // RTCPeerConnection.onsignalingstatechange
  _this._peers[peerId].peer.onsignalingstatechange =
    _this._peerConnectReactToOnsignalingstatechange(peerId);

  // RTCPeerConnection.onicegatheringstatechange
  _this._peers[peerId].peer.onicegatheringstatechange =
    _this._peerConnectReactToOnicegatheringstatechange(peerId);

  // RTCPeerConnection.onnegotiationneeded
  _this._peers[peerId].peer.onnegotiationneeded =
    _this._peerConnectReactToOnnegotiationneeded(peerId);

  // RTCPeerConnection.ondatachannel
  _this._peers[peerId].peer.ondatachannel =
    _this._peerConnectReactToOndatachannel(peerId);

  // RTCPeerConnection.onaddstream
  _this._peers[peerId].peer.onaddstream =
    _this._peerConnectReactToOnaddstream(peerId);

  // RTCPeerConnection.onremovestream
  _this._peers[peerId].peer.onremovestream =
    _this._peerConnectReactToOnremovestream(peerId);


  log.debug([peerId, 'Peer', null, 'Connection is ready for handshaking']);
};

/**
 * Monitors the Peer connection.
 * @method _peerConnectMonitor
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectMonitor = function (peerId) {
  var _this = this;
  var healthTimeout = 10000;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring configuring connection monitor as session does not exsits']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.debug([peerId, 'Peer', null, 'Ignoring configuring connection monitor as session is dead']);
    return;
  }

  // Check if Peer is offerer, and configure the unit if required
  if (_this._peers[peerId].connection.tieBreaker > _this._user.session.tieBreaker) {
    healthTimeout = 12500;
  }

  // Check if trickle ICE is disabled and increment as it takes longer
  if (!_this._peers[peerId].connection.ICE.trickle) {
    healthTimeout += 40000;
  }

  // Increment the timer for every retry
  healthTimeout += _this._peers[peerId].connection.health.retries * 10000;

  // Start the monitor
  _this._peers[peerId].connection.health.timer = setTimeout(function () {
    if (!_this._peers[peerId]) {
      log.warn([peerId, 'Peer', null, 'Ignoring monitor expiration as session does not exists']);
      return;
    }

    // Check if ICE connection is successful
    var iceConnectionStateStable = ['connected', 'completed'].indexOf(_this._peers[peerId].peer.iceConnectionState) > -1;
    // Check if signaling state is "stable"
    var signalingStateStable = _this._peers[peerId].peer.signalingState === 'stable';
    // Check if "main" RTCDataChannel is connected
    var dataChannelStateStable = _this._peers[peerId].connection.datachannel ?
    // Check if RTCDataChannel is required, else return as true
      _this._peers[peerId].channels.main && _this._peers[peerId].channels.main.channel &&
      _this._peers[peerId].channels.main.channel.readyState === 'open' : true;

    // Check if connection is stable
    if (iceConnectionStateStable && signalingStateStable && dataChannelStateStable) {
      _this._peers[peerId].connection.health.timer = null;
      _this._peers[peerId].connection.health.ok = true;

      log.debug([peerId, 'Peer', null, 'Connection health is healthy']);
      return;
    }

    log.debug([peerId, 'Peer', null, 'Connection status is not healthy, reconnecting ->'], {
      iceConnectionState: iceConnectionStateStable,
      signalingState: signalingStateStable,
      dataChannelState: dataChannelStateStable
    });

    _this._peerReconnect(peerId, false, false);

  }, healthTimeout);

  log.debug([peerId, 'Peer', null, 'Monitoring connection health with timeout ->'], healthTimeout);
};

/**
 * Stops the Peer connection.
 * @method _peerDisconnect
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerDisconnect = function (peerId) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring destroying of connection as session does not exists']);
    return;
  }

  // Close all RTCDataChannel connections
  objForEach(_this._peers[peerId].channels, function (channel, id) {
    log.debug([peerId, 'Peer', null, 'Closing RTCDataChannel connection ->'], id);

    channel.channel.close();
    channel.transfer = {};
  });

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring destroying of connection as connection does not exists']);
    return;
  }

  log.debug([peerId, 'Peer', null, 'Closing connection']);

  // Close RTCPeerConnection connection
  _this._peers[peerId].peer.close();
};

/**
 * Handshake step 1.
 * Generates a local offer RTCSessionDescription for Peer connection.
 * @method _peerConnectHandshakeOffer
 * @param {String} peerId The Peer session ID.
 * @param {Boolean} [iceRestart=false] The flag that indicates if connection should restart ICE.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeOffer = function (peerId, iceRestart) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as connection signalingState is not "stable" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  // Generate local offer RTCSessionDescription
  _this._peers[peerId].peer.createOffer(function (offer) {
    log.debug([peerId, 'Peer', null, 'Generated local offer ->'], offer);

    // Set local offer RTCSessionDescription
    _this._peerConnectHandshakeSetLocal(peerId, offer);

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Failed generating local offer ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);

  }, {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
      iceRestart: iceRestart === true
    }
  });
};

/**
 * Handshake step 2.
 * Generates a local answer RTCSessionDescription for Peer connection based on
 *   remote offer RTCSessionDescription received.
 * @method _peerConnectHandshakeOffer
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} offer The remote offer RTCSessionDescription received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeAnswer = function (peerId, offer) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as connection signalingState is not "stable" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  _this._peerConnectHandshakeSetRemote(peerId, offer, function () {
    // Generate local answer RTCSessionDescription
    _this._peers[peerId].peer.createAnswer(function (answer) {
      log.debug([peerId, 'Peer', null, 'Generated local answer ->'], answer);

      // Set local answer RTCSessionDescription
      _this._peerConnectHandshakeSetLocal(peerId, answer);

    }, function (error) {
      log.error([peerId, 'Peer', null, 'Failed generating local answer ->'], error);

      _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
    });
  });
};

/**
 * Handshake step 3.
 * Sets the remote answer RTCSessionDescription received.
 * @method _peerConnectHandshakeComplete
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} answer The answer offer RTCSessionDescription received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeComplete = function (peerId, answer) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.signalingState !== 'have-local-offer') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as connection signalingState is not "have-local-offer" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  _this._peerConnectHandshakeSetRemote(peerId, answer, function () {
    log.debug([peerId, 'Peer', null, 'Connection handshake has completed']);
  });
};

/**
 * Sets the local RTCSessionDescription generated.
 * @method _peerConnectHandshakeSetLocal
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} sessionDescription The local RTCSessionDescription generated.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeSetLocal = function (peerId, sessionDescription) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as connection does not exists']);
    return;
  }

  // Start modifications here

  log.debug([peerId, 'Peer', null, 'Setting local ' + sessionDescription.type + ' ->'], sessionDescription);

  _this._peers[peerId].peer.setLocalDescription(sessionDescription, function () {
    log.debug([peerId, 'Peer', null, 'Set local ' + sessionDescription.type + ' successfully']);

    if (!_this._peers[peerId].connection.ICE.trickle) {
      log.debug([peerId, 'Peer', null, 'Awaiting for ICE candidates generation to complete before sending ' +
        'local ' + sessionDescription.type]);
      return;
    }

    if (sessionDescription.type === 'offer') {
      _this._messageConstructOffer(peerId, sessionDescription);
    } else {
      _this._messageConstructAnswer(peerId, sessionDescription);
    }

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Failed setting local ' + sessionDescription.type + ' ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
  });
};

/**
 * Sets the remote RTCSessionDescription received.
 * @method _peerConnectHandshakeSetRemote
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} sessionDescription The remote RTCSessionDescription received.
 * @param {Function} callback The callback triggered after setRemoteDescription is successful
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeSetRemote = function (peerId, sessionDescription, callback) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type +
      ' as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type +
      ' as connection does not exists']);
    return;
  }

  // Start modifications here

  log.debug([peerId, 'Peer', null, 'Setting remote ' + sessionDescription.type + ' ->'], sessionDescription);

  _this._peers[peerId].peer.setRemoteDescription(sessionDescription, function () {
    log.debug([peerId, 'Peer', null, 'Set remote ' + sessionDescription.type + ' successfully']);

    // Add queued remote ICE candidates
    _this._peers[peerId].connection.ICE.candidates.incoming.queue.forEach(function (candidate) {
      var candidateId = candidate.candidate.split(' ')[0];

      log.debug([peerId, 'Peer', candidateId, 'Adding queued remote candidate ->'], candidate);

      _this._peers[peerId].peer.addIceCandidate(candidate, function () {
        log.debug([peerId, 'Peer', candidateId, 'Added queued remote candidate successfully']);
        _this._peers[peerId].connection.ICE.candidates.incoming.success.push(candidate);
      }, function (error) {
        log.debug([peerId, 'Peer', candidateId, 'Failed queued adding remote candidate ->'], error);
        _this._peers[peerId].connection.ICE.candidates.incoming.failed.push(candidate);
      });
    });

    _this._peers[peerId].connection.ICE.candidates.incoming.queue = [];

    callback();

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Failed setting remote ' + sessionDescription.type + ' ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
  });
};

/**
 * Adds the remote RTCIceCandidate received.
 * @method _peerConnectAddCandidate
 * @param {String} peerId The Peer session ID.
 * @param {RTCIceCandidate} candidate The remote RTCIceCandidate received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectAddCandidate = function (peerId, candidate) {
  var _this = this;
  var candidateId = candidate.candidate.split(' ')[0];

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring setting remote ' + sessionDescription.type +
      ' as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring setting local ' + sessionDescription.type +
      ' as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring setting remote ' + sessionDescription.type +
      ' as connection does not exists']);
    return;
  }

  if (!(_this._peers[peerId].peer.remoteDescription && !!_this._peers[peerId].peer.remoteDescription.sdp)) {
    log.debug([peerId, 'Peer', candidateId, 'Queueing remote candidate as remoteDescription is not present yet']);
    _this._peers[peerId].connection.ICE.candidates.incoming.queue.push(candidate);
    return;
  }

  var shouldAddCandidate = false;

  _this._user.session.ICE.useCandidates.current.forEach(function (candidateType) {
    if (candidate.candidate.indexOf(candidateType) > -1) {
      shouldAddCandidate = true;
    }
  });

  if (!shouldAddCandidate) {
    log.warn([peerId, 'Peer', candidateId, 'Dropping remote candidate as it does not match candidate types filter ->'], candidate);
    return;
  }

  log.debug([peerId, 'Peer', candidateId, 'Adding remote candidate ->'], candidate);

  _this._peers[peerId].peer.addIceCandidate(candidate, function () {
    log.debug([peerId, 'Peer', candidateId, 'Added remote candidate successfully']);
    _this._peers[peerId].connection.ICE.candidates.incoming.success.push(candidate);
  }, function (error) {
    log.debug([peerId, 'Peer', candidateId, 'Failed adding remote candidate ->'], error);
    _this._peers[peerId].connection.ICE.candidates.incoming.failed.push(candidate);
  });
};

/*
ANSWER SDP for MCU
// if firefox and peer is mcu, replace the sdp to suit mcu needs
  if (window.webrtcDetectedType === 'moz' && targetMid === 'MCU') {
    answer.sdp = answer.sdp.replace(/ generation 0/g, '');
    answer.sdp = answer.sdp.replace(/ udp /g, ' UDP ');
  }
  */

/**
 * Restarts the Peer connection.
 * @method _peerReconnect
 * @param {String} peerId The Peer session ID.
 * @param {Boolean} [hardRestart=false] The flag that indicates if connection should be re-created.
 * @param {Boolean} [iceRestart=false] The flag that indicates if connection should restart ICE.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerReconnect = function (peerId, passedHardRestart, iceRestart) {
  var _this = this;
  var hardRestart = passedHardRestart === true;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring reconnection as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.debug([peerId, 'Peer', null, 'Ignoring reconnection as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.debug([peerId, 'Peer', null, 'Constructing connection as it does not exists']);
    _this._peerConnect(peerId);
    hardRestart = true;
  }

  // Check if we have to do a complete restart
  if (hardRestart) {
    // Only hard restarts can be made with P2P only connections
    if (!_this._room.MCU) {
      log.debug([peerId, 'Peer', null, 'Reconstructing connection']);
      _this._peerDisconnect(peerId);
      _this._peerConnect(peerId);
    // Do not do hard restarts for MCU
    } else {
      log.warn([peerId, 'Peer', null, 'Not doing any reconstruction of connection for MCU environment']);
      hardRestart = false;
    }
  }

  _this._trigger('peerRestart', peerId, _this.getPeerInfo(peerId), true);

  if (!hardRestart) {
    var sessionDescription = _this._peers[peerId].peer.localDescription;

    // Check if local RTCSessionDescription exists first
    if (sessionDescription && !!sessionDescription.sdp) {
      // When other Peer connection does not receive our local offer RTCSessionDescription yet
      if (_this._peers[peerId].peer.signalingState === 'have-local-offer') {
        _this._messageConstructOffer(peerId, sessionDescription);
        _this._peerConnectMonitor(peerId);
        return;
      // When other Peer connection does not receive our local answer RTCPeerConnection yet
      } else if (_this._peers[peerId].peer.signalingState === 'have-remote-offer') {
        _this._messageConstructAnswer(peerId, sessionDescription);
        _this._peerConnectMonitor(peerId);
        return;
      }
    }
  }

  // Send the "restart" message scenario
  _this._messageConstructRestart(peerId, hardRestart, iceRestart);
  _this._peerConnectMonitor(peerId);
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

  log.debug([peerId, 'Peer', null, 'Session is closed. Destroying..']);

  _this._peerDisconnect(peerId);

  // Configure as session dead
  _this._peers[peerId].connection.dead = true;

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
      delete _this._peers[peerId];

      log.debug([peerId, 'Peer', null, 'Session is destroyed']);
    };

    if (!_this._peers[peerId]) {
      cleanup();
      return;
    }

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

    if (!_this._peers[peerId].connection.datachannel) {
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
 * Reacts to the RTCPeerConnection.onicecandidate event.
 * @method _peerConnectReactToOnicecandidate
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnicecandidate = function (peerId) {
  var _this = this;

  return function (event) {
    var candidate = event.candidate || event;

    // Check if candidate has generation is complete yet
    if (!candidate.candidate) {
      log.debug([peerId, 'Peer', null, 'Generation of local candidates has been completed']);

      _this._peers[peerId].connection.ICE.candidates.completed = true;

      // If ICE trickle is disabled, then send the local RTCSessionDescription object
      if (!_this._peers[peerId].connection.ICE.trickle) {
        var sessionDescription = _this._peers[peerId].peer.localDescription;

        log.debug([peerId, 'Peer', null, 'Sending delayed local sessionDescription ->'], sessionDescription);

        if (sessionDescription.type === 'offer') {
          _this._messageConstructOffer(peerId, sessionDescription);
        } else {
          _this._messageConstructAnswer(peerId, sessionDescription);
        }
      }
      return;
    }

    var shouldSendCandidate = false;
    var candidateId = candidate.candidate.split(' ')[0];

    log.debug([peerId, 'Peer', candidateId, 'Generated local candidate ->'], candidate);

    _this._user.session.ICE.useCandidates.current.forEach(function (candidateType) {
      if (candidate.candidate.indexOf(candidateType) > -1) {
        shouldSendCandidate = true;
      }
    });

    if (!shouldSendCandidate) {
      log.warn([peerId, 'Peer', candidateId, 'Dropping local candidate as it does not match candidate types filter ->'], candidate);
      return;
    }

    _this._peers[peerId].connection.ICE.candidates.outgoing.push(candidate);
    _this._messageConstructCandidate(peerId, candidate);
  };
};

/**
 * Reacts to the RTCPeerConnection.oniceconnectionstatechange event.
 * @method _peerConnectReactToOniceconnectionstatechange
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOniceconnectionstatechange = function (peerId) {
  var _this = this;

  return function () {
    var state = _this._peers[peerId].peer.iceConnectionState;

    log.debug([peerId, 'Peer', null, 'Connection ICE connection state ->'], state);

    _this._trigger('iceConnectionState', state, peerId);

    // Restart ICE connection state is "failed" or "disconnected"
    if (['failed', 'disconnected'].indexOf(state) > -1) {
      var hardRestart = false;

      // When iceConnectionState -> "failed"
      if (state === 'failed') {
        // Increment the failure counter
        _this._peers[peerId].connection.ICE.failures++;

        // Disable trickle ICE if failures counter is 3
        if (_this._peers[peerId].connection.ICE.failures === 3) {
          _this._peers[peerId].connection.ICE.trickle = false;

          // Check if MCU and do a hard restart if MCU
          if (!_this._room.MCU) {
            hardRestart = true;
          }

          _this._trigger('iceConnectionState', _this.ICE_CONNECTION_STATE.TRICKLE_FAILED, peerId);
        }
      }

      _this._peerReconnect(peerId, hardRestart, true);
    }
  };
};

/**
 * Reacts to the RTCPeerConnection.onsignalingstatechange event.
 * @method _peerConnectReactToOnsignalingstatechange
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnsignalingstatechange = function (peerId) {
  var _this = this;

  return function () {
    var state = _this._peers[peerId].peer.signalingState;

    log.debug([peerId, 'Peer', null, 'Connection signaling state ->'], state);

    _this._trigger('peerConnectionState', state, peerId);
  };
};

/**
 * Reacts to the RTCPeerConnection.onicegatheringstatechange event.
 * @method _peerConnectReactToOnicegatheringstatechange
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnicegatheringstatechange = function (peerId) {
  var _this = this;

  return function () {
    var state = _this._peers[peerId].peer.iceGatheringState;

    log.debug([peerId, 'Peer', null, 'Connection ICE gathering state ->'], state);

    _this._trigger('iceGatheringState', state, peerId);
  };
};

/**
 * Reacts to the RTCPeerConnection.ondatachannel event.
 * @method _peerConnectReactToOndatachannel
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOndatachannel = function (peerId) {
  var _this = this;

  return function (event) {
    var channel = event.channel || event;

    log.debug([peerId, 'Peer', null, 'Connection received RTCDataChannel ->'], channel);

    _this._createChannel(peerId, channel);
  };
};

/**
 * Reacts to the RTCPeerConnection.onaddstream event.
 * @method _peerConnectReactToOnaddstream
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnaddstream = function (peerId) {
  var _this = this;

  return function (event) {
    var stream = event.stream || event;
    // The timeout that somehow allows rendering to work
    var magicalTimeout = 0;

    log.debug([peerId, 'Peer', null, 'Connection received remote MediaStream ->'], stream);

    if (!_this._peers[peerId].stream) {
      log.debug([peerId, 'Peer', null, 'Ignoring received remote MediaStream as stream is empty ->'], stream);
      return;
    }


    if (_this._peers[peerId].agent.name === 'firefox' && _this._user.agent.name !== 'firefox') {
      magicalTimeout = 1500;
    }

    // NOTE: Add timeouts to the firefox stream received because it seems to have some sort of black stream rendering at first
    // This may not be advisable but that it seems to work after 1500s. (tried with ICE established but it does not work and getStats)
    setTimeout(function () {
      _this._trigger('incomingStream', peerId, stream, false, _this.getPeerInfo(peerId));
    }, magicalTimeout);
  };
};

/**
 * Reacts to the RTCPeerConnection.onnegotiationneeded event.
 * @method _peerConnectReactToOnnegotiationneeded
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnnegotiationneeded = function (peerId) {
  var _this = this;

  return function () {
    log.debug([peerId, 'Peer', null, 'Connection received negotiation request']);
  };
};

/**
 * Reacts to the RTCPeerConnection.onremovestream event.
 * @method _peerConnectReactToOnremovestream
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnremovestream = function (peerId) {
  var _this = this;

  return function (event) {
    var stream = event.stream || event;
    log.debug([peerId, 'Peer', null, 'Connection removed MediaStream ->'], stream);
  };
};

