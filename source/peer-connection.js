/**
 * Handles the peer session.
 * @class SkylinkPeer
 * @private
 * @since 0.6.8
 * @for Skylink
 */
function SkylinkPeer (id, config) {
  SkylinkEvent._mixin(this);

  this.id = id;

  if (typeof config.agent === 'object' && config.agent !== null) {
    if (typeof config.agent.name === 'string') {
      this.agent.name = config.agent.name;
    }
    if (typeof config.agent.version === 'number') {
      this.agent.version = config.agent.version;
    }
    if (typeof config.agent.os === 'string') {
      this.agent.os = config.agent.os;
    }
  }

  this.data = config.data;

  if (typeof config.stream === 'object' && config.stream !== null) {
    this._stream = config.stream;
  }

  if (typeof config.connection === 'object' && config.connection !== null) {
    if (config.connection.recvOnly === true) {
      this._connection.recvonly = true;
    }

    if (config.connection.dataChannel === false) {
      this._connection.datachannel = false;
    }

    if (config.connection.trickleICE === false) {
      this._connection.trickleICE = false;
    }

    if (config.connection.stereo === false) {
      this._connection.stereo = false;
    }

    if (typeof config.connection.bandwidth === 'object' && config.connection.bandwidth !== null) {
      if (typeof config.connection.bandwidth.audio === 'number' && config.connection.bandwidth.audio > 0) {
        this._connection.bandwidth.audio = config.connection.bandwidth.audio;
      }

      if (typeof config.connection.bandwidth.video === 'number' && config.connection.bandwidth.video > 0) {
        this._connection.bandwidth.video = config.connection.bandwidth.video;
      }

      if (typeof config.connection.bandwidth.data === 'number' && config.connection.bandwidth.data > 0) {
        this._connection.bandwidth.data = config.connection.bandwidth.data;
      }
    }
  }

  // Construct new RTCPeerConnection object
  this._peer = new RTCPeerConnection({
    iceServers: config.iceServers
    // iceTransportPolicy: 'relay',
    // bundlePolicy: 'balanced',
    // certificates: [],
    // iceCandidatePoolSize: 0,
    // rtcpMuxPolicy: 'require'
  }, {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  });

  this._listenToEvents();
  this._monitorHealth();

  log.debug([id, 'Peer', null, 'Connection object is ready for handshaking']);
}

