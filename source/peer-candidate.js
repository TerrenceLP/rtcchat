/**
 * Filters the RTCIceCandidate if it matches the filter expected.
 * @method _peerCandidateFilter
 * @param {RTCIceCandidate} candidate The RTCIceCandidate object to filter.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCandidateFilter = function (candidate) {
  var _this = this;

  // Filter out unwanted candidates at this point
  var matchesFilter = false;
  var candidateId = candidate.candidate.split(' ')[0];

  _this._user.session.ICE.useCandidates.current.forEach(function (candidateType) {
    if (candidate.candidate.indexOf(candidateType) > -1) {
      matchesFilter = true;
    }
  });

  return matchesFilter;
};

/**
 * Adds the remote RTCIceCandidate received.
 * @method _peerCandidateAdd
 * @param {String} peerId The Peer session ID.
 * @param {RTCIceCandidate} candidate The remote RTCIceCandidate received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCandidateAdd = function (peerId, candidate) {
  var _this = this;
  var candidateId = candidate.candidate.split(' ')[0];

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring remote candidate received as session does not exists']);
    return;
  }

  // Start adding remote ICE candidate
  var remoteSessionDescription = _this._peers[peerId].peer.remoteDescription;

  log.debug([peerId, 'Peer', candidateId, 'Received remote candidate ->'], candidate);

  // Check if remote RTCSessionDescription is received first, if not queue
  if (!(remoteSessionDescription && !!remoteSessionDescription.sdp)) {
    log.debug([peerId, 'Peer', candidateId, 'Queueing remote candidate received as remote description is not received yet']);

    _this._peers[peerId].ICEStatus.candidates.incoming.queue.push(candidate);
    return;
  }

  if (!_this._peerCandidateFilter(candidate)) {
    log.warn([peerId, 'Peer', candidateId, 'Dropping received remote candidate as it does not match filters of "' +
      _this._user.session.ICE.useCandidates.current.join(',') + '" types ->'], candidate);
    return;
  }

  log.debug([peerId, 'Peer', candidateId, 'Adding received remote candidate ->'], candidate);

  // Add remote RTCIceCandidate
  _this._peers[peerId].peer.addIceCandidate(candidate, function () {
    // RTCIceCandidate added successfully
    log.debug([peerId, 'Peer', candidateId, 'Added received remote candidate successfully']);

    _this._peers[peerId].ICEStatus.candidates.incoming.success.push(candidate);

  }, function (error) {
    // RTCIceCandidate failed adding
    log.error([peerId, 'Peer', candidateId, 'Failed adding received remote candidate ->'], error);

    _this._peers[peerId].ICEStatus.candidates.incoming.failed.push(candidate);
  });
};

/**
 * Sends the local RTCIceCandidate generated.
 * @method _peerCandidateSend
 * @param {String} peerId The Peer session ID.
 * @param {RTCIceCandidate} candidate The local RTCIceCandidate generated.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCandidateSend = function (peerId, candidate) {
  var _this = this;

  // Check if candidate has generation is complete yet
  if (!candidate.candidate) {
    log.debug([peerId, 'Peer', null, 'Generation of local candidates has been completed']);

    _this._peers[peerId].ICEStatus.candidates.completed = true;

    // If ICE trickle is disabled, then send the local RTCSessionDescription object
    if (!_this._peers[peerId].connection.trickleICE) {
      var sessionDescription = _this._peers[peerId].peer.localDescription;

      log.debug([peerId, 'Peer', null, 'Sending delayed local sessionDescription ->'], sessionDescription);

      // Send the local offer RTCSessionDescription
      if (sessionDescription.type === 'offer') {
        _this._messageConstructOffer(peerId, sessionDescription);

      // Send the local answer RTCSessionDescription
      } else {
        _this._messageConstructAnswer(peerId, sessionDescription);
      }
    }
    return;
  }

  var candidateId = candidate.candidate.split(' ')[0];

  log.debug([peerId, 'Peer', candidateId, 'Generated local candidate ->'], candidate);

  if (!_this._peerCandidateFilter(candidate)) {
    log.warn([peerId, 'Peer', candidateId, 'Dropping generated local candidate as it does not match filters of "' +
      _this._user.session.ICE.useCandidates.current.join(',') + '" types ->'], candidate);
    return;
  }

  // Push the current reference
  _this._peers[peerId].ICEStatus.candidates.outgoing.push(candidate);

  // Send the "candidate" message
  _this._messageConstructCandidate(peerId, candidate);
};

/**
 * Adds all queued RTCIceCandidates.
 * @method _peerCandidateAddQueued
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCandidateAddQueued = function (peerId) {
  var _this = this;

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring adding queued candidates as session does not exists']);
    return;
  }

  _this._peers[peerId].ICEStatus.candidates.incoming.queue.forEach(function (candidate) {

    log.debug([peerId, 'Peer', candidateId, 'Popped queued remote candidate ->'], candidate);

    _this._peerCandidateAdd(peerId, candidate);
  });

  _this._peers[peerId].ICEStatus.candidates.incoming.queue = [];
};