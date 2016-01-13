/**
 * Handles the peer sessions.
 * @class SkylinkPeer
 * @private
 * @since 0.6.8
 * @for Skylink
 */
function SkylinkPeer (config) {
  SkylinkEvent._mixin(this);

  // Configure the session ID
  this.id = config.id;
  // Configure the agent name
  this.agent.name = config.agent.name;
  // Configure the agent version
  this.agent.version = config.agent.version;
  // Configure the agent platform
  this.agent.os = config.agent.os;
  // Configure the custom data
  this.data = config.data;
  // Configure the streaming data
  this.stream = config.stream;
  // Configure the iceServers
  this._connection.iceServers = config.iceServers;

  // Configure the trickle ICE option
  if (config.connection.trickleICE === false) {
    this._connection.trickleICE = false;
  }

  // Configure the datachannel option
  if (config.connection.datachannel === false) {
    this._connection.datachannel = false;
  }

  // Configure the recvonly option
  if (config.connection.recvonly === true) {
    this._connection.recvonly = true;
  }

  // Configure the stereo option for OPUS
  if (config.connection.stereo === false) {
    this._connection.stereo = false;
  }

  // Configure the bandwidth
  if (typeof config.connection.bandwidth === 'object' && config.connection.bandwidth !== null) {
    // Configure the bandwidth for audio
    if (typeof config.connection.bandwidth.audio === 'number' && config.connection.bandwidth.audio > 0) {
      this._connection.bandwidth.audio = config.connection.bandwidth.audio;
    }
    // Configure the bandwidth for video
    if (typeof config.connection.bandwidth.video === 'number' && config.connection.bandwidth.video > 0) {
      this._connection.bandwidth.video = config.connection.bandwidth.video;
    }
    // Configure the bandwidth for data
    if (typeof config.connection.bandwidth.data === 'number' && config.connection.bandwidth.data > 0) {
      this._connection.bandwidth.data = config.connection.bandwidth.data;
    }
  }

  this.connect();

  log.debug([this.id, 'Peer', null, 'Ready for connection handshaking']);
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
 * @attribute stream
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.stream = null;

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
  iceServers: []
};

