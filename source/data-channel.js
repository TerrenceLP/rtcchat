//// HANDLES THE DATA CHANNELS AND TRANSFERS
//// -- PRIVATE METHODS -----------------------------------------------------
/**
 * Handles the RTCDataChannel connection and transfers.
 * @class DataChannel
 * @constructor
 * @param {JSON|RTCDataChannel} options The DataChannel connection settings.
 *   This parameter may be provided as a RTCDataChannel object.
 * @param {String} options.id The DataChannel connection ID.
 * @param {Boolean} [options.reliable=true] The flag that indicates if DataChannel
 *   connection should be reliable or not.
 * @param {RTCPeerConnection} options.RTCPeerConnection The RTCPeerConnection object
 *   to start creating the RTCDataChannel object with.
 * @private
 * @since 0.6.8
 * @for DataChannel
 */
function DataChannel (options) {
  // Append event listeners
  SkylinkEvent._mixin(this);

  // Check if object received is a RTCDataChannel object
  if (typeof options.send === 'function') {
    // Configure the ID
    this.id = options.label;
    // Configure the type
    this.type = options.label === 'main' ? 'messaging' : 'data';
    // Configure the reliable mode setting
    this.reliable = !!options.ordered;
    // Configure the _RTCDataChannel object
    this._RTCDataChannel = options;
    // Configure the _RTCDataChannelInit setting
    this._RTCDataChannelInit = null;

    console.debug(this.id, 'Parsed loaded RTCDataChannel object', options);

  } else {
    // Configure the ID
    this.id = options.id;
    // Configure the type
    this.type = options.id === 'main' ? 'messaging' : 'data';
    // Construct the RTCDataChannel object
    this._construct(options.RTCPeerConnection);

    console.debug(this.id, 'Parsed loaded options', options);
  }

  this._listenToEvents();

  if (this.reliable) {
    console.warn(this.id, 'Reliable mode is turned on, hence RTCDataChannel object transfers would be slower');
  }

  console.log(this.id, 'RTCDataChannel object is ready and has been initialized');
}

/**
 * Stores the DataChannel ID.
 * @attribute id
 * @type String
 * @since 0.6.8
 * @for DataChannel
 */
DataChannel.prototype.id = null;

/**
 * Stores the DataChannel reliable mode setting.
 * @attribute reliable
 * @default true
 * @type Boolean
 * @since 0.6.8
 * @for DataChannel
 */
DataChannel.prototype.reliable = true;

/**
 * Stores the DataChannel types.
 * @attribute type
 * @type String
 * @since 0.6.8
 * @for DataChannel
 */
DataChannel.prototype.type = 'data';

/**
 * Stores the RTCDataChannel object.
 * @attribute _RTCDataChannel
 * @type RTCDataChannel
 * @private
 * @since 0.6.8
 * @for DataChannel
 */
DataChannel.prototype._RTCDataChannel = null;

/**
 * Stores the RTCDataChannelInit configuration.
 * @attribute _RTCDataChannelInit
 * @type JSON
 * @private
 * @since 0.6.8
 * @for DataChannel
 */
DataChannel.prototype._RTCDataChannelInit = {
  // id: channelId,
  // negotiated: true,
  ordered: true // This sets it as ordered (TCP)
};

/**
 * Stores the list of DataTransfers.
 * @attribute _transfers
 * @param {DataTransfer} (#index) The DataTransfer object.
 * @type Array
 * @private
 * @since 0.6.8
 * @for DataChannel
 */
DataChannel.prototype._transfers = [];

/**
 * Constructs RTCDataChannel object connection.
 * @method _construct
 * @param {RTCPeerConnection} peer The RTCPeerConnection object to construct the
 *   RTCDataChannel object with.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
DataChannel.prototype._construct = function (peer) {
  var self = this;

  if (!peer) {
    console.error(self.id, 'Aborting construction of RTCDataChannel object as ' +
      'provided RTCPeerConnection object is invalid');
    return;
  }

  if (self._RTCDataChannel && self._RTCDataChannel.readyState !== 'closed') {
    console.warn(self.id, 'Aborting construction of RTCDataChannel object as ' +
      'provided RTCDataChannel object is already defined');
    return;
  }

  try {
    self._RTCDataChannel = peer.createDataChannel(self.id, self._RTCDataChannelInit);

  } catch (error) {
    console.error(self.id, 'Failed constructing RTCDataChannel object', error);
    self._trigger('error', error);
    return;
  }

  console.debug(self.id, 'RTCDataChannel object has been constructed successfully');
};

/**
 * Destroys RTCDataChannel object connection.
 * @method destroy
 * @since 0.6.8
 * @for Skylink
 */
