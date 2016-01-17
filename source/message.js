/**
 * Constructs the message type "joinRoom".
 * @method _messageConstructJoinRoom
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructJoinRoom = function () {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'joinRoom',

    // Room credentials
    rid: _this._room.session.data.room_key,

    // "joinRoom" information
    uid: _this._room.session.data.username,
    cid: _this._room.session.data.cid,
    userCred: _this._room.session.data.userCred,
    timeStamp: _this._room.session.data.timeStamp,
    apiOwner: _this._room.session.data.apiOwner,
    roomCred: _this._room.session.data.roomCred,
    start: _this._room.session.data.start,
    len: _this._room.session.data.len,
    // Default to false if undefined
    isPrivileged: _this._privileged.privileged,
    // Default to true if undefined
    autoIntroduce: _this._privileged.autoIntroduce

  });
};

/**
 * Constructs the message type "enter".
 * @method _messageConstructEnter
 * @param {String} peerId The target Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructEnter = function (peerId) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'enter',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // Target Peer session ID
    target: peerId,

    // "enter" information
    user: {
      agent: {
        name: _this._user.agent.name,
        version: _this._user.agent.version,
        os: _this._user.agent.os
      },
      data: _this._user.data
    },
    stream: null,
    connection: {
      trickleICE: _this._room.config.current.enableIceTrickle,
      dataChannel: _this._room.config.current.enableDataChannel,
      stereo: _this._user.session.stereo
    },
    tieBreaker: _this._user.session.tieBreaker

  });
};

/**
 * Constructs the message type "welcome".
 * @method _messageConstructWelcome
 * @param {String} peerId The target Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructWelcome = function (peerId) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'welcome',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // Target Peer session ID
    target: peerId,

    // "welcome" information
    user: {
      agent: {
        name: _this._user.agent.name,
        version: _this._user.agent.version,
        os: _this._user.agent.os
      },
      data: _this._user.data
    },
    stream: null,
    connection: {
      trickleICE: _this._room.config.current.enableIceTrickle,
      dataChannel: _this._room.config.current.enableDataChannel,
      stereo: _this._user.session.stereo
    },
    tieBreaker: _this._user.session.tieBreaker

  });
};

/**
 * Constructs the message type "restart".
 * @method _messageConstructRestart
 * @param {String} peerId The target Peer session ID.
 * @param {Boolean} hardRestart The flag that indicates if Peer connection should
 *   be constructed again.
 * @param {Boolean} iceRestart The flag that indicates if Peer connection should
 *   ICE restart.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructRestart = function (peerId, hardRestart, iceRestart) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'restart',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // Target Peer session ID
    target: peerId,

    // "restart" information
    user: {
      agent: {
        name: _this._user.agent.name,
        version: _this._user.agent.version,
        os: _this._user.agent.os
      },
      data: _this._user.data
    },
    stream: null,
    connection: {
      trickleICE: _this._room.config.current.enableIceTrickle,
      dataChannel: _this._room.config.current.enableDataChannel,
      stereo: _this._user.session.stereo
    },
    tieBreaker: _this._user.session.tieBreaker,
    hardRestart: hardRestart === true,
    iceRestart: iceRestart === true

  });
};

/**
 * Constructs the message type "offer".
 * @method _messageConstructOffer
 * @param {String} peerId The target Peer session ID.
 * @param {RTCSessionDescription} sessionDescription The local offer RTCSessionDescription object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructOffer = function (peerId, sessionDescription) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'offer',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // Target Peer session ID
    target: peerId,

    // "offer" information
    sdp: sessionDescription.sdp

  });
};

/**
 * Constructs the message type "answer".
 * @method _messageConstructOffer
 * @param {String} peerId The target Peer session ID.
 * @param {RTCSessionDescription} sessionDescription The local answer RTCSessionDescription object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructAnswer = function (peerId, sessionDescription) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'answer',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // Target Peer session ID
    target: peerId,

    // "offer" information
    sdp: sessionDescription.sdp

  });
};

/**
 * Constructs the message type "candidate".
 * @method _messageConstructCandidate
 * @param {String} peerId The target Peer session ID.
 * @param {RTCIceCandidate} candidate The local generated RTCIceCandidate object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructCandidate = function (peerId, candidate) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'candidate',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // Target Peer session ID
    target: peerId,

    // "candidate" information
    sdpMLineIndex: candidate.sdpMLineIndex,
    sdpMid: candidate.sdpMid,
    candidate: candidate.candidate

  });
};

/**
 * Constructs the message type "updateUserEvent".
 * @method _messageConstructUpdateUserEvent
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructUpdateUserEvent = function () {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'updateUserEvent',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // "updateUserEvent" information
    data: _this._user.data

  });
};

/**
 * Constructs the message type "roomLockEvent".
 * @method _messageConstructRoomLockEvent
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructRoomLockEvent = function () {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'roomLockEvent',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // "roomLockEvent" information
    lock: _this._room.locked

  });
};

/**
 * Constructs the message type "public".
 * @method _messageConstructPublic
 * @param {Any} message The custom message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructPublic = function (message) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'public',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // "public" information
    message: message

  });
};

/**
 * Constructs the message type "private".
 * @method _messageConstructPrivate
 * @param {String} peerId The target Peer session ID.
 * @param {Any} message The custom message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructPrivate = function (peerId, message) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'private',

    // Target Peer session ID
    target: peerId,

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // "public" information
    message: message

  });
};

/**
 * Constructs the message type "getPeers".
 * @method _messageConstructGetPeers
 * @param {Boolean} showAll The flag that indicates if returned list should
 *   also include privileged and standard in the list.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructGetPeers = function (showAll) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'getPeers',

    // "getPeers" information
    privilegedKey: _this._room.config.current.appKey,
    parentKey: _this._privileged.parentKey,
    showAll: showAll === true

  });
};

/**
 * Constructs the message type "introduce".
 * @method _messageConstructIntroduce
 * @param {String} sendingPeerId The Peer session ID who
 *   initiates the connection with the introduced Peer.
 * @param {String} receivingPeerId The Peer session ID of the
 *   introduced peer who would be introduced to the initiator Peer.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructIntroduce = function (sendingPeerId, receivingPeerId) {
  var _this = this;

  _this._socketSendMessage({

    // Message type
    type: 'introduce',

    // "introduce" information
    sendingPeerId: sendingPeerId,
    receivingPeerId: receivingPeerId

  });
};

/**
 * Routes the message object received to the reactor.
 * @method _messageReactRouter
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactRouter = function (message) {
  var _this = this;

  // For type -> "inRoom"
  if (message.type === 'inRoom') {
    _this._messageReactToInRoom(message);

  // For type -> "enter"
  } else if (message.type === 'enter') {
    _this._messageReactToEnter(message);

  // For type -> "welcome"
  } else if (message.type === 'welcome') {
    _this._messageReactToWelcome(message);

  // For type -> "restart"
  } else if (message.type === 'restart') {
    _this._messageReactToRestart(message);

  // For type -> "offer"
  } else if (message.type === 'offer') {
    _this._messageReactToOffer(message);

  // For type -> "answer"
  } else if (message.type === 'answer') {
    _this._messageReactToAnswer(message);

  // For type -> "candidate"
  } else if (message.type === 'candidate') {
    _this._messageReactToCandidate(message);

  // For type -> "updateUserEvent"
  } else if (message.type === 'updateUserEvent') {
    _this._messageReactToUpdateUserEvent(message);

  // For type -> "stream"
  } else if (message.type === 'stream') {
    _this._messageReactToStream(message);

  // For type -> "roomLockEvent"
  } else if (message.type === 'roomLockEvent') {
    _this._messageReactToRoomLockEvent(message);

  // For type -> "peerList"
  } else if (message.type === 'peerList') {
    _this._messageReactToPeerList(message);

  // For type -> "introduceError"
  } else if (message.type === 'introduceError') {
    _this._messageReactToIntroduceError(message);

  // For type -> "approach"
  } else if (message.type === 'approach') {
    _this._messageReactToApproach(message);

  // For type -> "redirect"
  } else if (message.type === 'redirect') {
    _this._messageReactToRedirect(message);

  // For type -> "bye"
  } else if (message.type === 'bye') {
    _this._messageReactToBye(message);

  // For type that does not exists
  } else {
    log.warn([message.mid, 'Room', message.type, 'Ignoring message received as it is unknown ->'], message);
  }
};

/**
 * Reacts to the message type "inRoom".
 * @method _messageReactToInRoom
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToInRoom = function (message) {
  var _this = this;

  _this._user.session.id = message.sid;
  _this._user.session.tieBreaker = (new Date ()).getTime();
  _this._user.session.ICE.useCandidates.current = _this._user.session.ICE.useCandidates.default;

  if (typeof message.tieBreaker === 'number') {
    _this._user.session.tieBreaker = message.tieBreaker;
  }

  // Firefox connections should always be the answerer with other types of agents
  if (_this._user.agent.name === 'firefox') {
    _this._user.session.tieBreaker -= 100000000000;
  }

  // Parse the ICE servers
  if (message.pc_config && Array.isArray(message.pc_config.iceServers)) {
    _this._user.session.ICE.servers = message.pc_config.iceServers;
  }

  // Set the ICE candidates if relay if force set
  if (_this._room.config.current.forceTURN) {
    _this._user.session.ICE.useCandidates.current = ['relay'];
  }


  _this._messageConstructEnter(null);
};

/**
 * Reacts to message type "enter".
 * @method _messageReactToEnter
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToEnter = function (message) {
  var _this = this;

  // Check if Peer session exists, if not create it
  if (!_this._peers[message.mid]) {
    // Construct the Peer session for this Peer
    _this._peerCreate(message.mid, message);
  }

  // Send "welcome" message
  _this._messageConstructWelcome(message.mid);
};

/**
 * Reacts to message type "welcome".
 * @method _messageReactToWelcome
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToWelcome = function (message) {
  var _this = this;

  // Check if Peer session exists, if not create it
  if (!_this._peers[message.mid]) {
    // Construct the Peer session for this Peer
    _this._peerCreate(message.mid, message);
  }

  // Check if Peer should start offer first
  if (_this._user.session.tieBreaker > message.tieBreaker) {
    _this._peerConnectHandshakeOffer(message.mid, false);
    return;
  }

  // Send the "welcome" message again because it's not meant to be
  _this._messageConstructWelcome(message.mid);
};

/**
 * Reacts to message type "restart".
 * @method _messageReactToRestart
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToRestart = function (message) {
  var _this = this;

  // Check if Peer session exists, if not create it
  if (!_this._peers[message.mid]) {
    log.debug([message.mid, 'Peer', null, 'Ignoring reconnection request as session does not exists']);
    return;
  }

  if (_this._peers[message.mid].connection.dead) {
    log.debug([message.mid, 'Peer', null, 'Ignoring reconnection request as session is dead']);
    return;
  }

  // Check if Peer connection exists, if not create it
  if (!_this._peers[message.mid].peer) {
    log.debug([message.mid, 'Peer', null, 'Constructing connection for request as it does not exists']);
    _this._peerConnect(message.mid);

  // Check if Peer connection requires construction again
  } else if (message.hardRestart) {
    log.debug([message.mid, 'Peer', null, 'Reconstructing connection from request']);
    _this._peerDisconnect(message.mid);
    _this._peerConnect(message.mid);

  }

  // Check if Peer should start offer first
  if (_this._user.session.tieBreaker > message.tieBreaker) {
    _this._peerConnectHandshakeOffer(message.mid, message.iceRestart);
    _this._peerConnectMonitor(message.mid);
    return;
  }

  // Send the "restart" message again because it's not meant to be
  _this._messageConstructRestart(message.mid, false, message.iceRestart);
  _this._peerConnectMonitor(message.mid);

  _this._trigger('peerRestart', message.mid, _this.getPeerInfo(message.mid), false);
};

/**
 * Reacts to message type "offer".
 * @method _messageReactToOffer
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToOffer = function (message) {
  var _this = this;
  var offer = new RTCSessionDescription({
    type: 'offer',
    sdp: message.sdp
  });

  // Check if Peer session exists
  if (!_this._peers[message.mid]) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring remote offer received as Peer does not have existing session ->'], offer);
    return;
  }

  // Check if Peer connection exists
  if (!_this._peers[message.mid].peer) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring remote offer received as Peer does not have existing connection ->'], offer);
    return;
  }

  _this._peerConnectHandshakeAnswer(message.mid, offer);
};

/**
 * Reacts to message type "answer".
 * @method _messageReactToAnswer
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToAnswer = function (message) {
  var _this = this;
  var answer = new RTCSessionDescription({
    type: 'answer',
    sdp: message.sdp
  });

  // Check if Peer session exists
  if (!_this._peers[message.mid]) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring remote answer received as Peer does not have existing session ->'], answer);
    return;
  }

  // Check if Peer connection exists
  if (!_this._peers[message.mid].peer) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring remote answer received as Peer does not have existing connection ->'], answer);
    return;
  }

  _this._peerConnectHandshakeComplete(message.mid, answer);
};

/**
 * Reacts to message type "candidate".
 * @method _messageReactToCandidate
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToCandidate = function (message) {
  var _this = this;
  var candidate = new RTCIceCandidate({
    sdpMid: message.sdpMid,
    sdpMLineIndex: message.sdpMLineIndex,
    candidate: message.candidate
  });

  // Check if Peer session exists
  if (!_this._peers[message.mid]) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring remote candidate received as Peer does not have existing session ->'], candidate);
    return;
  }

  // Check if Peer connection exists
  if (!_this._peers[message.mid].peer) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring remote candidate received as Peer does not have existing connection ->'], candidate);
    return;
  }

  _this._peerConnectAddCandidate(message.mid, candidate);
};

/**
 * Reacts to message type "updateUserEvent".
 * @method _messageReactToUpdateUserEvent
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToUpdateUserEvent = function (message) {
  var _this = this;

  // Check if Peer session exists
  if (!_this._peers[message.mid]) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring updated data received as Peer does not have existing session ->'], message.data);
    return;
  }

  log.debug([message.mid, 'Peer', null, 'Custom data has been updated ->'], message.data);

  _this._peers[message.mid].data = message.data;

  _this._trigger('peerUpdated', message.mid, _this.getPeerInfo(message.mid), false);
};

/**
 * Reacts to message type "stream".
 * @method _messageReactToStream
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToStream = function (message) {
  var _this = this;

  // Check if Peer session exists
  if (!_this._peers[message.mid]) {
    log.warn([message.mid, 'Peer', null,
      'Ignoring updated stream received as Peer does not have existing session ->'], message.stream);
    return;
  }

  log.debug([message.mid, 'Peer', null, 'Stream information has been updated ->'], message.stream);

  _this._peers[message.mid].stream = message.stream;

  //_this._trigger('streamEnded', message.mid, _this.getPeerInfo(message.mid), false);
  //_this._trigger('streamMuted', message.mid, _this.getPeerInfo(message.mid), false);
};

/**
 * Reacts to message type "roomLockEvent".
 * @method _messageReactToRoomLockEvent
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToRoomLockEvent = function (message) {
  var _this = this;

  // Check if Room session exists
  if (!_this._room.connected) {
    log.warn([message.mid, 'Room', _this._room.name,
      'Ignoring lock status received as user is not connected in Room ->'], message.lock);
    return;
  }

  log.debug([message.mid, 'Room', _this._room.name, 'Lock status updated ->'], message.lock);

  _this._room.locked = message.lock === true;

  _this._trigger('roomLock', message.lock, message.mid, _this.getPeerInfo(message.mid), false);
};

/**
 * Reacts to message type "public".
 * @method _messageReactToPublic
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToPublic = function (message) {
  var _this = this;

  // Check if Room session exists
  if (!_this._room.connected) {
    log.warn([message.mid, 'Room', _this._room.name,
      'Ignoring public message received as user is not connected in Room ->'], message.message);
    return;
  }

  log.debug([message.mid, 'Room', _this._room.name, 'Received public message ->'], message.message);

  this._trigger('incomingMessage', {

    content: message.message,
    isPrivate: false,
    targetPeerId: null,
    isDataChannel: false,
    senderPeerId: message.mid

  }, message.mid, this.getPeerInfo(message.mid), false);
};

/**
 * Reacts to message type "private".
 * @method _messageReactToPrivate
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToPrivate = function (message) {
  var _this = this;

  // Check if Room session exists
  if (!_this._room.connected) {
    log.warn([message.mid, 'Room', _this._room.name,
      'Ignoring private message received as user is not connected in Room ->'], message.message);
    return;
  }

  log.debug([message.mid, 'Room', _this._room.name, 'Received private message ->'], message.message);

  this._trigger('incomingMessage', {

    content: message.message,
    isPrivate: true,
    targetPeerId: message.target,
    isDataChannel: false,
    senderPeerId: message.mid

  }, message.mid, this.getPeerInfo(message.mid), false);
};

/**
 * Reacts to message type "peerList".
 * @method _messageReactToPeerList
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToPeerList = function (message) {
  var _this = this;

  log.debug([null, 'Room', _this._room.name, 'Received list of rooms peers ->'], message.result);

  _this._privileged.session.roomPeers = message.result;

  _this._trigger('getPeersStateChange', _this.GET_PEERS_STATE.RECEIVED,
    _this._user.session.id, message.result);
};

/**
 * Reacts to message type "introduceError".
 * @method _messageReactToIntroduceError
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToIntroduceError = function (message) {
  var _this = this;
  var introduceError = new Error(message.reason);

  log.log([null, 'Room', _this._room.name, 'Failed introducing peer "' +
    message.sendingPeerId + '" to "' + message.receivingPeerId + '" ->'], introduceError);

  _this._trigger('introduceStateChange', _this.INTRODUCE_STATE.ERROR, _this._user.session.id,
    message.sendingPeerId, message.receivingPeerId, introduceError);
};

/**
 * Reacts to message type "approach".
 * @method _messageReactToApproach
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToApproach = function (message) {
  var _this = this;

  log.debug([message.target, 'Peer', null, 'Received request to approach Peer']);

  _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ENTER, _this._user.session.id);

  _this._messageConstructEnter(message.target);
};

/**
 * Reacts to message type "redirect".
 * @method _messageReactToRedirect
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToRedirect = function (message) {
  var _this = this;
  var redirectError = new Error(message.info);

  if (message.reason === _this.SYSTEM_ACTION_REASON.ROOM_LOCKED) {
    _this._room.locked = true;
  }

  if (message.action === _this.SYSTEM_ACTION.REJECT) {
    log.warn([null, 'Room', _this._room.name, 'Rejection from server ->'], redirectError);

  } else {
    log.warn([null, 'Room', _this._room.name, 'Warning from server ->'], redirectError);
  }

  _this._trigger('systemAction', message.action, redirectError, message.reason);

  // Clear all connections
  objForEach(_this._peers, function (peer, peerId) {
    _this._peerDestroy(peerId);
  });
};

/**
 * Reacts to message type "bye".
 * @method _messageReactToBye
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToBye = function (message) {
  var _this = this;

  log.debug([message.mid, 'Peer', null, 'Destroying peer session']);

  _this._peerDestroy(message.mid);
};


