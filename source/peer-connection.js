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

  // The ICE connection status
  _this._peers[peerId].ICEStatus = {
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
  };

  // RTCPeerConnection.onconnectionstatechange - not implemented yet

  // RTCPeerConnection.onicecandidateerror - not implemented yet

  // RTCPeerConnection.ontrack - not implemented yet

  // RTCPeerConnection.onicecandidate
  _this._peers[peerId].peer.onicecandidate = _this._peerConnectReactToOnicecandidate(peerId);

  // RTCPeerConnection.oniceconnectionstatechange
  _this._peers[peerId].peer.oniceconnectionstatechange = _this._peerConnectReactToOniceconnectionstatechange(peerId);

  // RTCPeerConnection.onsignalingstatechange
  _this._peers[peerId].peer.onsignalingstatechange = _this._peerConnectReactToOnsignalingstatechange(peerId);

  // RTCPeerConnection.onicegatheringstatechange
  _this._peers[peerId].peer.onicegatheringstatechange = _this._peerConnectReactToOnicegatheringstatechange(peerId);

  // RTCPeerConnection.onnegotiationneeded
  _this._peers[peerId].peer.onnegotiationneeded = _this._peerConnectReactToOnnegotiationneeded(peerId);

  // RTCPeerConnection.ondatachannel
  _this._peers[peerId].peer.ondatachannel = _this._peerConnectReactToOndatachannel(peerId);

  // RTCPeerConnection.onaddstream
  _this._peers[peerId].peer.onaddstream = _this._peerConnectReactToOnaddstream(peerId);

  // RTCPeerConnection.onremovestream
  _this._peers[peerId].peer.onremovestream = _this._peerConnectReactToOnremovestream(peerId);


  log.debug([peerId, 'Peer', null, 'Connection has started and is ready for handshaking']);
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

  // Check if Peer session exists
  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring stopping connection as session does not exists']);
    return;
  }

  // Close Peer connection if exists
  if (_this._peers[peerId].peer) {
    _this._peers[peerId].peer.close();

    log.debug([peerId, 'Peer', null, 'Connection is stopping']);
  }

  // Disconnects all RTCDataChannel connections
  _this._channelDestroy(peerId);
};

/**
 * Restarts the Peer connection.
 * @method _peerReconnect
 * @param {String} peerId The Peer session ID.
 * @param {Boolean} hardRestart The flag that indicates if reconnection should be re-created.
 * @param {Boolean} iceRestart The flag that indicates if reconnection should restart ICE.
 * @param {Boolean} isSelfRestart The flag that indicates if reconnection is initiated by self.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerReconnect = function (peerId, hardRestart, iceRestart, isSelfRestart) {
  var _this = this;

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring reconnection as session does not exists']);
    return;
  }

  var resendSDP = false;

  // Firefox does not support ICE restart yet
  if (_this._user.agent.name === 'firefox' && iceRestart) {
    log.warn([peerId, 'Peer', null, 'Current browser does not support ICE restart, hence fallbacking to restarting connection']);

    hardRestart = true;
  }

  // Check if we have to do a complete restart
  // Only hard restarts can be made with P2P only connections
  if (hardRestart) {
    log.debug([peerId, 'Peer', null, 'Restarting connection']);

    _this._peerDisconnect(peerId);
    _this._peerConnect(peerId);

    // Always configure ICE restart to false since you no need it if you are restarting the Peer connection object
    iceRestart = false;

  // Do re-negotiation of O / A
  } else {
    // Do re-sends of O / A only for self initiated restarts
    if (isSelfRestart) {
      var sessionDescription = _this._peers[peerId].peer.localDescription;

      // Check if local RTCSessionDescription exists first
      if (sessionDescription && !!sessionDescription.sdp) {
        // When other Peer connection does not receive our local offer RTCSessionDescription yet
        if (_this._peers[peerId].peer.signalingState === 'have-local-offer') {
          _this._messageConstructOffer(peerId, sessionDescription);
          resendSDP = true;

        // When other Peer connection does not receive our local answer RTCPeerConnection yet
        } else if (_this._peers[peerId].peer.signalingState === 'have-remote-offer') {
          _this._messageConstructAnswer(peerId, sessionDescription);
          resendSDP = true;
        }
      }
    }
  }

  // Send the "restart" message scenario
  if (isSelfRestart) {
    if (!resendSDP) {
      _this._messageConstructRestart(peerId, hardRestart, iceRestart);
    }
  }

  log.debug([peerId, 'Peer', null, 'Reconnection options ->'], {
    hardRestart: hardRestart,
    iceRestart: iceRestart,
    isSelfRestart: isSelfRestart
  });

  _this._trigger('peerRestart', peerId, _this.getPeerInfo(peerId), isSelfRestart);

  _this._peerConnectMonitor(peerId);
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

    _this._channelCreate(peerId, channel);
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

    log.debug([peerId, 'Peer', stream.id, 'Connection received remote MediaStream ->'], stream);

    // Check if Peer session has stream information, else it's an empty remote MediaStream that Chrome triggers
    if (!_this._peers[peerId].stream) {
      log.debug([peerId, 'Peer', stream.id, 'Ignoring received remote MediaStream as session stream information is empty ->'], stream);
      return;
    }

    // The timeout that somehow allows rendering to work
    var magicalTimeout = 0;

    if (_this._peerSessions[peerId].agent.name === 'firefox' && _this._user.agent.name !== 'firefox') {
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

  return function (event) {
    log.debug([peerId, 'Peer', null, 'Connection received negotiation request ->'], event);
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
    log.debug([peerId, 'Peer', stream.id, 'Connection removed remote MediaStream ->'], stream);
  };
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

    _this._peerCandidateSend(peerId, candidate);
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
        _this._peers[peerId].ICEStatus.failures++;

        // Disable trickle ICE if failures counter is 3 and MCU is not present
        // Only P2P can do hard restarts
        if (_this._peers[peerId].ICEStatus.failures === 3 && !_this._room.MCU) {
          _this._peers[peerId].connection.trickleICE = false;
          hardRestart = true;

          _this._trigger('iceConnectionState', _this.ICE_CONNECTION_STATE.TRICKLE_FAILED, peerId);
        }
      }

      _this._peerReconnect(peerId, hardRestart, true, true);
    }
  };
};