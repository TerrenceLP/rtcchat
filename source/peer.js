/**
 * @class Peer
 * @constructor
 * @param {Socket} socketRef The Socket object reference that the Peer class object would relay events to.
 * @param {JSON} config The configuration settings for the Peer class object.
 * @param {String} config.id The Peer ID.
 * @param {Object} [config.userData=null] The Peer custom data.
 * @param {JSON} config.agent The peer connecting agent platform.
 * @param {String} config.agent.name The platform agent name that Peer is connecting from.
 * @param {Number} config.agent.version The version of the platform agent.
 * @param {String} config.agent.os The platform operating system the agent is running from.
 * @param {Array} config.iceServers The list of ICE servers that the Peer connection would attempt to use for successful ICE connection.
 * @param {String} config.room The room that the Peer is connected to.
 */
var Peer = function (socketRef, config) {

  'use strict';

  // Reference object
  var self = this;

  log.debug('Passed configuration for constructing new Peer object', config);

  if ((!config && typeof config !== 'object') || config === null) {
    throw new Error('Configuration passed in for constructing new Peer object is invalid');
  }

  if (typeof config.id !== 'string') {
    throw new Error('Configuration ID passed in for constructing new Peer object is invalid', config.id);
  }

  if ((!config.agent && typeof config.agent !== 'object') || config.agent === null) {
    throw new Error('Configuration agent passed in for constructing new Peer object is invalid', config.agent);
  }

  if (typeof config.room !== 'string') {
    throw new Error('Configuration room passed in for constructing new Peer object is invalid', config.room);
  }

  if (!Array.isArray(config.iceServers)) {
    throw new Error('Configuration ICE servers passed in for constructing new Peer object is invalid', config.iceServers);
  }

/***************************************************
 = ATTRIBUTES (The ones that requires declaration from config) [use @attribute for attributes]
 ***************************************************/
  /**
   * The Peer ID.
   * @attribute id
   * @type String
   * @readOnly
   */
  self.id = config.id;

  /**
   * The Peer custom data.
   * @attribute userData
   * @type Object
   * @readOnly
   */
  self.userData = config.userData || null;

  /**
   * The Peer connecting agent platform.
   * @attribute userData
   * @type JSON
   * @param {String} [name="unknown"] The platform agent name that Peer is connecting from.
   * @param {Number} [version=0] The version of the platform agent.
   * @param {String} [os="unknown"] The platform operating system the agent is running from.
   * @readOnly
   */
  self.agent = {
    // Define the objects to prevent undefined errors
    name: config.agent.name || 'unknown',
    version: config.agent.version || 0,
    os: config.agent.os || 'unknown'
  };

  /**
   * The room that the Peer is connected to.
   * @attribute room
   * @type String
   * @readOnly
   */
  self.room = config.room;

  /**
   * The list of ICE servers that the RTCPeerConnection would attempt to use for successful ICE connection.
   * @attribute _iceServers
   * @type Array
   * @private
   */
  self._iceServers = config.iceServers;

  // Event hook to object for triggering
  SkylinkEvent._mixin(self);

  // Initialise the RTCPeerConnection object to wait for ready connection
};

/***************************************************
 = CONSTANTS [use @property for constants]
 ***************************************************/
/**
 * @property ICE_CONNECTION_STATE
 * @type JSON
 * @readOnly
 * @final
 */
Peer.prototype.ICE_CONNECTION_STATE = {
  STARTING: 'starting',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  FAILED: 'failed',
  TRICKLE_FAILED: 'trickleFailed',
  DISCONNECTED: 'disconnected'
};

/**
 * @property CANDIDATE_GENERATION_STATE
 * @type JSON
 * @readOnly
 * @final
 */
Peer.prototype.CANDIDATE_GENERATION_STATE = {
  NEW: 'new',
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

/**
 * @property PEER_CONNECTION_STATE
 * @type JSON
 * @readOnly
 * @final
 */
Peer.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
};

/**
 * @property HANDSHAKE_PROGRESS
 * @type JSON
 * @readOnly
 * @final
 */
Peer.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * @property READY_STATE
 * @type JSON
 * @readOnly
 * @final
 */
Peer.prototype.READY_STATE = {
  CONSTRUCT: 'construct', // usually never happens
  CONSTRUCTED: 'constructed',
  CONNECTING: 'connecting',
  CONNECTION_ERROR: 'connection-error',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
};


