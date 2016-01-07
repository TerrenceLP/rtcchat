/**
 * The current version of Skylink Web SDK.
 * @attribute VERSION
 * @type String
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.VERSION = '@@version';

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

/**
 * These are the list of Peer connection signaling states that Skylink would trigger.
 * - Some of the state references the [w3c WebRTC Specification Draft](http://www.w3.org/TR/webrtc/#idl-def-RTCSignalingState).
 * @attribute PEER_CONNECTION_STATE
 * @type JSON
 * @param {String} STABLE <small>Value <code>"stable"</code></small>
 *   The state when there is no handshaking in progress and when
 *   handshaking has just started or close.<br>
 * This state occurs when Peer connection has just been initialised and after
 *   <code>HAVE_LOCAL_OFFER</code> or <code>HAVE_REMOTE_OFFER</code>.
 * @param {String} HAVE_LOCAL_OFFER <small>Value <code>"have-local-offer"</code></small>
 *   The state when the local session description <code>"offer"</code> is generated and to be sent.<br>
 * This state occurs after <code>STABLE</code> state.
 * @param {String} HAVE_REMOTE_OFFER <small>Value <code>"have-remote-offer"</code></small>
 *   The state when the remote session description <code>"offer"</code> is received.<br>
 * At this stage, this indicates that the Peer connection signaling handshaking has been completed, and
 *   likely would go back to <code>STABLE</code> after local <code>"answer"</code> is received by Peer.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when the Peer connection is closed.<br>
 * This state occurs when connection with Peer has been closed, usually when Peer leaves the room.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
};

/**
 * These are the types of server Peers that Skylink would connect with.
 * - Different server Peers that serves different functionalities.
 * - The server Peers functionalities are only available depending on the
 *   Application Key configuration.
 * - Eventually, this list will be populated as there are more server Peer
 *   functionalities provided by the Skylink platform.
 * @attribute SERVER_PEER_TYPE
 * @param {String} MCU <small>Value <code>"mcu"</code></small>
 *   This server Peer is a MCU server connection.
 * @type JSON
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.SERVER_PEER_TYPE = {
  MCU: 'mcu'
  //SIP: 'sip'
};


