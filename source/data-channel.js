/**
 * Starts the Channel connection
 * @method _channelCreate
 * @param {String} peerId The Peer session ID.
 * @param {RTCDataChannel|String} channel The RTCDataChannel object received or Channel ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelCreate = function (peerId, passedChannel) {
  var _this = this;
  var channel = null;
  var channelId = null;

  if (typeof passedChannel === 'string') {
    channelId = passedChannel;
  } else {
    channelId = passedChannel.label;
    channel = passedChannel;
  }

  // Check if Peer session exists
  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Channel', channelId, 'Ignoring connection initialization as Peer session does not exists ->'], passedChannel);
    return;
  }

  // Check if we should allow override of Channel session. Only "main" type of Channels can be reconnected
  if (_this._peers[peerId].channels[channelId] && channelId !== 'main') {
    log.warn([peerId, 'Channel', channelId, 'Ignoring connection initialization as connection already exists ->'], passedChannel);
    return;
  }

  var channelType = _this.DATA_CHANNEL_TYPE.DATA;

  if (channelId === 'main') {
    channelType = _this.DATA_CHANNEL_TYPE.MESSAGING;
  }

  if (!channel) {
    // TCP semantics
    var options = {
      ordered: true,
      // protocol: "",
      // id: "",
      // negotiated: false
    };

    if (!_this._peers[peerId].connection.reliableTransfers) {
      // UDP semantics
      options = {
        ordered: false // do not guarantee order
        //maxRetransmitTime: 3000 // in milliseconds
        //maxRetransmits: 5
      };

      log.warn([peerId, 'Channel', channelId, 'Connection is unreliable and may result in unordered transfers']);

    } else {
      log.warn([peerId, 'Channel', channelId, 'Connection is reliable and may result in slower transfers']);
    }

    try {
      channel = _this._peers[peerId].peer.createDataChannel(channelId, options);
    } catch (error) {
      log.error([peerId, 'Channel', channelId, 'Failed to initialize connection ->'], error);

      _this._trigger('dataChannelState', _this.DATA_CHANNEL_STATE.ERROR, peerId, error, channelId, channelType);
      return;
    }
  }

  _this._peers[peerId].channels[channelId] = {
    channel: channel,
    transfer: null
  };

  // RTCDataChannel.onopen event
  _this._peers[peerId].channels[channelId].channel.onopen = _this._channelReactToOnopen(peerId, channelId, channelType);

  // RTCDataChannel.onclose event
  _this._peers[peerId].channels[channelId].channel.onclose = _this._channelReactToOnclose(peerId, channelId, channelType);

  // RTCDataChannel.onclosing event
  _this._peers[peerId].channels[channelId].channel.onclosing = _this._channelReactToOnclosing(peerId, channelId, channelType);

  // RTCDataChannel.onmessage event
  _this._peers[peerId].channels[channelId].channel.onmessage = _this._channelReactToOnmessage(peerId, channelId, channelType);

  // RTCDataChannel.onerror event
  _this._peers[peerId].channels[channelId].channel.onerror = _this._channelReactToOnerror(peerId, channelId, channelType);

  // RTCDataChannel.onerror event
  _this._peers[peerId].channels[channelId].channel.onbufferedamountlow = _this._channelReactToOnbufferedamountlow(peerId, channelId, channelType);

  log.debug([peerId, 'Channel', channelId, 'Connection has been initialized']);
};

/**
 * Reacts to the RTCDataChannel.onopen event.
 * @method _channelReactToOnopen
 * @param {String} peerId The Peer session ID.
 * @param {String} channelId The Channel ID.
 * @param {String} channelType The Channel type.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelReactToOnopen = function (peerId, channelId, channelType) {
  var _this = this;

  var handler = function () {
    log.debug([peerId, 'Channel', channelId, 'Connection readyState ->'], 'open');

    _this._trigger('dataChannelState', _this.DATA_CHANNEL_STATE.OPEN, peerId, null, channelId, channelType);
  };

  var currentState = _this._peers[peerId].channels[channelId].channel.readyState;

  if (currentState === 'open') {
    // NOTE: the datachannel was not defined in array before it was triggered
    // set a timeout to allow the dc objec to be returned before triggering "open"
    setTimeout(handler, 500);
    return null;
  }

  _this._trigger('dataChannelState', currentState, peerId, null, channelId, channelType);

  return handler;
};

/**
 * Reacts to the RTCDataChannel.onclose event.
 * @method _channelReactToOnclose
 * @param {String} peerId The Peer session ID.
 * @param {String} channelId The Channel ID.
 * @param {String} channelType The Channel type.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelReactToOnclose = function (peerId, channelId, channelType) {
  var _this = this;

  return function () {
    log.debug([peerId, 'Channel', channelId, 'Connection readyState ->'], 'closed');

    _this._trigger('dataChannelState', _this.DATA_CHANNEL_STATE.CLOSED, peerId, null, channelId, channelType);

    // Check if we should revive RTCDataChannel connection
    if (channelId === 'main') {
      // Check if Peer session exists
      if (_this._peerCheckExists(peerId)) {
        log.debug([peerId, 'Channel', channelId, 'Ignoring reconnection of main connection as Peer session does not exists']);
        return;
      }

      if (_this._peers[peerId].peer.signalingState !== 'closed') {
        _this._channelCreate(peerId, channelId);
      }
    }
  };
};

/**
 * Reacts to the RTCDataChannel.onclosing event.
 * @method _channelReactToOnclosing
 * @param {String} peerId The Peer session ID.
 * @param {String} channelId The Channel ID.
 * @param {String} channelType The Channel type.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelReactToOnclosing = function (peerId, channelId, channelType) {
  var _this = this;

  return function () {
    log.debug([peerId, 'Channel', channelId, 'Connection readyState ->'], 'closing');

    _this._trigger('dataChannelState', _this.DATA_CHANNEL_STATE.CLOSING, peerId, null, channelId, channelType);
  };
};

/**
 * Reacts to the RTCDataChannel.onmessage event.
 * @method _channelReactToOnmessage
 * @param {String} peerId The Peer session ID.
 * @param {String} channelId The Channel ID.
 * @param {String} channelType The Channel type.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelReactToOnmessage = function (peerId, channelId, channelType) {
  var _this = this;

  return function (event) {
    var message = event.message || event;

    log.debug([peerId, 'Channel', channelId, 'Received P2P message ->'], message);
  };
};

/**
 * Reacts to the RTCDataChannel.onerror event.
 * @method _channelReactToOnerror
 * @param {String} peerId The Peer session ID.
 * @param {String} channelId The Channel ID.
 * @param {String} channelType The Channel type.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelReactToOnerror = function (peerId, channelId, channelType) {
  var _this = this;

  return function (event) {
    var error = event.error || event;

    log.error([peerId, 'Channel', channelId, 'Connection encountered exception ->'], error);

    _this._trigger('dataChannelState', _this.DATA_CHANNEL_STATE.ERROR, peerId, error, channelId, channelType);
  };
};

/**
 * Reacts to the RTCDataChannel.onbufferedamountlow event.
 * @method _channelReactToOnbufferedamountlow
 * @param {String} peerId The Peer session ID.
 * @param {String} channelId The Channel ID.
 * @param {String} channelType The Channel type.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelReactToOnbufferedamountlow = function (peerId, channelId, channelType) {
  var _this = this;

  return function () {
    log.warn([peerId, 'Channel', channelId, 'Connection bufferring is low ->'], {
      amount: _this._peers[peerId].channels[channelId].channel.bufferedAmount,
      amountLowThreshold: _this._peers[peerId].channels[channelId].channel.bufferedAmountLowThreshold
    });

    _this._trigger('dataChannelState', _this.DATA_CHANNEL_STATE.CLOSED, peerId, null, channelId, channelType);
  };
};

/**
 * Stops the Channel connection.
 * @method _channelDestroy
 * @param {String} peerId The Peer session ID.
 * @param {String} [channelId] The Channel ID. If not provided, it closes all Channels.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channelDestroy = function (peerId, channelId) {
  var _this = this;

  if (!_this._peerCheckExists(peerId)) {
    log.warn([peerId, 'Channel', channelId, 'Ignoring destroying of connection as Peer session does not exists']);
    return;
  }

  var channelsToClose = [];

  if (typeof channelId !== 'string') {
    channelsToClose = Object.keys(_this._peers[peerId].channels);
  } else {
    channelsToClose = [channelId];
  }

  channelsToClose.forEach(function (channel, channelItemId) {
    if (!_this._peers[peerId].channels[channelItemId]) {
      log.log([peerId, 'Channel', channelItemId, 'Ignoring destroying of connection as connection does not exists']);
      return;
    }

    if (['closed', 'closing'].indexOf(_this._peers[peerId].channels[channelItemId].channel.readyState) > -1) {
      log.log([peerId, 'Channel', channelItemId, 'Ignoring closing of connection as connection is closed']);
      return;
    }

    log.debug([peerId, 'Channel', channelItemId, 'Connection is closing']);

    channel.channel.close();
  });
};
