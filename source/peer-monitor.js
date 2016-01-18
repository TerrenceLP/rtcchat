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

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', null, 'Ignoring monitoring of connection as session does not exists']);
    return;
  }

  // Check if there is any existing timers and clear if needed
  if (_this._peers[peerId].monitor.timer) {
    log.debug([peerId, 'Peer', null, 'Stopping the current connection health monitor']);
    clearTimeout(_this._peers[peerId].monitor.timer);
  }

  // Check if Peer is offerer, and increment as it takes more longer for the offerer
  if (_this._peers[peerId].monitor.offerer) {
    healthTimeout += 2500;
  }

  // Check if trickle ICE is disabled and increment as it takes longer
  if (!_this._peers[peerId].connection.trickleICE) {
    healthTimeout += 40000;
  }

  // Increment the timer for every retry
  healthTimeout += _this._peers[peerId].monitor.retries * 10000;

  // Reset the connection status to false first
  _this._peers[peerId].monitor.connected = false;

  // Start the monitor
  _this._peers[peerId].monitor.timer = setTimeout(function () {
    if (!_this._peerCheckExists(peerId)) {
      log.warn([peerId, 'Peer', null, 'Ignoring expiration of connection monitor as session does not exists']);
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
      _this._peers[peerId].monitor.timer = null;
      _this._peers[peerId].monitor.connected = true;

      log.debug([peerId, 'Peer', null, 'Connection is connected and healthy']);
      return;
    }

    log.debug([peerId, 'Peer', null, 'Connection is not healthy, reconnecting ->'], {
      iceConnectionState: iceConnectionStateStable,
      signalingState: signalingStateStable,
      dataChannelState: dataChannelStateStable
    });

    _this._peerReconnect(peerId, false, false, true);

  }, healthTimeout);

  log.debug([peerId, 'Peer', null, 'Monitoring connection health with timeout ->'], healthTimeout);
};