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

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as session does not exists']);
    return;
  }

  // Check if Peer connection signalingState === "stable"
  if (_this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as connection signalingState is not "stable" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  if (_this._peers[peerId].connection.datachannel) {
    log.debug([peerId, 'Peer', null, 'Starting RTCDataChannel connection']);

    _this._channelCreate(peerId, 'main');
  }

  /* Old format is no longer supported
  // RTCOfferOptions with mandatory OfferToReceiveAudio/Video not working with 44 and above
  // Let's move on with the new versions
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
      iceRestart: iceRestart === true
    }
  }; */

  // Generate local offer RTCSessionDescription
  _this._peers[peerId].peer.createOffer(function (offer) {
    log.debug([peerId, 'Peer', null, 'Connection generated local offer ->'], offer);

    // Set local offer RTCSessionDescription
    _this._peerConnectHandshakeSetLocal(peerId, offer);

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Connection failed generating local offer ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);

  }, {

    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    iceRestart: iceRestart === true

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

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as session does not exists']);
    return;
  }

  // Check if Peer connection signalingState === "stable"
  if (_this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as connection signalingState is not "stable" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  _this._peerConnectHandshakeSetRemote(peerId, offer, function () {
    // Generate local answer RTCSessionDescription
    _this._peers[peerId].peer.createAnswer(function (answer) {
      log.debug([peerId, 'Peer', null, 'Connection generated local answer ->'], answer);

      // Set local answer RTCSessionDescription
      _this._peerConnectHandshakeSetLocal(peerId, answer);

    }, function (error) {
      log.error([peerId, 'Peer', null, 'Connection failed generating local answer ->'], error);

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

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as session does not exists']);
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

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type + ' as session does not exists']);
    return;
  }

  // Start modifications here
  /*
  var sdpLines = sessionDescription.sdp.split('\r\n');

  // remove h264 invalid pref
  sdpLines = self._removeSDPFirefoxH264Pref(sdpLines);
  // Check if stereo was enabled
  if (self._streamSettings.hasOwnProperty('audio')) {
    if (self._streamSettings.audio.stereo) {
      self._addSDPStereo(sdpLines);
    }
  }

  log.info([targetMid, null, null, 'Requested stereo:'], (self._streamSettings.audio ?
    (self._streamSettings.audio.stereo ? self._streamSettings.audio.stereo : false) :
    false));

  // set sdp bitrate
  if (self._streamSettings.hasOwnProperty('bandwidth')) {
    var peerSettings = (self._peerInformations[targetMid] || {}).settings || {};

    sdpLines = self._setSDPBitrate(sdpLines, peerSettings);
  }

  self._streamSettings.bandwidth = self._streamSettings.bandwidth || {};

  self._streamSettings.video = self._streamSettings.video || false;

  log.info([targetMid, null, null, 'Custom bandwidth settings:'], {
    audio: (self._streamSettings.bandwidth.audio || 'Not set') + ' kB/s',
    video: (self._streamSettings.bandwidth.video || 'Not set') + ' kB/s',
    data: (self._streamSettings.bandwidth.data || 'Not set') + ' kB/s'
  });

  if (self._streamSettings.video.hasOwnProperty('frameRate') &&
    self._streamSettings.video.hasOwnProperty('resolution')){
    log.info([targetMid, null, null, 'Custom resolution settings:'], {
      frameRate: (self._streamSettings.video.frameRate || 'Not set') + ' fps',
      width: (self._streamSettings.video.resolution.width || 'Not set') + ' px',
      height: (self._streamSettings.video.resolution.height || 'Not set') + ' px'
    });
  }

  // set video codec
  if (self._selectedVideoCodec !== self.VIDEO_CODEC.AUTO) {
    sdpLines = self._setSDPVideoCodec(sdpLines);
  } else {
    log.log([targetMid, null, null, 'Not setting any video codec']);
  }

  // set audio codec
  if (self._selectedAudioCodec !== self.AUDIO_CODEC.AUTO) {
    sdpLines = self._setSDPAudioCodec(sdpLines);
  } else {
    log.log([targetMid, null, null, 'Not setting any audio codec']);
  }

  sessionDescription.sdp = sdpLines.join('\r\n');
  */

  log.debug([peerId, 'Peer', null, 'Connection setting local ' + sessionDescription.type + ' ->'], sessionDescription);

  _this._peers[peerId].peer.setLocalDescription(sessionDescription, function () {
    log.debug([peerId, 'Peer', null, 'Connection set local ' + sessionDescription.type + ' successfully']);

    if (!_this._peers[peerId].connection.trickleICE) {
      log.debug([peerId, 'Peer', null, 'Connection is awaiting for ICE candidates generation to complete before sending ' +
        'local ' + sessionDescription.type]);
      return;
    }

    // Send local offer RTCSessionDescription
    if (sessionDescription.type === 'offer') {
      _this._messageConstructOffer(peerId, sessionDescription);
    // Send local answer RTCSessionDescription
    } else {
      _this._messageConstructAnswer(peerId, sessionDescription);
    }

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Connection failed setting local ' + sessionDescription.type + ' ->'], error);

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

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type + ' as session does not exists']);
    return;
  }

  // Filter out unwanted over sending of "answer"
  if (sessionDescription.type === 'answer' && _this._peers[peerId].peer.signalingState !== 'have-local-offer') {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type + ' as connection signalingState ' +
      'is not "have-local-offer" ->'], _this._peers[peerId].peer.signalingState);
    return;
  }
  // Filter out unwanted over sending of "offer"
  if (sessionDescription.type === 'offer' && _this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type + ' as connection signalingState ' +
      'is not "stable" ->'], _this._peers[peerId].peer.signalingState);
    return;
  }

  // Start modifications here

  log.debug([peerId, 'Peer', null, 'Connection setting remote ' + sessionDescription.type + ' ->'], sessionDescription);

  _this._peers[peerId].peer.setRemoteDescription(sessionDescription, function () {
    log.debug([peerId, 'Peer', null, 'Connection set remote ' + sessionDescription.type + ' successfully']);

    // Add queued remote ICE candidates
    _this._peerCandidateAddQueued(peerId);

    callback();

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Connection failed setting remote ' + sessionDescription.type + ' ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
  });
};