DataChannel.prototype.destroy = function () {
  var self = this;

  if (self._RTCDataChannel && ['closing', 'closed'].indexOf(self._RTCDataChannel.readyState) === -1) {
    self._RTCDataChannel.close();
    console.log(self.id, 'RTCDataChannel object connection has been destroyed');
  }
};

/**
 * Sends data using the RTCDataChannel object connection.
 * @method send
 * @param {String|JSON} data The data to send.
 * @since 0.6.8
 * @for Skylink
 */
DataChannel.prototype.send = function (data) {
  var self = this;

  if (!self._RTCDataChannel) {
    console.warn(self.id, 'Dropping sending of data as RTCDataChannel object is not defined');
    return;
  }

  if (self._RTCDataChannel.readyState !== 'open') {
    var notReadyError = 'Dropping sending of data as RTCDataChannel object connection is not opened';
    console.error(notReadyError, self._RTCDataChannel.readyState);
    self._trigger('error', new Error(error));
    return;
  }

  // Currently we support sending of type "string"
  var dataString = data;

  if (typeof data === 'object') {
    dataString = JSON.stringify(data);
  }

  self._RTCDataChannel.send(dataString);

  console.log('Data has been sent with RTCDataChannel object ->', data);
};

/**
 * Listens to the RTCDataChannel object events.
 * @method _listenToEvents
 * @private
 * @since 0.6.8
 * @for Skylink
 */
DataChannel.prototype._listenToEvents = function () {
  var self = this;

  // RTCDataChannel.onopen event
  var onopenHandler = function () {
    console.debug(self.id, 'RTCDataChannel object readyState ->', 'open');
    self._trigger('state', 'open');
  };

  // - If RTCDataChannel object is already opened
  if (self._RTCDataChannel.readyState === 'open') {
    // NOTE: To set a timeout to allow the RTCDataChannel object to be returned before triggering "open"
    // to allow the object to be set in the _channels array list first
    setTimeout(onopenHandler, 500);
  // - Check and wait for RTCDataChannel object to be opened
  } else {
    self._trigger('state', self._RTCDataChannel.readyState);
    self._RTCDataChannel.onopen = onopenHandler;
  }

  // RTCDataChannel.onmessage event
  self._RTCDataChannel.onmessage = function(event) {
    var data = event.data || event;
    console.debug(self.id, 'RTCDataChannel object has received data ->', data);
    self._trigger('data', data);
  };

  // RTCDataChannel.onbufferedamountlow event
  self._RTCDataChannel.onbufferedamountlow = function(event) {
    console.warn(self.id, 'RTCDataChannel object bufferring amount is low');
    self._trigger('bufferedamountlow');
  };

  // RTCDataChannel.onerror event
  self._RTCDataChannel.onerror = function(event) {
    console.error(self.id, 'RTCDataChannel object has caught with an exception ->', event);
    self._trigger('error', event);
  };

  // RTCDataChannel.onclose event
  self._RTCDataChannel.onclose = function() {
    console.debug(self.id, 'RTCDataChannel object readyState ->', 'closed');
    self._trigger('state', 'closed');
  };

  console.log(self.id, 'Listening to RTCDataChannel object events');
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

  self._channels[peerId][channelId] = new DataChannel({
    id: channelId,
    RTCPeerConnection: self._peerConnections[peerId]
  });
  self._listenToChannel(peerId, channelId);

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

  self._channels[peerId][channelId].on('data', function (data) {
    self._dataChannelProtocolHandler(data, peerId, channelId, channelType);
  });

  self._channels[peerId][channelId].on('error', function (error) {
    log.error([peerId, 'RTCDataChannel', channelId, 'Exception occurred in datachannel:'], {
      channelType: channelType,
      error: error
    });
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, error,
      channelId, channelType);
  });

  self._channels[peerId][channelId].on('state', function (state) {
    log.log([peerId, 'RTCDataChannel', channelId, 'Current RTCDataChannel readyState'], state);
    self._trigger('dataChannelState', state, peerId, null, channelId, channelType);
  });

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

  self._channels[peerId][channelId].destroy();
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

  /*if (self._channels[peerId][channelId].readyState !== 'open') {
    var readyState = self._channels[peerId][channelId].readyState;

    log.error([peerId, 'RTCDataChannel', channelId + '|' + dc.label,
      'Datachannel is not opened'], {
        readyState: readyState,
        type: (data.type || 'DATA'),
        data: data
    });

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR,
      peerId, 'Datachannel is not ready.\nState is: ' + readyState);
    return;
  }*/

  var dataString = data;

  // For JSON objects
  if (typeof data === 'object') {
    dataString = JSON.stringify(data);
  }

  log.debug([peerId, 'RTCDataChannel', channelId, 'Sending data from RTCDataChannel ->'], data);

  self._channels[peerId][channelId].send(dataString);
};

//// -- PUBLIC METHODS -----------------------------------------------------