/***************************************************
 = ATTRIBUTES [use @attribute for attributes]
 ***************************************************/
/**
 * The Peer RTCPeerConnection object reference.
 * @attribute _ref
 * @type RTCPeerConnection
 * @private
 */
Peer.prototype._ref = null;

/**
 * The Peer connection readyState.
 * @attribute readyState
 * @type String
 * @private
 */
Peer.prototype.readyState = 'construct';

/**
 * The Peer RTCPeerConnection connection settings.
 * @attribute _connectionSettings
 * @param {Boolean} [trickleICE=true] The flag that indicates if RTCPeerConnection
 *   should trickle ICE.
 * @parma {Boolean} [dataChannel=true] The flag that indicates if RTCPeerConnection
 *   should have any DataChannel connections.
 * @param {JSON} RTCOfferOptions The RTCOfferOptions / RTCAnswerOptions to be
 *   passed into RTCPeerConnection <code>.createOffer()</code> and <code>.createAnswer()</code> methods.
 * @param {JSON} RTCConfiguration The RTCConfiguration to be
 *   passed when constructing a new RTCPeerConnection object.
 * @param {JSON} ICESettings The configuration to configure the list of ICE servers to be
 *   passed into the RTCPeerConnection RTCConfiguration <code>.iceServers</code>.
 * @type JSON
 * @private
 */
Peer.prototype._connectionSettings = {
  trickleICE: true,
  dataChannel: true,
  RTCOfferOptions: {
    iceRestart: true,
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    voiceActivityDetection: true
  },
  RTCConfiguration: {
    iceServers: []
    //bundlePolicy: 'balanced',
    //iceTransportPolicy: 'all',
    //peerIdentity: null,
    //certificates: [],
    //iceCandidatePoolSize: 0
  },
  ICESettings: {
    turn: {
      enabled: true,
      useSSLProtocol: false,
      useSSLPort: false
    },
    stun: {
      enabled: true,
      usePublic: true
    },
  }
};

/**
 * The list of streams that the Peer is receiving.
 * @attribute _localStreams
 * @param {Stream} (#streamId) The Stream object sent to Peer.
 * @type JSON
 * @private
 */
Peer.prototype._localStreams = {};

/**
 * The list of streams that the Peer is sending.
 * @attribute _remoteStreams
 * @param {Stream} (#streamId) The Stream object received from Peer.
 * @type JSON
 * @private
 */
Peer.prototype._remoteStreams = {};

/**
 * The list of DataChannel connections with the Peer.
 * @attribute _remoteStreams
 * @param {DataChannek} (#channelId) The DataChannel connection object.
 * @type JSON
 * @private
 */
Peer.prototype._dataChannels = {};


/**
 * Constructs the RTCPeerConnection object and listens the RTCPeerConnection events.
 * @method _construct
 * @private
 */
Peer.prototype._construct = function () {
  var self = this;
  // ICEParser.configure(ICE, self._connectionSettings.ICESettings);
  self._ref = new RTCPeerConnection(self._connectionSettings.RTCConfiguration);

  //self._ref.onnegotiationneeded = function () {};

  self._ref.ondatachannel = function(event) {
    var channel = event.channel || event;
    log.debug('Received datachannel', channel);

    self._dataChannels[channel.label] = channel;
  };

  self._ref.onaddstream = function(event) {
    var stream = event.stream || event;
    log.debug('Received remote stream', stream);

    self._remoteStreams[stream.id || stream.label] = stream;
  };

  self._ref.onicecandidate = function(event) {
    var candidate = event.candidate || event;
    log.debug('Generated ICE candidate', candidate);

    if (candidate.candidate === null || !candidate.candidate) {
      log.debug('Generation of ICE candidate has been completed');
      return;
    }

    /*send({
      target: self.id,
      type: 'candidate',
      label: candidate.sdpMLineIndex,
      candidate: candidate.candidate,
      id: candidate.sdpMid
    });*/
  };

  self._ref.oniceconnectionstatechange = function(event) {
    log.debug('ICE connection state change', self._ref.iceConnectionState);
  };

  self._ref.onremovestream = function (event) {
    log.debug('Remote stream removed', event);
  };

  self._ref.onsignalingstatechange = function() {
    log.debug('Signaling state change', self._ref.signalingState);
  };

  self._ref.onicegatheringstatechange = function() {
    log.debug('ICE gathering state change', self._ref.iceGatheringState);
  };
};