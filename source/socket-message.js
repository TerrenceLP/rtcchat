/**
 * Sends a message with the signaling connection.
 * @method _socketSendMessage
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketSendMessage = function(passedMessage) {
  var _this = this;

  // Handles sending the socket message
  var messageFn = function (message) {
    if (!_this._socket.socket) {
      log.warn([null, 'Socket', _this._room.name,
        'Dropping message as connection is not yet initialized ->'], message);
      return;
    }

    if (!_this._socket.connected) {
      log.warn([null, 'Socket', _this._room.name,
        'Dropping message as connection is not yet connected ->'], message);
      return;
    }

    log.debug([null, 'Socket', _this._room.name, 'Sending message ->'], message);

    // Normal case when messages are sent not so rapidly
    var messageString = JSON.stringify(message);

    _this._socket.socket.send(messageString);
  };

  // Handles delaying the message interval
  var delayMessageIntervalFn = function () {
    // Check if there is any queue current
    if (_this._socket.messaging.queue.length > 0) {
      var data = _this._socket.messaging.queue[0];

      // Check if queue length is lesser than throughput
      if (_this._socket.messaging.queue.length < _this._socket.messaging.throughput) {
        var delayedMessages = _this._socket.messaging.queue.splice(0, _this._socket.messaging.queue.length);

        log.debug([null, 'Socket', _this._room.name, 'Sending delayed messages ->'], delayedMessages);

        // NOTE: What happens when one message rid is different :o
        _this._messageConstructGroup(delayedMessages);

        clearTimeout(_this._socket.messaging.timer);

        _this._socket.messaging.timer = null;

      // Splice and send based on the throughput
      } else {
        var delayedFirst16Messages = _this._socket.messaging.queue.splice(0, _this._socket.messaging.throughput);

        log.debug([null, 'Socket', _this._room.name, 'Sending delayed (first 16) messages ->'], delayedFirst16Messages);

        _this._messageConstructGroup(delayedFirst16Messages);

        // To send later after sending the first 16
        clearTimeout(_this._socket.messaging.timer);

        _this._socket.messaging.timer = null;
        _this._socket.messaging.timer = setTimeout(delayMessageIntervalFn, _this._socket.messaging.interval);
      }

      _this._socket.messaging.timestamp = Date.now() || function() {
        return +new Date();
      };
    }
  };

  // For group messages, just don't hestiate and send
  if (passedMessage.type === 'group') {
    messageFn(passedMessage);
    return;
  }

  // For non-group messages, delay when messages are sent too rapidly for broadcasted messages
  if ((Date.now() || function() {
      return +new Date();
    }) - _this._socket.messaging.timestamp < _this._socket.messaging.interval &&
    _this._socket.messaging.typesToQueue.indexOf(passedMessage.type) > -1) {

    log.warn([null, 'Socket', _this._room.name, 'Messages has been fired too rapidly. Delaying messages with queue']);

    _this._socket.messaging.queue.push(passedMessage);

    // Create the timer when it doesn't exists
    if (!_this._socket.messaging.timer) {
      _this._socket.messaging.timer = setTimeout(delayMessageIntervalFn,
        _this._socket.messaging.interval - ((Date.now() || function() {
          return +new Date();
        }) - _this._socket.messaging.timestamp));
    }
    return;
  }

  messageFn(passedMessage);

  // Append the timestamp for delay
  _this._socket.messaging.timestamp = Date.now() || function() {
    return +new Date();
  };
};

/**
 * Send a message object or string using the platform signaling socket connection
 *   to the list of targeted PeerConnections.
 * To send message objects with DataChannel connections, see
 *   {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}}.
 * @method sendMessage
 * @param {String|JSON} message The message object.
 * @param {String|Array} [targetPeerId] The array of targeted PeerConnections to
 *   transfer the message object to. Alternatively, you may provide this parameter
 *   as a string to a specific targeted Peer to transfer the message object.
 * @example
 *   // Example 1: Send to all peers
 *   SkylinkDemo.sendMessage("Hi there!"");
 *
 *   // Example 2: Send to a targeted peer
 *   SkylinkDemo.sendMessage("Hi there peer!", targetPeerId);
 * @trigger incomingMessage
 * @component Message
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.sendMessage = function(message, targetPeerId) {
  var _this = this;
  var listOfPeers = Object.keys(this._peerSessions);
  var isPrivate = false;

  // Check if message object is defined first
  if (typeof message === 'undefined' || message === null) {
    throw new Error('Failed sending message as message object is empty');
  }

  // Parse the listOfPeers expected to receive the message and if it's a targeted (private) message
  if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;

  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  // Send the targeted message to Peer
  if (isPrivate) {
    listOfPeers.forEach(function (peerId) {
      _this._messageConstructPrivate(message, peerId);
    });
  // Broadcast the message to other Peers
  } else {
    _this._messageConstructPublic(message);
  }

  // Trigger this event
  _this._trigger('incomingMessage', {

    content: message,
    isPrivate: isPrivate,
    targetPeerId: targetPeerId,
    isDataChannel: false,
    senderPeerId: this._user.session.id

  }, this._user.session.id, this.getPeerInfo(), true);
};