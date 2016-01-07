//// HANDLES THE DATA CHANNELS AND TRANSFERS
//// -- PRIVATE METHODS -----------------------------------------------------
function DataChannel (id, channel) {
  this.id = id;
  this.type = id === 'main' ? 'messaging' : 'data';
  this._config = {
    // id: channelId,
    // negotiated: true,
    ordered: true // This sets it as ordered (TCP)
  };

  if (!this.reliable) {
    this._config = {
      maxPacketLifeTime: 3000, // This overrides it to unordered (UDP)
      maxRetransmits: 3, // This overrides it to unordered (UDP)
      ordered: false
    };
  }

  if (channel) {
    this._ref = channel;
    this._listenToEvents();
  }

  // Append event listeners
  SkylinkEvent._mixin(this);
}

/**
 * Stores the DataChannel ID.
 * @attribute id
 */
DataChannel.prototype.id = null;

DataChannel.prototype.reliable = true;

DataChannel.prototype.type = 'data';


DataChannel.prototype._transfers = [];

DataChannel.prototype.open = function (peer) {
  var self = this;

  if (!peer) {
    return console.error('RTCPeerConnection object provided is invalid');
  }

  if (self._ref && self._ref.readyState !== 'closed') {
    return console.warn('RTCDataChannel object is already defined. ' +
      'Does not require opening new RTCDataChannel object session');
  }

  try {
    self._ref = peer.createDataChannel(self.id, self._config);

  } catch (error) {
    console.error('Failed constructing RTCDataChannel object', error);
    self._trigger('error', error);
    return;
  }

  self._listenToEvents();

  console.log('RTCDataChannel constructed successfully');
};

DataChannel.prototype.close = function () {
  var self = this;

  if (self._ref && ['closing', 'closed'].indexOf(self._ref.readyState) === -1) {
    self._ref.close();
    console.log('RTCDataChannel object is closed');
  }
};

DataChannel.prototype.send = function (data) {
  var self = this;

  if (!self._ref) {
    return console.error('RTCDataChannel object is not yet defined');
  }

  if (self._ref.readyState !== 'open') {
    var notReadyError = 'RTCDataChannel object is not yet opened. Unable to send data';
    console.error(notReadyError, self._ref.readyState);
    self._trigger('error', new Error(error));
    return;
  }

  var dataString = data;

  if (typeof data === 'object') {
    dataString = JSON.stringify(data);
  }

  self._ref.send(dataString);

  console.log('RTCDataChannel message has been sent', data);
};

DataChannel.prototype._listenToEvents = function () {
  var self = this;

  // RTCDataChannel.onopen event
  var onopenHandler = function () {
    console.log('RTCDataChannel has been opened');
    self._trigger('open');
  };

  // - If RTCDataChannel object is already opened
  if (self._ref.readyState === 'open') {
    // NOTE: To set a timeout to allow the RTCDataChannel object to be returned before triggering "open"
    // to allow the object to be set in the _channels array list first
    setTimeout(onopenHandler, 500);
  // - Check and wait for RTCDataChannel object to be opened
  } else {
    self._trigger(self._ref.readyState);
    self._ref.onopen = onopenHandler;
  }

  // RTCDataChannel.onmessage event
  self._ref.onmessage = function(event) {
    var data = event.data || event;
    console.debug('RTCDataChannel onmessage event triggered', data);
    self._trigger('message', data);
  };

  // RTCDataChannel.onbufferedamountlow event
  self._ref.onbufferedamountlow = function(event) {
    console.debug('RTCDataChannel onbufferedamountlow event triggered');
    self._trigger('bufferedamountlow');
  };

  // RTCDataChannel.onerror event
  self._ref.onerror = function(event) {
    console.debug('RTCDataChannel onerror event triggered');
    self._trigger('error', event);
  };

  // RTCDataChannel.onclose event
  self._ref.onclose = function() {
    console.debug('RTCDataChannel onclose event triggered');
    self._trigger('closed');
  };

  console.log('RTCDataChannel events is listened');
};