/**
 * Contains the peer session ID.
 * @attribute id
 * @type String
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.id = null;

/**
 * Contains the peer agent.
 * @attribute agent
 * @type JSON
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.agent = {
  name: null,
  version: null,
  os: null
};

/**
 * Contains the peer custom data.
 * @attribute data
 * @type Any
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.data = null;

/**
 * Contains the peer streaming information.
 * @attribute _stream
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._stream = null;

/**
 * Contains the peer connection information.
 * @attribute _connection
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._connection = {
  recvonly: false,
  datachannel: true,
  trickleICE: true,
  stereo: true,
  bandwidth: {},
  monitor: null
};

/**
 * Contains the RTCPeerConnection object.
 * @attribute _peer
 * @type RTCPeerConnection
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._peer = null;

/**
 * Contains the list of datachannels.
 * @attribute _channels
 * @param {DataChannel} (#channelId) The DataChannel connection object.
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._channels = null;

/**
 * Listens to RTCPeerConnection events.
 * @method _listenToEvents
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._listenToEvents = function() {
  var self = this;

  // RTCPeerConnection ondatachannel event
  self._peer.ondatachannel = function(event) {
    var channel = event.channel || event;

    log.debug([self.id, 'Peer', channel.label, 'Received RTCDataChannel ->'], channel);
  };

  // RTCPeerConnection onaddstream event
  self._peer.onaddstream = function(event) {
    var stream = event.stream || event;
    var timeout = 0;

    // NOTE: Add timeouts to the firefox stream received because it seems to have some sort of black stream rendering at first
    // This may not be advisable but that it seems to work after 1500s. (tried with ICE established but it does not work and getStats)
    if (self.agent.name === 'firefox' && user.agent.name !== 'firefox') {
      timeout = 1500;
    }

    setTimeout(function () {
      log.debug([self.id, 'Peer', stream.id, 'Received MediaStream ->'], stream);
    }, timeout);
  };

  // RTCPeerConnection onicecandidate event
  self._peer.onicecandidate = function(event) {
    var candidate = event.candidate || event;

    if (candidate.candidate) {
      log.debug([self.id, 'Peer', null, 'Generated RTCIceCandidate ->'], candidate);

      self._trigger('candidate', candidate);

    } else {
      log.log([self.id, 'Peer', null, 'Generation of RTCIceCandidates has completed']);
    }
  };

  // RTCPeerConnection oniceconnectionstatechange event
  self._peer.oniceconnectionstatechange = function() {
    log.debug([self.id, 'Peer', null, 'Current iceConnectionState ->'], self._peer.iceConnectionState);

    self._trigger('iceConnectionState', self._peer.iceConnectionState);
  };

  // RTCPeerConnection onsignalingstatechange event
  self._peer.onsignalingstatechange = function() {
    log.debug([self.id, 'Peer', null, 'Current signalingState ->'], self._peer.signalingState);

    self._trigger('signalingState', self._peer.signalingState);
  };

  // RTCPeerConnection onicegatheringstatechange event
  self._peer.onicegatheringstatechange = function() {
    log.debug([self.id, 'Peer', null, 'Current iceGatheringState ->'], self._peer.iceGatheringState);

    self._trigger('iceGatheringState', self._peer.iceGatheringState);
  };

  log.debug([self.id, 'Peer', null, 'Listenting to RTCPeerConnection object events']);
};

/**
 * Generates a local offer RTCSessionDescription.
 * @method offer
 * @param {Boolean} [restartICE=false] The flag that indicates if generation of offer should generate
 *   new ICE credentials over the server.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.offer = function (restartICE) {
  var self = this;

  if (!self._peer) {
    log.error([self.id, 'Peer', null, 'Ignoring creating of offer as peer object is not initialized']);
    return;
  }

  self._peer.createOffer(function (offer) {
    log.debug([self.id, 'Peer', null, 'Generated offer ->'], offer);
    self._setLocalDescription(offer);

  }, function (error) {
    log.error([self.id, 'Peer', null, 'Failed creating offer ->'], error);

    self._trigger('handshake', 'error', error);
  }, {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    iceRestart: !!restartICE
  });
};

/**
 * Generates a local answer RTCSessionDescription in response to given offer.
 * @method answer
 * @param {String} offer The offer session description string.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.answer = function (sdpString) {
  var self = this;

  if (!self._peer) {
    log.error([self.id, 'Peer', null, 'Ignoring creating of answer as peer object is not initialized']);
    return;
  }

  var offer = new RTCSessionDescription({
    type: 'offer',
    sdp: sdpString
  });

  self._setRemoteDescription(offer, function () {
    self._peer.createAnswer(function (answer) {
      log.debug([self.id, 'Peer', null, 'Generated answer ->'], answer);
      self._setLocalDescription(answer);

    }, function (error) {
      log.error([self.id, 'Peer', null, 'Failed creating answer ->'], error);

      self._trigger('handshake', 'error', error);
    });
  });
};

/**
 * Completes the connection handshaking in response to given answer.
 * @method complete
 * @param {String} answer The answer session description string.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.complete = function (sdpString) {
  var self = this;

  if (!self._peer) {
    log.error([self.id, 'Peer', null, 'Ignoring setting of answer as peer object is not initialized']);
    return;
  }

  var answer = new RTCSessionDescription({
    type: 'answer',
    sdp: sdpString
  });

  self._setRemoteDescription(answer, function () {
    log.debug([self.id, 'Peer', null, 'Handshaking has completed']);
  });
};

/**
 * Adds the RTCIceCandidate object to the RTCPeerConnection object.
 * @method addCandidate
 * @param {JSON} candidate The candidate session.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.addCandidate = function (candidateSession) {
  var self = this;

  if (!self._peer) {
    log.error([self.id, 'Peer', null, 'Ignoring adding of candidate as peer object is not initialized']);
    return;
  }

  var candidate = new RTCIceCandidate({
    sdpMLineIndex: candidateSession.sdpMLineIndex,
    sdpMid: candidateSession.sdpMid,
    candidate: candidateSession.candidate
  });

  self._peer.addIceCandidate(candidate, function () {
    log.debug([self.id, 'Peer', null, 'Successfully added candidate'], candidate);
  }, function (error) {
    log.error([self.id, 'Peer', null, 'Failed adding candidate'], {
      candidate: candidate,
      error: error
    });
  });
};

/**
 * Sets the local RTCSessionDescription.
 * @method _setLocalDescription
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._setLocalDescription = function (sdp) {
  var self = this;

  if (!self._peer) {
    log.error([self.id, 'Peer', null, 'Ignoring setting local description as peer object is not initialized']);
    return;
  }

  self._peer.setLocalDescription(sdp, function () {
    log.debug([self.id, 'Peer', null, 'Local description has been set']);

    self._trigger('handshake', sdp.type, null);
    self._trigger(sdp.type, sdp);

  }, function (error) {
    log.error([self.id, 'Peer', null, 'Failed setting local description ->'], error);

    self._trigger('handshake', 'error', error);
  });
};

/**
 * Sets the remote RTCSessionDescription.
 * @method _setRemoteDescription
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._setRemoteDescription = function (sdp, callback) {
  var self = this;

  if (!self._peer) {
    log.error([self.id, 'Peer', null, 'Ignoring setting remote description as peer object is not initialized']);
    return;
  }

  self._peer.setRemoteDescription(sdp, function () {
    log.debug([self.id, 'Peer', null, 'Remote description has been set']);
    self._trigger('handshake', sdp.type, null);

    callback();

  }, function (error) {
    log.error([self.id, 'Peer', null, 'Failed setting remote description ->'], error);

    self._trigger('handshake', 'error', error);
  });
};

/**
 * Monitors the RTCPeerConnection health and restarts when required.
 * @method _monitorHealth
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._monitorHealth = function () {
  var self = this;

  self._connection.monitor = setTimeout(function () {
    if (self._peer && self._peer.iceConnectionState !== 'connect') {

    }

  }, 10000);
};

