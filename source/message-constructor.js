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
 * Constructs the message type "group".
 * @method _messageConstructGroup
 * @param {Array} list The list of queued messages.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._messageConstructGroup = function (list) {
  var _this = this;
  var stringifiedList = [];

  list.forEach(function (item) {
    stringifiedList.push(JSON.stringify(item));
  });

  _this._socketSendMessage({

    // Message type
    type: 'group',

    // Room credentials
    mid: _this._user.session.id,
    rid: _this._room.session.data.room_key,

    // "group" information
    lists: stringifiedList

  });
};