/**
 * Contains the list of peer RTCDataChannel objects
 * @attribute _channels
 * @param {JSON} (#peerId) Contains the key list of RTCDataChannel objects.
 *   Note that IDs with the value <code>"main"</code> is reserved as the sole
 *   messaging channel.
 * @param {RTCDataChannel} (#peerId).(#channelId) The RTCDataChannel object.
 * @type JSON
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._channels = {};

/**
 * Creates the RTCDataChannel object for peer session.
 * @method _createChannel
 * @param {String} peerId The peer session ID.
 * @param {String} channelId The RTCDataChannel object ID.
 * @type JSON
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._createChannel = function (peerId, channelId) {
  var self = this;

  // Check if peer session RTCPeerConnection object is defined first
  if (!self._peerConnections[peerId]) {
    log.error([peerId, 'RTCDataChannel', channelId,
      'Ignoring creation of RTCDataChannel as peer connection object is missing']);
    return;
  }

  self._channels[peerId][channelId] = new DataChannel(channelId);
  self._listenToChannel(peerId, channelId);
  self._channels[peerId][channelId].open(self._peerConnections[peerId]);

  log.log([peerId, 'RTCDataChannel', channelId, 'Created RTCDataChannel object for peer session']);
};

/**
 * Listens to the RTCDataChannel object events.
 * @method _createChannel
 * @param {String} peerId The peer session ID.
 * @param {String} channelId The RTCDataChannel object ID.
 * @type JSON
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._listenToChannel = function (peerId, channelId) {
  var self = this;

  if (!(self._channels[peerId] && self._channels[peerId][channelId])) {
    return log.error([peerId, 'RTCDataChannel', channelId,
      'Ignoring listening of RTCDataChannel as peer connection object is missing']);
  }

  var channelType = self._channels[peerId][channelId].type;

  self._channels[peerId][channelId].on('message', function () {
    self._dataChannelProtocolHandler(event.data, peerId, channelId, channelType);
  });

  self._channels[peerId][channelId].on('error', function (error) {
    log.error([peerId, 'RTCDataChannel', channelId, 'Exception occurred in datachannel:'], {
      channelType: channelType,
      error: error
    });
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, error,
      channelId, channelType);
  });

  var onstateHandler = function (state) {
    return function () {
      log.log([peerId, 'RTCDataChannel', channelId, 'Current RTCDataChannel readyState'], state);
      self._trigger('dataChannelState', state, peerId, null, channelId, channelType);
    };
  };

  self._channels[peerId][channelId].on('connecting', onstateHandler('connecting'));
  self._channels[peerId][channelId].on('open', onstateHandler('open'));
  self._channels[peerId][channelId].on('closed', onstateHandler('closed'));
  self._channels[peerId][channelId].on('closing', onstateHandler('closing'));

  log.log([peerId, 'RTCDataChannel', channelId, 'RTCDataChannel events listened']);
};

/**
 * Destroys the RTCDataChannel object for peer session.
 * @method _destroyChannel
 * @param {String} peerId The peer session ID.
 * @param {String} channelId The RTCDataChannel object ID.
 * @type JSON
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._destroyChannel = function (peerId, channelId) {
  var self = this;

  // Check if peer session RTCPeerConnection object is defined first
  if (!self._peerConnections[peerId]) {
    log.error([peerId, 'RTCDataChannel', channelId,
      'Ignoring destroying of RTCDataChannel as peer connection object is missing']);
    return;
  }

  if (!self._channels[peerId]) {
    log.error([peerId, 'RTCDataChannel', channelId,
      'Ignoring destroying of RTCDataChannel as datachannel session (list) is missing']);
    return;
  }

  if (!self._channels[peerId][channelId]) {
    log.error([peerId, 'RTCDataChannel', channelId,
      'Ignoring destroying of RTCDataChannel as datachannel session is missing']);
    return;
  }

  self._channels[peerId][channelId].close();
  delete self._channels[peerId][channelId];

  log.log([peerId, 'RTCDataChannel', channelId, 'Destroyed RTCDataChannel object']);
};

/**
 * Sends the RTCDataChannel object for peer session.
 * @method _destroyChannel
 * @param {String} peerId The peer session ID.
 * @param {String} channelId The RTCDataChannel object ID.
 * @type JSON
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._sendChannelData = function (peerId, channelId, data) {
  var self = this;

  if (!(self._channels[peerId] && self._channels[peerId][channelId])) {
    log.error([peerId, 'RTCDataChannel', channelId, 'Ignoring sending of data as ' +
      'RTCDataChannel object session is not found ->'], data);
  }

  if (self._channels[peerId][channelId].readyState !== 'open') {
    var readyState = self._channels[peerId][channelId].readyState;

    log.error([peerId, 'RTCDataChannel', channelKey + '|' + dc.label,
      'Datachannel is not opened'], {
        readyState: readyState,
        type: (data.type || 'DATA'),
        data: data
    });

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR,
      peerId, 'Datachannel is not ready.\nState is: ' + readyState);
    return;
  }

  var dataString = data;

  // For JSON objects
  if (typeof data === 'object') {
    dataString = JSON.stringify(data);
  }

  log.debug([peerId, 'RTCDataChannel', channelId, 'Sending data from RTCDataChannel ->'], data);

  self._channels[peerId][channelId].send(dataString);
};

//// -- PUBLIC METHODS -----------------------------------------------------
/**
 * These are the list of DataChannel connection states that Skylink would trigger.
 * - Some of the state references the [w3c WebRTC Specification Draft](http://w3c.github.io/webrtc-pc/#idl-def-RTCDataChannelState),
 *   except the <code>ERROR</code> state, which is an addition provided state by Skylink
 *   to inform exception during the DataChannel connection with Peers.
 * @attribute DATA_CHANNEL_STATE
 * @type JSON
 * @param {String} CONNECTING <small>Value <code>"connecting"</code></small>
 *   The state when DataChannel is attempting to establish a connection.<br>
 *   This is the initial state when a DataChannel connection is created.
 * @param {String} OPEN <small>Value <code>"open"</code></small>
 *   The state when DataChannel connection is established.<br>
 *   This happens usually after <code>CONNECTING</code> state, or not when DataChannel connection
 *   is from initializing Peer (the one who begins the DataChannel connection).
 * @param {String} CLOSING <small>Value <code>"closing"</code></small>
 *   The state when DataChannel connection is closing.<br>
 *   This happens when DataChannel connection is closing and happens after <code>OPEN</code>.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when DataChannel connection is closed.<br>
 *   This happens when DataChannel connection has closed and happens after <code>CLOSING</code>
 *   (or sometimes <code>OPEN</code> depending on the browser implementation).
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when DataChannel connection have met with an exception.<br>
 *   This may happen during any state not after <code>CLOSED</code>.
 * @readOnly
 * @component DataChannel
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.DATA_CHANNEL_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error'
};

/**
 * These are the types of DataChannel connection that Skylink provides.
 * - Different channels serves different functionalities.
 * @attribute DATA_CHANNEL_TYPE
 * @type JSON
 * @param {String} MESSAGING <small><b>MAIN connection</b> | Value <code>"messaging"</code></small>
 *   This DataChannel connection is used for P2P messaging only, as used in
 *   {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}}.<br>
 * Unless if self connects with Peers connecting from the mobile SDK platform applications,
 *   this connection would be used for data transfers as used in
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}} and
 *   and {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}, which allows
 *   only one outgoing and incoming data transfer one at a time (no multi-transfer support).<br>
 *   This connection will always be kept alive until the Peer connection has ended.
 * @param {String} DATA <small>Value <code>"data"</code></small>
 *   This DataChannel connection is used for a data transfer, as used in
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}}
 *   and {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}.<br>
 * If self connects with Peers with DataChannel connections of this type,
 *   it indicates that multi-transfer is supported.<br>
 *   This connection will be closed once the data transfer has completed or terminated.
 * @readOnly
 * @component DataChannel
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.DATA_CHANNEL_TYPE = {
  MESSAGING: 'messaging',
  DATA: 'data'
};