/**
 * Contains the peer connection establishment heath status.
 * @attribute _heath
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._health = {
  healthy: false,
  retries: 0,
  failures: 0,
  timer: null
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
 * @param {SkylinkDataChannel} (#channelId) The datachannel connection object.
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._channels = {};

/**
 * Contains the list of queued remote ICE candidates.
 * @attribute _candidates
 * @type JSON
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._candidates = {
  incoming: {
    queue: [],
    success: [],
    failure: []
  },
  outgoing: [],
  complete: false
};

/**
 * Creates the RTCPeerConnection object and listens to its events.
 * @method _connect
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.connect = function() {
  var self = this;

  // Settings for the RTCConfiguration
  var RTCConfiguration = {
    iceServers: self._connection.iceServers
    // iceTransportPolicy: 'relay',
    // bundlePolicy: 'balanced',
    // certificates: [],
    // iceCandidatePoolSize: 0,
    // rtcpMuxPolicy: 'require'
  };

  // Settings for the RTCConfiguration (optional)
  var RTCOptional = {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  };

  log.debug([self.id, 'Peer', null, 'Constructing RTCPeerConnection object ->'], {
    RTCConfiguration: RTCConfiguration,
    RTCOptional: RTCOptional
  });

  if (!self._connection.trickleICE) {
    log.warn([self.id, 'Peer', null, 'Trickle ICE has been disabled for this connection and this may result in a ' +
      'slower connection establishment']);
  }

  if (!self._connection.datachannel) {
    log.warn([self.id, 'Peer', null, 'Datachannel functionalities is disabled']);
  }

  // Construct the new RTCPeerConnection object
  self._peer = new RTCPeerConnection(RTCConfiguration, RTCOptional);

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
      self._trigger('stream', stream);
    }, timeout);
  };

  // RTCPeerConnection onicecandidate event
  self._peer.onicecandidate = function(event) {
    var candidate = event.candidate || event;

    // Generation of RTCIceCandidates is still ongoing
    if (candidate.candidate) {
      var candidateId = candidate.candidate.split(' ')[0];

      log.debug([self.id, 'Peer', candidateId, 'Generated RTCIceCandidate ->'], candidate);

      self._candidates.outgoing.push(candidate);
      self._trigger('candidate', candidate);

    // Generation of RTCIceCandidates has completed
    } else {
      log.log([self.id, 'Peer', null, 'Generation of RTCIceCandidates has completed']);

      self._candidates.complete = true;

      // Check if trickle ICE is disabled, and if so, send the local RTCSessionDescription to peer
      if (!self._connection.trickleICE && self._peer.localDescription && !!self._peer.localDescription.type) {
        log.debug([self.id, 'Peer', null, 'Connection handshake may proceeed now']);

        self._trigger(self._peer.localDescription.type, self._peer.localDescription);
      }
    }
  };

  // RTCPeerConnection oniceconnectionstatechange event
  self._peer.oniceconnectionstatechange = function() {
    log.debug([self.id, 'Peer', null, 'Current iceConnectionState ->'], self._peer.iceConnectionState);

    self._trigger('iceConnectionState', self._peer.iceConnectionState);

    if (self._peer.iceConnectionState === 'failed') {
      self._health.failures++;

      // Check if ICE failure has reached to 3 and disable ICE trickle if so
      if (self._health.failures === 3 && self._connection.trickleICE) {
        self._trigger('iceConnectionState', 'trickleFailed');
        self._connection.trickleICE = false;
        self._handshakeRestart(true, false);

      // Have not reached to 3 yet
      } else {
        self._handshakeRestart(false, true);
      }
    } else if (['connected', 'completed'].indexOf(self._peer.iceConnectionState) > -1) {
      self._health.healthy = true;
    }
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

  log.log([self.id, 'Peer', null, 'Listenting to RTCPeerConnection object events']);

  self._monitorHealth();
};

/**
 * Connection handshake process:
 * Sets the local RTCSessionDescription.
 * @method _setLocalDescription
 * @param {RTCSessionDescription} sdp The local RTCSessionDescription object generated.
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._setLocalDescription = function (sessionDescription) {
  var self = this;

  // Make checks if connection object is at correct state
  if (!self._peer) {
    log.warn([self.id, 'Peer', null, 'Ignoring local description as peer object is not initialized']);
    return;
  }

  // If sessionDescription type is "offer"
  if (sessionDescription.type === 'offer') {
    // If stage is not at "stable"
    if (self._peer.signalingState !== 'stable') {
      log.warn([self.id, 'Peer', null, 'Ignoring local description as state is not "stable" ->'],
        self._peer.signalingState);
      return;
    }

  // If sessionDescription type is "answer"
  } else {
    // If stage is not at "have-remote-offer"
    if (self._peer.signalingState !== 'have-remote-offer') {
      log.warn([self.id, 'Peer', null, 'Ignoring local description as state is not "have-remote-offer" ->'],
        self._peer.signalingState);
      return;
    }
  }

  log.debug([self.id, 'Peer', null, 'Setting local ' + sessionDescription.type + ' ->'], sessionDescription);

  // Set the local RTCSessionDescription
  self._peer.setLocalDescription(sessionDescription, function () {
    // Set local description success
    log.log([self.id, 'Peer', null, 'Local ' + sessionDescription.type + ' has been set']);

    self._trigger('handshakeProgress', sessionDescription.type, null);

    // Check if trickleICE is disabled and prevent local offer being sent until ICE candidates have generated completely
    if (!self._connection.trickleICE && !self._candidates.complete) {
      log.debug([self.id, 'Peer', null, 'Awaiting for all ICE candidates to complete generation']);
      return;
    }

    self._trigger(sessionDescription.type, sessionDescription);

  }, function (error) {
    // Failed setting local description
    log.error([self.id, 'Peer', null, 'Failed setting local ' + sessionDescription.type + ' ->'], error);

    self._trigger('handshakeProgress', 'error', error);
  });
};

/**
 * Connection handshake process:
 * Sets the remote RTCSessionDescription.
 * @method _setRemoteDescription
 * @param {RTCSessionDescription} sdp The remote RTCSessionDescription object received.
 * @param {Function} callback The callback triggered once setRemoteDescription is done.
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._setRemoteDescription = function (sessionDescription, callback) {
  var self = this;

  // Checks have been made at handshakeAnswer() and handshakeComplete()
  log.debug([self.id, 'Peer', null, 'Setting remote ' + sessionDescription.type + ' ->'], sessionDescription);

  // Set the remote RTCSessionDescription
  self._peer.setRemoteDescription(sessionDescription, function () {
    // Set remote description success
    log.debug([self.id, 'Peer', null, 'Remote ' + sessionDescription.type + ' has been set']);

    self._trigger('handshakeProgress', sessionDescription.type, null);

    // Add any queued remote ICE candidates
    for (var c = 0; c < self._candidates.incoming.queue.length; c++) {
      self.addCandidate(self._candidates.incoming.queue[c]);
    }

    // Reset to empty
    self._candidates.incoming.queue = [];
    callback();

  }, function (error) {
    // Failed settings remote description
    log.error([self.id, 'Peer', null, 'Failed setting remote ' + sessionDescription.type + ' ->'], error);

    self._trigger('handshakeProgress', 'error', error);
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
  var timeout = 10000;

  self._health.timer = setTimeout(function () {

  }, timeout);

  /*self._connection.monitor = setTimeout(function () {
    if (self._peer && self._peer.iceConnectionState !== 'connect') {

    }

  }, 10000);*/
};

