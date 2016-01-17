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

  if (_this._peers[peerId].peer.remoteDescription && !!_this._peers[peerId].peer.remoteDescription.sdp) {
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



/**
 * Stores the timestamp of the moment when the last Peers connection
 *   restarts has happened. Used for the restart Peers connection functionality.
 * @attribute _lastRestart
 * @type Object
 * @required
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.9
 */
Skylink.prototype._lastRestart = null;

/**
 * Stores the counter of the number of consecutive
 *   Peers connection restarts retries.
 * @attribute _retryCount
 * @type Number
 * @required
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._retryCount = 0;

/**
 * Stores the list of Peers connection.
 * @attribute _peerConnections
 * @param {Object} (#peerId) The Peer ID associated to the RTCPeerConnection object.
 * @type JSON
 * @required
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._peerConnections = {};

/**
 * Connects to the Peer.
 * @method _addPeer
 * @param {String} targetMid The Peer ID to connect to.
 * @param {JSON} peerBrowser The Peer platform agent information.
 * @param {String} peerBrowser.agent The Peer platform browser or agent name.
 * @param {Number} peerBrowser.version The Peer platform browser or agent version.
 * @param {Number} peerBrowser.os The Peer platform name.
 * @param {Boolean} [toOffer=false] The flag that indicates if the Peer connection
 *   should be start connection as an offerer or as an answerer.
 * @param {Boolean} [restartConn=false] The flag that indicates if the Peer
 *   connection is part of restart functionality use-case.
 * @param {Boolean} [receiveOnly=false] The flag that indicates if the Peer
 *   connection would send Stream or not (receive only).
 * @param {Boolean} [isSS=false] The flag that indicates if the Peer
 *   connection Stream sent is a screensharing stream or not.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._addPeer = function(targetMid, peerBrowser, toOffer, restartConn, receiveOnly, isSS) {
  var self = this;
  if (self._peerConnections[targetMid] && !restartConn) {
    log.error([targetMid, null, null, 'Connection to peer has already been made']);
    return;
  }
  log.log([targetMid, null, null, 'Starting the connection to peer. Options provided:'], {
    peerBrowser: peerBrowser,
    toOffer: toOffer,
    receiveOnly: receiveOnly,
    enableDataChannel: self._enableDataChannel
  });

  log.info('Adding peer', isSS);

  if (!restartConn) {
    self._peerConnections[targetMid] = self._createPeerConnection(targetMid, !!isSS);
  }

  if (!self._peerConnections[targetMid]) {
    log.error([targetMid, null, null, 'Failed creating the connection to peer']);
    return;
  }

  self._peerConnections[targetMid].receiveOnly = !!receiveOnly;
  self._peerConnections[targetMid].hasScreen = !!isSS;
  if (!receiveOnly) {
    self._addLocalMediaStreams(targetMid);
  }
  // I'm the callee I need to make an offer
  if (toOffer) {
    if (self._enableDataChannel) {
      if (typeof self._dataChannels[targetMid] !== 'object') {
        log.error([targetMid, 'RTCDataChannel', null, 'Create offer error as unable to create datachannel ' +
          'as datachannels array is undefined'], self._dataChannels[targetMid]);
        return;
      }

      self._dataChannels[targetMid].main =
        self._createDataChannel(targetMid, self.DATA_CHANNEL_TYPE.MESSAGING, null, targetMid);
      self._peerConnections[targetMid].hasMainChannel = true;
    }
    self._doOffer(targetMid, peerBrowser);
  }

  // do a peer connection health check
  // let MCU handle this case
  if (!self._hasMCU) {
    this._startPeerConnectionHealthCheck(targetMid, toOffer);
  } else {
    log.warn([targetMid, 'PeerConnectionHealth', null, 'Not setting health timer for MCU connection']);
    return;
  }
};

/**
 * Recreates a peer connection.
 * This is the fallback restart mechanism for other platforms.
 * @method _restartPeerConnection
 * @param {String} peerId The Peer ID to recreate the connection with.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.6.6
 */
Skylink.prototype._recreatePeerConnection = function (peerId) {
  var self = this;

  if (!self._peerConnections[peerId]) {
    log.error([peerId, null, null, 'Peer does not have an existing ' +
      'connection. Unable to recreate connection']);
    return;
  }

  // get the value of receiveOnly
  log.log([peerId, null, null, 'Recreating a peer connection']);

   // get the value of receiveOnly
  var receiveOnly = self._peerConnections[peerId] ?
    !!self._peerConnections[peerId].receiveOnly : false;
  var hasScreenSharing = self._peerConnections[peerId] ?
    !!self._peerConnections[peerId].hasScreen : false;

  // close the peer connection and remove the reference
  var iceConnectionStateClosed = false;
  var peerConnectionStateClosed = false;
  var dataChannelStateClosed = !self._enableDataChannel;

  delete self._peerConnectionHealth[peerId];

  self._stopPeerConnectionHealthCheck(peerId);

  if (self._peerConnections[peerId].signalingState !== 'closed') {
    self._peerConnections[peerId].close();
  }

  if (self._peerConnections[peerId].hasStream) {
    self._trigger('streamEnded', peerId, self.getPeerInfo(peerId), false);
  }

  self._peerConnections[peerId].dataChannelClosed = true;

  delete self._peerConnections[peerId];

  log.log([peerId, null, null, 'Re-creating peer connection']);

  self._peerConnections[peerId] = self._createPeerConnection(peerId, !!hasScreenSharing);

  if (self._peerConnections[peerId]){
    self._peerConnections[peerId].receiveOnly = receiveOnly;
    self._peerConnections[peerId].hasScreen = hasScreenSharing;
  }

  return self._peerConnections[peerId];
};

/**
 * Restarts a Peer connection in a P2P environment.
 * This is usually done for replacing the previous Stream attached and restarting
 *   the connection with a new one, or when the ICE connection has issues
 *   streaming video/audio stream in the remote Stream which requires
 *   a refresh in the ICE connection.
 * @method _restartPeerConnection
 * @param {String} peerId The Peer ID to restart the connection with.
 * @param {Boolean} isSelfInitiatedRestart The flag that indicates if the restart action
 *    was caused by self.
 * @param {Boolean} isConnectionRestart The flag that indicates whether the restarting action
 *   is caused by ICE connection or handshake connection failure. Currently, this feature works the same as
 *   <code>explict</code> parameter.
 * @param {Function} callback The callback fired after the Peer connection has
 *   been succesfully initiated with a restart. Set this value to <code>null</code> if you
 *   do not want to pass in any callbacks.
 * @param {Boolean} [explict=false] The flag that indicates whether the restart functionality
 *   is invoked by the application or by Skylink when the ICE connection fails to establish
 *   a "healthy" connection state. Currently, this feature works the same as
 *   <code>isConnectionRestart</code> parameter.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._restartPeerConnection = function (peerId, isSelfInitiatedRestart, isConnectionRestart, callback, explicit) {
  var self = this;

  if (!self._peerConnections[peerId]) {
    log.error([peerId, null, null, 'Peer does not have an existing ' +
      'connection. Unable to restart']);
    return;
  }

  delete self._peerConnectionHealth[peerId];

  self._stopPeerConnectionHealthCheck(peerId);

  var pc = self._peerConnections[peerId];

  var agent = (self.getPeerInfo(peerId) || {}).agent || {};

  // fallback to older versions for mobile users
  if (['Android', 'iOS'].indexOf(agent.name) > -1) {
    pc = self._recreatePeerConnection(peerId);

    if (!pc) {
      var noConnObjError = 'Failed restarting (fallback) with mobile SDKs as peer connection object is not defined';
      log.error([peerId, 'RTCPeerConnection', null, noConnObjError], {
          localDescription: pc.localDescription,
          remoteDescription: pc.remoteDescription
      });
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
        callback(null, new Error(noConnObjError));
      }
      return;
    }
  }

  // This is when the state is stable and re-handshaking is possible
  // This could be due to previous connection handshaking that is already done
  if (pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
    if (self._peerConnections[peerId] && !self._peerConnections[peerId].receiveOnly) {
      self._addLocalMediaStreams(peerId);
    }

    if (isSelfInitiatedRestart){
      log.log([peerId, null, null, 'Sending restart message to signaling server']);

      var lastRestart = Date.now() || function() { return +new Date(); };

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.RESTART,
        mid: self._user.sid,
        rid: self._room.id,
        agent: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        userInfo: self.getPeerInfo(),
        target: peerId,
        isConnectionRestart: !!isConnectionRestart,
        lastRestart: lastRestart,
        // This will not be used based off the logic in _restartHandler
        weight: self._peerPriorityWeight,
        receiveOnly: self._peerConnections[peerId].receiveOnly,
        enableIceTrickle: self._enableIceTrickle,
        enableDataChannel: self._enableDataChannel,
        sessionType: !!self._mediaScreen ? 'screensharing' : 'stream',
        explicit: !!explicit
      });

      self._trigger('peerRestart', peerId, self.getPeerInfo(peerId), false);

      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart callback']);
        callback(null, null);
      }
    } else {
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart callback (receiving peer)']);
        callback(null, null);
      }
    }

    // following the previous logic to do checker always
    self._startPeerConnectionHealthCheck(peerId, false);

  } else {
    // Let's check if the signalingState is stable first.
    // In another galaxy or universe, where the local description gets dropped..
    // In the offerHandler or answerHandler, do the appropriate flags to ignore or drop "extra" descriptions
    if (pc.signalingState === self.PEER_CONNECTION_STATE.HAVE_LOCAL_OFFER ||
      pc.signalingState === self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
      // Checks if the local description is defined first
      var hasLocalDescription = pc.localDescription && pc.localDescription.sdp;
      // By then it should have at least the local description..
      if (hasLocalDescription) {
        self._sendChannelMessage({
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp,
          mid: self._user.sid,
          target: peerId,
          rid: self._room.id,
          restart: true
        });
      } else {
        var noLocalDescriptionError = 'Failed re-sending localDescription as there is ' +
          'no localDescription set to connection. There could be a handshaking step error';
        log.error([peerId, 'RTCPeerConnection', null, noLocalDescriptionError], {
            localDescription: pc.localDescription,
            remoteDescription: pc.remoteDescription
        });
        if (typeof callback === 'function') {
          log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
          callback(null, new Error(noLocalDescriptionError));
        }
      }
    // It could have connection state closed
    } else {
      var unableToRestartError = 'Failed restarting as peer connection state is ' + pc.signalingState;
      log.warn([peerId, 'RTCPeerConnection', null, unableToRestartError]);
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
        callback(null, new Error(unableToRestartError));
      }
    }
  }
};

/**
 * Disconnects the Peer connection and remove object references associated.
 * @method _removePeer
 * @param {String} peerId The Peer ID to disconnect the connection with.
 * @trigger peerLeft
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._removePeer = function(peerId) {
  var peerInfo = clone(this.getPeerInfo(peerId)) || {
    userData: '',
    settings: {},
    mediaStatus: {},
    agent: {},
    room: clone(this._selectedRoom)
  };

  if (peerId !== 'MCU') {
    this._trigger('peerLeft', peerId, peerInfo, false);
  } else {
    this._hasMCU = false;
    log.log([peerId, null, null, 'MCU has stopped listening and left']);
    this._trigger('serverPeerLeft', peerId, this.SERVER_PEER_TYPE.MCU);
  }
  // stop any existing peer health timer
  this._stopPeerConnectionHealthCheck(peerId);

  // check if health timer exists
  if (typeof this._peerConnections[peerId] !== 'undefined') {
    // new flag to check if datachannels are all closed
    this._peerConnections[peerId].dataChannelClosed = true;

    if (this._peerConnections[peerId].signalingState !== 'closed') {
      this._peerConnections[peerId].close();
    }

    if (this._peerConnections[peerId].hasStream) {
      this._trigger('streamEnded', peerId, this.getPeerInfo(peerId), false);
    }

    delete this._peerConnections[peerId];
  }
  // remove peer informations session
  if (typeof this._peerInformations[peerId] !== 'undefined') {
    delete this._peerInformations[peerId];
  }
  if (typeof this._peerConnectionHealth[peerId] !== 'undefined') {
    delete this._peerConnectionHealth[peerId];
  }
  // close datachannel connection
  if (this._enableDataChannel) {
    this._closeDataChannel(peerId);
  }

  log.log([peerId, null, null, 'Successfully removed peer']);
};

/**
 * Creates a Peer connection. This does not start the handshake connection
 *   but creates the Peer connection object ready for connection.
 * @method _createPeerConnection
 * @param {String} targetMid The Peer ID to create the connection object
 *   with.
 * @param {Boolean} [isScreenSharing=false] The flag that indicates if the Peer
 *   connection Stream sent is a screensharing stream or not.
 * @return {Object} The Peer connection object associated with
 *   the provided ID.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._createPeerConnection = function(targetMid, isScreenSharing) {
  var pc, self = this;
  // currently the AdapterJS 0.12.1-2 causes an issue to prevent firefox from
  // using .urls feature
  var newRTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection ||
    window.RTCPeerConnection;
  try {
    pc = new newRTCPeerConnection(
      self._room.connection.peerConfig,
      self._room.connection.peerConstraints);
    log.info([targetMid, null, null, 'Created peer connection']);
    log.debug([targetMid, null, null, 'Peer connection config:'],
      self._room.connection.peerConfig);
    log.debug([targetMid, null, null, 'Peer connection constraints:'],
      self._room.connection.peerConstraints);
  } catch (error) {
    log.error([targetMid, null, null, 'Failed creating peer connection:'], error);
    return null;
  }
  // attributes (added on by Temasys)
  pc.setOffer = '';
  pc.setAnswer = '';
  pc.hasStream = false;
  pc.hasScreen = !!isScreenSharing;
  pc.hasMainChannel = false;
  pc.firefoxStreamId = '';

  // datachannels
  self._dataChannels[targetMid] = {};
  // candidates
  self._addedCandidates[targetMid] = {
    relay: [],
    host: [],
    srflx: []
  };

  // callbacks
  // standard not implemented: onnegotiationneeded,
  pc.ondatachannel = function(event) {
    var dc = event.channel || event;
    log.debug([targetMid, 'RTCDataChannel', dc.label, 'Received datachannel ->'], dc);
    if (self._enableDataChannel) {

      var channelType = self.DATA_CHANNEL_TYPE.DATA;
      var channelKey = dc.label;

      // if peer does not have main channel, the first item is main
      if (!pc.hasMainChannel) {
        channelType = self.DATA_CHANNEL_TYPE.MESSAGING;
        channelKey = 'main';
        pc.hasMainChannel = true;
      }

      self._dataChannels[targetMid][channelKey] =
        self._createDataChannel(targetMid, channelType, dc, dc.label);

    } else {
      log.warn([targetMid, 'RTCDataChannel', dc.label, 'Not adding datachannel as enable datachannel ' +
        'is set to false']);
    }
  };
  pc.onaddstream = function(event) {
    var stream = event.stream || event;
    pc.hasStream = true;

    var agent = (self.getPeerInfo(targetMid) || {}).agent || {};
    var timeout = 0;

    // NOTE: Add timeouts to the firefox stream received because it seems to have some sort of black stream rendering at first
    // This may not be advisable but that it seems to work after 1500s. (tried with ICE established but it does not work and getStats)
    if (agent.name === 'firefox' && window.webrtcDetectedBrowser !== 'firefox') {
      timeout = 1500;
    }
    setTimeout(function () {
      self._onRemoteStreamAdded(targetMid, stream, !!pc.hasScreen);
    }, timeout);
  };
  pc.onicecandidate = function(event) {
    log.debug([targetMid, 'RTCIceCandidate', null, 'Ice candidate generated ->'],
      event.candidate);
    self._onIceCandidate(targetMid, event);
  };
  pc.oniceconnectionstatechange = function(evt) {
    checkIceConnectionState(targetMid, pc.iceConnectionState,
      function(iceConnectionState) {
      log.debug([targetMid, 'RTCIceConnectionState', null,
        'Ice connection state changed ->'], iceConnectionState);
      self._trigger('iceConnectionState', iceConnectionState, targetMid);

      // clear all peer connection health check
      // peer connection is stable. now if there is a waiting check on it
      if (iceConnectionState === self.ICE_CONNECTION_STATE.COMPLETED &&
        pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
        log.debug([targetMid, 'PeerConnectionHealth', null,
          'Peer connection with user is stable']);
        self._peerConnectionHealth[targetMid] = true;
        self._stopPeerConnectionHealthCheck(targetMid);
        self._retryCount = 0;
      }

      if (typeof self._ICEConnectionFailures[targetMid] === 'undefined') {
        self._ICEConnectionFailures[targetMid] = 0;
      }

      if (self._ICEConnectionFailures[targetMid] > 2) {
        self._peerIceTrickleDisabled[targetMid] = true;
      }

      if (iceConnectionState === self.ICE_CONNECTION_STATE.FAILED) {
        self._ICEConnectionFailures[targetMid] += 1;

        if (self._enableIceTrickle && !self._peerIceTrickleDisabled[targetMid]) {
          self._trigger('iceConnectionState',
            self.ICE_CONNECTION_STATE.TRICKLE_FAILED, targetMid);
        }
        // refresh when failed. ignore for MCU case since restart is handled by MCU in this case
        if (!self._hasMCU) {
          self._restartPeerConnection(targetMid, true, true, null, false);
        }
      }

      /**** SJS-53: Revert of commit ******
      // resend if failed
      if (iceConnectionState === self.ICE_CONNECTION_STATE.FAILED) {
        log.debug([targetMid, 'RTCIceConnectionState', null,
          'Ice connection state failed. Re-negotiating connection']);
        self._removePeer(targetMid);
        self._sendChannelMessage({
          type: self._SIG_MESSAGE_TYPE.WELCOME,
          mid: self._user.sid,
          rid: self._room.id,
          agent: window.webrtcDetectedBrowser,
          version: window.webrtcDetectedVersion,
          userInfo: self.getPeerInfo(),
          target: targetMid,
          restartNego: true,
          hsPriority: -1
        });
      } *****/
    });
  };
  // pc.onremovestream = function () {
  //   self._onRemoteStreamRemoved(targetMid);
  // };
  pc.onsignalingstatechange = function() {
    log.debug([targetMid, 'RTCSignalingState', null,
      'Peer connection state changed ->'], pc.signalingState);
    self._trigger('peerConnectionState', pc.signalingState, targetMid);

    // clear all peer connection health check
    // peer connection is stable. now if there is a waiting check on it
    if ((pc.iceConnectionState === self.ICE_CONNECTION_STATE.COMPLETED ||
      pc.iceConnectionState === self.ICE_CONNECTION_STATE.CONNECTED) &&
      pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
      log.debug([targetMid, 'PeerConnectionHealth', null,
        'Peer connection with user is stable']);
      self._peerConnectionHealth[targetMid] = true;
      self._stopPeerConnectionHealthCheck(targetMid);
      self._retryCount = 0;
    }
  };
  pc.onicegatheringstatechange = function() {
    log.log([targetMid, 'RTCIceGatheringState', null,
      'Ice gathering state changed ->'], pc.iceGatheringState);
    self._trigger('candidateGenerationState', pc.iceGatheringState, targetMid);
  };

  if (window.webrtcDetectedBrowser === 'firefox') {
    pc.removeStream = function (stream) {
      var senders = pc.getSenders();
      for (var s = 0; s < senders.length; s++) {
        var tracks = stream.getTracks();
        for (var t = 0; t < tracks.length; t++) {
          if (tracks[t] === senders[s].track) {
            pc.removeTrack(senders[s]);
          }
        }
      }
    };
  }

  return pc;
};

