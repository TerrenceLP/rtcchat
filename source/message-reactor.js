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

  // For type -> "group"
  } else if (message.type === 'group') {
    _this._messageReactToGroup(message);

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

  _this._roomReactToConnect(message.sid, message.tieBreaker, message.pc_config.iceServers);
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

  // Construct the Peer session for this Peer
  _this._peerCreate(message.mid, message);

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

  // Construct the Peer session for this Peer
  _this._peerCreate(message.mid, message);

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

  _this._peerReconnect(message.mid, message.hardRestart, message.iceRestart, false);

  // Firefox does not support ICE restart yet so resend the message
  if (_this._user.agent.name === 'firefox' && message.iceRestart) {
    // Send the "restart" message again because it's not meant to be
    _this._messageConstructRestart(message.mid, true, false);
    return;
  }

  // Check if Peer should start offer first
  if (_this._user.session.tieBreaker > message.tieBreaker) {
    _this._peerConnectHandshakeOffer(message.mid, message.iceRestart);
    return;
  }

  // Send the "restart" message again because it's not meant to be
  _this._messageConstructRestart(message.mid, false, message.iceRestart);
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

  _this._peerConnectHandshakeAnswer(message.mid, new RTCSessionDescription({
    type: 'offer',
    sdp: message.sdp
  }));
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

  _this._peerConnectHandshakeComplete(message.mid, new RTCSessionDescription({
    type: 'answer',
    sdp: message.sdp
  }));
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

  _this._peerCandidateAdd(message.mid, new RTCIceCandidate({
    sdpMid: message.sdpMid,
    sdpMLineIndex: message.sdpMLineIndex,
    candidate: message.candidate
  }));
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

  _this._peerUpdateData(message.mid, message.data);
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

  _this._peerUpdateStream(message.mid, message.stream);
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

  _this._roomReactToLock(message.mid, message.lock);
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

  _this._roomReactToMessage(message.mid, message.message, false);
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

  _this._roomReactToMessage(message.mid, message.message, true);
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

  _this._roomReactToServerAction(message.action, message.reason, message.info);
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

  _this._peerDestroy(message.mid);
};

/**
 * Reacts to message type "group".
 * @method _messageReactToGroup
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageReactToGroup = function (message) {
  // NOTE: For those who never follow the protocol, I dont care :(
  message.lists.foreach(function (messageItem) {
    _this._messageReactRouter(JSON.parse(messageItem));
  });
};