/**
 * Restarts the establishment of the RTCPeerConnection.
 * @method _handshakeRestart
 * @param {Boolean} [hardRestart=false] The flag that indicates if RTCPeerConnection object should be refreshed.
 * @param {Boolean} [restartIce=false] The flag that indicates if generation of offer should generate
 *   new ICE credentials over the server.
 * @private
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype._handshakeRestart = function (hardRestart, restartIce) {
  var self = this;

  // If hardRestart, we should re-create the RTCPeerConnection object
  if (hardRestart) {
    self.disconnect();
    self.connect();

  } else {
    // Have local offer/answer description
    if (['have-local-offer', 'have-remote-offer'].indexOf(self._peer.signalingState) > -1 &&
      self._peer.localDescription && self._peer.localDescription.type) {
      // Resend the local offer/answer description
      log.debug([self.id, 'Peer', null, 'Sending local ' + self._peer.localDescription.type + ' again for restart ->'],
        self._peer.localDescription);

      self._trigger(self._peer.localDescription.type, self._peer.localDescription);
      return;
    }
  }

  // Restart normal connection
  self._trigger('restart', hardRestart, restartIce);
};


/**
 * Connection handshake step 1:
 * Generates a local offer RTCSessionDescription.
 * @method handshakeOffer
 * @param {Boolean} [restartIce=false] The flag that indicates if generation of offer should generate
 *   new ICE credentials over the server.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.handshakeOffer = function (restartIce) {
  var self = this;

  // If stage is not at "stable", return
  if (self._peer.signalingState !== 'stable') {
    log.warn([self.id, 'Peer', null, 'Ignoring local offer generation as state is not "stable" ->'],
      self._peer.signalingState);
    return;
  }

  // The RTCOfferOptions
  var RTCOfferOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    iceRestart: !!restartIce
  };

  log.debug([self.id, 'Peer', null, 'Generating offer ->'], RTCOfferOptions);

  // Generate local offer RTCSessionDescription
  self._peer.createOffer(function (offer) {
    // Offer has been generated successfully case
    log.log([self.id, 'Peer', null, 'Generated offer ->'], offer);
    // Set local offer RTCSessionDescription
    self._setLocalDescription(offer);

  }, function (error) {
    // Offer has failed generating
    log.error([self.id, 'Peer', null, 'Failed generating offer ->'], error);

    self._trigger('handshakeProgress', 'error', error);

  }, RTCOfferOptions);
};

/**
 * Connection handshake step 2:
 * Generates a local answer RTCSessionDescription in response to given offer.
 * @method answer
 * @param {String} offer The offer session description string.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.handshakeAnswer = function (sdpString) {
  var self = this;

  // If stage is not at "stable", return
  if (self._peer.signalingState !== 'stable') {
    log.warn([self.id, 'Peer', null, 'Ignoring remote offer as state is not "stable" ->'],
      self._peer.signalingState);
    return;
  }

  // Construct the remote offer RTCSessionDescription
  var offer = new RTCSessionDescription({
    type: 'offer',
    sdp: sdpString
  });

  log.debug([self.id, 'Peer', null, 'Setting remote offer first before generating answer ->'], offer);

  // Set the remote offer RTCSessionDescription
  self._setRemoteDescription(offer, function () {
    // Remote offer has been set successfully
    log.debug([self.id, 'Peer', null, 'Generating answer ->'], null);

    // Generate local answer RTCSessionDescription
    self._peer.createAnswer(function (answer) {
      // Answer has been generated successfully case
      log.log([self.id, 'Peer', null, 'Generated answer ->'], answer);
      // Set local answer RTCSessionDescription
      self._setLocalDescription(answer);

    }, function (error) {
      // Answer has failed generating
      log.error([self.id, 'Peer', null, 'Failed generating answer ->'], error);

      self._trigger('handshakeProgress', 'error', error);
    });
  });
};

/**
 * Connection handshake step 3 (final):
 * Completes the connection handshaking in response to given answer.
 * @method handshakeComplete
 * @param {String} answer The answer session description string.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.handshakeComplete = function (sdpString) {
  var self = this;

  // If stage is not at "stable", return
  if (self._peer.signalingState !== 'have-local-offer') {
    log.warn([self.id, 'Peer', null, 'Ignoring remote answer as state is not "have-local-offer" ->'],
      self._peer.signalingState);
    return;
  }

  // Construct the remote answer RTCSessionDescription
  var answer = new RTCSessionDescription({
    type: 'answer',
    sdp: sdpString
  });

  self._setRemoteDescription(answer, function () {
    // Remote answer has been set successfully
    log.log([self.id, 'Peer', null, 'Connection handshake has completed']);
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

  // Construct the new RTCIceCandidate
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: candidateSession.sdpMLineIndex,
    sdpMid: candidateSession.sdpMid,
    candidate: candidateSession.candidate
  });
  var candidateId = candidateSession.candidate.split(' ')[0];

  if (!(self._peer.remoteDescription && !!self._peer.remoteDescription.sdp)) {
    log.debug([self.id, 'Peer', candidateId, 'Queueing remote ICE candidates receiving before remote description ->'],
      candidate);
    self._candidates.incoming.queue.push(candidate);
    return;
  }

  log.debug([self.id, 'Peer', candidateId, 'Processing remote ICE candidate ->'], candidate);

  // Add the candidate
  self._peer.addIceCandidate(candidate, function () {
    // Add candidate success
    log.log([self.id, 'Peer', candidateId, 'Added remote ICE candidate']);
    self._candidates.incoming.success.push(candidate);

  }, function (error) {
    // Add candidate failure
    log.error([self.id, 'Peer', candidateId, 'Failed adding remote ICE candidate ->'], error);
    self._candidates.incoming.failure.push(candidate);
  });
};

/**
 * Updates the stream of the RTCPeerConnection object.
 * @method sendStream
 * @param {MediaStream} stream The stream object.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.sendStream = function (newStream) {
  var self = this;
  var removeStreamHandler = null;

  // Remove current MediaStreams
  if (user.agent.name === 'firefox') {
    removeStreamHandler = function (oldStream) {
      var senders = self._peer.getSenders();

      for (var s = 0; s < senders.length; s++) {
        var tracks = oldStream.getTracks();
        for (var t = 0; t < tracks.length; t++) {
          if (tracks[t] === senders[s].track) {
            self._peer.removeTrack(senders[s]);
          }
        }
      }
    };
  } else {
    removeStreamHandler = function (oldStream) {
      self._peer.removeStream(oldStream);
    };
  }

  var prevStreams = self._peer.getLocalStreams();

  for (var i = 0; i < prevStreams.length; i++) {
    // try removeStream
    self._peer.removeStream(prevStreams[i]);
  }

  self._peer.addStream(newStream);

  if (self._health.healthy) {
    self._handshakeRestart(false, false);
  }
};

/**
 * Sends a Blob data to RTCPeerConnection object.
 * @method sendData
 * @param {Blob|String} data The blob object.
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.sendData = function (blob) {
  var self = this;

  // TODO: Open a new channel and send message or blob
};

/**
 * Disconnects the RTCPeerConnection object.
 * @method disconnect
 * @since 0.6.8
 * @for SkylinkPeer
 */
SkylinkPeer.prototype.disconnect = function () {
  var self = this;

  self._peer.close();

  // Disconnect all the RTCDataChannel objects
};