/**
 * Refreshes a Peer connection.
 * - This feature can be used to refresh a Peer connection when the
 *   remote Stream received does not stream any audio/video stream.
 * - If there are more than 1 refresh during 5 seconds
 *   or refresh is less than 3 seconds since the last refresh
 *   initiated by the other peer, it will be aborted.
 * - As for MCU connection, the restart mechanism makes the self user
 *    leave and join the currently connected room again.
 * @method refreshConnection
 * @param {String|Array} [targetPeerId] The array of targeted Peers connection to refresh
 *   the connection with.
 * @param {Function} [callback] The callback fired after all targeted Peers connection has
 *   been initiated with refresh or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Array} callback.error.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @param {JSON} callback.error.refreshErrors The list of errors occurred
 *   based on per Peer basis.
 * @param {Object|String} callback.error.refreshErrors.(#peerId) The Peer ID that
 *   is associated with the error that occurred when refreshing the connection.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {Array} callback.success.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @example
 *   SkylinkDemo.on("iceConnectionState", function (state, peerId)) {
 *     if (iceConnectionState === SkylinkDemo.ICE_CONNECTION_STATE.FAILED) {
 *       // Do a refresh
 *       SkylinkDemo.refreshConnection(peerId);
 *     }
 *   });
 * @trigger peerRestart, serverPeerRestart, peerJoined, peerLeft, serverPeerJoined, serverPeerLeft
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.refreshConnection = function(targetPeerId, callback) {
  var self = this;

  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerRestarts = [];
  var error = '';
  var listOfPeerRestartErrors = {};

  if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;

  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  if (listOfPeers.length === 0) {
    error = 'There is currently no peer connections to restart';
    log.warn([null, 'PeerConnection', null, error]);

    listOfPeerRestartErrors.self = new Error(error);

    if (typeof callback === 'function') {
      callback({
        refreshErrors: listOfPeerRestartErrors,
        listOfPeers: listOfPeers
      }, null);
    }
    return;
  }

  // To fix jshint dont put functions within a loop
  var refreshSinglePeerCallback = function (peerId) {
    return function (error, success) {
      if (listOfPeerRestarts.indexOf(peerId) === -1) {
        if (error) {
          log.error([peerId, 'RTCPeerConnection', null, 'Failed restarting for peer'], error);
          listOfPeerRestartErrors[peerId] = error;
        }
        listOfPeerRestarts.push(peerId);
      }

      if (listOfPeerRestarts.length === listOfPeers.length) {
        if (typeof callback === 'function') {
          log.log([null, 'PeerConnection', null, 'Invoked all peers to restart. Firing callback']);

          if (Object.keys(listOfPeerRestartErrors).length > 0) {
            callback({
              refreshErrors: listOfPeerRestartErrors,
              listOfPeers: listOfPeers
            }, null);
          } else {
            callback(null, {
              listOfPeers: listOfPeers
            });
          }
        }
      }
    };
  };

  var refreshSinglePeer = function(peerId, peerCallback){
    if (!self._peerConnections[peerId]) {
      error = 'There is currently no existing peer connection made ' +
        'with the peer. Unable to restart connection';
      log.error([peerId, null, null, error]);
      listOfPeerRestartErrors[peerId] = new Error(error);
      return;
    }

    var now = Date.now() || function() { return +new Date(); };

    if (now - self.lastRestart < 3000) {
      error = 'Last restart was so tight. Aborting.';
      log.error([peerId, null, null, error]);
      listOfPeerRestartErrors[peerId] = new Error(error);
      return;
    }

    log.log([peerId, 'PeerConnection', null, 'Restarting peer connection']);

    // do a hard reset on variable object
    self._restartPeerConnection(peerId, true, false, peerCallback, true);
  };

  var toRefresh = function() {
    if(!self._hasMCU) {
      var i;

      for (i = 0; i < listOfPeers.length; i++) {
        var peerId = listOfPeers[i];

        if (Object.keys(self._peerConnections).indexOf(peerId) > -1) {
          refreshSinglePeer(peerId, refreshSinglePeerCallback(peerId));
        } else {
          error = 'Peer connection with peer does not exists. Unable to restart';
          log.error([peerId, 'PeerConnection', null, error]);
          listOfPeerRestartErrors[peerId] = new Error(error);
        }

        // there's an error to trigger for
        if (i === listOfPeers.length - 1 && Object.keys(listOfPeerRestartErrors).length > 0) {
          if (typeof callback === 'function') {
            callback({
              refreshErrors: listOfPeerRestartErrors,
              listOfPeers: listOfPeers
            }, null);
          }
        }
      }
    } else {
      self._restartMCUConnection(callback);
    }
  };

  self._throttle(toRefresh,5000)();

};

/**
 * Restarts all Peers connection in a MCU connection environment.
 * This would require the current user to leave the room and restart all
 *   current existing Peers connection.
 * @method _restartMCUConnection
 * @param {Function} [callback] The callback fired after all targeted Peers connection has
 *   been initiated with refresh or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Array} callback.error.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @param {JSON} callback.error.refreshErrors The list of errors occurred
 *   based on per Peer basis.
 * @param {Object|String} callback.error.refreshErrors.(#peerId) The Peer ID associated
 *   with the error that occurred when refreshing the connection.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {Array} callback.success.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @private
 * @trigger peerRestart, serverPeerRestart, peerJoined, peerLeft, serverPeerJoined
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._restartMCUConnection = function(callback) {
  var self = this;
  log.info([self._user.sid, null, null, 'Restarting with MCU enabled']);
  // Save room name
  /*var roomName = (self._room.id).substring((self._room.id)
                    .indexOf('_api_') + 5, (self._room.id).length);*/
  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerRestartErrors = {};
  var peerId; // j shint is whinning
  var receiveOnly = false;
  // for MCU case, these dont matter at all
  var lastRestart = Date.now() || function() { return +new Date(); };
  var weight = (new Date()).valueOf();

  self._trigger('serverPeerRestart', 'MCU', self.SERVER_PEER_TYPE.MCU);

  for (var i = 0; i < listOfPeers.length; i++) {
    peerId = listOfPeers[i];

    if (!self._peerConnections[peerId]) {
      var error = 'Peer connection with peer does not exists. Unable to restart';
      log.error([peerId, 'PeerConnection', null, error]);
      listOfPeerRestartErrors[peerId] = new Error(error);
      continue;
    }

    if (peerId === 'MCU') {
      receiveOnly = !!self._peerConnections[peerId].receiveOnly;
    }

    if (peerId !== 'MCU') {
      self._trigger('peerRestart', peerId, self.getPeerInfo(peerId), true);

      log.log([peerId, null, null, 'Sending restart message to signaling server']);

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.RESTART,
        mid: self._user.sid,
        rid: self._room.id,
        agent: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        userInfo: self.getPeerInfo(),
        target: peerId, //'MCU',
        isConnectionRestart: false,
        lastRestart: lastRestart,
        weight: self._peerPriorityWeight,
        receiveOnly: receiveOnly,
        enableIceTrickle: self._enableIceTrickle,
        enableDataChannel: self._enableDataChannel,
        sessionType: !!self._mediaScreen ? 'screensharing' : 'stream',
        explicit: true
      });
    }
  }

  // Restart with MCU = peer leaves then rejoins room
  var peerJoinedFn = function (peerId, peerInfo, isSelf) {
    log.log([null, 'PeerConnection', null, 'Invoked all peers to restart with MCU. Firing callback']);

    if (typeof callback === 'function') {
      if (Object.keys(listOfPeerRestartErrors).length > 0) {
        callback({
          refreshErrors: listOfPeerRestartErrors,
          listOfPeers: listOfPeers
        }, null);
      } else {
        callback(null, {
          listOfPeers: listOfPeers
        });
      }
    }
  };

  self.once('peerJoined', peerJoinedFn, function (peerId, peerInfo, isSelf) {
    return isSelf;
  });

  self.leaveRoom(false, function (error, success) {
    if (error) {
      if (typeof callback === 'function') {
        for (var i = 0; i < listOfPeers.length; i++) {
          listOfPeerRestartErrors[listOfPeers[i]] = error;
        }
        callback({
          refreshErrors: listOfPeerRestartErrors,
          listOfPeers: listOfPeers
        }, null);
      }
    } else {
      //self._trigger('serverPeerLeft', 'MCU', self.SERVER_PEER_TYPE.MCU);
      self.joinRoom(self._selectedRoom);
    }
  });
};