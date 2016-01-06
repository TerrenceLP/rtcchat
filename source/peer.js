/*
 * Contains the list of peers.
 * @attribute _peers
 * @param {JSON} (#peerId) The peer session information.
 * @param {RTCPeerConnection} (#peerId).peer The peer RTCPeerConnection object.
 * @param {JSON} (#peerId).connection The peer connection settings.
 * @param {Boolean} [(#peerId).connection.trickleICE=true] The flag that indicates if
 *   RTCPeerConnection object should trickle ICE.
 * @param {Number} (#peerId).connection.ICEFailures Stores the number of ICE failures.
 * @param {Boolean} [(#peerId).connection.dataChannel=true] The flag that indicates if
 *   RTCPeerConnection object should enable RTCDataChannel functionality.
 * @param {JSON} (#peerId).connection.bandwidth Stores the bandwidth information to modify the SDP with.
 * @param {Number} (#peerId).connection.bandwidth.audio The audio bandwidth allocation.
 * @param {Number} (#peerId).connection.bandwidth.video The video bandwidth allocation.
 * @param {Number} (#peerId).connection.bandwidth.data The data transfers bandwidth allocation.
 * @param {Boolean} (#peerId).connection.stereo The flag that indicates if the SDP should be modified with
 *   stereo flag when in a OPUS call.
 * @param {JSON} (#peerId).connection.codecs The media codecs used.
 * @param {String} (#peerId).connection.codecs.audio The audio codec used.
 * @param {String} (#peerId).connection.codecs.video The video codec used.
 * @param {JSON} (#peerId).agent The peer agent information.
 * @param {String} (#peerId).agent.name The peer agent name.
 * @param {Number} (#peerId).agent.version The peer agent version.
 * @param {String} (#peerId).agent.os The peer agent platform.
 * @param {Any} (#peerId).data The peer custom data.
 * @param {JSON} (#peerId).channels The peer RTCDataChannels list.
 * @param {JSON} (#peerId).health The peer connection status health checker.
 * @param {Function} (#peerId).health.timer The timeout checker for the RTCPeerConnection.
 * @Param {Boolean} (#peerId).health.connected The flag that indicates if RTCPeerConnection is connected.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peers = {};

/**
 * Creates the peer session object and starts the connection.
 * @method _createPeer
 * @param {String} peerId The peer session ID.
 */
Skylink.prototype._createPeer = function (peerId, options) {
  var self = this;

  if (self._peers[peerId]) {
    log.warn(peerId, 'Ignoring creation for peer object as it exists');
    return;
  }

  self._peers[peerId] = {
    // RTCPeerConnection object
    peer: null,
    // Browser (or SDK) agent info
    agent: {
      name: options.agent.name,
      version: options.agent.version,
      os: options.agent.os || ''
    },
    // SDP connection settings
    connection: {

    }
  };


};


/**
 * Updates the peer session object.
 * @param _updatePeer
 */


/**
 * Creates the peer RTCPeerConnection object.
 * @method _createConnection
 * @param {String} peerId The peer session ID.
 */
Skylink.prototype._createConnection = function (peerId) {
  var self = this;

  // Checks for existance
  if (typeof self._peers[peerId] !== 'object' || self._peers[peerId] === null) {
    log.warn(peerId, 'Ignoring creation for peer RTCPeerConnection object as session does not exists');
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


};
