/*! skylinkjs - v0.6.7 - Mon Jan 18 2016 04:27:14 GMT+0800 (SGT) */

(function() {

'use strict';

/* IE < 10 Polyfills */
// Mozilla provided polyfill for Object.keys()
if (!Object.keys) {
  Object.keys = (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({
        toString: null
      }).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    }
  })()
}

var objForEach = function (obj, callback) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      callback(obj[key], key);
    }
  }
};

// Mozilla provided polyfill for Date.getISOString()
(function() {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  Date.prototype.toISOString = function() {
    return this.getUTCFullYear() +
      '-' + pad(this.getUTCMonth() + 1) +
      '-' + pad(this.getUTCDate()) +
      'T' + pad(this.getUTCHours()) +
      ':' + pad(this.getUTCMinutes()) +
      ':' + pad(this.getUTCSeconds()) +
      '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  };
})();

// addEventListener polyfill 1.0 / Eirik Backer / MIT Licence
(function(win, doc){
  if(win.addEventListener) return; //No need to polyfill

  function docHijack(p){var old = doc[p];doc[p] = function(v){ return addListen(old(v)) }}
  function addEvent(on, fn, self){
    return (self = this).attachEvent('on' + on, function(e){
      var e = e || win.event;
      e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
      e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
      fn.call(self, e);
    });
  }
  function addListen(obj, i){
    if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
    else obj.addEventListener = addEvent;
    return obj;
  }

  addListen([doc, win]);
  if('Element' in win)win.Element.prototype.addEventListener = addEvent; //IE8
  else{                                     //IE < 8
    doc.attachEvent('onreadystatechange', function(){addListen(doc.all)}); //Make sure we also init at domReady
    docHijack('getElementsByTagName');
    docHijack('getElementById');
    docHijack('createElement');
    addListen(doc.all);
  }
})(window, document);

// global clone function
var clone = function (obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
};

/**
 * <h2>Before using Skylink</h2>
 * Please invoke {{#crossLink "Skylink/init:method"}}init(){{/crossLink}} method
 * first to initialise the Application Key before using any functionalities in Skylink.
 *
 * If you do not have an Application Key, you may register for a Skylink platform developer account
 *   [to create one](http://developer.temasys.com.sg/register).
 *
 * To get started you may [visit the getting started page](https://temasys.github.io/how-to/2014/08/08/
 * Getting_started_with_WebRTC_and_SkylinkJS/), or alternatively fork a ready made demo application
 * that uses Skylink Web SDK at [getaroom.io](http://getaroom.io/).
 *
 * For tips on using skylink and troubleshooting you can visit
 *   [our support portal](http://support.temasys.com.sg/support/solutions/folders/5000267498).
 * @class Skylink
 * @constructor
 * @example
 *   // Here's a simple example on how you can start using Skylink
 *   var SkylinkDemo = new Skylink();
 *
 *   // Subscribe all events first before init()
 *   SkylinkDemo.on("incomingStream", function (peerId, stream, peerInfo, isSelf) {
 *     if (isSelf) {
 *       attachMediaStream(document.getElementById("selfVideo"), stream);
 *     } else {
 *       var peerVideo = document.createElement("video");
 *       peerVideo.id = peerId;
 *       peerVideo.autoplay = "autoplay";
 *       document.getElementById("peersVideo").appendChild(peerVideo);
 *       attachMediaStream(peerVideo, stream);
 *     }
 *   });
 *
 *   SkylinkDemo.on("peerLeft", function (peerId, peerInfo, isSelf) {
 *     if (!isSelf) {
 *       var peerVideo = document.getElementById(peerId);
 *       // do a check if peerVideo exists first
 *       if (peerVideo) {
 *         document.getElementById("peersVideo").removeChild(peerVideo);
 *       } else {
 *         console.error("Peer video for " + peerId + " is not found.");
 *       }
 *     }
 *   });
 *
 *  // never call joinRoom in readyStateChange event subscription.
 *  // call joinRoom after init() callback if you want to joinRoom instantly.
 *  SkylinkDemo.on("readyStateChange", function (state, room) {
 *    console.log("Room (" + room + ") state: ", room);
 *  })
 *
 *  // always remember to call init()
 *  SkylinkDemo.init("YOUR_APP_KEY_HERE", function (error, success) {
 *    // do a check for error or success
 *    if (error) {
 *      console.error("Init failed: ", error);
 *    } else {
 *      SkylinkDemo.joinRoom("my_room", {
 *        userData: "My Username",
 *        audio: true,
 *        video: true
 *      });
 *    }
 *  });
 * @for Skylink
 * @since 0.5.0
 */
function Skylink() {
  if (!(this instanceof Skylink)) {
    return new Skylink();
  }

  /**
   * The current version of Skylink Web SDK.
   * @attribute VERSION
   * @type String
   * @readOnly
   * @for Skylink
   * @since 0.1.0
   */
  this.VERSION = '0.6.7';

  /**
   * Helper function that generates an Unique ID (UUID) string.
   * @method generateUUID
   * @return {String} Generated Unique ID (UUID) string.
   * @example
   *    // Get Unique ID (UUID)
   *    var uuid = SkylinkDemo.generateUUID();
   * @for Skylink
   * @since 0.5.9
   */
  this.generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
  };
}

/**
 * These are the list of room initialization ready states that Skylink would trigger.
 * - The states indicates if the required connection information has been retrieved successfully from
 *   the platform server to start a connection.
 * - These states are triggered when {{#crossLink "Skylink/init:method"}}init(){{/crossLink}} or
 *   {{#crossLink "Skylink/joinRoom:attr"}}joinRoom(){{/crossLink}} is invoked.
 * @attribute READY_STATE_CHANGE
 * @type JSON
 * @param {Number} INIT <small>Value <code>0</code></small>
 *   The state when Skylink is at the initial state before retrieval.<br>
 * If all dependencies has been loaded, this would proceed to <code>LOADING</code> state.
 * @param {Number} LOADING <small>Value <code>1</code></small>
 *   The state when Skylink starts retrieving the connection information from the platform server.<br>
 * This state occurs after <code>INIT</code> state and if retrieval is successful, this would
 *   proceed to <code>COMPLETED</code> state.
 * @param {Number} COMPLETED <small>Value <code>2</code></small>
 *   The state when the connection information has been retrieved successfully.<br>
 * This state occurs after <code>LOADING</code>, and if it's
 *   {{#crossLink "Skylink/joinRoom:attr"}}joinRoom(){{/crossLink}} that is invoked, room connection
 *   would commerce.
 * @param {Number} ERROR <small>Value <code>-1</code></small>
 *   The state when an exception occured while retrieving the connection information.<br>
 * This state might be triggered when dependencies failed to load or HTTP retrieval fails.<br>
 * Reference {{#crossLink "Skylink/READY_STATE_CHANGE_ERROR:attr"}}READY_STATE_CHANGE_ERROR{{/crossLink}}
 *   to see the list of errors that might have triggered the <code>ERROR</code> state.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * These are the list of room initialization ready state errors that Skylink has.
 * - Ready state errors like <code>ROOM_LOCKED</code>, <code>API_NOT_ENOUGH_CREDIT</code>,
 *   <code>API_NOT_ENOUGH_PREPAID_CREDIT</code>, <code>API_FAILED_FINDING_PREPAID_CREDIT</code> and
 *   <code>SCRIPT_ERROR</code> has been removed as they are no longer supported.
 * @attribute READY_STATE_CHANGE_ERROR
 * @type JSON
 * @param {Number} API_INVALID <small>Value <code>4001</code></small>
 *   The error when provided Application Key does not exists <em>(invalid)</em>.<br>
 * For this error, it's recommended that you check if the Application Key exists in your account
 *   in the developer console.
 * @param {Number} API_DOMAIN_NOT_MATCH <small>Value <code>4002</code></small>
 *   The error when application accessing from backend IP address is not valid for provided Application Key.<br>
 * This rarely (and should not) occur and it's recommended to report this issue if this occurs.
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH <small>Value <code>4003</code></small>
 *   The error when application accessing from the CORS domain is not valid for provided Application Key.<br>
 * For this error, it's recommended that you check the CORS configuration for the provided Application Key
 *   in the developer console.
 * @param {Number} API_CREDENTIALS_INVALID <small>Value <code>4004</code></small>
 *   The error when credentials provided is not valid for provided Application Key.<br>
 * For this error, it's recommended to check the <code>credentials</code> provided in
 *   {{#crossLink "Skylink/init:method"}}init() configuration{{/crossLink}}.
 * @param {Number} API_CREDENTIALS_NOT_MATCH <small>Value <code>4005</code></small>
 *   The error when credentials does not match as expected generated credentials for provided Application Key.<br>
 * For this error, it's recommended to check the <code>credentials</code> provided in
 *   {{#crossLink "Skylink/init:method"}}init() configuration{{/crossLink}}.
 * @param {Number} API_INVALID_PARENT_KEY <small>Value <code>4006</code></small>
 *   The error when provided alias Application Key has an error because parent Application Key does not exists.<br>
 * For this error, it's recommended to provide another alias Application Key.
 * @param {Number} API_NO_MEETING_RECORD_FOUND <small>Value <code>4010</code></small>
 *   The error when there is no meeting currently that is open or available to join
 *   for self at the current time in the selected room.<br>
 * For this error, it's recommended to retrieve the list of meetings and check if it exists using
 *   the [Meeting Resource REST API](https://temasys.atlassian.net/wiki/display/TPD/SkylinkAPI+-+Meeting+%28Persistent+Room%29+Resources).
 * @param {Number} NO_SOCKET_IO <small>Value <code>1</code></small>
 *   The error when socket.io dependency is not loaded.<br>
 * For this error, it's recommended to load the
 *   [correct socket.io-client dependency](http://socket.io/download/) from the CDN.
 * @param {Number} NO_XMLHTTPREQUEST_SUPPORT <small>Value <code>2</code></small>
 *   The error when XMLHttpRequest is not supported in current browser.<br>
 * For this error, it's recommended to ask user to switch to another browser that supports <code>XMLHttpRequest</code>.
 * @param {Number} NO_WEBRTC_SUPPORT <small>Value <code>3</code></small>
 *   The error when WebRTC is not supported in current browser.<br>
 * For this error, it's recommended to ask user to switch to another browser that supports WebRTC.
 * @param {Number} NO_PATH <small>Value <code>4</code></small>
 *   The error when constructed path is invalid.<br>
 * This rarely (and should not) occur and it's recommended to report this issue if this occurs.
 * @param {Number} INVALID_XMLHTTPREQUEST_STATUS <small>Value <code>5</code></small>
 *   The error when XMLHttpRequest does not return a HTTP status code of <code>200</code> but a HTTP failure.<br>
 * This rarely (and should not) occur and it's recommended to report this issue if this occurs.
 * @param {Number} ADAPTER_NO_LOADED <small>Value <code>7</code></small>
 *   The error when AdapterJS dependency is not loaded.<br>
 * For this error, it's recommended to load the
 *   [correct AdapterJS dependency](https://github.com/Temasys/AdapterJS/releases) from the CDN.
 * @param {Number} XML_HTTP_REQUEST_ERROR <small>Value <code>-1</code></small>
 *   The error when XMLHttpRequest failure on the network level when attempting to
 *   connect to the platform server to retrieve selected room connection information.<br>
 * This might happen when connection timeouts. If this is a persistent issue, it's recommended to report this issue.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.READY_STATE_CHANGE_ERROR = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  //ROOM_LOCKED: 5001,
  XML_HTTP_REQUEST_ERROR: -1,
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  //INVALID_XMLHTTPREQUEST_STATUS: 5,
  //SCRIPT_ERROR: 6,
  ADAPTER_NO_LOADED: 7
};

/**
 * These are the list of available platform signaling servers Skylink
 *   should connect to for faster connectivity.
 * @attribute REGIONAL_SERVER
 * @type JSON
 * @param {String} APAC1 <small>Value <code>"sg"</code></small>
 *   The option to select the Asia pacific server 1 regional server.
 * @param {String} US1 <small>Value <code>"us2"</code></small>
 *   The option to select the US server 1 regional server.
 * @deprecated Signaling server selection is handled on
 *    the server side based on load and latency.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.REGIONAL_SERVER = {
  APAC1: 'sg',
  US1: 'us2'
};

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
 * The current version of the internal <u>Data Transfer (DT)</u> Protocol that Skylink is using.<br>
 * - This is not a feature for developers to use but rather for SDK developers to
 *   see the Protocol version used in this Skylink version.
 * - In some cases, this information may be used for reporting issues with Skylink.
 * - DT_PROTOCOL VERSION: <code>0.1.0</code>.
 * @attribute DT_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.DT_PROTOCOL_VERSION = '0.1.0';

/**
 * These are the list of Peer connection ICE connection states that Skylink would trigger.
 * - These states references the [w3c WebRTC Specification Draft](http://www.w3.org/TR/webrtc/#idl-def-RTCIceConnectionState),
 *   except the <code>TRICKLE_FAILED</code> state, which is an addition provided state by Skylink
 *   to inform that trickle ICE has failed.
 * @attribute ICE_CONNECTION_STATE
 * @type JSON
 * @param {String} STARTING <small>Value <code>"starting"</code></small>
 *   The state when the ICE agent is gathering addresses and/or waiting
 *   for remote candidates to be supplied.<br>
 * This state occurs when Peer connection has just been initialised.
 * @param {String} CHECKING <small>Value <code>"checking"</code></small>
 *   The state when the ICE agent has received remote candidates
 *   on at least one component, and is checking candidate pairs but has
 *   not yet found a connection. In addition to checking, it may also
 *   still be gathering.<br>
 * This state occurs after <code>STARTING</code> state.
 * @param {String} CONNECTED <small>Value <code>"connected"</code></small>
 *  The state when the ICE agent has found a usable connection
 *   for all components but is still checking other candidate pairs to see
 *   if there is a better connection. It may also still be gathering.<br>
 * This state occurs after <code>CHECKING</code>.
 * @param {String} COMPLETED <small>Value <code>"completed"</code></small>
 *   The state when the ICE agent has finished gathering and
 *   checking and found a connection for all components.<br>
 * This state occurs after <code>CONNECTED</code> (or sometimes after <code>CHECKING</code>).
 * @param {String} FAILED <small>Value <code>"failed"</code></small>
 *   The state when the ICE agent is finished checking all
 *   candidate pairs and failed to find a connection for at least one
 *   component.<br>
 * This state occurs during the ICE connection attempt after <code>STARTING</code> state.
 * @param {String} DISCONNECTED <small>Value <code>"disconnected"</code></small>
 *   The state when liveness checks have failed for one or
 *   more components. This is more aggressive than "failed", and may
 *   trigger intermittently (and resolve itself without action) on
 *   a flaky network.<br>
 * This state occurs after <code>CONNECTED</code> or <code>COMPLETED</code> state.
 * @param {String} CLOSED <small>Value <code>"closed"</code></small>
 *   The state when the ICE agent has shut down and is no
 *   longer responding to STUN requests.<br>
 * This state occurs after Peer connection has been disconnected <em>(closed)</em>.
 * @param {String} TRICKLE_FAILED <small>Value <code>"trickeFailed"</code></small>
 *   The state when attempting to connect successfully with ICE connection fails
 *    with trickle ICE connections.<br>
 * Trickle ICE would be disabled after <code>3</code> attempts to have a better
 *   successful ICE connection.
 * @readOnly
 * @since 0.1.0
 * @component ICE
 * @for Skylink
 */
Skylink.prototype.ICE_CONNECTION_STATE = {
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
 * These are the list of available transports that
 *   Skylink would use to connect to the TURN servers with.
 * - For example as explanation how these options works below, let's take that
 *   these are list of TURN servers given by the platform signaling:<br>
 *   <small><code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @attribute TURN_TRANSPORT
 * @type JSON
 * @param {String} TCP <small>Value <code>"tcp"</code></small>
 *   The option to connect using only TCP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code></small>
 * @param {String} UDP <small>Value <code>"udp"</code></small>
 *   The option to connect using only UDP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @param {String} ANY <small><b>DEFAULT</b> | Value <code>"any"</code></small>
 *   This option to use any transports that is preconfigured by provided by the platform signaling.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @param {String} NONE <small>Value <code>"none"</code></small>
 *   This option to set no transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123</code><br>
 *   <code>turn:turnurl</code><br>
 *   <code>turn:turnurl:1234</code></small>
 * @param {String} ALL <small>Value <code>"all"</code></small>
 *   This option to use both TCP and UDP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @readOnly
 * @since 0.5.4
 * @component ICE
 * @for Skylink
 */
Skylink.prototype.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none',
  ALL: 'all'
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

/**
 * These are the list of Peer connection handshake states that Skylink would trigger.
 * - Do not be confused with {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}.
 *   This is the Peer recognition connection that is established with the platform signaling protocol, and not
 *   the Peer connection signaling state itself.
 * - In this case, this happens before the {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE
 *   handshaking states. {{/crossLink}} The <code>OFFER</code> and <code>ANSWER</code> relates to the
 *   {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE states{{/crossLink}}.
 * - For example as explanation how these state works below, let's make self as the offerer and
 *   the connecting Peer as the answerer.
 * @attribute HANDSHAKE_PROGRESS
 * @type JSON
 * @param {String} ENTER <small>Value <code>"enter"</code></small>
 *   The state when Peer have received <code>ENTER</code> from self,
 *   and Peer connection with self is initialised with self.<br>
 * This state will occur for both self and Peer as <code>ENTER</code>
 *   message is sent to ping for Peers in the room.<br>
 * At this state, Peer would sent <code>WELCOME</code> to the peer to
 *   start the session description connection handshake.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">1.</td>
 *       <td class="col-md-5">Sends <code>ENTER</code></td><td>Sends <code>ENTER</code></td></tr>
 *     <tr><td class="col-md-1">2.</td>
 *       <td class="col-md-5">-</td><td>Receives self <code>ENTER</code></td></tr>
 *     <tr><td class="col-md-1">3.</td>
 *       <td class="col-md-5">-</td><td>Sends self <code>WELCOME</code></td></tr>
 *   </tbody>
 * </table>
 * @param {String} WELCOME <small>Value <code>"welcome"</code></small>
 *   The state when self have received <code>WELCOME</code> from Peer,
 *   and Peer connection is initialised with Peer.<br>
 * At this state, self would start the session description connection handshake and
 *   send the local <code>OFFER</code> session description to Peer.
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">4.</td>
 *       <td class="col-md-5">Receives <code>WELCOME</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">5.</td>
 *       <td class="col-md-5">Generates <code>OFFER</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">6.</td>
 *       <td class="col-md-5">Sets local <code>OFFER</code><sup>REF</sup></td><td>-</td></tr>
 *     <tr><td class="col-md-1">7.</td>
 *       <td class="col-md-5">Sends <code>OFFER</code></td><td>-</td></tr>
 *   </tbody>
 * </table>
 * <sup>REF</sup>: The will cause {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}
 *   state go to <code>HAVE_LOCAL_OFFER</code>.
 * @param {String} OFFER <small>Value <code>"offer"</code></small>
 *   The state when Peer received <code>OFFER</code> from self.
 * At this state, Peer would set the remote <code>OFFER</code> session description and
 *   start to send local <code>ANSWER</code> session description to self.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">8.</td>
 *        <td class="col-md-5">-</td><td>Receives <code>OFFER</code></td></tr>
 *     <tr><td class="col-md-1">9.</td>
 *        <td class="col-md-5">-</td><td>Sets remote <code>OFFER</code><sup>REF</sup></td></tr>
 *     <tr><td class="col-md-1">10.</td>
 *        <td class="col-md-5">-</td><td>Generates <code>ANSWER</code></td></tr>
 *     <tr><td class="col-md-1">11.</td>
 *        <td class="col-md-5">-</td><td>Sets local <code>ANSWER</code></td></tr>
 *     <tr><td class="col-md-1">12.</td>
 *        <td class="col-md-5">-</td><td>Sends <code>ANSWER</code></td></tr>
 *   </tbody>
 * </table>
 * <sup>REF</sup>: The will cause {{#crossLink "Skylink/PEER_CONNECTION_STATE:attr"}}PEER_CONNECTION_STATE{{/crossLink}}
 *   state go to <code>HAVE_REMOTE_OFFER</code>.
 * @param {String} ANSWER <small>Value <code>"answer"</code></small>
 *   The state when self received <code>ANSWER</code> from Peer.<br>
 * At this state, self would set the remote <code>ANSWER</code> session description and
 *   the connection handshaking progress has been completed.<br>
 * <table class="table table-condensed">
 *   <thead><tr><th class="col-md-1"></th><th class="col-md-5">Self</th><th>Peer</th></thead>
 *   <tbody>
 *     <tr><td class="col-md-1">13.</td>
 *        <td class="col-md-5">Receives <code>ANSWER</code></td><td>-</td></tr>
 *     <tr><td class="col-md-1">14.</td>
 *        <td class="col-md-5">Sets remote <code>ANSWER</code></td><td>-</td></tr>
 *   </tbody>
 * </table>
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when connection handshake has occurred and exception,
 *   in this which the connection handshake could have been aborted abruptly
 *   and no Peer connection is established.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * These are the list of Peer list retrieval states that Skylink would trigger.
 * - This relates to and requires the Privileged Key feature where Peers using
 *   that Privileged alias Key becomes a privileged Peer with privileged functionalities.
 * @attribute GET_PEERS_STATE
 * @type JSON
 * @param {String} ENQUIRED <small>Value <code>"enquired"</code></small>
 *   The state when the privileged Peer already enquired signaling for list of peers.
 * @param {String} RECEIVED <small>Value <code>"received"</code></small>
 *   The state when the privileged Peer received list of peers from signaling.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.GET_PEERS_STATE = {
  ENQUIRED: 'enquired',
  RECEIVED: 'received'
};

/**
 * These are the list of Peer introduction states that Skylink would trigger.
 * - This relates to and requires the Privileged Key feature where Peers using
 *   that Privileged alias Key becomes a privileged Peer with privileged functionalities.
 * @attribute INTRODUCE_STATE
 * @type JSON
 * @param {String} INTRODUCING <small>Value <code>"enquired"</code></small>
 *   The state when the privileged Peer have sent the introduction signal.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when the Peer introduction has occurred an exception.
 * @readOnly
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.INTRODUCE_STATE = {
  INTRODUCING: 'introducing',
  ERROR: 'error'
};

/**
 * These are the list of platform signaling system actions that Skylink would be given with.
 * - Upon receiving from the signaling, the application has to reflect the
 *   relevant actions given.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION_REASON:attribute"}}SYSTEM_ACTION_REASON{{/crossLink}}
 *   for the types of system action reasons that would be given.
 * @attribute SYSTEM_ACTION
 * @type JSON
 * @param {String} WARNING <small>Value <code>"warning"</code></small>
 *   This action serves a warning to self. Usually if
 *   warning is not heeded, it may result in an <code>REJECT</code> action.
 * @param {String} REJECT <small>Value <code>"reject"</code></small>
 *   This action means that self has been kicked out
 *   of the current signaling room connection, and subsequent Peer connections
 *   would be disconnected.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * These are the list of Skylink platform signaling codes as the reason
 *   for the system action given by the platform signaling that Skylink would receive.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION:attribute"}}SYSTEM_ACTION{{/crossLink}}
 *   for the types of system actions that would be given.
 * - Reason codes like <code>FAST_MESSAGE</code>, <code>ROOM_FULL</code>, <code>VERIFICATION</code> and
 *   <code>OVER_SEAT_LIMIT</code> has been removed as they are no longer supported.
 * @attribute SYSTEM_ACTION_REASON
 * @type JSON
 * @param {String} ROOM_LOCKED <small>Value <code>"locked"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when room is locked and self is rejected from joining the room.
 * @param {String} DUPLICATED_LOGIN <small>Value <code>"duplicatedLogin"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the credentials given is already in use, which the platform signaling
 *   throws an exception for this error.<br>
 * This rarely occurs as Skylink handles this issue, and it's recommended to report this issue if this occurs.
 * @param {String} SERVER_ERROR <small>Value <code>"serverError"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the connection with the platform signaling has an exception with self.<br>
 * This rarely (and should not) occur and it's recommended to  report this issue if this occurs.
 * @param {String} EXPIRED <small>Value <code>"expired"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has expired so self is unable to join the room as
 *   the end time of the meeting has ended.<br>
 * Depending on other meeting timings available for this room, the persistent room will appear expired.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSED <small>Value <code>"roomclose"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has ended and has been rendered expired so self is rejected
 *   from the room as the meeting is over.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSING <small>Value <code>"toclose"</code> | Action ties with <code>WARNING</code></small>
 *   The reason code when the persistent room meeting is going to end soon, so this warning is given to inform
 *   users before self is rejected from the room.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.SYSTEM_ACTION_REASON = {
  //FAST_MESSAGE: 'fastmsg',
  ROOM_LOCKED: 'locked',
  //ROOM_FULL: 'roomfull',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  SERVER_ERROR: 'serverError',
  //VERIFICATION: 'verification',
  EXPIRED: 'expired',
  ROOM_CLOSED: 'roomclose',
  ROOM_CLOSING: 'toclose'
};

/**
 * These are the logging levels that Skylink provides.
 * - This manipulates the debugging messages sent to <code>console</code> object.
 * - Refer to [Javascript Web Console](https://developer.mozilla.org/en/docs/Web/API/console).
 * @attribute LOG_LEVEL
 * @type JSON
 * @param {Number} DEBUG <small>Value <code>4</code> | Level higher than <code>LOG</code></small>
 *   Displays debugging logs from <code>LOG</code> level onwards with <code>DEBUG</code> logs.
 * @param {Number} LOG <small>Value <code>3</code> | Level higher than <code>INFO</code></small>
 *   Displays debugging logs from <code>INFO</code> level onwards with <code>LOG</code> logs.
 * @param {Number} INFO <small>Value <code>2</code> | Level higher than <code>WARN</code></small>
 *   Displays debugging logs from <code>WARN</code> level onwards with <code>INFO</code> logs.
 * @param {Number} WARN <small>Value <code>1</code> | Level higher than <code>ERROR</code></small>
 *   Displays debugging logs of <code>ERROR</code> level with <code>WARN</code> logs.
 * @param {Number} ERROR <small><b>DEFAULT</b> | Value <code>0</code> | Lowest level</small>
 *   Displays only <code>ERROR</code> logs.
 * @readOnly
 * @component Log
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0
};

/**
 * These are the list of socket connection error states that Skylink would trigger.
 * - These error states references the [socket.io-client events](http://socket.io/docs/client-api/).
 * @attribute SOCKET_ERROR
 * @type JSON
 * @param {Number} CONNECTION_FAILED <small>Value <code>0</code></small>
 *   The error state when Skylink have failed to establish a socket connection with
 *   platform signaling in the first attempt.
 * @param {String} RECONNECTION_FAILED <small>Value <code>-1</code></small>
 *   The error state when Skylink have failed to
 *   reestablish a socket connection with platform signaling after the first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} CONNECTION_ABORTED <small>Value <code>-2</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after the failed first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ABORTED <small>Value <code>-3</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after several failed reattempts
 *   <code>RECONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ATTEMPT <small>Value <code>-4</code></small>
 *   The error state when Skylink is attempting to reestablish
 *   a socket connection with platform signaling after a failed attempt
 *   <code>CONNECTION_FAILED</code> or <code>RECONNECTION_FAILED</code>.
 * @readOnly
 * @component Socket
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * The current version of the internal <u>Signaling Message (SM)</u> Protocol that Skylink is using.<br>
 * - This is not a feature for developers to use but rather for SDK developers to
 *   see the Protocol version used in this Skylink version.
 * - In some cases, this information may be used for reporting issues with Skylink.
 * - SM_PROTOCOL VERSION: <code>0.1.</code>.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @required
 * @component Socket
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.1';

/**
 * These are the list of available video codecs settings that Skylink would use
 *   when streaming video stream with Peers.
 * - The video codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>VP8</code> is
 *   used by default.
 * @attribute VIDEO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any video codec selected by the browser generated session description.
 * @param {String} VP8 <small>Value <code>"VP8"</code></small>
 *   The option to let Skylink use the [VP8](https://en.wikipedia.org/wiki/VP8) codec.<br>
 *   This is the common and mandantory video codec used by most browsers.
 * @param {String} H264 <small>Value <code>"H264"</code></small>
 *   The option to let Skylink use the [H264](https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC) codec.<br>
 *   This only works if the browser supports the H264 video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  H264: 'H264'
};

/**
 * These are the list of available audio codecs settings that Skylink would use
 *   when streaming audio stream with Peers.
 * - The audio codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>OPUS</code> is
 *   used by default.
 * @attribute AUDIO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any audio codec selected by the browser generated session description.
 * @param {String} OPUS <small>Value <code>"opus"</code></small>
 *   The option to let Skylink use the [OPUS](https://en.wikipedia.org/wiki/Opus_(audio_format)) codec.<br>
 *   This is the common and mandantory audio codec used.
 * @param {String} ISAC <small>Value <code>"ISAC"</code></small>
 *   The option to let Skylink use the [iSAC](https://en.wikipedia.org/wiki/Internet_Speech_Audio_Codec).<br>
 *   This only works if the browser supports the iSAC video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus'
};

/**
 * These are the list of socket connection error states that Skylink would trigger.
 * - These error states references the [socket.io-client events](http://socket.io/docs/client-api/).
 * @attribute SOCKET_ERROR
 * @type JSON
 * @param {Number} CONNECTION_FAILED <small>Value <code>0</code></small>
 *   The error state when Skylink have failed to establish a socket connection with
 *   platform signaling in the first attempt.
 * @param {String} RECONNECTION_FAILED <small>Value <code>-1</code></small>
 *   The error state when Skylink have failed to
 *   reestablish a socket connection with platform signaling after the first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} CONNECTION_ABORTED <small>Value <code>-2</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after the failed first attempt
 *   <code>CONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ABORTED <small>Value <code>-3</code></small>
 *   The error state when attempt to reestablish socket connection
 *   with platform signaling has been aborted after several failed reattempts
 *   <code>RECONNECTION_FAILED</code>.
 * @param {String} RECONNECTION_ATTEMPT <small>Value <code>-4</code></small>
 *   The error state when Skylink is attempting to reestablish
 *   a socket connection with platform signaling after a failed attempt
 *   <code>CONNECTION_FAILED</code> or <code>RECONNECTION_FAILED</code>.
 * @readOnly
 * @component Socket
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * These are the list of fallback attempt types that Skylink would attempt with.
 * @attribute SOCKET_FALLBACK
 * @type JSON
 * @param {String} NON_FALLBACK <small>Value <code>"nonfallback"</code> | Protocol <code>"http:"</code>,
 * <code>"https:"</code> | Transports <code>"WebSocket"</code>, <code>"Polling"</code></small>
 *   The current socket connection attempt
 *   is using the first selected socket connection port for
 *   the current selected transport <code>"Polling"</code> or <code>"WebSocket"</code>.
 * @param {String} FALLBACK_PORT <small>Value <code>"fallbackPortNonSSL"</code> | Protocol <code>"http:"</code>
 *  | Transports <code>"WebSocket"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTP</code> protocol connection with the current selected transport
 *   <code>"Polling"</code> or <code>"WebSocket"</code>.
 * @param {String} FALLBACK_PORT_SSL <small>Value <code>"fallbackPortSSL"</code> | Protocol <code>"https:"</code>
 *  | Transports <code>"WebSocket"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTPS</code> protocol connection with the current selected transport
 *   <code>"Polling"</code> or <code>"WebSocket"</code>.
 * @param {String} LONG_POLLING <small>Value <code>"fallbackLongPollingNonSSL"</code> | Protocol <code>"http:"</code>
 *  | Transports <code>"Polling"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTP</code> protocol connection with <code>"Polling"</code> after
 *   many attempts of <code>"WebSocket"</code> has failed.
 *   This occurs only for socket connection that is originally using
 *   <code>"WebSocket"</code> transports.
 * @param {String} LONG_POLLING_SSL <small>Value <code>"fallbackLongPollingSSL"</code> | Protocol <code>"https:"</code>
 *  | Transports <code>"Polling"</code></small>
 *   The current socket connection reattempt
 *   is using the next selected socket connection port for
 *   <code>HTTPS</code> protocol connection with <code>"Polling"</code> after
 *   many attempts of <code>"WebSocket"</code> has failed.
 *   This occurs only for socket connection that is originally using
 *   <code>"WebSocket"</code> transports.
 * @readOnly
 * @component Socket
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};

/**
 * These are the list of platform signaling system actions that Skylink would be given with.
 * - Upon receiving from the signaling, the application has to reflect the
 *   relevant actions given.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION_REASON:attribute"}}SYSTEM_ACTION_REASON{{/crossLink}}
 *   for the types of system action reasons that would be given.
 * @attribute SYSTEM_ACTION
 * @type JSON
 * @param {String} WARNING <small>Value <code>"warning"</code></small>
 *   This action serves a warning to self. Usually if
 *   warning is not heeded, it may result in an <code>REJECT</code> action.
 * @param {String} REJECT <small>Value <code>"reject"</code></small>
 *   This action means that self has been kicked out
 *   of the current signaling room connection, and subsequent Peer connections
 *   would be disconnected.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * These are the list of Skylink platform signaling codes as the reason
 *   for the system action given by the platform signaling that Skylink would receive.
 * - You may refer to {{#crossLink "Skylink/SYSTEM_ACTION:attribute"}}SYSTEM_ACTION{{/crossLink}}
 *   for the types of system actions that would be given.
 * - Reason codes like <code>FAST_MESSAGE</code>, <code>ROOM_FULL</code>, <code>VERIFICATION</code> and
 *   <code>OVER_SEAT_LIMIT</code> has been removed as they are no longer supported.
 * @attribute SYSTEM_ACTION_REASON
 * @type JSON
 * @param {String} ROOM_LOCKED <small>Value <code>"locked"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when room is locked and self is rejected from joining the room.
 * @param {String} DUPLICATED_LOGIN <small>Value <code>"duplicatedLogin"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the credentials given is already in use, which the platform signaling
 *   throws an exception for this error.<br>
 * This rarely occurs as Skylink handles this issue, and it's recommended to report this issue if this occurs.
 * @param {String} SERVER_ERROR <small>Value <code>"serverError"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the connection with the platform signaling has an exception with self.<br>
 * This rarely (and should not) occur and it's recommended to  report this issue if this occurs.
 * @param {String} EXPIRED <small>Value <code>"expired"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has expired so self is unable to join the room as
 *   the end time of the meeting has ended.<br>
 * Depending on other meeting timings available for this room, the persistent room will appear expired.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSED <small>Value <code>"roomclose"</code> | Action ties with <code>REJECT</code></small>
 *   The reason code when the persistent room meeting has ended and has been rendered expired so self is rejected
 *   from the room as the meeting is over.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @param {String} ROOM_CLOSING <small>Value <code>"toclose"</code> | Action ties with <code>WARNING</code></small>
 *   The reason code when the persistent room meeting is going to end soon, so this warning is given to inform
 *   users before self is rejected from the room.<br>
 * This relates to the persistent room feature configured in the Application Key.
 * @readOnly
 * @component Room
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.SYSTEM_ACTION_REASON = {
  //FAST_MESSAGE: 'fastmsg',
  ROOM_LOCKED: 'locked',
  //ROOM_FULL: 'roomfull',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  SERVER_ERROR: 'serverError',
  //VERIFICATION: 'verification',
  EXPIRED: 'expired',
  ROOM_CLOSED: 'roomclose',
  ROOM_CLOSING: 'toclose'
};

/**
 * The current version of the internal <u>Signaling Message (SM)</u> Protocol that Skylink is using.<br>
 * - This is not a feature for developers to use but rather for SDK developers to
 *   see the Protocol version used in this Skylink version.
 * - In some cases, this information may be used for reporting issues with Skylink.
 * - SM_PROTOCOL VERSION: <code>0.1.</code>.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @required
 * @component Socket
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.1';

/**
 * These are the list of available video codecs settings that Skylink would use
 *   when streaming video stream with Peers.
 * - The video codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>VP8</code> is
 *   used by default.
 * @attribute VIDEO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any video codec selected by the browser generated session description.
 * @param {String} VP8 <small>Value <code>"VP8"</code></small>
 *   The option to let Skylink use the [VP8](https://en.wikipedia.org/wiki/VP8) codec.<br>
 *   This is the common and mandantory video codec used by most browsers.
 * @param {String} H264 <small>Value <code>"H264"</code></small>
 *   The option to let Skylink use the [H264](https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC) codec.<br>
 *   This only works if the browser supports the H264 video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  H264: 'H264'
};

/**
 * These are the list of available audio codecs settings that Skylink would use
 *   when streaming audio stream with Peers.
 * - The audio codec would be used if the self and Peer's browser supports the selected codec.
 * - This would default to the browser selected codec. In most cases, option <code>OPUS</code> is
 *   used by default.
 * @attribute AUDIO_CODEC
 * @param {String} AUTO <small><b>DEFAULT</b> | Value <code>"auto"</code></small>
 *   The option to let Skylink use any audio codec selected by the browser generated session description.
 * @param {String} OPUS <small>Value <code>"opus"</code></small>
 *   The option to let Skylink use the [OPUS](https://en.wikipedia.org/wiki/Opus_(audio_format)) codec.<br>
 *   This is the common and mandantory audio codec used.
 * @param {String} ISAC <small>Value <code>"ISAC"</code></small>
 *   The option to let Skylink use the [iSAC](https://en.wikipedia.org/wiki/Internet_Speech_Audio_Codec).<br>
 *   This only works if the browser supports the iSAC video codec.
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus'
};

/**
 * These are the list of suggested video resolutions that Skylink should configure
 *   when retrieving self user media video stream.
 * - Setting the resolution may not force set the resolution provided as it
 *   depends on the how the browser handles the resolution.
 * - It's recommended to use video resolution option to maximum <code>FHD</code>, as the other
 *   resolution options may be unrealistic and create performance issues. However, we provide them
 *   to allow developers to test with the browser capability, but do use it at your own risk.
 * - The higher the resolution, the more CPU usage might be used, hence it's recommended to
 *   use the default option <code>VGA</code>.
 * - This follows the
 *   [Wikipedia Graphics display resolution page](https://en.wikipedia.org/wiki/Graphics_display_resolution#Video_Graphics_Array)
 * @param {JSON} QQVGA <small>Value <code>{ width: 160, height: 120 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use QQVGA resolution.
 * @param {JSON} HQVGA <small>Value <code>{ width: 240, height: 160 }</code> | Aspect Ratio <code>3:2</code></small>
 *   The option to use HQVGA resolution.
 * @param {JSON} QVGA <small>Value <code>{ width: 320, height: 240 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use QVGA resolution.
 * @param {JSON} WQVGA <small>Value <code>{ width: 384, height: 240 }</code> | Aspect Ratio <code>16:10</code></small>
 *   The option to use WQVGA resolution.
 * @param {JSON} HVGA <small>Value <code>{ width: 480, height: 320 }</code> | Aspect Ratio <code>3:2</code></small>
 *   The option to use HVGA resolution.
 * @param {JSON} VGA <small><b>DEFAULT</b> | Value <code>{ width: 640, height: 480 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use VGA resolution.
 * @param {JSON} WVGA <small>Value <code>{ width: 768, height: 480 }</code> | Aspect Ratio <code>16:10</code></small>
 *   The option to use WVGA resolution.
 * @param {JSON} FWVGA <small>Value <code>{ width: 854, height: 480 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use FWVGA resolution.
 * @param {JSON} SVGA <small>Value <code>{ width: 800, height: 600 }</code> | Aspect Ratio <code>4:3</code></small>
 *   The option to use SVGA resolution.
 * @param {JSON} DVGA <small>Value <code>{ width: 960, height: 640 }</code> | Aspect Ratio <code>3:2</code></small>
 *   The option to use DVGA resolution.
 * @param {JSON} WSVGA <small>Value <code>{ width: 1024, height: 576 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use WSVGA resolution.
 * @param {JSON} HD <small>Value <code>{ width: 1280, height: 720 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use HD resolution.
 * @param {JSON} HDPLUS <small>Value <code>{ width: 1600, height: 900 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use HDPLUS resolution.
 * @param {JSON} FHD <small>Value <code>{ width: 1920, height: 1080 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use FHD resolution.
 * @param {JSON} QHD <small>Value <code>{ width: 2560, height: 1440 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use QHD resolution.
 * @param {JSON} WQXGAPLUS <small>Value <code>{ width: 3200, height: 1800 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use WQXGAPLUS resolution.
 * @param {JSON} UHD <small>Value <code>{ width: 3840, height: 2160 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use UHD resolution.
 * @param {JSON} UHDPLUS <small>Value <code>{ width: 5120, height: 2880 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use UHDPLUS resolution.
 * @param {JSON} FUHD <small>Value <code>{ width: 7680, height: 4320 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use FUHD resolution.
 * @param {JSON} QUHD <small>Value <code>{ width: 15360, height: 8640 }</code> | Aspect Ratio <code>16:9</code></small>
 *   The option to use QUHD resolution.
 * @attribute VIDEO_RESOLUTION
 * @type JSON
 * @readOnly
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.VIDEO_RESOLUTION = {
  QQVGA: { width: 160, height: 120, aspectRatio: '4:3' },
  HQVGA: { width: 240, height: 160, aspectRatio: '3:2' },
  QVGA: { width: 320, height: 240, aspectRatio: '4:3' },
  WQVGA: { width: 384, height: 240, aspectRatio: '16:10' },
  HVGA: { width: 480, height: 320, aspectRatio: '3:2' },
  VGA: { width: 640, height: 480, aspectRatio: '4:3' },
  WVGA: { width: 768, height: 480, aspectRatio: '16:10' },
  FWVGA: { width: 854, height: 480, aspectRatio: '16:9' },
  SVGA: { width: 800, height: 600, aspectRatio: '4:3' },
  DVGA: { width: 960, height: 640, aspectRatio: '3:2' },
  WSVGA: { width: 1024, height: 576, aspectRatio: '16:9' },
  HD: { width: 1280, height: 720, aspectRatio: '16:9' },
  HDPLUS: { width: 1600, height: 900, aspectRatio: '16:9' },
  FHD: { width: 1920, height: 1080, aspectRatio: '16:9' },
  QHD: { width: 2560, height: 1440, aspectRatio: '16:9' },
  WQXGAPLUS: { width: 3200, height: 1800, aspectRatio: '16:9' },
  UHD: { width: 3840, height: 2160, aspectRatio: '16:9' },
  UHDPLUS: { width: 5120, height: 2880, aspectRatio: '16:9' },
  FUHD: { width: 7680, height: 4320, aspectRatio: '16:9' },
  QUHD: { width: 15360, height: 8640, aspectRatio: '16:9' }
};


this.Skylink = Skylink;

Skylink.prototype._enableDataChannel = true;

/**
 * Stores the list of DataChannel connections.
 * @attribute _dataChannels
 * @param {Array} (#peerId) The Peer ID associated with the list of
 *   DataChannel connections.
 * @param {Object} (#peerId).main The DataChannel connection object
 *   that is used for messaging only associated with the Peer connection.
 *   This is the sole channel for sending P2P messages in
 *   {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}}.
 *   This connection will always be kept alive until the Peer connection has
 *   ended. The <code>channelName</code> for this reserved key is <code>"main"</code>.
 * @param {Object} (#peerId).(#channelName) The DataChannel connection
 *   object that is used temporarily for a data transfer associated with the
 *   Peer connection. This is using caused by methods
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}}
 *   and {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}.
 *   This connection will be closed once the transfer has completed or terminated.
 *   The <code>channelName</code> is usually the data transfer ID.
 * @type JSON
 * @private
 * @component DataChannel
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._dataChannels = {};

/**
 * Starts a DataChannel connection with a Peer connection. If the
 *   DataChannel is provided in the parameter, it simply appends
 *   event handlers to check the current state of the DataChannel.
 * @method _createDataChannel
 * @param {String} peerId The Peer ID to start the
 *   DataChannel with or associate the provided DataChannel object
 *   connection with.
 * @param {String} channelType The DataChannel functionality type.
 *   [Rel: Skylink.DATA_CHANNEL_TYPE]
 * @param {Object} [dataChannel] The RTCDataChannel object received
 *   in the Peer connection <code>.ondatachannel</code> event.
 * @param {String} customChannelName The custom RTCDataChannel label
 *   name to identify the different opened channels.
 * @trigger dataChannelState
 * @return {Object} The DataChannel connection object associated with
 *   the provided Peer ID.
 * @private
 * @component DataChannel
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._createDataChannel = function(peerId, channelType, dc, customChannelName) {
  var self = this;

  if (typeof dc === 'string') {
    customChannelName = dc;
    dc = null;
  }

  if (!customChannelName) {
    log.error([peerId, 'RTCDataChannel', null, 'Aborting of creating Datachannel as no ' +
      'channel name is provided for channel. Aborting of creating Datachannel'], {
        channelType: channelType
      });
    return;
  }

  var channelName = (dc) ? dc.label : customChannelName;
  var pc = self._peerConnections[peerId];

  var SctpSupported = 
    !(window.webrtcDetectedBrowser === 'chrome' && window.webrtcDetectedVersion < 30 || 
      window.webrtcDetectedBrowser === 'opera'  && window.webrtcDetectedVersion < 20 );

  if (!SctpSupported) {
    log.warn([peerId, 'RTCDataChannel', channelName, 'SCTP not supported'], {
      channelType: channelType
    });
    return;
  }

  var dcHasOpened = function () {
    log.log([peerId, 'RTCDataChannel', channelName, 'Datachannel state ->'], {
      readyState: 'open',
      channelType: channelType
    });

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.OPEN,
      peerId, null, channelName, channelType);
  };

  if (!dc) {
    try {
      dc = pc.createDataChannel(channelName);

      if (dc.readyState === self.DATA_CHANNEL_STATE.OPEN) {
        // the datachannel was not defined in array before it was triggered
        // set a timeout to allow the dc objec to be returned before triggering "open"
        setTimeout(dcHasOpened, 500);
      } else {
        self._trigger('dataChannelState', dc.readyState, peerId, null,
          channelName, channelType);

        self._wait(function () {
          log.log([peerId, 'RTCDataChannel', dc.label, 'Firing callback. ' +
            'Datachannel state has opened ->'], dc.readyState);
          dcHasOpened();
        }, function () {
          return dc.readyState === self.DATA_CHANNEL_STATE.OPEN;
        });
      }

      log.debug([peerId, 'RTCDataChannel', channelName, 'Datachannel RTC object is created'], {
        readyState: dc.readyState,
        channelType: channelType
      });

    } catch (error) {
      log.error([peerId, 'RTCDataChannel', channelName, 'Exception occurred in datachannel:'], {
        channelType: channelType,
        error: error
      });
      self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, error,
        channelName, channelType);
      return;
    }
  } else {
    if (dc.readyState === self.DATA_CHANNEL_STATE.OPEN) {
      // the datachannel was not defined in array before it was triggered
      // set a timeout to allow the dc objec to be returned before triggering "open"
      setTimeout(dcHasOpened, 500);
    } else {
      dc.onopen = dcHasOpened;
    }
  }

  log.log([peerId, 'RTCDataChannel', channelName, 'Binary type support ->'], {
    binaryType: dc.binaryType,
    readyState: dc.readyState,
    channelType: channelType
  });

  dc.dcType = channelType;

  dc.onerror = function(error) {
    log.error([peerId, 'RTCDataChannel', channelName, 'Exception occurred in datachannel:'], {
      channelType: channelType,
      readyState: dc.readyState,
      error: error
    });
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, error,
       channelName, channelType);
  };

  dc.onclose = function() {
    log.debug([peerId, 'RTCDataChannel', channelName, 'Datachannel state ->'], {
      readyState: 'closed',
      channelType: channelType
    });

    dc.hasFiredClosed = true;

    // give it some time to set the variable before actually closing and checking.
    setTimeout(function () {
      // redefine pc
      pc = self._peerConnections[peerId];
      // if closes because of firefox, reopen it again
      // if it is closed because of a restart, ignore

      var checkIfChannelClosedDuringConn = !!pc ? !pc.dataChannelClosed : false;

      if (checkIfChannelClosedDuringConn && dc.dcType === self.DATA_CHANNEL_TYPE.MESSAGING) {
        log.debug([peerId, 'RTCDataChannel', channelName, 'Re-opening closed datachannel in ' +
          'on-going connection'], {
            channelType: channelType,
            readyState: dc.readyState,
            isClosedDuringConnection: checkIfChannelClosedDuringConn
        });

        self._dataChannels[peerId].main =
          self._createDataChannel(peerId, self.DATA_CHANNEL_TYPE.MESSAGING, null, peerId);

        log.debug([peerId, 'RTCDataChannel', channelName, 'Re-opened closed datachannel'], {
          channelType: channelType,
          readyState: dc.readyState,
          isClosedDuringConnection: checkIfChannelClosedDuringConn
        });

      } else {
        self._closeDataChannel(peerId, channelName);
        self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CLOSED, peerId, null,
          channelName, channelType);

        log.debug([peerId, 'RTCDataChannel', channelName, 'Datachannel has closed'], {
          channelType: channelType,
          readyState: dc.readyState,
          isClosedDuringConnection: checkIfChannelClosedDuringConn
        });
      }
    }, 100);
  };

  dc.onmessage = function(event) {
    self._dataChannelProtocolHandler(event.data, peerId, channelName, channelType);
  };

  return dc;
};

/**
 * Sends data over the DataChannel connection associated
 *    with the Peer connection.
 * The current supported data type is <code>string</code>. <code>Blob</code>,
 *   <code>ArrayBuffer</code> types support is not yet currently handled or
 *   implemented.
 * @method _sendDataChannelMessage
 * @param {String} peerId The Peer ID to send the data to the
 *   associated DataChannel connection.
 * @param {JSON|String} data The data to send over. <code>string</code> is only
 *   used to send binary data string over. <code>JSON</code> is primarily used
 *   for the {{#crossLink "Skylink/DT_PROTOCOL_VERSION:attribute"}}DT Protocol{{/crossLink}}
 *   that Skylink follows for P2P messaging and transfers.
 * @param {String} [channelName="main"] The DataChannel channelName of the connection
 *   to send the data over to. The datachannel to send messages to. By default,
 *   if the DataChannel <code>channelName</code> is not provided,
 *   the DataChannel connection associated with the channelName <code>"main"</code> would be used.
 * @trigger dataChannelState
 * @private
 * @component DataChannel
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._sendDataChannelMessage = function(peerId, data, channelKey) {
  var self = this;

  var channelName;

  if (!channelKey || channelKey === peerId) {
    channelKey = 'main';
  }

  var dcList = self._dataChannels[peerId] || {};
  var dc = dcList[channelKey];

  if (!dc) {
    log.error([peerId, 'RTCDataChannel', channelKey + '|' + channelName,
      'Datachannel connection to peer does not exist'], {
        enabledState: self._enableDataChannel,
        dcList: dcList,
        dc: dc,
        type: (data.type || 'DATA'),
        data: data,
        channelKey: channelKey
    });
    return;
  } else {
    channelName = dc.label;

    log.debug([peerId, 'RTCDataChannel', channelKey + '|' + channelName,
      'Sending data using this channel key'], data);

    if (dc.readyState === this.DATA_CHANNEL_STATE.OPEN) {
      var dataString = (typeof data === 'object') ? JSON.stringify(data) : data;
      log.debug([peerId, 'RTCDataChannel', channelKey + '|' + dc.label,
        'Sending to peer ->'], {
          readyState: dc.readyState,
          type: (data.type || 'DATA'),
          data: data
      });
      dc.send(dataString);
    } else {
      log.error([peerId, 'RTCDataChannel', channelKey + '|' + dc.label,
        'Datachannel is not opened'], {
          readyState: dc.readyState,
          type: (data.type || 'DATA'),
          data: data
      });
      this._trigger('dataChannelState', this.DATA_CHANNEL_STATE.ERROR,
        peerId, 'Datachannel is not ready.\nState is: ' + dc.readyState);
    }
  }
};

/**
 * Stops DataChannel connections associated with a Peer connection
 *   and remove any object references to the DataChannel connection(s).
 * @method _closeDataChannel
 * @param {String} peerId The Peer ID associated with the DataChannel
 *   connection(s) to close.
 * @param {String} [channelName] The targeted DataChannel <code>channelName</code>
 *   to close the connection with. If <code>channelName</code> is not provided,
 *   all associated DataChannel connections with the Peer connection would be closed.
 * @trigger dataChannelState
 * @private
 * @component DataChannel
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._closeDataChannel = function(peerId, channelName) {
  var self = this;
  var dcList = self._dataChannels[peerId] || {};
  var dcKeysList = Object.keys(dcList);


  if (channelName) {
    dcKeysList = [channelName];
  }

  for (var i = 0; i < dcKeysList.length; i++) {
    var channelKey = dcKeysList[i];
    var dc = dcList[channelKey];

    if (dc) {
      if (dc.readyState !== self.DATA_CHANNEL_STATE.CLOSED) {
        log.log([peerId, 'RTCDataChannel', channelKey + '|' + dc.label,
          'Closing datachannel']);
        dc.close();
      } else {
        if (!dc.hasFiredClosed && window.webrtcDetectedBrowser === 'firefox') {
          log.log([peerId, 'RTCDataChannel', channelKey + '|' + dc.label,
            'Closed Firefox datachannel']);
          self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CLOSED, peerId,
            null, channelName, channelKey === 'main' ? self.DATA_CHANNEL_TYPE.MESSAGING :
            self.DATA_CHANNEL_TYPE.DATA);
        }
      }
      delete self._dataChannels[peerId][channelKey];

      log.log([peerId, 'RTCDataChannel', channelKey + '|' + dc.label,
        'Sucessfully removed datachannel']);
    } else {
      log.log([peerId, 'RTCDataChannel', channelKey + '|' + channelName,
        'Unable to close Datachannel as it does not exists'], {
          dc: dc,
          dcList: dcList
      });
    }
  }
};
Skylink.prototype._CHUNK_FILE_SIZE = 49152;

/**
 * The fixed data chunk size for
 *   [<code>dataURL</code>](https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs)
 *   (which is a binary string (base64) and known as data URIs)
 *   data transfers using DataChannel connection.
 * @attribute _CHUNK_DATAURL_SIZE
 * @type Number
 * @private
 * @final
 * @component DataProcess
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._CHUNK_DATAURL_SIZE = 1212;

/**
 * The fixed data chunk size for
 *   [<code>Blob</code>](https://developer.mozilla.org/en/docs/Web/API/Blob)
 *   data type for transfers using DataChanel connection on
 *   Firefox based browsers.
 * Limitations is different for Firefox as tested in some PCs (linux predominantly)
 *   that sending a packet size of <code>49152</code>kb from another browser
 *   reflects as <code>16384</code>kb packet size when received.
 * @attribute _MOZ_CHUNK_FILE_SIZE
 * @type Number
 * @private
 * @final
 * @component DataProcess
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._MOZ_CHUNK_FILE_SIZE = 12288;

/**
 * These are the list of available transfer encodings that would be used by Skylink during a data transfer.
 * - The currently supported data type is <code>BINARY_STRING</code>.
 * - Support for data types <code>BLOB</code> and <code>ARRAY_BUFFER</code> is still in implementation.
 * @attribute DATA_TRANSFER_DATA_TYPE
 * @type JSON
 * @param {String} BINARY_STRING <small><b>DEFAULT</b> | Value <code>"binaryString"</code></small>
 *   The option to let Skylink encode data packets using
 *   [binary converted strings](https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs)
 *   when sending the data packets through the DataChannel connection during data transfers.
 * @param {String} ARRAY_BUFFER <small><em>IN IMPLEMENTATION</em> | Value <code>"arrayBuffer"</code></small>
 *   The option to let Skylink encode data packets using
 *   [ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
 *   when sending the data packets through the DataChannel connection during data transfers.
 * @param {String} BLOB <small><em>IN IMPLEMENTATION</em> | Value <code>"blob"</code></small>
 *   The option to let Skylink encode data packets using
 *   [Blobs](https://developer.mozilla.org/en/docs/Web/API/Blob)
 *   when sending the data packets through the DataChannel connection during data transfers.
 * @readOnly
 * @component DataProcess
 * @partof DATA TRANSFER FUNCTIONALITY
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.DATA_TRANSFER_DATA_TYPE = {
  BINARY_STRING: 'binaryString',
  ARRAY_BUFFER: 'arrayBuffer',
  BLOB: 'blob'
};

/**
 * Converts a binary string (base64) derived from
 *  [dataURL conversion](https://developer.mozilla.org/en-US
 *   /docs/Web/API/FileReader/readAsDataURL)
 *   to a Blob data object.<br>
 * <small>Author: devnull69@stackoverflow.com #6850276</small>
 * @method _base64ToBlob
 * @param {String} dataURL The binary string (base64) to convert.
 * @return {Blob} The converted Blob data object.
 * @private
 * @component DataProcess
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._base64ToBlob = function(dataURL) {
  var byteString = atob(dataURL.replace(/\s\r\n/g, ''));
  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var j = 0; j < byteString.length; j++) {
    ia[j] = byteString.charCodeAt(j);
  }
  // write the ArrayBuffer to a blob, and you're done
  return new Blob([ab]);
};

/**
 * Converts a Blob data object into a binary string (base64) using
 *   [dataURL conversion](https://developer.mozilla.org/en-US
 *   /docs/Web/API/FileReader/readAsDataURL)
 * @method _blobToBase64
 * @param {Blob} data The Blob data object to convert.
 * @param {Function} callback The callback triggered when Blob data
 *   conversion to binary string (base64) has completed.
 * @param {String} callback.data The converted binary string (base64).
 * @private
 * @component DataProcess
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._blobToBase64 = function(data, callback) {
  var fileReader = new FileReader();
  fileReader.onload = function() {
    // Load Blob as dataurl base64 string
    var base64BinaryString = fileReader.result.split(',')[1];
    callback(base64BinaryString);
  };
  fileReader.readAsDataURL(data);
};

/**
 * Chunks a huge Blob data object into smaller Blob data object chunks
 *   based on the chunk sizes provided.
 * If provided Blob data object is smaller than chunk sizes, it will return an array
 *   length of <code>1</code> with the Blob data object.
 * @method _chunkBlobData
 * @param {Blob} blob The huge Blob binary data object.
 * @param {Number} chunkSize The chunk size that the Blob binary data should be cut
 *   into.
 * @return {Array} The array of chunked Blob data objects based on the Blob data
 *   object provided.
 * @private
 * @component DataProcess
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._chunkBlobData = function(blob, chunkSize) {
  var chunksArray = [];
  var startCount = 0;
  var endCount = 0;
  var blobByteSize = blob.size;

  if (blobByteSize > chunkSize) {
    // File Size greater than Chunk size
    while ((blobByteSize - 1) > endCount) {
      endCount = startCount + chunkSize;
      chunksArray.push(blob.slice(startCount, endCount));
      startCount += chunkSize;
    }
    if ((blobByteSize - (startCount + 1)) > 0) {
      chunksArray.push(blob.slice(startCount, blobByteSize - 1));
    }
  } else {
    // File Size below Chunk size
    chunksArray.push(blob);
  }
  return chunksArray;
};

/**
 * Chunks a huge dataURL binary string (base64)
 *   into smaller strings based on the chunk length provided.
 * If provided dataURL binary string (base64)
 *   is smaller than chunk length, it will return an array
 *   length of <code>1</code> with the dataURL string.
 * @method _chunkDataURL
 * @param {String} dataURL The huge dataURL binary string (base64).
 * @param {Number} chunkSize The string (chunk) length that the dataURL
 *   binary string (base64) should be cut into.
 * @return {Array} The array of chunked dataURL binary strings
 *   (base64) based on the dataURL string provided.
 * @private
 * @component DataProcess
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._chunkDataURL = function(dataURL, chunkSize) {
  var outputStr = dataURL; //encodeURIComponent(dataURL);
  var dataURLArray = [];
  var startCount = 0;
  var endCount = 0;
  var dataByteSize = dataURL.size || dataURL.length;

  if (dataByteSize > chunkSize) {
    // File Size greater than Chunk size
    while ((dataByteSize - 1) > endCount) {
      endCount = startCount + chunkSize;
      dataURLArray.push(outputStr.slice(startCount, endCount));
      startCount += chunkSize;
    }
    if ((dataByteSize - (startCount + 1)) > 0) {
      chunksArray.push(outputStr.slice(startCount, dataByteSize - 1));
    }
  } else {
    // File Size below Chunk size
    dataURLArray.push(outputStr);
  }

  return dataURLArray;
};

/**
 * Assembles the data string chunks of a chunked dataURL
 *   binary string (base64) into the original dataURL binary string (base64).
 * @method _assembleDataURL
 * @param {Array} dataURLArray The array of chunked dataURL binary strings
 *   (base64) based on the dataURL string provided.
 * @return {String} The original huge dataURL binary string (base64).
 * @private
 * @component DataProcess
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._assembleDataURL = function(dataURLArray) {
  var outputStr = '';

  for (var i = 0; i < dataURLArray.length; i++) {
    try {
      outputStr += dataURLArray[i];
    } catch (error) {
      console.error('Malformed', i, dataURLArray[i]);
    }
  }

  return outputStr;
};
Skylink.prototype._TRANSFER_DELIMITER = '_skylink__';

/**
 * The list of Protocol types that is used for transfers and messaging using
 *   the DataChannel connection.
 * @attribute _DC_PROTOCOL_TYPE
 * @type JSON
 * @param {String} WRQ Protocol to initiate a transfer request on the current
 *   DataChannel connection. Data transfer step 1.
 * @param {String} ACK Protocol to accept or reject the transfer request.
 *   Data transfer step 2.
 * @param {String} DATA Actual binary data or string send based on the
 *   <code>ackN</code> in the <code>ACK</code> packet received.
 *   Data transfer step 3. This may not occur is step 2 is rejected.
 * @param {String} CANCEL Protocol to terminate an ongoing transfer.
 *   This data transfer step can happen after step 2 or 3.
 * @param {String} ERROR Protocol that is sent when a transfer occurs an exception
 *   which using causes it to be terminated.
 *   This data transfer step can happen after step 2 or 3.
 * @param {String} MESSAGE Protocol that is used to send P2P message objects
 *   over the DataChannel connection.
 *   This is not related to any data transfer step, but for messaging purposes.
 * @final
 * @private
 * @for Skylink
 * @component DataTransfer
 * @since 0.5.2
 */
Skylink.prototype._DC_PROTOCOL_TYPE = {
  WRQ: 'WRQ',
  ACK: 'ACK',
  ERROR: 'ERROR',
  CANCEL: 'CANCEL',
  MESSAGE: 'MESSAGE'
};

/**
 * The list of platforms that Skylink should fallback to use the
 *   {{#crossLink "Skylink/DATA_CHANNEL_TYPE:attr"}}<code>
 *   DATA_CHANNEL_TYPE.MESSAGING</code>{{/crossLink}}
 *   channel for transfers instead of using multi-transfers
 *   due to the lack of support in the platform implementations.
 * @attribute _INTEROP_MULTI_TRANSFERS
 * @type Array
 * @final
 * @private
 * @for Skylink
 * @component DataTransfer
 * @since 0.6.1
 */
Skylink.prototype._INTEROP_MULTI_TRANSFERS = ['Android', 'iOS'];

/**
 * These are the types of data transfers that indicates if transfer is an
 *   outgoing <small><em>(uploading)</em></small> or incoming <small><em>(downloding)</em></small> transfers.
 * @attribute DATA_TRANSFER_TYPE
 * @type JSON
 * @param {String} UPLOAD <small>Value <code>"upload"</code></small>
 *   This data transfer is an outgoing <em>(uploading)</em> transfer.<br>
 *   Data is sent to the receiving Peer using the associated DataChannel connection.
 * @param {String} DOWNLOAD <small>Value <code>"download"</code></small>
 *   The data transfer is an incoming <em>(downloading)</em> transfer.<br>
 *   Data is received from the sending Peer using the associated DataChannel connection.
 * @readOnly
 * @component DataTransfer
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.DATA_TRANSFER_TYPE = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download'
};

/**
 * These are the list of data transfer states that Skylink would trigger.
 * @attribute DATA_TRANSFER_STATE
 * @type JSON
 * @param {String} UPLOAD_REQUEST <small>Value <code>"request"</code></small>
 *   The state when a data transfer request has been received from Peer.
 * This happens after Peer starts a data transfer using
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}} or
 *   {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}.
 * @param {String} UPLOAD_STARTED <small>Value <code>"uploadStarted"</code></small>
 *   The state when the data transfer will begin and start to upload the first data
 *   packets to receiving Peer.<br>
 * This happens after receiving Peer accepts a data transfer using
 *   {{#crossLink "Skylink/acceptDataTransfer:method"}}acceptDataTransfer(){{/crossLink}}.
 * @param {String} DOWNLOAD_STARTED <small>Value <code>"downloadStarted"</code></small>
 *   The state when the data transfer has begin and associated DataChannel connection is
 *   expected to receive the first data packet from sending Peer.<br>
 * This happens after self accepts a data transfer using
 *   {{#crossLink "Skylink/acceptDataTransfer:method"}}acceptDataTransfer(){{/crossLink}} upon
 *   the triggered state of <code>UPLOAD_REQUEST</code>.
 * @param {String} REJECTED <small>Value <code>"rejected"</code></small>
 *   The state when the data transfer has been rejected by receiving Peer and data transfer is
 *   terminated.<br>
 * This happens after Peer rejects a data transfer using
 *   {{#crossLink "Skylink/acceptDataTransfer:method"}}acceptDataTransfer(){{/crossLink}}.
 * @param {String} UPLOADING <small>Value <code>"uploading"</code></small>
 *   The state when the data transfer is still being transferred to receiving Peer.<br>
 * This happens after state <code>UPLOAD_STARTED</code>.
 * @param {String} DOWNLOADING <small>Value <code>"downloading"</code></small>
 *   The state when the data transfer is still being transferred from sending Peer.<br>
 * This happens after state <code>DOWNLOAD_STARTED</code>.
 * @param {String} UPLOAD_COMPLETED <small>Value <code>"uploadCompleted"</code></small>
 *   The state when the data transfer has been transferred to receiving Peer successfully.<br>
 * This happens after state <code>UPLOADING</code> or <code>UPLOAD_STARTED</code>, depending
 *   on how huge the data being transferred is.
 * @param {String} DOWNLOAD_COMPLETED <small>Value <code>"downloadCompleted"</code></small>
 *   The state when the data transfer has been transferred from sending Peer successfully.<br>
 * This happens after state <code>DOWNLOADING</code> or <code>DOWNLOAD_STARTED</code>, depending
 *   on how huge the data being transferred is.
 * @param {String} CANCEL <small>Value <code>"cancel"</code></small>
 *   The state when the data transfer has been terminated by Peer.<br>
 * This happens after state <code>DOWNLOAD_STARTED</code> or <code>UPLOAD_STARTED</code>.
 * @param {String} ERROR <small>Value <code>"error"</code></small>
 *   The state when the data transfer has occurred an exception.<br>
 * At this stage, the data transfer would usually be terminated and may lead to state <code>CANCEL</code>.
 * @readOnly
 * @component DataTransfer
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.DATA_TRANSFER_STATE = {
  UPLOAD_REQUEST: 'request',
  UPLOAD_STARTED: 'uploadStarted',
  DOWNLOAD_STARTED: 'downloadStarted',
  REJECTED: 'rejected',
  CANCEL: 'cancel',
  ERROR: 'error',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  UPLOAD_COMPLETED: 'uploadCompleted',
  DOWNLOAD_COMPLETED: 'downloadCompleted'
};

/**
 * Stores the list of ongoing data transfers data packets (chunks) to be sent to receiving end
 *   in a DataChannel connection based on the associated DataChannel ID.
 * @attribute _uploadDataTransfers
 * @param {Array} (#channelName) The ongoing data transfer packets to be sent to
 *   receiving end associated with the DataChannel connection.
 * @param {Blob|String} (#channelName).(#index) The packet index of chunked Blob data object or
 *   dataURL string (base64 binary string) to be sent to received end.
 * @type JSON
 * @private
 * @required
 * @component DataTransfer
 * @for Skylink
 * @since 0.4.1
 */
Skylink.prototype._uploadDataTransfers = {};

/**
 * Stores the list of ongoing data transfer state informations that is sent to receiving end
 *   in a DataChannel connection based on the associated DataChannel ID.
 * @attribute _uploadDataSessions
 * @param {JSON} (#channelName) The ongoing data transfer information that is sent
 *   to receiving end associated with the DataChannel connection.
 * @param {String} (#channelName).name The data transfer name.
 * @param {Number} (#channelName).size The expected data size of the
 *   completed data transfer.
 * @param {Boolean} (#channelName).isUpload The flag that indicates if the
 *   transfer is an upload data transfer.
 *   In this case, the value should be <code>true</code>.
 * @param {String} (#channelName).senderPeerId The Peer uploader ID.
 * @param {String} (#channelName).transferId The data transfer ID.
 * @param {Number} (#channelName).percentage The data transfer percentage.
 * @param {Number} (#channelName).timeout The data transfer timeout.
 * @param {Number} (#channelName).chunkSize The data transfer packet (chunk) size.
 * @param {String} (#channelName).dataType The data transfer packet (chunk) data type.
 * @type JSON
 * @private
 * @required
 * @component DataTransfer
 * @for Skylink
 * @since 0.4.1
 */
Skylink.prototype._uploadDataSessions = {};

/**
 * Stores the list of ongoing data transfers data packets (chunks) to be received from
 *   sending point in a DataChannel connection based on the associated DataChannel ID.
 * @attribute _downloadDataTransfers
 * @param {Array} (#channelName) The ongoing data transfer packets received
 *   associated with DataChannel.
 * @param {Blob|String} (#channelName).(#index) The packet index of chunked Blob data object or
 *   dataURL string (base64 binary string) received from sending point.
 * @type JSON
 * @private
 * @required
 * @component DataTransfer
 * @for Skylink
 * @since 0.4.1
 */
Skylink.prototype._downloadDataTransfers = {};

/**
 * Stores the list of ongoing data transfer state informations that is received from
 *   the sender point in a DataChannel connection based on the associated DataChannel ID.
 * @attribute _downloadDataSessions
 * @param {JSON} (#channelName) The ongoing data transfer information that is sent
 *   to receiving end associated with the DataChannel connection.
 * @param {String} (#channelName).name The data transfer name.
 * @param {Number} (#channelName).size The expected data size of the
 *   completed data transfer.
 * @param {Boolean} (#channelName).isUpload The flag that indicates if the
 *   transfer is an upload data transfer.
 *   In this case, the value should be <code>false</code>.
 * @param {String} (#channelName).senderPeerId The Peer uploader ID.
 * @param {String} (#channelName).transferId The data transfer ID.
 * @param {Number} (#channelName).percentage The data transfer percentage.
 * @param {Number} (#channelName).timeout The data transfer timeout to wait for response
 *   before throwing a timeout error.
 * @param {Number} (#channelName).chunkSize The data transfer packet (chunk) size.
 * @param {String} (#channelName).dataType The data transfer packet (chunk) data type.
 * @type JSON
 * @private
 * @required
 * @component DataTransfer
 * @for Skylink
 * @since 0.4.1
 */
Skylink.prototype._downloadDataSessions = {};

/**
 * Stores the list of ongoing data transfer timeouts using the
 *   <code>setTimeout</code> objects for each DataChannel connection transfer.
 * @attribute _dataTransfersTimeout
 * @param {Object} (#channelName) The timeout for the associated DataChannel
 *   connection.
 * @type JSON
 * @private
 * @required
 * @component DataTransfer
 * @for Skylink
 * @since 0.4.1
 */
Skylink.prototype._dataTransfersTimeout = {};

/**
 * Sets a waiting timeout for every response sent to DataChannel connection receiving
 *   end. Once the timeout has ended, a timeout error will be thrown and
 *   data transfer will be terminated.
 * @method _setDataChannelTimeout
 * @param {String} peerId The Peer ID associated with the DataChannel connection.
 * @param {Number} timeout The waiting timeout in seconds.
 * @param {Boolean} [isSender=false] The flag thats indicates if the response
 *   is related to a downloading or uploading data transfer.
 * @param {String} channelName The DataChannel connection ID.
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype._setDataChannelTimeout = function(peerId, timeout, isSender, channelName) {
  var self = this;
  if (!self._dataTransfersTimeout[channelName]) {
    self._dataTransfersTimeout[channelName] = null;
  }
  var type = (isSender) ? self.DATA_TRANSFER_TYPE.UPLOAD :
    self.DATA_TRANSFER_TYPE.DOWNLOAD;

  self._dataTransfersTimeout[channelName] = setTimeout(function() {
    var name;
    if (self._dataTransfersTimeout[channelName][type]) {
      if (isSender) {
        name = self._uploadDataSessions[channelName].name;
        delete self._uploadDataTransfers[channelName];
        delete self._uploadDataSessions[channelName];
      } else {
        name = self._downloadDataSessions[channelName].name;
        delete self._downloadDataTransfers[channelName];
        delete self._downloadDataSessions[channelName];
      }

      self._sendDataChannelMessage(peerId, {
        type: self._DC_PROTOCOL_TYPE.ERROR,
        sender: self._user.sid,
        name: name,
        content: 'Connection Timeout. Longer than ' + timeout +
          ' seconds. Connection is abolished.',
        isUploadError: isSender
      }, channelName);
      // TODO: Find a way to add channel name so it's more specific
      log.error([peerId, 'RTCDataChannel', channelName, 'Failed transfering data:'],
        'Transfer ' + ((isSender) ? 'for': 'from') + ' ' + peerId +
        ' failed. Connection timeout');
      self._clearDataChannelTimeout(peerId, isSender, channelName);
    }
  }, 1000 * timeout);
};

/**
 * Stops and clears the waitig timeout for the associated DataChannel connection.
 * @method _clearDataChannelTimeout
 * @param {String} peerId The Peer ID associated with the DataChannel connection.
 * @param {Boolean} [isSender=false] The flag thats indicates if the response
 *   is related to a downloading or uploading data transfer.
 * @param {String} channelName The DataChannel connection ID.
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype._clearDataChannelTimeout = function(peerId, isSender, channelName) {
  if (this._dataTransfersTimeout[channelName]) {
    clearTimeout(this._dataTransfersTimeout[channelName]);
    delete this._dataTransfersTimeout[channelName];
    log.debug([peerId, 'RTCDataChannel', channelName, 'Clear datachannel timeout']);
  } else {
    log.debug([peerId, 'RTCDataChannel', channelName, 'Unable to find timeouts. ' +
      'Not clearing the datachannel timeouts']);
  }
};

/**
 * Starts a data transfer with a Peer. If multi-transfer is supported,
 *   Skylink would open a new DataChannel connection with Peer to start
 *   data transfer. If mutli-transfer is not supported in
 *   {{#crossLink "Skylink/_INTEROP_MULTI_TRANSFERS:attr"}}_INTEROP_MULTI_TRANSFERS{{/crossLink}},
 *   the data transfer would start in the {{#crossLink "Skylink/DATA_CHANNEL_TYPE:attr"}}<code>
 *   DATA_CHANNEL_TYPE.MESSAGING</code>{{/crossLink}} channel instead.
 * @method _sendBlobDataToPeer
 * @param {Blob} data The Blob data object to send.
 * @param {JSON} dataInfo The data transfer information.
 * @param {String} dataInfo.transferId The transfer ID of the data transfer.
 * @param {String} dataInfo.name The transfer Blob data object name.
 * @param {Number} [dataInfo.timeout=60] The timeout set to await in seconds
 *   for response from DataChannel connection.
 * @param {Number} dataInfo.size The Blob data binary size expected to be received in the receiving end.
 * @param {Boolean} [dataInfo.isPrivate=false] The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {String|Array} [targetPeerId=null] The receiving Peer ID. Array is used for
 *   MCU connection where multi-targeted Peers are used. By default, the
 *   value is <code>null</code>, which indicates that the data transfer is requested with all
 *   connected Peers.
 * @return {String} The DataChannel connection ID associated with the transfer. If returned
 *   as <code>null</code> or empty, it indicates an error.
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._sendBlobDataToPeer = function(data, dataInfo, targetPeerId) {
  var self = this;
  //If there is MCU then directs all messages to MCU
  var targetChannel = targetPeerId;//(self._hasMCU) ? 'MCU' : targetPeerId;
  var targetPeerList = [];

  var binarySize = parseInt((dataInfo.size * (4 / 3)).toFixed(), 10);
  var binaryChunkSize = 0;
  var chunkSize = 0;
  var i;
  var hasSend = false;

  // move list of peers to targetPeerList
  if (self._hasMCU) {
    if (Array.isArray(targetPeerList)) {
      targetPeerList = targetPeerId;
    } else {
      targetPeerList = [targetPeerId];
    }
    targetPeerId = 'MCU';
  }

  if (dataInfo.dataType !== 'blob') {
    // output: 1616
    binaryChunkSize = self._CHUNK_DATAURL_SIZE;
    chunkSize = self._CHUNK_DATAURL_SIZE;
    binarySize = dataInfo.size;
  } else if (window.webrtcDetectedBrowser === 'firefox') {
    // output: 16384
    binaryChunkSize = self._MOZ_CHUNK_FILE_SIZE * (4 / 3);
    chunkSize = self._MOZ_CHUNK_FILE_SIZE;
  } else {
    // output: 65536
    binaryChunkSize = parseInt((self._CHUNK_FILE_SIZE * (4 / 3)).toFixed(), 10);
    chunkSize = self._CHUNK_FILE_SIZE;
  }

  var throwTransferErrorFn = function (message) {
    // MCU targetPeerId case - list of peers
    if (self._hasMCU) {
      for (i = 0; i < targetPeerList.length; i++) {
        var peerId = targetPeerList[i];
        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR,
          dataInfo.transferId, peerId, {
            name: dataInfo.name,
            size: dataInfo.size,
            percentage: 0,
            data: null,
            dataType: dataInfo.dataType,
            senderPeerId: self._user.sid,
            timeout: dataInfo.timeout,
            isPrivate: dataInfo.isPrivate
          },{
            message: message,
            transferType: self.DATA_TRANSFER_TYPE.UPLOAD
        });
      }
    } else {
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR,
        dataInfo.transferId, targetPeerId, {
          name: dataInfo.name,
          size: dataInfo.size,
          percentage: 0,
          data: null,
          dataType: dataInfo.dataType,
          senderPeerId: self._user.sid,
          timeout: dataInfo.timeout,
          isPrivate: dataInfo.isPrivate
        },{
          message: message,
          transferType: self.DATA_TRANSFER_TYPE.UPLOAD
      });
    }
  };

  var startTransferFn = function (targetId, channel) {
    if (!hasSend) {
      hasSend = true;
      var payload = {
        type: self._DC_PROTOCOL_TYPE.WRQ,
        sender: self._user.sid,
        agent: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        name: dataInfo.name,
        size: binarySize,
        dataType: dataInfo.dataType,
        chunkSize: binaryChunkSize,
        timeout: dataInfo.timeout,
        target: self._hasMCU ? targetPeerList : targetPeerId,
        isPrivate: dataInfo.isPrivate
      };

      if (self._hasMCU) {
        // if has MCU and is public, do not send individually
        self._sendDataChannelMessage('MCU', payload, channel);
        try {
          var mainChannel = self._dataChannels.MCU.main.label;
          self._setDataChannelTimeout('MCU', dataInfo.timeout, true, mainChannel);
        } catch (error) {
          log.error(['MCU', 'RTCDataChannel', 'MCU', 'Failed setting datachannel ' +
            'timeout for MCU'], error);
        }
      } else {
        // if has MCU and is public, do not send individually
        self._sendDataChannelMessage(targetId, payload, channel);
        self._setDataChannelTimeout(targetId, dataInfo.timeout, true, channel);
      }

    }
  };

  log.log([targetPeerId, 'RTCDataChannel', targetChannel, 'Chunk size of data:'], {
    chunkSize: chunkSize,
    binaryChunkSize: binaryChunkSize,
    transferId: dataInfo.transferId,
    dataType: dataInfo.dataType
  });


  var supportMulti = false;
  var peerAgent = (self._peerInformations[targetPeerId] || {}).agent || {};

  if (!peerAgent && !peerAgent.name) {
    log.error([targetPeerId, 'RTCDataChannel', targetChannel, 'Aborting transfer to peer ' +
      'as peer agent information for peer does not exists'], dataInfo);
    throwTransferErrorFn('Peer agent information for peer does not exists');
    return;
  }

  if (self._INTEROP_MULTI_TRANSFERS.indexOf(peerAgent.name) === -1) {

    targetChannel = targetPeerId + '-' + dataInfo.transferId;
    supportMulti = true;

    if (!(self._dataChannels[targetPeerId] || {}).main) {
      log.error([targetPeerId, 'RTCDataChannel', targetChannel,
        'Main datachannel does not exists'], dataInfo);
      throwTransferErrorFn('Main datachannel does not exists');
      return;

    } else if (self._dataChannels[targetPeerId].main.readyState !==
      self.DATA_CHANNEL_STATE.OPEN) {
      log.error([targetPeerId, 'RTCDataChannel', targetChannel,
        'Main datachannel is not opened'], {
          transferId: dataInfo.transferId,
          readyState: self._dataChannels[targetPeerId].main.readyState
      });
      throwTransferErrorFn('Main datachannel is not opened');
      return;
    }

    self._dataChannels[targetPeerId][targetChannel] =
      self._createDataChannel(targetPeerId, self.DATA_CHANNEL_TYPE.DATA, null, targetChannel);

  } else {
    var ongoingTransfer = null;

    if (self._uploadDataSessions[targetChannel]) {
      ongoingTransfer = self.DATA_TRANSFER_TYPE.UPLOAD;
    } else if (self._downloadDataSessions[targetChannel]) {
      ongoingTransfer = self.DATA_TRANSFER_TYPE.DOWNLOAD;
    }

    if (ongoingTransfer) {
      log.error([targetPeerId, 'RTCDataChannel', targetChannel, 'User have ongoing ' +
        ongoingTransfer + ' transfer session with peer. Unable to send data'], dataInfo);
      throwTransferErrorFn('Another ' + ongoingTransfer +
        ' transfer is ongoing. Unable to send data.');
      return;
    }
  }

  if (dataInfo.dataType === 'blob') {
    self._uploadDataTransfers[targetChannel] = self._chunkBlobData(data, chunkSize);
  } else {
    self._uploadDataTransfers[targetChannel] = self._chunkDataURL(data, chunkSize);
  }

  self._uploadDataSessions[targetChannel] = {
    name: dataInfo.name,
    size: binarySize,
    isUpload: true,
    senderPeerId: self._user.sid,
    transferId: dataInfo.transferId,
    percentage: 0,
    timeout: dataInfo.timeout,
    chunkSize: chunkSize,
    dataType: dataInfo.dataType,
    isPrivate: dataInfo.isPrivate
  };

  if (supportMulti) {
    self._condition('dataChannelState', function () {
      startTransferFn(targetPeerId, targetChannel);
    }, function () {
      return self._dataChannels[targetPeerId][targetChannel].readyState ===
        self.DATA_CHANNEL_STATE.OPEN;
    }, function (state) {
      return state === self.DATA_CHANNEL_STATE.OPEN;
    });
  } else {
    startTransferFn(targetChannel, targetChannel);
  }

  return targetChannel;
};

/**
 * Routes the data received to the relevant Protocol handler based on the data received.
 * @method _dataChannelProtocolHandler
 * @param {String|Object} data The data received from the DataChannel connection.
 * @param {String} senderPeerId The Peer ID associated with the DataChannel connection.
 * @param {String} channelName The DataChannel connection ID.
 * @param {String} channelType The DataChannel connection functionality type.
 *   [Rel: Skylink.DATA_CHANNEL_TYPE]
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._dataChannelProtocolHandler = function(dataString, peerId, channelName, channelType) {
  // PROTOCOL ESTABLISHMENT

  if (!(this._peerInformations[peerId] || {}).agent) {
    log.error([peerId, 'RTCDataChannel', channelName, 'Peer informations is missing during protocol ' +
      'handling. Dropping packet'], dataString);
    return;
  }

  /*var useChannel = channelName;
  var peerAgent = this._peerInformations[peerId].agent.name;

  if (channelType === this.DATA_CHANNEL_TYPE.MESSAGING ||
    this._INTEROP_MULTI_TRANSFERS[peerAgent] > -1) {
    useChannel = peerId;
  }*/

  if (typeof dataString === 'string') {
    var data = {};
    try {
      data = JSON.parse(dataString);
    } catch (error) {
      log.debug([peerId, 'RTCDataChannel', channelName, 'Received from peer ->'], {
        type: 'DATA',
        data: dataString
      });
      this._DATAProtocolHandler(peerId, dataString,
        this.DATA_TRANSFER_DATA_TYPE.BINARY_STRING, channelName);
      return;
    }
    log.debug([peerId, 'RTCDataChannel', channelName, 'Received from peer ->'], {
      type: data.type,
      data: data
    });
    switch (data.type) {
    case this._DC_PROTOCOL_TYPE.WRQ:
      this._WRQProtocolHandler(peerId, data, channelName);
      break;
    case this._DC_PROTOCOL_TYPE.ACK:
      this._ACKProtocolHandler(peerId, data, channelName);
      break;
    case this._DC_PROTOCOL_TYPE.ERROR:
      this._ERRORProtocolHandler(peerId, data, channelName);
      break;
    case this._DC_PROTOCOL_TYPE.CANCEL:
      this._CANCELProtocolHandler(peerId, data, channelName);
      break;
    case this._DC_PROTOCOL_TYPE.MESSAGE: // Not considered a protocol actually?
      this._MESSAGEProtocolHandler(peerId, data, channelName);
      break;
    default:
      log.error([peerId, 'RTCDataChannel', channelName, 'Unsupported message ->'], {
        type: data.type,
        data: data
      });
    }
  }
};

/**
 * Handles the WRQ Protocol request received from the DataChannel connection.
 * @method _WRQProtocolHandler
 * @param {String} senderPeerId The Peer ID associated with the DataChannel connection.
 * @param {JSON} data The data object received from the DataChannel connection.
 *   This should contain the <code>WRQ</code> payload.
 * @param {String} data.agent The sender Peer platform browser or agent name.
 * @param {Number} data.version The sender Peer platform browser or agent version.
 * @param {String} data.name The transfer data object name.
 * @param {Number} data.size The transfer data object expected received size.
 * @param {Number} data.chunkSize The expected data transfer packet (chunk) size.
 * @param {Number} data.timeout The timeout set to await in seconds
 *   for response from DataChannel connection.
 * @param {Boolean} data.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer connection directly and not broadcasted to all Peers conneciton.
 * @param {String} data.sender The Peer ID of the sender.
 * @param {String} data.type Protocol step <code>"WRQ"</code>.
 * @param {String} channelName The DataChannel connection ID associated with the transfer.
 * @trigger dataTransferState
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._WRQProtocolHandler = function(peerId, data, channelName) {
  var transferId = channelName + this._TRANSFER_DELIMITER + (new Date()).getTime();

  log.log([peerId, 'RTCDataChannel', channelName,
    'Received file request from peer:'], data);

  var name = data.name;
  var binarySize = data.size;
  var expectedSize = data.chunkSize;
  var timeout = data.timeout;

  this._downloadDataSessions[channelName] = {
    transferId: transferId,
    name: name,
    isUpload: false,
    senderPeerId: peerId,
    size: binarySize,
    percentage: 0,
    dataType: data.dataType,
    ackN: 0,
    receivedSize: 0,
    chunkSize: expectedSize,
    timeout: timeout,
    isPrivate: data.isPrivate
  };
  this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.UPLOAD_REQUEST,
    transferId, peerId, {
      name: name,
      size: binarySize,
      percentage: 0,
      data: null,
      dataType: data.dataType,
      senderPeerId: peerId,
      timeout: timeout,
      isPrivate: data.isPrivate
  });
  this._trigger('incomingDataRequest', transferId, peerId, {
    name: name,
    size: binarySize,
    percentage: 0,
    dataType: data.dataType,
    senderPeerId: peerId,
    timeout: timeout,
    isPrivate: data.isPrivate
  }, false);
};

/**
 * Handles the ACK Protocol request received from the DataChannel connection.
 * @method _ACKProtocolHandler
 * @param {String} peerId The Peer ID associated with the DataChannel connection.
 * @param {JSON} data The data object received from the DataChannel connection.
 *   This should contain the <code>ACK</code> payload.
 * @param {Number} data.ackN The ACK response of the current data transfer.
 *   If <code>0</code>, it means that the request has been accepted and the sending Peer
 *   has to send the first data transfer packet (chunk). If it's greater than <code>0</code>,
 *   it means that the previous data transfer packet (chunk) has been received and is expecting
 *   for the next data transfer packet. The number always increment based on the number of data
 *   packets the receiving end has received. If it's <code>-1</code>, it means that the data
 *   transfer request has been rejected and the data transfer will be terminated.
 * @param {String} data.sender The Peer ID of sender.
 * @param {String} data.type Protocol step <code>"ACK"</code>.
 * @param {String} channelName The DataChannel connection ID associated with the transfer.
 * @trigger dataTransferState
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._ACKProtocolHandler = function(peerId, data, channelName) {
  var self = this;
  var ackN = data.ackN;
  var transferStatus = self._uploadDataSessions[channelName];

  if (!transferStatus) {
    log.error([peerId, 'RTCDataChannel', channelName, 'Ignoring data received as ' +
      'upload data transfers is empty'], {
        status: transferStatus,
        data: data
    });
    return;
  }

  if (!this._uploadDataTransfers[channelName]) {
    log.error([peerId, 'RTCDataChannel', channelName,
      'Ignoring data received as upload data transfers array is missing'], {
        data: data
    });
    return;
  }

  //peerId = (peerId === 'MCU') ? data.sender : peerId;
  var chunksLength = self._uploadDataTransfers[channelName].length;
  var transferId = transferStatus.transferId;
  var timeout = transferStatus.timeout;

  self._clearDataChannelTimeout(peerId, true, channelName);
  log.log([peerId, 'RTCDataChannel', channelName, 'ACK stage (' +
    transferStatus.transferId + ') ->'], ackN + ' / ' + chunksLength);

  if (ackN > -1) {
    // Still uploading
    if (ackN < chunksLength) {
      var sendDataFn = function (base64BinaryString) {
        var percentage = parseFloat((((ackN + 1) / chunksLength) * 100).toFixed(2), 10);

        if (!self._uploadDataSessions[channelName]) {
          log.error([peerId, 'RTCDataChannel', channelName,
            'Failed uploading as data session is empty'], {
              status: transferStatus,
              data: data
          });
          return;
        }

        self._uploadDataSessions[channelName].percentage = percentage;

        self._sendDataChannelMessage(peerId, base64BinaryString, channelName);
        self._setDataChannelTimeout(peerId, timeout, true, channelName);

        // to prevent from firing upload = 100;
        if (percentage !== 100) {
          self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOADING,
            transferId, peerId, {
              name: transferStatus.name,
              size: transferStatus.size,
              percentage: percentage,
              data: null,
              dataType: transferStatus.dataType,
              senderPeerId: transferStatus.senderPeerId,
              timeout: transferStatus.timeout,
              isPrivate: transferStatus.isPrivate
          });
        }
      };

      if (transferStatus.dataType === 'blob') {
        self._blobToBase64(self._uploadDataTransfers[channelName][ackN], sendDataFn);
      } else {
        sendDataFn(self._uploadDataTransfers[channelName][ackN]);
      }
    } else if (ackN === chunksLength) {
	    log.log([peerId, 'RTCDataChannel', channelName, 'Upload completed (' +
        transferStatus.transferId + ')'], transferStatus);

      self._trigger('dataTransferState',
        self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED, transferId, peerId, {
          name: transferStatus.name,
          size: transferStatus.size,
          percentage: 100,
          data: null,
          dataType: transferStatus.dataType,
          senderPeerId: transferStatus.senderPeerId,
          timeout: transferStatus.timeout,
          isPrivate: transferStatus.isPrivate
      });

      var blob = null;

      if (transferStatus.dataType === 'blob') {
        blob = new Blob(self._uploadDataTransfers[channelName]);
      } else {
        blob = self._assembleDataURL(self._uploadDataTransfers[channelName]);
      }

      self._trigger('incomingData', blob, transferId, peerId, {
        name: transferStatus.name,
        size: transferStatus.size,
        percentage: 100,
        dataType: transferStatus.dataType,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
      }, true);
      delete self._uploadDataTransfers[channelName];
      delete self._uploadDataSessions[channelName];

      // close datachannel after transfer
      if (self._dataChannels[peerId] && self._dataChannels[peerId][channelName]) {
        log.debug([peerId, 'RTCDataChannel', channelName, 'Closing datachannel for upload transfer']);
        self._closeDataChannel(peerId, channelName);
      }
    }
  } else {
    log.debug([peerId, 'RTCDataChannel', channelName, 'Upload rejected (' +
      transferStatus.transferId + ')'], transferStatus);

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.REJECTED,
      transferId, peerId, {
        name: transferStatus.name, //self._uploadDataSessions[channelName].name,
        size: transferStatus.size, //self._uploadDataSessions[channelName].size,
        percentage: 0,
        data: null,
        dataType: transferStatus.dataType,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
    });
    delete self._uploadDataTransfers[channelName];
    delete self._uploadDataSessions[channelName];

    // close datachannel if rejected
    if (self._dataChannels[peerId] && self._dataChannels[peerId][channelName]) {
      log.debug([peerId, 'RTCDataChannel', channelName, 'Closing datachannel for upload transfer']);
      self._closeDataChannel(peerId, channelName);
    }
  }
};

/**
 * Handles the MESSAGE Protocol request received from the DataChannel connection.
 * @method _MESSAGEProtocolHandler
 * @param {String} peerId The Peer ID associated with the DataChannel connection.
 * @param {JSON} data The data object received from the DataChannel connection.
 *   This should contain the <code>MESSAGE</code> payload.
 * @param {String} data.target The targeted Peer ID to receive the message object.
 * @param {String|JSON} data.data The message object.
 * @param {String} data.sender The Peer ID of the sender.
 * @param {String} data.type Protocol step <code>"MESSAGE"</code>.
 * @param {String} channelName The DataChannel connection ID associated with the transfer.
 * @trigger incomingMessage
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._MESSAGEProtocolHandler = function(peerId, data, channelName) {
  var targetMid = data.sender;
  log.log([targetMid, 'RTCDataChannel', channelName,
    'Received P2P message from peer:'], data);
  this._trigger('incomingMessage', {
    content: data.data,
    isPrivate: data.isPrivate,
    isDataChannel: true,
    targetPeerId: this._user.sid,
    senderPeerId: targetMid
  }, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Handles the ERROR Protocol request received from the DataChannel connection.
 * @method _ERRORProtocolHandler
 * @param {String} senderPeerId The Peer ID associated with the DataChannel connection.
 * @param {JSON} data The data object received from the DataChannel connection.
 *   This should contain the <code>ERROR</code> payload.
 * @param {String} data.name The transfer data object name.
 * @param {String} data.content The error message.
 * @param {Boolean} [data.isUploadError=false] The flag thats indicates if the response
 *   is related to a downloading or uploading data transfer.
 * @param {String} data.sender The Peer ID of the sender.
 * @param {String} data.type Protocol step <code>"ERROR"</code>.
 * @param {String} channelName The DataChannel connection ID associated with the transfer.
 * @trigger dataTransferState
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._ERRORProtocolHandler = function(peerId, data, channelName) {
  var isUploader = data.isUploadError;
  var transferStatus = (isUploader) ? this._uploadDataSessions[channelName] :
    this._downloadDataSessions[channelName];

  if (!transferStatus) {
    log.error([peerId, 'RTCDataChannel', channelName, 'Ignoring data received as ' +
      (isUploader ? 'upload' : 'download') + ' data session is empty'], data);
    return;
  }

  var transferId = transferStatus.transferId;

  log.error([peerId, 'RTCDataChannel', channelName,
    'Received an error from peer:'], data);
  this._clearDataChannelTimeout(peerId, isUploader, channelName);
  this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.ERROR,
    transferId, peerId, {
      name: transferStatus.name,
      size: transferStatus.size,
      percentage: transferStatus.percentage,
      data: null,
      dataType: transferStatus.dataType,
      senderPeerId: transferStatus.senderPeerId,
      timeout: transferStatus.timeout,
      isPrivate: transferStatus.isPrivate
    }, {
      message: data.content,
      transferType: ((isUploader) ? this.DATA_TRANSFER_TYPE.UPLOAD :
        this.DATA_TRANSFER_TYPE.DOWNLOAD)
  });
};

/**
 * Handles the CANCEL Protocol request received from the DataChannel connection.
 * @method _CANCELProtocolHandler
 * @param {String} senderPeerId The Peer ID associated with the DataChannel connection.
 * @param {JSON} data The data object received from the DataChannel connection.
 *   This should contain the <code>CANCEL</code> payload.
 * @param {String} data.name The transfer data object name.
 * @param {String} data.content The reason for termination as a message.
 * @param {String} data.sender The Peer ID of the sender.
 * @param {String} data.type Protocol step <code>"CANCEL"</code>.
 * @param {String} channelName The DataChannel connection ID associated with the transfer.
 * @trigger dataTransferState
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype._CANCELProtocolHandler = function(peerId, data, channelName) {
  var isUpload = !!this._uploadDataSessions[channelName];
  var isDownload = !!this._downloadDataSessions[channelName];
  var transferStatus = (isUpload) ? this._uploadDataSessions[channelName] :
    this._downloadDataSessions[channelName];

  if (!transferStatus) {
    log.error([peerId, 'RTCDataChannel', channelName, 'Ignoring data received as ' +
      (isUpload ? 'upload' : 'download') + ' data session is empty'], data);
    return;
  }

  var transferId = transferStatus.transferId;

  log.log([peerId, 'RTCDataChannel', channelName,
    'Received file transfer cancel request:'], data);

  this._clearDataChannelTimeout(peerId, isUpload, channelName);

  try {
    if (isUpload) {
      delete this._uploadDataSessions[channelName];
      delete this._uploadDataTransfers[channelName];
    } else {
      delete this._downloadDataSessions[channelName];
      delete this._downloadDataTransfers[channelName];
    }

    this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.CANCEL,
      transferId, peerId, {
        name: transferStatus.name,
        size: transferStatus.size,
        data: null,
        dataType: transferStatus.dataType,
        percentage: transferStatus.percentage,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
      }, {
        message: data.content,
        transferType: ((isUpload) ? this.DATA_TRANSFER_TYPE.UPLOAD :
          this.DATA_TRANSFER_TYPE.DOWNLOAD)
    });

    log.log([peerId, 'RTCDataChannel', channelName,
      'Emptied file transfer session:'], data);

  } catch (error) {
    this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.ERROR,
      transferId, peerId, {
        name: transferStatus.name,
        size: transferStatus.size,
        data: null,
        dataType: transferStatus.dataType,
        percentage: transferStatus.percentage,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
      }, {
        message: 'Failed cancelling data request from peer',
        transferType: ((isUpload) ? this.DATA_TRANSFER_TYPE.UPLOAD :
          this.DATA_TRANSFER_TYPE.DOWNLOAD)
    });

    log.error([peerId, 'RTCDataChannel', channelName,
      'Failed emptying file transfer session:'], {
        data: data,
        error: error
    });
  }
};

/**
 * Handles the DATA Protocol request received from the DataChannel connection.
 * In this handler, it actually handles and manipulates the received data transfer packet.
 * @method _DATAProtocolHandler
 * @param {String} senderPeerId The Peer ID associated with the DataChannel connection.
 * @param {ArrayBuffer|Blob|String} dataString The data transfer packet (chunk) received.
 * @param {String} dataType The data transfer packet (chunk) data type received.
 *   [Rel: Skylink.DATA_TRANSFER_DATA_TYPE]
 * @param {String} channelName The DataChannel connection ID associated with the transfer.
 * @trigger dataTransferState
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._DATAProtocolHandler = function(peerId, dataString, dataType, channelName) {
  var chunk, error = '';
  var transferStatus = this._downloadDataSessions[channelName];
  log.log([peerId, 'RTCDataChannel', channelName,
    'Received data chunk from peer ->'], {
      dataType: dataType,
      data: dataString,
      type: 'DATA'
  });

  if (!transferStatus) {
    log.error([peerId, 'RTCDataChannel', channelName,
      'Ignoring data received as download data session is empty'], {
        dataType: dataType,
        data: dataString,
        type: 'DATA'
    });
    return;
  }

  if (!this._downloadDataTransfers[channelName]) {
    log.error([peerId, 'RTCDataChannel', channelName,
      'Ignoring data received as download data transfers array is missing'], {
        dataType: dataType,
        data: dataString,
        type: 'DATA'
    });
    return;
  }

  var transferId = transferStatus.transferId;
  var dataTransferType = transferStatus.dataType;
  var receivedSize = 0;

  this._clearDataChannelTimeout(peerId, false, channelName);

  if (dataType === this.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
    if (dataTransferType === 'blob') {
      chunk = this._base64ToBlob(dataString);
      receivedSize = (chunk.size * (4 / 3));
    } else {
      chunk = dataString;
      receivedSize = dataString.length;
    }
  } else if (dataType === this.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER) {
    chunk = new Blob(dataString);
  } else if (dataType === this.DATA_TRANSFER_DATA_TYPE.BLOB) {
    chunk = dataString;
  } else {
    error = 'Unhandled data exception: ' + dataType;
    log.error([peerId, 'RTCDataChannel', channelName, 'Failed downloading data packets:'], {
      dataType: dataType,
      data: dataString,
      type: 'DATA',
      error: error
    });
    this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.ERROR,
      transferId, peerId, {
        name: transferStatus.name,
        size: transferStatus.size,
        percentage: transferStatus.percentage,
        data: null,
        dataType: dataTransferType,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
      }, {
        message: error,
        transferType: this.DATA_TRANSFER_TYPE.DOWNLOAD
    });
    return;
  }

  log.log([peerId, 'RTCDataChannel', channelName,
    'Received and expected data chunk size (' + receivedSize + ' === ' +
      transferStatus.chunkSize + ')'], {
        dataType: dataType,
        data: dataString,
        receivedSize: receivedSize,
        expectedSize: transferStatus.chunkSize,
        type: 'DATA'
  });

  if (transferStatus.chunkSize >= receivedSize) {
    this._downloadDataTransfers[channelName].push(chunk);
    transferStatus.ackN += 1;
    transferStatus.receivedSize += receivedSize;
    var totalReceivedSize = transferStatus.receivedSize;
    var percentage = parseFloat(((totalReceivedSize / transferStatus.size) * 100).toFixed(2), 10);

    this._sendDataChannelMessage(peerId, {
      type: this._DC_PROTOCOL_TYPE.ACK,
      sender: this._user.sid,
      ackN: transferStatus.ackN
    }, channelName);

    // update the percentage
    this._downloadDataSessions[channelName].percentage = percentage;

    if (transferStatus.chunkSize === receivedSize && percentage < 100) {
      log.log([peerId, 'RTCDataChannel', channelName,
        'Transfer in progress ACK n (' + transferStatus.ackN + ')'], {
          dataType: dataType,
          data: dataString,
          ackN: transferStatus.ackN,
          type: 'DATA'
      });
      this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.DOWNLOADING,
        transferId, peerId, {
          name: transferStatus.name,
          size: transferStatus.size,
          percentage: percentage,
          data: null,
          dataType: dataTransferType,
          senderPeerId: transferStatus.senderPeerId,
          timeout: transferStatus.timeout,
          isPrivate: transferStatus.isPrivate
      });
      this._setDataChannelTimeout(peerId, transferStatus.timeout, false, channelName);

      if (!this._downloadDataSessions[channelName]) {
        log.error([peerId, 'RTCDataChannel', channelName,
          'Failed downloading as data session is empty'], {
            dataType: dataType,
            data: dataString,
            type: 'DATA'
        });
        return;
      }

      this._downloadDataSessions[channelName].info = transferStatus;

    } else {
      log.log([peerId, 'RTCDataChannel', channelName,
        'Download complete'], {
          dataType: dataType,
          data: dataString,
          type: 'DATA',
          transferInfo: transferStatus
      });

      var blob = null;

      if (dataTransferType === 'blob') {
        blob = new Blob(this._downloadDataTransfers[channelName]);
      } else {
        blob = this._assembleDataURL(this._downloadDataTransfers[channelName]);
      }
      this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED,
        transferId, peerId, {
          name: transferStatus.name,
          size: transferStatus.size,
          percentage: 100,
          data: blob,
          dataType: dataTransferType,
          senderPeerId: transferStatus.senderPeerId,
          timeout: transferStatus.timeout,
          isPrivate: transferStatus.isPrivate
      });

      this._trigger('incomingData', blob, transferId, peerId, {
        name: transferStatus.name,
        size: transferStatus.size,
        percentage: 100,
        dataType: dataTransferType,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
      }, false);

      delete this._downloadDataTransfers[channelName];
      delete this._downloadDataSessions[channelName];

      log.log([peerId, 'RTCDataChannel', channelName,
        'Converted to Blob as download'], {
          dataType: dataType,
          data: dataString,
          type: 'DATA',
          transferInfo: transferStatus
      });

      // close datachannel after transfer
      if (this._dataChannels[peerId] && this._dataChannels[peerId][channelName]) {
        log.debug([peerId, 'RTCDataChannel', channelName, 'Closing datachannel for download transfer']);
        this._closeDataChannel(peerId, channelName);
      }
    }

  } else {
    error = 'Packet not match - [Received]' + receivedSize +
      ' / [Expected]' + transferStatus.chunkSize;

    this._trigger('dataTransferState',
      this.DATA_TRANSFER_STATE.ERROR, transferId, peerId, {
        name: transferStatus.name,
        size: transferStatus.size,
        percentage: transferStatus.percentage,
        data: null,
        dataType: dataTransferType,
        senderPeerId: transferStatus.senderPeerId,
        timeout: transferStatus.timeout,
        isPrivate: transferStatus.isPrivate
      }, {
        message: error,
        transferType: this.DATA_TRANSFER_TYPE.DOWNLOAD
    });

    log.error([peerId, 'RTCDataChannel', channelName,
      'Failed downloading data packets:'], {
        dataType: dataType,
        data: dataString,
        type: 'DATA',
        transferInfo: transferStatus,
        error: error
    });
  }
};

/**
 * Starts a data transfer with Peers using the DataChannel connections with
 *   [Blob](https://developer.mozilla.org/en/docs/Web/API/Blob datas).
 * - You can transfer files using the <code>input</code> [fileupload object](
 *   http://www.w3schools.com/jsref/dom_obj_fileupload.asp) and accessing the receiving
 *   files using [FileUpload files property](http://www.w3schools.com/jsref/prop_fileupload_files.asp).
 * - The [File](https://developer.mozilla.org/en/docs/Web/API/File) object inherits from
 *   the Blob interface which is passable in this method as a Blob object.
 * - The receiving Peers have the option to accept or reject the data transfer with
 *   <a href="#method_acceptDataTransfer">acceptDataTransfer()</a>.
 * - For Peers connecting from our mobile platforms
 *   (<a href="http://skylink.io/ios/">iOS</a> / <a href="http://skylink.io/android/">Android</a>),
 *   the DataChannel connection channel type would be <code>DATA_CHANNEL_TYPE.MESSAGING</code>.<br>
 *   For Peers connecting from the Web platform, the DataChannel connection channel type would be
 *  <code>DATA_CHANNEL_TYPE.DATA</code>.
 * @method sendBlobData
 * @param {Blob} data The Blob data object to transfer to Peer.
 * @param {Number} [timeout=60] The waiting timeout in seconds that the DataChannel connection
 *   data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {String|Array} [targetPeerId] The array of targeted Peers to transfer the
 *   data object to. Alternatively, you may provide this parameter as a string to a specific
 *   targeted Peer to transfer the data object.
 * @param {Function} [callback] The callback fired after all the data transfers is completed
 *   successfully or met with an exception. The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {String} [callback.error.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the error has occurred. This only triggers for a single targeted Peer data transfer.
 * @param {Object|String} [callback.error.error=null] <i>Deprecated</i>. The error received when the
 *   data transfer fails. This only triggers for single targeted Peer data transfer.
 * @param {String} callback.error.transferId The transfer ID of the failed data transfer.
 * @param {String} [callback.error.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.error.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.error.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.error.transferErrors The list of errors occurred based on per Peer
 *   basis.
 * @param {Object|String} callback.error.transferErrors.(#peerId) The error that occurred when having
 *   a DataChannel connection data transfer with associated Peer.
 * @param {JSON} callback.error.transferInfo The transfer data object information.
 * @param {String} [callback.error.transferInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} callback.error.transferInfo.size The transfer data size.
 * @param {String} callback.error.transferInfo.transferId The data transfer ID.
 * @param {String} callback.error.transferInfo.dataType The type of data transfer initiated.
 *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
 * @param {String} callback.error.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.error.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} [callback.success.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the data transfer has been completed successfully.
 *   This only triggers for a single targeted Peer data transfer.
 * @param {String} callback.success.transferId The transfer ID of the successful data transfer.
 * @param {String} [callback.success.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.success.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.success.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success.transferInfo The transfer data object information.
 * @param {String} [callback.success.transferInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} callback.success.transferInfo.size The transfer data size.
 * @param {String} callback.success.transferInfo.transferId The data transfer ID.
 * @param {String} callback.success.transferInfo.dataType The type of data transfer initiated.
 *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
 * @param {String} callback.success.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.success.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @example
 *   // Example 1: Send file to all peers connected
 *   SkylinkDemo.sendBlobData(file, 67);
 *
 *   // Example 2: Send file to individual peer
 *   SkylinkDemo.sendBlobData(blob, 87, targetPeerId);
 *
 *   // Example 3: Send file with callback
 *   SkylinkDemo.sendBlobData(data,{
 *      name: data.name,
 *      size: data.size
 *    },function(error, success){
 *     if (error){
 *       console.error("Error happened. Could not send file", error);
 *     }
 *     else{
 *       console.info("Successfully uploaded file");
 *     }
 *   });
 *
 * @trigger incomingData, incomingDataRequest, dataTransferState, dataChannelState
 * @since 0.5.5
 * @component DataTransfer
 * @for Skylink
 */
Skylink.prototype.sendBlobData = function(data, timeout, targetPeerId, callback) {
  var listOfPeers = Object.keys(this._peerConnections);
  var isPrivate = false;
  var dataInfo = {};
  var transferId = this._user.sid + this.DATA_TRANSFER_TYPE.UPLOAD +
    (((new Date()).toISOString().replace(/-/g, '').replace(/:/g, ''))).replace('.', '');
  // for error case
  var errorMsg, errorPayload, i, peerId; // for jshint
  var singleError = null;
  var transferErrors = {};
  var stateError = null;
  var singlePeerId = null;

  //Shift parameters
  // timeout
  if (typeof timeout === 'function') {
    callback = timeout;

  } else if (typeof timeout === 'string') {
    listOfPeers = [timeout];
    isPrivate = true;

  } else if (Array.isArray(timeout)) {
    listOfPeers = timeout;
    isPrivate = true;
  }

  // targetPeerId
  if (typeof targetPeerId === 'function'){
    callback = targetPeerId;

  // data, timeout, target [array], callback
  } else if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;

  // data, timeout, target [string], callback
  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  //state: String, Deprecated. But for consistency purposes. Null if not a single peer
  //error: Object, Deprecated. But for consistency purposes. Null if not a single peer
  //transferId: String,
  //peerId: String, Deprecated. But for consistency purposes. Null if not a single peer
  //listOfPeers: Array, NEW!!
  //isPrivate: isPrivate, NEW!!
  //transferErrors: JSON, NEW!! - Array of errors
  //transferInfo: JSON The same payload as dataTransferState transferInfo payload

  // check if it's blob data
  if (!(typeof data === 'object' && data instanceof Blob)) {
    errorMsg = 'Provided data is not a Blob data';

    if (listOfPeers.length === 0) {
      transferErrors.self = errorMsg;

    } else {
      for (i = 0; i < listOfPeers.length; i++) {
        peerId = listOfPeers[i];
        transferErrors[peerId] = errorMsg;
      }

      // Deprecated but for consistency purposes. Null if not a single peer.
      if (listOfPeers.length === 1 && isPrivate) {
        stateError = self.DATA_TRANSFER_STATE.ERROR;
        singleError = errorMsg;
        singlePeerId = listOfPeers[0];
      }
    }

    errorPayload = {
      state: stateError,
      error: singleError,
      transferId: transferId,
      peerId: singlePeerId,
      listOfPeers: listOfPeers,
      transferErrors: transferErrors,
      transferInfo: dataInfo,
      isPrivate: isPrivate
    };

    log.error(errorMsg, errorPayload);

    if (typeof callback === 'function'){
      log.log([null, 'RTCDataChannel', null, 'Error occurred. Firing callback ' +
        'with error -> '],errorPayload);
      callback(errorPayload, null);
    }
    return;
  }

  // populate data
  dataInfo.name = data.name || transferId;
  dataInfo.size = data.size;
  dataInfo.timeout = typeof timeout === 'number' ? timeout : 60;
  dataInfo.transferId = transferId;
  dataInfo.dataType = 'blob';
  dataInfo.isPrivate = isPrivate;

  // check if datachannel is enabled first or not
  if (!this._enableDataChannel) {
    errorMsg = 'Unable to send any blob data. Datachannel is disabled';

    if (listOfPeers.length === 0) {
      transferErrors.self = errorMsg;

    } else {
      for (i = 0; i < listOfPeers.length; i++) {
        peerId = listOfPeers[i];
        transferErrors[peerId] = errorMsg;
      }

      // Deprecated but for consistency purposes. Null if not a single peer.
      if (listOfPeers.length === 1 && isPrivate) {
        stateError = self.DATA_TRANSFER_STATE.ERROR;
        singleError = errorMsg;
        singlePeerId = listOfPeers[0];
      }
    }

    errorPayload = {
      state: stateError,
      error: singleError,
      transferId: transferId,
      peerId: singlePeerId,
      listOfPeers: listOfPeers,
      transferErrors: transferErrors,
      transferInfo: dataInfo,
      isPrivate: isPrivate
    };

    log.error(errorMsg, errorPayload);

    if (typeof callback === 'function'){
      log.log([null, 'RTCDataChannel', null, 'Error occurred. Firing callback ' +
        'with error -> '], errorPayload);
      callback(errorPayload, null);
    }
    return;
  }

  this._startDataTransfer(data, dataInfo, listOfPeers, callback);
};


/**
 * Starts the actual data transfers with the array of Peers provided
 *   and based on the data transfer type to start the DataChannel connection data transfer.
 * @method _startDataTransfer
 * @param {Blob|String} data The transfer data object.
 * @param {JSON} dataInfo The transfer data object information.
 * @param {String} [dataInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} dataInfo.size The transfer data size.
 * @param {String} dataInfo.transferId The data transfer ID.
 * @param {String} dataInfo.dataType The type of data transfer initiated.
 *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
 * @param {String} dataInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} dataInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {Array} [listOfPeers] The array of targeted Peer to transfer the
 *   data object to.
 * @param {Function} [callback] The callback fired after all the data transfers is completed
 *   successfully or met with an exception. The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {String} [callback.error.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the error has occurred. This only triggers for a single targeted Peer data transfer.
 * @param {Object|String} [callback.error.error=null] <i>Deprecated</i>. The error received when the
 *   data transfer fails. This only triggers for single targeted Peer data transfer.
 * @param {String} callback.error.transferId The transfer ID of the failed data transfer.
 * @param {String} [callback.error.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.error.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.error.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.error.transferErrors The list of errors occurred based on per Peer
 *   basis.
 * @param {Object|String} callback.error.transferErrors.(#peerId) The error that occurred when having
 *   a DataChannel connection data transfer with associated Peer.
 * @param {JSON} callback.error.transferInfo The transfer data object information.
 * @param {String} [callback.error.transferInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} callback.error.transferInfo.size The transfer data size.
 * @param {String} callback.error.transferInfo.transferId The data transfer ID.
 * @param {String} callback.error.transferInfo.dataType The type of data transfer initiated.
 *   The received type would be <code>"blob"</code>.
 * @param {String} callback.error.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.error.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} [callback.success.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the data transfer has been completed successfully.
 *   This only triggers for a single targeted Peer data transfer.
 * @param {String} callback.success.transferId The transfer ID of the successful data transfer.
 * @param {String} [callback.success.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.success.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.success.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success.transferInfo The transfer data object information.
 * @param {String} [callback.success.transferInfo.name=transferId] The transfer data object name.
 *   If there is no name based on the Blob given, the name would be the transfer ID.
 * @param {Number} callback.success.transferInfo.size The transfer data size.
 * @param {String} callback.success.transferInfo.transferId The data transfer ID.
 * @param {String} callback.success.transferInfo.dataType The type of data transfer initiated.
 *   The received type would be <code>"blob"</code>.
 * @param {String} callback.success.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.success.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @private
 * @component DataTransfer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._startDataTransfer = function(data, dataInfo, listOfPeers, callback) {
  var self = this;
  var error = '';
  var noOfPeersSent = 0;
  var transferId = dataInfo.transferId;
  var dataType = dataInfo.dataType;
  var isPrivate = dataInfo.isPrivate;
  var i;
  var peerId;

  // for callback
  var listOfPeersTransferState = {};
  var transferSuccess = true;
  var listOfPeersTransferErrors = {};
  var listOfPeersChannels = {};
  var successfulPeerTransfers = [];

  var triggerCallbackFn = function () {
    for (i = 0; i < listOfPeers.length; i++) {
      var transferPeerId = listOfPeers[i];

      if (!listOfPeersTransferState[transferPeerId]) {
        // if error, make as false and break
        transferSuccess = false;
        break;
      }
    }

    if (transferSuccess) {
      log.log([null, 'RTCDataChannel', transferId, 'Firing success callback for data transfer'], dataInfo);
      // should we even support this? maybe keeping to not break older impl
      if (listOfPeers.length === 1 && isPrivate) {
        callback(null,{
          state: self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED,
          peerId: listOfPeers[0],
          listOfPeers: listOfPeers,
          transferId: transferId,
          isPrivate: isPrivate, // added new flag to indicate privacy
          transferInfo: dataInfo
        });
      } else {
        callback(null,{
          state: null,
          peerId: null,
          transferId: transferId,
          listOfPeers: listOfPeers,
          isPrivate: isPrivate, // added new flag to indicate privacy
          transferInfo: dataInfo
        });
      }
    } else {
      log.log([null, 'RTCDataChannel', transferId, 'Firing failure callback for data transfer'], dataInfo);

      // should we even support this? maybe keeping to not break older impl
      if (listOfPeers.length === 1 && isPrivate) {
        callback({
          state: self.DATA_TRANSFER_STATE.ERROR,
          error: listOfPeersTransferErrors[listOfPeers[0]],
          peerId: listOfPeers[0],
          transferId: transferId,
          transferErrors: listOfPeersTransferErrors,
          transferInfo: dataInfo,
          isPrivate: isPrivate, // added new flag to indicate privacy
          listOfPeers: listOfPeers
        }, null);
      } else {
        callback({
          state: null,
          peerId: null,
          error: null,
          transferId: transferId,
          listOfPeers: listOfPeers,
          isPrivate: isPrivate, // added new flag to indicate privacy
          transferInfo: dataInfo,
          transferErrors: listOfPeersTransferErrors
        }, null);
      }
    }
  };

  for (i = 0; i < listOfPeers.length; i++) {
    peerId = listOfPeers[i];

    if (peerId === 'MCU') {
      continue;
    }

    if (self._dataChannels[peerId] && self._dataChannels[peerId].main) {
      log.log([peerId, 'RTCDataChannel', null, 'Sending blob data ->'], dataInfo);

      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_STARTED,
        transferId, peerId, {
          name: dataInfo.name,
          size: dataInfo.size,
          percentage: 0,
          data: data,
          dataType: dataType,
          senderPeerId: self._user.sid,
          timeout: dataInfo.timeout,
          isPrivate: isPrivate
      });

      self._trigger('incomingDataRequest', transferId, peerId, {
        name: dataInfo.name,
        size: dataInfo.size,
        percentage: 0,
        dataType: dataType,
        senderPeerId: self._user.sid,
        timeout: dataInfo.timeout,
        isPrivate: isPrivate
      }, true);

      if (!self._hasMCU) {
        listOfPeersChannels[peerId] =
          self._sendBlobDataToPeer(data, dataInfo, peerId);
      } else {
        listOfPeersChannels[peerId] = self._dataChannels[peerId].main.label;
      }

      noOfPeersSent++;

    } else {
      error = 'Datachannel does not exist. Unable to start data transfer with peer';
      log.error([peerId, 'RTCDataChannel', null, error]);
      listOfPeersTransferErrors[peerId] = error;
    }
  }

  // if has MCU
  if (self._hasMCU) {
    self._sendBlobDataToPeer(data, dataInfo, listOfPeers, isPrivate, transferId);
  }

  if (noOfPeersSent === 0) {
    error = 'Failed sending data as there is no available datachannels to send data';

    for (i = 0; i < listOfPeers.length; i++) {
      peerId = listOfPeers[i];

      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR,
        transferId, peerId, {
          name: dataInfo.name,
          size: dataInfo.size,
          data: null,
          dataType: dataType,
          percentage: 0,
          senderPeerId: self._user.sid,
          timeout: dataInfo.timeout,
          isPrivate: isPrivate
        }, {
          message: error,
          transferType: self.DATA_TRANSFER_TYPE.UPLOAD
      });

      listOfPeersTransferErrors[peerId] = error;
    }

    log.error([null, 'RTCDataChannel', null, error]);
    self._uploadDataTransfers = [];
    self._uploadDataSessions = [];

    transferSuccess = false;

    if (typeof callback === 'function') {
      triggerCallbackFn();
    }
    return;
  }

  if (typeof callback === 'function') {
    var dataChannelStateFn = function(state, transferringPeerId, errorObj, channelName, channelType){
      // check if error or closed halfway, if so abort
      if (state === self.DATA_CHANNEL_STATE.ERROR &&
        state === self.DATA_CHANNEL_STATE.CLOSED &&
        listOfPeersChannels[peerId] === channelName) {
        // if peer has already been inside, ignore
        if (successfulPeerTransfers.indexOf(transferringPeerId) === -1) {
          listOfPeersTransferState[transferringPeerId] = false;
          listOfPeersTransferErrors[transferringPeerId] = errorObj;

          log.error([transferringPeerId, 'RTCDataChannel', null,
            'Data channel state has met a failure state for peer (datachannel) ->'], {
              state: state,
              error: errorObj
          });
        }
      }

      if (Object.keys(listOfPeersTransferState).length === listOfPeers.length) {
        self.off('dataTransferState', dataTransferStateFn);
        self.off('dataChannelState', dataChannelStateFn);

        log.log([null, 'RTCDataChannel', transferId,
          'Transfer states have been gathered completely in dataChannelState'], state);

        triggerCallbackFn();
      }
    };

    var dataTransferStateFn = function(state, stateTransferId, transferringPeerId, transferInfo, errorObj){
      // check if transfer is related to this transfer
      if (stateTransferId === transferId) {
        // check if state upload has completed
        if (state === self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED) {

          log.debug([transferringPeerId, 'RTCDataChannel', stateTransferId,
            'Data transfer state has met a success state for peer ->'], state);

          // if peer has already been inside, ignore
          if (successfulPeerTransfers.indexOf(transferringPeerId) === -1) {
            listOfPeersTransferState[transferringPeerId] = true;
          }
        } else if(state === self.DATA_TRANSFER_STATE.REJECTED ||
          state === self.DATA_TRANSFER_STATE.CANCEL ||
          state === self.DATA_TRANSFER_STATE.ERROR) {

          if (state === self.DATA_TRANSFER_STATE.REJECTED) {
            errorObj = new Error('Peer has rejected data transfer request');
          }

          log.error([transferringPeerId, 'RTCDataChannel', stateTransferId,
            'Data transfer state has met a failure state for peer ->'], {
              state: state,
              error: errorObj
          });

          // if peer has already been inside, ignore
          if (successfulPeerTransfers.indexOf(transferringPeerId) === -1) {
            listOfPeersTransferState[transferringPeerId] = false;
            listOfPeersTransferErrors[transferringPeerId] = errorObj;
          }
        }
      }

      if (Object.keys(listOfPeersTransferState).length === listOfPeers.length) {
        self.off('dataTransferState', dataTransferStateFn);
        self.off('dataChannelState', dataChannelStateFn);

        log.log([null, 'RTCDataChannel', stateTransferId,
          'Transfer states have been gathered completely in dataTransferState'], state);

        triggerCallbackFn();
      }
    };
    self.on('dataTransferState', dataTransferStateFn);
    self.on('dataChannelState', dataChannelStateFn);
  }
};


/**
 * Responds to a data transfer request by a Peer.
 * @method respondBlobRequest
 * @param {String} peerId The sender Peer ID.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to accept or reject.
 * @param {Boolean} [accept=false] The flag that indicates <code>true</code> as a response
 *   to accept the data transfer and <code>false</code> as a response to reject the
 *   data transfer request.
 * @trigger dataTransferState, incomingDataRequest, incomingData
 * @component DataTransfer
 * @deprecated Use .acceptDataTransfer()
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.respondBlobRequest =
/**
 * Responds to a data transfer request by a Peer.
 * @method acceptDataTransfer
 * @param {String} peerId The sender Peer ID.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to accept or reject.
 * @param {Boolean} [accept=false] The flag that indicates <code>true</code> as a response
 *   to accept the data transfer and <code>false</code> as a response to reject the
 *   data transfer request.
 * @trigger dataTransferState, incomingDataRequest, incomingData
 * @component DataTransfer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.acceptDataTransfer = function (peerId, transferId, accept) {

  if (typeof transferId !== 'string' && typeof peerId !== 'string') {
    log.error([peerId, 'RTCDataChannel', null, 'Aborting accept data transfer as ' +
      'transfer ID and peer ID is not provided'], {
        accept: accept,
        peerId: peerId,
        transferId: transferId
    });
    return;
  }

  if (transferId.indexOf(this._TRANSFER_DELIMITER) === -1) {
    log.error([peerId, 'RTCDataChannel', null, 'Aborting accept data transfer as ' +
      'invalid transfer ID is provided'], {
        accept: accept,
        transferId: transferId
    });
    return;
  }
  var channelName = transferId.split(this._TRANSFER_DELIMITER)[0];

  if (accept) {

    log.info([peerId, 'RTCDataChannel', channelName, 'User accepted peer\'s request'], {
      accept: accept,
      transferId: transferId
    });

    if (!this._peerInformations[peerId] && !this._peerInformations[peerId].agent) {
      log.error([peerId, 'RTCDataChannel', channelName, 'Aborting accept data transfer as ' +
        'Peer informations for peer is missing'], {
          accept: accept,
          transferId: transferId
      });
      return;
    }

    this._downloadDataTransfers[channelName] = [];

    var data = this._downloadDataSessions[channelName];
    this._sendDataChannelMessage(peerId, {
      type: this._DC_PROTOCOL_TYPE.ACK,
      sender: this._user.sid,
      ackN: 0,
      agent: window.webrtcDetectedBrowser
    }, channelName);
    this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.DOWNLOAD_STARTED,
      data.transferId, peerId, {
        name: data.name,
        size: data.size,
        data: null,
        dataType: data.dataType,
        percentage: 0,
        senderPeerId: peerId,
        timeout: data.timeout,
        isPrivate: data.isPrivate
    });
  } else {
    log.info([peerId, 'RTCDataChannel', channelName, 'User rejected peer\'s request'], {
      accept: accept,
      transferId: transferId
    });
    this._sendDataChannelMessage(peerId, {
      type: this._DC_PROTOCOL_TYPE.ACK,
      sender: this._user.sid,
      ackN: -1
    }, channelName);
    delete this._downloadDataSessions[channelName];
    delete this._downloadDataTransfers[channelName];
  }
};

/**
 * Terminates a current data transfer with Peer.
 * @method cancelBlobTransfer
 * @param {String} peerId The Peer ID associated with the data transfer.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to terminate the request.
 * @trigger dataTransferState
 * @component DataTransfer
 * @deprecated Use .cancelDataTransfer()
 * @for Skylink
 * @since 0.5.7
 */
Skylink.prototype.cancelBlobTransfer =
/**
 * Terminates a current data transfer with Peer.
 * @method cancelDataTransfer
 * @param {String} peerId The Peer ID associated with the data transfer.
 * @param {String} transferId The data transfer ID of the data transfer request
 *   to terminate the request.
 * @trigger dataTransferState
 * @component DataTransfer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.cancelDataTransfer = function (peerId, transferId) {
  var data;

  // targetPeerId + '-' + transferId
  var channelName = peerId + '-' + transferId;

  if (transferId.indexOf(this._TRANSFER_DELIMITER) > 0) {
    channelName = transferId.split(this._TRANSFER_DELIMITER)[0];
  } else {

    var peerAgent = (this._peerInformations[peerId] || {}).agent;

    if (!peerAgent && !peerAgent.name) {
      log.error([peerId, 'RTCDataChannel', null, 'Cancel transfer to peer ' +
        'failed as peer agent information for peer does not exists'], transferId);
      return;
    }

    if (self._INTEROP_MULTI_TRANSFERS.indexOf(peerAgent.name) > -1) {
      channelName = peerId;
    }
  }

  if (this._uploadDataSessions[channelName]) {
    data = this._uploadDataSessions[channelName];

    delete this._uploadDataSessions[channelName];
    delete this._uploadDataTransfers[channelName];

    // send message
    this._sendDataChannelMessage(peerId, {
      type: this._DC_PROTOCOL_TYPE.CANCEL,
      sender: this._user.sid,
      name: data.name,
      content: 'Peer cancelled upload transfer'
    }, channelName);

    log.debug([peerId, 'RTCDataChannel', channelName,
      'Cancelling upload data transfers'], transferId);

  } else if (this._downloadDataSessions[channelName]) {
    data = this._downloadDataSessions[channelName];

    delete this._downloadDataSessions[channelName];
    delete this._downloadDataTransfers[channelName];

    // send message
    this._sendDataChannelMessage(peerId, {
      type: this._DC_PROTOCOL_TYPE.CANCEL,
      sender: this._user.sid,
      name: data.name,
      content: 'Peer cancelled download transfer'
    }, channelName);

    log.debug([peerId, 'RTCDataChannel', channelName,
      'Cancelling download data transfers'], transferId);

  } else {
    log.error([peerId, 'RTCDataChannel', null, 'Cancel transfer to peer ' +
      'failed as transfer session with peer does not exists'], transferId);
    return;
  }

  this._trigger('dataTransferState', this.DATA_TRANSFER_STATE.CANCEL,
    data.transferId, peerId, {
      name: data.name,
      size: data.size,
      percentage: data.percentage,
      data: null,
      dataType: data.dataType,
      senderPeerId: data.senderPeerId,
      timeout: data.timeout,
      isPrivate: data.isPrivate
  });
};

/**
 * Send a message object or string using the DataChannel connection
 *   associated with the list of targeted Peers.
 * - The maximum size for the message object would be<code>16Kb</code>.<br>
 * - To send a string length longer than <code>16kb</code>, please considered
 *   to use {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}}
 *   to send longer strings (for that instance base64 binary strings are long).
 * - To send message objects with platform signaling socket connection, see
 *   {{#crossLink "Skylink/sendMessage:method"}}sendMessage(){{/crossLink}}.
 * @method sendP2PMessage
 * @param {String|JSON} message The message object.
 * @param {String|Array} [targetPeerId] The array of targeted Peers to
 *   transfer the message object to. Alternatively, you may provide this parameter
 *   as a string to a specific targeted Peer to transfer the message object.
 * @example
 *   // Example 1: Send to all peers
 *   SkylinkDemo.sendP2PMessage("Hi there! This is from a DataChannel connection!"");
 *
 *   // Example 2: Send to specific peer
 *   SkylinkDemo.sendP2PMessage("Hi there peer! This is from a DataChannel connection!", targetPeerId);
 * @trigger incomingMessage
 * @since 0.5.5
 * @component DataTransfer
 * @for Skylink
 */
Skylink.prototype.sendP2PMessage = function(message, targetPeerId) {
  var self = this;

  // check if datachannel is enabled first or not
  if (!self._enableDataChannel) {
    log.warn('Unable to send any P2P message. Datachannel is disabled');
    return;
  }

  var listOfPeers = Object.keys(self._dataChannels);
  var isPrivate = false;

  //targetPeerId is defined -> private message
  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;

  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  // sending public message to MCU to relay. MCU case only
  if (self._hasMCU) {
    if (isPrivate) {
      log.log(['MCU', null, null, 'Relaying private P2P message to peers'], listOfPeers);
      self._sendDataChannelMessage('MCU', {
        type: self._DC_PROTOCOL_TYPE.MESSAGE,
        isPrivate: isPrivate,
        sender: self._user.sid,
        target: listOfPeers,
        data: message
      });
    } else {
      log.log(['MCU', null, null, 'Relaying P2P message to peers']);

      self._sendDataChannelMessage('MCU', {
        type: self._DC_PROTOCOL_TYPE.MESSAGE,
        isPrivate: isPrivate,
        sender: self._user.sid,
        target: 'MCU',
        data: message
      });
    }
  } else {
    for (var i = 0; i < listOfPeers.length; i++) {
      var peerId = listOfPeers[i];
      var useChannel = (self._hasMCU) ? 'MCU' : peerId;

      // Ignore MCU peer
      if (peerId === 'MCU') {
        continue;
      }

      log.log([peerId, null, useChannel, 'Sending P2P message to peer']);

      self._sendDataChannelMessage(useChannel, {
        type: self._DC_PROTOCOL_TYPE.MESSAGE,
        isPrivate: isPrivate,
        sender: self._user.sid,
        target: peerId,
        data: message
      });
    }
  }

  self._trigger('incomingMessage', {
    content: message,
    isPrivate: isPrivate,
    targetPeerId: targetPeerId || null,
    isDataChannel: true,
    senderPeerId: self._user.sid
  }, self._user.sid, self.getPeerInfo(), true);
};

/**
 * Starts a [data URI](https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   /readAsDataURL) transfer with Peers using the DataChannel connection.
 * - The receiving Peers have the option to accept or reject the data transfer with
 *   <a href="#method_acceptDataTransfer">acceptDataTransfer()</a>.
 * - For Peers connecting from our mobile platforms
 *   (<a href="http://skylink.io/ios/">iOS</a> / <a href="http://skylink.io/android/">Android</a>),
 *   the DataChannel connection channel type would be <code>DATA_CHANNEL_TYPE.MESSAGING</code>.<br>
 *   For Peers connecting from the Web platform, the DataChannel connection channel type would be
 *  <code>DATA_CHANNEL_TYPE.DATA</code>.
 * @method sendURLData
 * @param {String} data The dataURL (base64 binary string) string to transfer to Peers.
 * @param {Number} [timeout=60] The waiting timeout in seconds that the DataChannel connection
 *   data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {String|Array} [targetPeerId] The array of targeted Peers to transfer the
 *   data object to. Alternatively, you may provide this parameter as a string to a specific
 *   targeted Peer to transfer the data object.
 * @param {Function} [callback] The callback fired after all the data transfers is completed
 *   successfully or met with an exception. The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {String} [callback.error.state=null] <i>Deprecated</i>. The
 *   <a href="#event_dataTransferState">dataTransferState</a>
 *   when the error has occurred. This only triggers for a single targeted Peer data transfer.
 * @param {Object|String} [callback.error.error=null] <i>Deprecated</i>. The error received when the
 *   data transfer fails. This only triggers for single targeted Peer data transfer.
 * @param {String} callback.error.transferId The transfer ID of the failed data transfer.
 * @param {String} [callback.error.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.error.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.error.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.error.transferErrors The list of errors occurred based on per Peer
 *   basis.
 * @param {Object|String} callback.error.transferErrors.(#peerId) The error that occurred when having
 *   a DataChannel connection data transfer with associated Peer.
 * @param {JSON} callback.error.transferInfo The transfer data object information.
 * @param {String} [callback.error.transferInfo.name=transferId] The data transfer ID.
 * @param {Number} callback.error.transferInfo.size The transfer data size.
 * @param {String} callback.error.transferInfo.transferId The data transfer ID.
 * @param {String} callback.error.transferInfo.dataType The type of data transfer initiated.
 *   The received type would be <code>"dataURL"</code>.
 * @param {String} callback.error.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.error.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} [callback.success.state=null] <i>Deprecated</i>. The
 *   <a href="#method_dataTransferState">dataTransferState</a>
 *   when the data transfer has been completed successfully.
 *   This only triggers for a single targeted Peer data transfer.
 * @param {String} callback.success.transferId The transfer ID of the successful data transfer.
 * @param {String} [callback.success.peerId=null] The single targeted Peer ID for the data transfer.
 *   This only triggers for single targeted Peer data transfer.
 * @param {Array} callback.success.listOfPeers The list of Peer that the data transfer has been
 *   initiated with.
 * @param {Boolean} callback.success.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @param {JSON} callback.success.transferInfo The transfer data object information.
 * @param {String} [callback.success.transferInfo.name=transferId] The data transfer ID.
 * @param {Number} callback.success.transferInfo.size The transfer data size.
 * @param {String} callback.success.transferInfo.transferId The data transfer ID.
 * @param {String} callback.success.transferInfo.dataType The type of data transfer initiated.
 *   The received type would be <code>"dataURL"</code>.
 * @param {String} callback.success.transferInfo.timeout The waiting timeout in seconds that the DataChannel
 *   connection data transfer should wait before throwing an exception and terminating the data transfer.
 * @param {Boolean} callback.success.transferInfo.isPrivate The flag to indicate if the data transfer is a private
 *   transfer to the Peer directly and not broadcasted to all Peers.
 * @example
 *
 *   // Example 1: Send dataURL to all peers connected
 *   SkylinkDemo.sendURLData(dataURL, 67);
 *
 *   // Example 2: Send dataURL to individual peer
 *   SkylinkDemo.sendURLData(dataURL, 87, targetPeerId);
 *
 *   // Example 3: Send dataURL with callback
 *   SkylinkDemo.sendURLData(dataURL, 87, function(error, success){
 *     if (error){
 *       console.error("Error happened. Could not send dataURL", error);
 *     }
 *     else{
 *       console.info("Successfully sent dataURL");
 *     }
 *   });
 *
 * @trigger incomingData, incomingDataRequest, dataTransferState, dataChannelState
 * @since 0.6.1
 * @component DataTransfer
 * @for Skylink
 */
Skylink.prototype.sendURLData = function(data, timeout, targetPeerId, callback) {
  var listOfPeers = Object.keys(this._peerConnections);
  var isPrivate = false;
  var dataInfo = {};
  var transferId = this._user.sid + this.DATA_TRANSFER_TYPE.UPLOAD +
    (((new Date()).toISOString().replace(/-/g, '').replace(/:/g, ''))).replace('.', '');
  // for error case
  var errorMsg, errorPayload, i, peerId; // for jshint
  var singleError = null;
  var transferErrors = {};
  var stateError = null;
  var singlePeerId = null;

  //Shift parameters
  // timeout
  if (typeof timeout === 'function') {
    callback = timeout;

  } else if (typeof timeout === 'string') {
    listOfPeers = [timeout];
    isPrivate = true;

  } else if (Array.isArray(timeout)) {
    listOfPeers = timeout;
    isPrivate = true;
  }

  // targetPeerId
  if (typeof targetPeerId === 'function'){
    callback = targetPeerId;

  // data, timeout, target [array], callback
  } else if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;

  // data, timeout, target [string], callback
  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  //state: String, Deprecated. But for consistency purposes. Null if not a single peer
  //error: Object, Deprecated. But for consistency purposes. Null if not a single peer
  //transferId: String,
  //peerId: String, Deprecated. But for consistency purposes. Null if not a single peer
  //listOfPeers: Array, NEW!!
  //isPrivate: isPrivate, NEW!!
  //transferErrors: JSON, NEW!! - Array of errors
  //transferInfo: JSON The same payload as dataTransferState transferInfo payload

  // check if it's blob data
  if (typeof data !== 'string') {
    errorMsg = 'Provided data is not a dataURL';

    if (listOfPeers.length === 0) {
      transferErrors.self = errorMsg;

    } else {
      for (i = 0; i < listOfPeers.length; i++) {
        peerId = listOfPeers[i];
        transferErrors[peerId] = errorMsg;
      }

      // Deprecated but for consistency purposes. Null if not a single peer.
      if (listOfPeers.length === 1 && isPrivate) {
        stateError = self.DATA_TRANSFER_STATE.ERROR;
        singleError = errorMsg;
        singlePeerId = listOfPeers[0];
      }
    }

    errorPayload = {
      state: stateError,
      error: singleError,
      transferId: transferId,
      peerId: singlePeerId,
      listOfPeers: listOfPeers,
      transferErrors: transferErrors,
      transferInfo: dataInfo,
      isPrivate: isPrivate
    };

    log.error(errorMsg, errorPayload);

    if (typeof callback === 'function'){
      log.log([null, 'RTCDataChannel', null, 'Error occurred. Firing callback ' +
        'with error -> '],errorPayload);
      callback(errorPayload, null);
    }
    return;
  }

  // populate data
  dataInfo.name = data.name || transferId;
  dataInfo.size = data.size || data.length;
  dataInfo.timeout = typeof timeout === 'number' ? timeout : 60;
  dataInfo.transferId = transferId;
  dataInfo.dataType = 'dataURL';
  dataInfo.isPrivate = isPrivate;

  // check if datachannel is enabled first or not
  if (!this._enableDataChannel) {
    errorMsg = 'Unable to send any dataURL. Datachannel is disabled';

    if (listOfPeers.length === 0) {
      transferErrors.self = errorMsg;

    } else {
      for (i = 0; i < listOfPeers.length; i++) {
        peerId = listOfPeers[i];
        transferErrors[peerId] = errorMsg;
      }

      // Deprecated but for consistency purposes. Null if not a single peer.
      if (listOfPeers.length === 1 && isPrivate) {
        stateError = self.DATA_TRANSFER_STATE.ERROR;
        singleError = errorMsg;
        singlePeerId = listOfPeers[0];
      }
    }

    errorPayload = {
      state: stateError,
      error: singleError,
      transferId: transferId,
      peerId: singlePeerId,
      listOfPeers: listOfPeers,
      transferErrors: transferErrors,
      transferInfo: dataInfo,
      isPrivate: isPrivate
    };

    log.error(errorMsg, errorPayload);

    if (typeof callback === 'function'){
      log.log([null, 'RTCDataChannel', null, 'Error occurred. Firing callback ' +
        'with error -> '], errorPayload);
      callback(errorPayload, null);
    }
    return;
  }

  this._startDataTransfer(data, dataInfo, listOfPeers, callback);
};

Skylink.prototype._peerCandidatesQueue = {};

/**
 * Stores the list of flags associated to the PeerConnections
 *   to disable trickle ICE as attempting to establish an
 *   ICE connection failed after many trickle ICE connection
 *   attempts. To ensure the stability and increase the chances
 *   of a successful ICE connection, track the Peer connection and store
 *   it as a flag in this list to disable trickling of ICE connections.
 * @attribute _peerIceTrickleDisabled
 * @param {Boolean} (#peerId) The Peer trickle ICE disabled flag.
 *   If value is <code>true</code>, it means that trickling of ICE is
 *   disabled for subsequent connection attempt.
 * @type JSON
 * @private
 * @required
 * @since 0.5.8
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._peerIceTrickleDisabled = {};

/**
 * Stores the list of candidates sent <code>local</code> and added <code>remote</code> information.
 * @attribute _addedCandidates
 * @param {JSON} (#peerId) The list of candidates sent and added associated with the Peer ID.
 * @param {Array} (#peerId).relay The number of relay candidates added and sent.
 * @param {Array} (#peerId).srflx The number of server reflexive candidates added and sent.
 * @param {Array} (#peerId).host The number of host candidates added and sent.
 * @type JSON
 * @private
 * @required
 * @since 0.6.4
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._addedCandidates = {};

/**
 * The list of Peer connection ICE candidate generation states that Skylink would trigger.
 * - These states references the [w3c WebRTC Specification Draft](http://www.w3.org/TR/webrtc/#idl-def-RTCIceGatheringState).
 * @attribute CANDIDATE_GENERATION_STATE
 * @type JSON
 * @param {String} NEW <small>Value <code>"new"</code></small>
 *   The state when the object was just created, and no networking has occurred yet.<br>
 * This state occurs when Peer connection has just been initialised.
 * @param {String} GATHERING <small>Value <code>"gathering"</code></small>
 *   The state when the ICE engine is in the process of gathering candidates for connection.<br>
 * This state occurs after <code>NEW</code> state.
 * @param {String} COMPLETED <small>Value <code>"completed"</code></small>
 *   The ICE engine has completed gathering. Events such as adding a
 *   new interface or a new TURN server will cause the state to go back to gathering.<br>
 * This state occurs after <code>GATHERING</code> state and means ICE gathering has been done.
 * @readOnly
 * @since 0.4.1
 * @component ICE
 * @for Skylink
 */
Skylink.prototype.CANDIDATE_GENERATION_STATE = {
  NEW: 'new',
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

/**
 * Handles the ICE candidate object received from associated Peer connection
 *   to send the ICE candidate object or wait for all gathering to complete
 *   before sending the candidate to prevent trickle ICE.
 * @method _onIceCandidate
 * @param {String} targetMid The Peer ID associated with the ICE
 *   candidate object received.
 * @param {Event} event The event object received in the <code>RTCPeerConnection.
 *   onicecandidate</code> to parse the ICE candidate and determine
 *   if gathering has completed.
 * @trigger candidateGenerationState
 * @private
 * @since 0.1.0
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._onIceCandidate = function(targetMid, event) {
  var self = this;
  if (event.candidate) {
    if (self._enableIceTrickle && !self._peerIceTrickleDisabled[targetMid]) {
      var messageCan = event.candidate.candidate.split(' ');
      var candidateType = messageCan[7];
      log.debug([targetMid, 'RTCIceCandidate', null, 'Created and sending ' +
        candidateType + ' candidate:'], event);

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.CANDIDATE,
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
        mid: self._user.sid,
        target: targetMid,
        rid: self._room.id
      });

      if (!self._addedCandidates[targetMid]) {
        self._addedCandidates[targetMid] = {
          relay: [],
          host: [],
          srflx: []
        };
      }

      // shouldnt happen but just incase
      if (!self._addedCandidates[targetMid][candidateType]) {
        self._addedCandidates[targetMid][candidateType] = [];
      }

      self._addedCandidates[targetMid][candidateType].push('local:' + messageCan[4] +
        (messageCan[5] !== '0' ? ':' + messageCan[5] : '') +
        (messageCan[2] ? '?transport=' + messageCan[2].toLowerCase() : ''));

    }
  } else {
    log.debug([targetMid, 'RTCIceCandidate', null, 'End of gathering']);
    self._trigger('candidateGenerationState', self.CANDIDATE_GENERATION_STATE.COMPLETED,
      targetMid);
    // Disable Ice trickle option
    if (!self._enableIceTrickle || self._peerIceTrickleDisabled[targetMid]) {
      var sessionDescription = self._peerConnections[targetMid].localDescription;

      // make checks for firefox session description
      if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER && window.webrtcDetectedBrowser === 'firefox') {
        sessionDescription.sdp = self._addSDPSsrcFirefoxAnswer(targetMid, sessionDescription.sdp);
      }

      self._sendChannelMessage({
        type: sessionDescription.type,
        sdp: sessionDescription.sdp,
        mid: self._user.sid,
        agent: window.webrtcDetectedBrowser,
        target: targetMid,
        rid: self._room.id
      });
    }

    // We should remove this.. this could be due to ICE failures
    // Adding this fix is bad
    // Does the restart in the case when the candidates are extremely a lot
    /*var doACandidateRestart = self._addedCandidates[targetMid].relay.length > 20 &&
      (window.webrtcDetectedBrowser === 'chrome' || window.webrtcDetectedBrowser === 'opera');

    log.debug([targetMid, 'RTCIceCandidate', null, 'Relay candidates generated length'], self._addedCandidates[targetMid].relay.length);

    if (doACandidateRestart) {
      setTimeout(function () {
        if (self._peerConnections[targetMid]) {
          if(self._peerConnections[targetMid].iceConnectionState !== self.ICE_CONNECTION_STATE.CONNECTED &&
            self._peerConnections[targetMid].iceConnectionState !== self.ICE_CONNECTION_STATE.COMPLETED) {
            // restart
            self._restartPeerConnection(targetMid, true, true, null, false);
          }
        }
      }, self._addedCandidates[targetMid].relay.length * 50);
    }*/
  }
};

/**
 * Buffers an ICE candidate object associated with a Peer connection
 *   to prevent disruption to ICE connection when ICE candidate
 *   is received before <code>RTCPeerConnection.setRemoteDescription</code>
 *   is called.
 * @method _addIceCandidateToQueue
 * @param {String} targetMid The Peer ID associated with the ICE
 *   candidate object.
 * @param {Object} candidate The constructed ICE candidate object.
 * @private
 * @since 0.5.2
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._addIceCandidateToQueue = function(targetMid, candidate) {
  log.debug([targetMid, null, null, 'Queued candidate to add after ' +
    'setRemoteDescription'], candidate);
  this._peerCandidatesQueue[targetMid] =
    this._peerCandidatesQueue[targetMid] || [];
  this._peerCandidatesQueue[targetMid].push(candidate);
};

/**
 * Handles the event when adding an ICE candidate has been added
 *   successfully. This is mainly to prevent JShint errors.
 * @method _onAddIceCandidateSuccess
 * @private
 * @since 0.5.9
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._onAddIceCandidateSuccess = function () {
  log.debug([null, 'RTCICECandidate', null, 'Successfully added ICE candidate']);
};

/**
 * Handles the event when adding an ICE candidate has failed.
 * This is mainly to prevent JShint errors.
 * @method _onAddIceCandidateFailure
 * @param {Object} error The error received in the failure callback
 *   in <code>RTCPeerConnection.addIceCandidate(candidate, successCb, failureCb)</code>.
 * @private
 * @since 0.5.9
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._onAddIceCandidateFailure = function (error) {
  log.error([null, 'RTCICECandidate', null, 'Error'], error);
};

/**
 * Adds the list of ICE candidates bufferred before <code>RTCPeerConnection.setRemoteDescription
 *   </code> is called associated with the Peer connection.
 * @method _addIceCandidateFromQueue
 * @param {String} targetMid The Peer ID to add the associated bufferred
 *   ICE candidates.
 * @private
 * @since 0.5.2
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._addIceCandidateFromQueue = function(targetMid) {
  this._peerCandidatesQueue[targetMid] =
    this._peerCandidatesQueue[targetMid] || [];
  if(this._peerCandidatesQueue[targetMid].length > 0) {
    for (var i = 0; i < this._peerCandidatesQueue[targetMid].length; i++) {
      var candidate = this._peerCandidatesQueue[targetMid][i];
      log.debug([targetMid, null, null, 'Added queued candidate'], candidate);
      this._peerConnections[targetMid].addIceCandidate(candidate,
        this._onAddIceCandidateSuccess, this._onAddIceCandidateFailure);
    }
    delete this._peerCandidatesQueue[targetMid];
  } else {
    log.log([targetMid, null, null, 'No queued candidates to add']);
  }
};
Skylink.prototype.ICE_CONNECTION_STATE = {
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
 * These are the list of available transports that
 *   Skylink would use to connect to the TURN servers with.
 * - For example as explanation how these options works below, let's take that
 *   these are list of TURN servers given by the platform signaling:<br>
 *   <small><code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @attribute TURN_TRANSPORT
 * @type JSON
 * @param {String} TCP <small>Value <code>"tcp"</code></small>
 *   The option to connect using only TCP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code></small>
 * @param {String} UDP <small>Value <code>"udp"</code></small>
 *   The option to connect using only UDP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @param {String} ANY <small><b>DEFAULT</b> | Value <code>"any"</code></small>
 *   This option to use any transports that is preconfigured by provided by the platform signaling.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234</code><br>
 *   <code>turn:turnurl</code></small>
 * @param {String} NONE <small>Value <code>"none"</code></small>
 *   This option to set no transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123</code><br>
 *   <code>turn:turnurl</code><br>
 *   <code>turn:turnurl:1234</code></small>
 * @param {String} ALL <small>Value <code>"all"</code></small>
 *   This option to use both TCP and UDP transports.
 *   <small>EXAMPLE OUTPUT<br>
 *   <code>turn:turnurl:123?transport=tcp</code><br>
 *   <code>turn:turnurl:123?transport=udp</code><br>
 *   <code>turn:turnurl?transport=tcp</code><br>
 *   <code>turn:turnurl?transport=udp</code><br>
 *   <code>turn:turnurl:1234?transport=tcp</code><br>
 *   <code>turn:turnurl:1234?transport=udp</code></small>
 * @readOnly
 * @since 0.5.4
 * @component ICE
 * @for Skylink
 */
Skylink.prototype.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none',
  ALL: 'all'
};

/**
 * The flag that indicates if PeerConnections should enable
 *    trickling of ICE to connect the ICE connection.
 * @attribute _enableIceTrickle
 * @type Boolean
 * @default true
 * @private
 * @required
 * @since 0.3.0
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._enableIceTrickle = true;

/**
 * The flag that indicates if PeerConnections ICE gathering
 *   should use STUN server connection.
 * @attribute _enableSTUN
 * @type Boolean
 * @default true
 * @private
 * @required
 * @component ICE
 * @since 0.5.4
 */
Skylink.prototype._enableSTUN = true;

/**
 * The flag that indicates if PeerConnections ICE gathering
 *   should use TURN server connection.
 * Tampering this flag may disable any successful Peer connection
 *   that is behind any firewalls.
 * @attribute _enableTURN
 * @type Boolean
 * @default true
 * @private
 * @required
 * @component ICE
 * @since 0.5.4
 */
Skylink.prototype._enableTURN = true;

/**
 * The flag to enable using of public STUN server connections.
 * @attribute _usePublicSTUN
 * @type Boolean
 * @default true
 * @required
 * @private
 * @component ICE
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._usePublicSTUN = true;

/**
 * Stores the TURN server transport to enable for TURN server connections.
 * [Rel: Skylink.TURN_TRANSPORT]
 * @attribute _TURNTransport
 * @type String
 * @default Skylink.TURN_TRANSPORT.ANY
 * @private
 * @required
 * @since 0.5.4
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._TURNTransport = 'any';

/**
 * Stores the list of Peer connection ICE connection failures.
 * After an third attempt of ICE connection failure, the
 *   trickling of ICE would be disabled.
 * @attribute _ICEConnectionFailures
 * @param {Number} (#peerId) The Peer ID associated with the
 *   number of Peer connection ICE connection attempt failures.
 * @type JSON
 * @private
 * @required
 * @component Peer
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._ICEConnectionFailures = {};

/**
 * Reconfigures the <code>RTCConfiguration.iceServers</code> that is
 *   to be passed in constructing the new <code>RTCPeerConnection</code>
 *   object to remove (disable) STUN or remove TURN (disable) server
 *   connections based on the
 *   {{#crossLink "Skylink/init:method"}}init(){{/crossLink}}
 *   configuration passed in.
 * @method _setIceServers
 * @param {JSON} config The RTCConfiguration that is to be passed for
 *   constructing the new RTCPeerConnection object.
 * @return {JSON} The updated RTCConfiguration object based on the
 *   configuration settings in the
 *   {{#crossLink "Skylink/init:method"}}init(){{/crossLink}}
 *   method.
 * @private
 * @since 0.5.4
 * @component ICE
 * @for Skylink
 */
Skylink.prototype._setIceServers = function(givenConfig) {
  var givenIceServers = clone(givenConfig.iceServers);
  var iceServersList = {};
  var newIceServers = [];
  // TURN SSL config
  var useTURNSSLProtocol = false;
  var useTURNSSLPort = false;



  if (window.location.protocol === 'https:' || this._forceTURNSSL) {
    if (window.webrtcDetectedBrowser === 'chrome' ||
      window.webrtcDetectedBrowser === 'safari' ||
      window.webrtcDetectedBrowser === 'IE') {
      useTURNSSLProtocol = true;
      useTURNSSLPort = false;
    } else {
      useTURNSSLPort = true;
    }
  }

  log.log('TURN server connections SSL configuration', {
    useTURNSSLProtocol: useTURNSSLProtocol,
    useTURNSSLPort: useTURNSSLPort
  });

  var pushIceServer = function (username, credential, url, index) {
    if (!iceServersList[username]) {
      iceServersList[username] = {};
    }

    if (!iceServersList[username][credential]) {
      iceServersList[username][credential] = [];
    }

    if (iceServersList[username][credential].indexOf(url) === -1) {
      if (typeof index === 'number') {
        iceServersList[username][credential].splice(index, 0, url);
      } else {
        iceServersList[username][credential].push(url);
      }
    }
  };

  var i, serverItem;

  for (i = 0; i < givenIceServers.length; i++) {
    var server = givenIceServers[i];

    if (typeof server.url !== 'string') {
      log.warn('Ignoring ICE server provided at index ' + i, clone(server));
      continue;
    }

    if (server.url.indexOf('stun') === 0) {
      if (!this._enableSTUN) {
        log.warn('Ignoring STUN server provided at index ' + i, clone(server));
        continue;
      }

      if (!this._usePublicSTUN && server.url.indexOf('temasys') === -1) {
        log.warn('Ignoring public STUN server provided at index ' + i, clone(server));
        continue;
      }

    } else if (server.url.indexOf('turn') === 0) {
      if (!this._enableTURN) {
        log.warn('Ignoring TURN server provided at index ' + i, clone(server));
        continue;
      }

      if (server.url.indexOf(':443') === -1 && useTURNSSLPort) {
        log.log('Ignoring TURN Server (non-SSL port) provided at index ' + i, clone(server));
        continue;
      }

      if (useTURNSSLProtocol) {
        var parts = server.url.split(':');
        parts[0] = 'turns';
        server.url = parts.join(':');
      }
    }

    // parse "@" settings
    if (server.url.indexOf('@') > 0) {
      var protocolParts = server.url.split(':');
      var urlParts = protocolParts[1].split('@');
      server.username = urlParts[0];
      server.url = protocolParts[0] + ':' + urlParts[1];

      // add the ICE server port
      if (protocolParts[2]) {
        server.url += ':' + protocolParts[2];
      }
    }

    var username = typeof server.username === 'string' ? server.username : 'none';
    var credential = typeof server.credential === 'string' ? server.credential : 'none';

    if (server.url.indexOf('turn') === 0) {
      if (this._TURNTransport === this.TURN_TRANSPORT.ANY) {
        pushIceServer(username, credential, server.url);

      } else {
        var rawUrl = server.url;

        if (rawUrl.indexOf('?transport=') > 0) {
          rawUrl = rawUrl.split('?transport=')[0];
        }

        if (this._TURNTransport === this.TURN_TRANSPORT.NONE) {
          pushIceServer(username, credential, rawUrl);
        } else if (this._TURNTransport === this.TURN_TRANSPORT.UDP) {
          pushIceServer(username, credential, rawUrl + '?transport=udp');
        } else if (this._TURNTransport === this.TURN_TRANSPORT.TCP) {
          pushIceServer(username, credential, rawUrl + '?transport=tcp');
        } else if (this._TURNTransport === this.TURN_TRANSPORT.ALL) {
          pushIceServer(username, credential, rawUrl + '?transport=tcp');
          pushIceServer(username, credential, rawUrl + '?transport=udp');
        } else {
          log.warn('Invalid TURN transport option "' + this._TURNTransport +
            '". Ignoring TURN server at index' + i, clone(server));
          continue;
        }
      }
    } else {
      pushIceServer(username, credential, server.url);
    }
  }

  // add mozilla STUN for firefox
  if (this._enableSTUN && this._usePublicSTUN && window.webrtcDetectedBrowser === 'firefox') {
    pushIceServer('none', 'none', 'stun:stun.services.mozilla.com', 0);
  }

  var hasUrlsSupport = false;

  if (window.webrtcDetectedBrowser === 'chrome' && window.webrtcDetectedVersion > 34) {
    hasUrlsSupport = true;
  }

  if (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion > 38) {
    hasUrlsSupport = true;
  }

  if (window.webrtcDetectedBrowser === 'opera' && window.webrtcDetectedVersion > 31) {
    hasUrlsSupport = true;
  }

  // plugin supports .urls
  if (window.webrtcDetectedBrowser === 'safari' || window.webrtcDetectedBrowser === 'IE') {
    hasUrlsSupport = true;
  }

  for (var serverUsername in iceServersList) {
    if (iceServersList.hasOwnProperty(serverUsername)) {
      for (var serverCred in iceServersList[serverUsername]) {
        if (iceServersList[serverUsername].hasOwnProperty(serverCred)) {
          if (hasUrlsSupport) {
            var urlsItem = {
              urls: iceServersList[serverUsername][serverCred]
            };
            if (serverUsername !== 'none') {
              urlsItem.username = serverUsername;
            }
            if (serverCred !== 'none') {
              urlsItem.credential = serverCred;
            }
            newIceServers.push(urlsItem);
          } else {
            for (var j = 0; j < iceServersList[serverUsername][serverCred].length; j++) {
              var urlItem = {
                url: iceServersList[serverUsername][serverCred][j]
              };
              if (serverUsername !== 'none') {
                urlItem.username = serverUsername;
              }
              if (serverCred !== 'none') {
                urlItem.credential = serverCred;
              }
              newIceServers.push(urlItem);
            }
          }
        }
      }
    }
  }

  log.log('Output iceServers configuration:', newIceServers);

  return {
    iceServers: newIceServers
  };
};
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



Skylink.prototype.init = function (passedOptions, passedCallback) {
  var _this = this;

  var options = {},
      callback = function () {};

  // init("appKey")
  if (typeof passedOptions === 'string') {
    options = { appKey: passedOptions };

  // init({})
  } else if (typeof passedOptions === 'object' && passedOptions !== null) {
    options = clone(passedOptions);

  // init(no options error)
  } else {
    var noOptionsError = new Error('Provided appKey is invalid');

    // init(function () {})
    if (typeof passedOptions === 'function') {
      callback = passedOptions;
    }

    callback(noOptionsError, null);
    //throw noOptionsError;
  }

  // init(.., function () {})
  if (typeof passedCallback === 'function') {
    callback = passedCallback;
  }

  _this._readyState = _this.READY_STATE_CHANGE.INIT;
  _this._trigger('readyStateChange', _this.READY_STATE_CHANGE.INIT, null, null);

  var handleErrorCase = function (error) {
    log.error('init() failed ->', error);

    _this._readyState = _this.READY_STATE_CHANGE.ERROR;
    _this._trigger('readyStateChange', _this.READY_STATE_CHANGE.ERROR, error, _this._room.name);

    callback({

      error: error.content,
      errorCode: error.errorCode,
      status: error.status

    }, null);
  };

  var handleSuccessCase = function (response) {
    log.info('init() success ->', response);

    _this._readyState = _this.READY_STATE_CHANGE.COMPLETED;
    _this._trigger('readyStateChange', _this.READY_STATE_CHANGE.COMPLETED, null, _this._room.name);

    callback(null, {

      serverUrl: _this._room.session.path,
      readyState: _this._readyState,
      appKey: _this._room.config.current.appKey,
      roomServer: _this._room.config.current.roomServer,
      defaultRoom: _this._room.config.current.defaultRoom,
      selectedRoom: _this._room.name,
      serverRegion: _this._room.config.current.region,
      enableDataChannel: _this._room.config.current.enableDataChannel,
      enableIceTrickle: _this._room.config.current.enableIceTrickle,
      enableTURNServer: _this._room.config.current.enableTURNServer,
      enableSTUNServer: _this._room.config.current.enableSTUNServer,
      TURNTransport: _this._room.config.current.TURNServerTransport,
      audioFallback: _this._room.config.current.audioFallback,
      forceSSL: _this._room.config.current.forceSSL,
      socketTimeout: _this._room.config.current.socketTimeout,
      forceTURNSSL: _this._room.config.current.forceTURNSSL,
      audioCodec: _this._room.config.current.audioCodec,
      videoCodec: _this._room.config.current.videoCodec,
      forceTURN: _this._room.config.current.forceTURN,
      usePublicSTUN: _this._room.config.current.usePublicSTUN

    });
  };

  try {
    // Parse init() configuration
    _this._initParseConfig(options);
    // Load dependencies
    _this._initLoadDependencies(function (error) {
      if (error) {
        // Failure in loading dependencies
        handleErrorCase(error);
        return;
      }

      _this._readyState = _this.READY_STATE_CHANGE.LOADING;
      _this._trigger('readyStateChange', _this.READY_STATE_CHANGE.LOADING, null, _this._room.name);

      // Fetch room session
      _this._roomFetchSession(function (error, success) {
        if (error) {
          // Failure in fetching room session
          handleErrorCase(error);
          return;
        }
        // Fetch room session success
        handleSuccessCase(success);
      });
    });

  } catch (error) {
    handleErrorCase({

      errorCode: _this.READY_STATE_CHANGE_ERROR.NO_PATH,
      content: error,
      status: null

    });
  }
};

/**
 * Connects self to the selected room.
 * By default, if room parameter is not provided, it will
 *   connect to the default room provided in
 *   {{#crossLink "Skylink/init:method"}}init() <code>defaultRoom</code> settings{{/crossLink}}.
 * If any existing user media streams attached in Skylink, like for an example, calling
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}} or
 *   {{#crossLink "Skylink/sendStream:method"}}sendStream(){{/crossLink}} before
 *   <code>joinRoom()</code>, self would actually send the current attached user media stream
 *   attached. To stop the current attached Stream, please invoke
 *   {{#crossLink "Skylink/stopStream:method"}}stopStream(){{/crossLink}} before
 *   <code>joinRoom()</code> is invoked.
 * @method joinRoom
 * @param {String} [room] The room for
 *   self to join to. If room is not provided, the room
 *   would default to the the <code>defaultRoom</code> option set
 *   in {{#crossLink "Skylink/init:method"}}init() settings{{/crossLink}}.
 * @param {JSON} [options] The connection settings for self connection in the
 *   room. If both audio and video
 *   option is <code>false</code>, there should be no audio and video stream
 *   sending from self connection.
 * @param {String|JSON} [options.userData] The custom user data
 *   information set by developer. This custom user data can also
 *   be set in {{#crossLink "Skylink/setUserData:method"}}setUserData(){{/crossLink}}.
 * @param {Boolean|JSON} [options.audio=false] The self Stream streaming audio settings.
 *   If <code>false</code>, it means that audio streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [options.audio.stereo] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean} [options.audio.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Array} [options.audio.optional] The optional constraints for audio streaming
 *   in self user media Stream object. This follows the <code>optional</code>
 *   setting in the <code>MediaStreamConstraints</code> when <code>getUserMedia()</code> is invoked.
 *   Tampering this may cause errors in retrieval of self user media Stream object.
 *   Refer to this [site for more reference](http://www.sitepoint.com/introduction-getusermedia-api/).
 * @param {Boolean|JSON} [options.video=false] The self Stream streaming video settings.
 *   If <code>false</code>, it means that video streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {Boolean} [options.video.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {Array} [options.video.optional] The optional constraints for video streaming
 *   in self user media Stream object. This follows the <code>optional</code>
 *   setting in the <code>MediaStreamConstraints</code> when <code>getUserMedia()</code> is invoked.
 *   Tampering this may cause errors in retrieval of self user media Stream object.
 *   Refer to this [site for more reference](http://www.sitepoint.com/introduction-getusermedia-api/).
 * @param {JSON} [options.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [options.video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [options.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 * @param {String} [options.bandwidth] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {String} [options.bandwidth.audio=50] The configured
 *   audio stream channel for the self Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {String} [options.bandwidth.video=256] The configured
 *   video stream channel for the self Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {String} [options.bandwidth.data=1638400] The configured
 *   datachannel channel for the DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @param {Boolean} [options.manualGetUserMedia] The flag that indicates if
 *   <code>joinRoom()</code> should not invoke
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   automatically but allow the developer's application to invoke
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   manually in the application. When user media access is required, the
 *   event {{#crossLink "Skylink/mediaAccessRequired:event"}}mediaAccessRequired{{/crossLink}}
 *   will be triggered.
 * @param {Function} [callback] The callback fired after self has
 *   joined the room successfully with the provided media settings or
 *   have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Array} callback.error.error The exception thrown that caused the failure
 *   for joining the room.
 * @param {JSON} callback.error.errorCode The
 *   <a href="#attr_READY_STATE_CHANGE_ERROR">READY_STATE_CHANGE_ERROR</a>
 *   if there is an <a href="#event_readyStateChange">readyStateChange</a>
 *   event error that caused the failure for joining the room.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @param {Object|String} callback.error.room The selected room that self is
 *   trying to join to.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {Array} callback.success.room The selected room that self has
 *   succesfully joined to.
 * @param {String} callback.success.peerId The self Peer ID that
 *   would be reflected remotely to peers in the room.
 * @param {JSON} callback.success.peerInfo The connection settings for self connection in the
 *   room. If both audio and video option is <code>false</code>,
 *   there should be no audio and video stream sending from self connection.
  * @param {String|JSON} callback.success.peerInfo.userData The custom user data
 *   information set by developer. This custom user data can also
 *   be set in <a href="#method_setUserData">setUserData()</a>.
 * @param {Boolean|JSON} [callback.success.peerInfo.audio=false] The self Stream
 *   streaming audio settings. If <code>false</code>, it means that audio
 *   streaming is disabled in the self Stream. If this option is set to
 *   <code>true</code> or is defined with settings,
 *   <a href="#method_getUserMedia">getUserMedia()</a>
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [callback.success.peerInfo.audio.stereo] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *    audio streaming.
 * @param {Boolean|JSON} [callback.success.peerInfo.video=false] The self Stream
 *   streaming video settings. If <code>false</code>, it means that video
 *   streaming is disabled in the self Stream. If this option is set to
 *   <code>true</code> or is defined with settings,
 *   <a href="#method_getUserMedia">getUserMedia()</a>
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {JSON} [callback.success.peerInfo.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [callback.success.peerInfo.video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [callback.success.peerInfo.video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [callback.success.peerInfo.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 * @param {Boolean} [callback.success.peerInfo.video.screenshare=false] The flag
 *   that indicates if the self connection Stream object sent
 *   is a screensharing stream or not.
 * @param {String} [callback.success.peerInfo.bandwidth] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {String} [callback.success.peerInfo.bandwidth.audio=50] The configured
 *   audio stream channel for the self Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {String} [callback.success.peerInfo.bandwidth.video=256] The configured
 *   video stream channel for the self Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {String} [callback.success.peerInfo.bandwidth.data=1638400] The configured
 *   datachannel channel for the DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @param {JSON} callback.success.peerInfo.mediaStatus The self Stream mute
 *   settings for both audio and video streamings.
 * @param {Boolean} [callback.success.peerInfo.mediaStatus.audioMuted=true] The flag that
 *   indicates if the self Stream object audio streaming is muted. If
 *   there is no audio streaming enabled for the self, by default,
 *   it is set to <code>true</code>.
 * @param {Boolean} [callback.success.peerInfo.mediaStatus.videoMuted=true] The flag that
 *   indicates if the self Stream object video streaming is muted. If
 *   there is no video streaming enabled for the Peer connection, by default,
 *   it is set to <code>true</code>.
 * @param {JSON} callback.success.peerInfo.agent The self platform agent information.
 * @param {String} callback.success.peerInfo.agent.name The self platform browser or agent name.
 * @param {Number} callback.success.peerInfo.agent.version The self platform browser or agent version.
 * @param {Number} callback.success.peerInfo.agent.os The self platform name.
 * @param {String} callback.success.peerInfo.room The current room that the self is in.
 * @example
 *   // To just join the default room without any video or audio
 *   // Note that calling joinRoom without any parameters
 *   // still sends any available existing MediaStreams allowed.
 *   // See Examples 2, 3, 4 and 5 etc to prevent video or audio stream
 *   SkylinkDemo.joinRoom();
 *
 *   // To just join the default room with bandwidth settings
 *   SkylinkDemo.joinRoom({
 *     bandwidth: {
 *       data: 14440
 *     }
 *   });
 *
 *   // Example 1: To call getUserMedia and joinRoom seperately
 *   SkylinkDemo.getUserMedia();
 *   SkylinkDemo.on("mediaAccessSuccess", function (stream)) {
 *     attachMediaStream($(".localVideo")[0], stream);
 *     SkylinkDemo.joinRoom();
 *   });
 *
 *   // Example 2: Join a room without any video or audio
 *   SkylinkDemo.joinRoom("room_a");
 *
 *   // Example 3: Join a room with audio only
 *   SkylinkDemo.joinRoom("room_b", {
 *     audio: true,
 *     video: false
 *   });
 *
 *   // Example 4: Join a room with prefixed video width and height settings
 *   SkylinkDemo.joinRoom("room_c", {
 *     audio: true,
 *     video: {
 *       resolution: {
 *         width: 640,
 *         height: 320
 *       }
 *     }
 *   });
 *
 *   // Example 5: Join a room with userData and settings with audio, video
 *   // and bandwidth
 *   SkylinkDemo.joinRoom({
 *     userData: {
 *       item1: "My custom data",
 *       item2: "Put whatever, string or JSON or array"
 *     },
 *     audio: {
 *        stereo: true
 *     },
 *     video: {
 *        resolution: SkylinkDemo.VIDEO_RESOLUTION.VGA,
 *        frameRate: 50
 *     },
 *     bandwidth: {
 *       audio: 48,
 *       video: 256,
 *       data: 14480
 *     }
 *   });
 *
 *   //Example 6: joinRoom with callback
 *   SkylinkDemo.joinRoom(function(error, success){
 *     if (error){
 *       console.log("Error happened. Can not join room");
 *     }
 *     else{
 *       console.log("Successfully joined room");
 *     }
 *   });
 * @trigger readyStateChange, peerJoined, mediaAccessRequired
 * @component Room
 * @for Skylink
 * @since 0.5.5
 */

Skylink.prototype.joinRoom = function(passedRoom, passedMediaOptions, passedCallback) {
  var _this = this;
  var room = null,
      mediaOptions = {},
      callback = function () {};

  // joinRoom("...")
  if (typeof passedRoom === 'string') {
    room = passedRoom;

  // joinRoom({})
  } else if (typeof passedRoom === 'object' && passedRoom !== null) {
    mediaOptions = clone(passedRoom);

  // joinRoom(function () {})
  } else if (typeof passedRoom === 'function') {
    callback = passedRoom;
  }

  // joinRoom(.. , {})
  if (typeof passedMediaOptions === 'object' && passedMediaOptions !== null) {
    mediaOptions = clone(passedMediaOptions);

  // joinRoom(.. , function () {})
  } else if (typeof passedMediaOptions === 'function') {
    callback = passedMediaOptions;
  }

  // joinRoom(.. , .. , function () {})
  if (typeof passedCallback === 'function') {
    callback = passedCallback;
  }

  var handleErrorCase = function (error) {
    log.error('joinRoom() failed ->', error);

    callback({

      room: room,
      errorCode: _this._readyState,
      error: error

    }, null);

    // throw error;
  };

  var handleSuccessCase = function () {
    log.debug('joinRoom() success ->', _this._room.session.data.sid);

    callback(null, {

      room: self._selectedRoom,
      peerId: _this._room.session.data.sid,
      peerInfo: _this.getPeerInfo()

    });
  };

  // NOTE: Should we add checks when room is the same as previous room?
  if (passedRoom === null) {
    handleErrorCase(new Error('Provided room name is invalid'));
    return;
  }

  // Configure the room name based on selection
  if (typeof room === 'string') {
    _this._room.name = room;
  } else {
    _this._room.name = _this._room.config.current.defaultRoom;
  }

  // Handler when you can start fetching Room session and connecting to signaling server
  var connectHandler = function () {
    var channelOpenHandler = function () {
      _this.off('channelClose', channelCloseHandler);
      _this.off('socketError', socketErrorHandler);

      // parse user data settings
      _this._parseUserData(mediaOptions.userData || _this._userData);
      _this._parseBandwidthSettings(mediaOptions.bandwidth || {});

      _this._waitForLocalMediaStream(function () {
        _this._messageConstructJoinRoom();
      }, mediaOptions);
    };

    var channelCloseHandler = function () {
      _this.off('channelOpen', channelOpenHandler);
      _this.off('socketError', socketErrorHandler);

      handleErrorCase(new Error('Failed joining room as socket connection was disconnected whilst joining room'));
    };

    var socketErrorHandler = function (state, error) {
      _this.off('channelClose', channelCloseHandler);
      _this.off('channelOpen', channelOpenHandler);

      handleErrorCase(error);
    };

    // Fetch the new Room session based on provided room name
    _this._roomFetchSession(function (error, success) {
      if (error) {
        handleErrorCase(error);
        return;
      }

      // Hook these events and start socket connection
      _this.once('channelOpen', channelOpenHandler);
      _this.once('channelClose', channelCloseHandler);
      _this.once('socketError', socketErrorHandler, function (state) {
        return state === _this.SOCKET_ERROR.RECONNECTION_ABORTED;
      });

      // Start socket connection to signaling server
      _this._socketConnect();
    });
  };

  // User is in room, close all current connections
  if (_this._room.connected) {
    _this.leaveRoom(false, function (error, success) {
      if (error) {
        handleErrorCase(error);
        return;
      }

      connectHandler();
    });

  // Socket is just connected, close current connection
  } else if (_this._socket.connected) {
    _this.once('channelClose', connectHandler);
    _this._socketDisconnect();

  // There is no current connections yet
  } else {
    connectHandler();
  }
};


/**
 * Disconnects self from current connected room.
 * @method leaveRoom
 * @param {Boolean|JSON} [stopMediaOptions=true] The stop attached Stream options for
 *   Skylink when leaving the room. If provided options is a
 *   <var>typeof</var> <code>boolean</code>, it will be interpreted as both
 *   <code>userMedia</code> and <code>screenshare</code> Streams would be stopped.
 * @param {Boolean} [stopMediaOptions.userMedia=true]  The flag that indicates if leaving the room
 *   should automatically stop and clear the existing user media stream attached to skylink.
 *   This would trigger <code>mediaAccessStopped</code> for this Stream if available.
 * @param {Boolean} [stopMediaOptions.screenshare=true] The flag that indicates if leaving the room
 *   should automatically stop and clear the existing screensharing stream attached to skylink.
 *   This would trigger <code>mediaAccessStopped</code> for this Stream if available.
 * @param {Function} [callback] The callback fired after self has
 *   left the room successfully or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {Object} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} callback.success.peerId The assigned previous Peer ID
 *   to self given when self was still connected to the room.
 * @param {String} callback.success.previousRoom The room self was disconnected
 *   from.
 * @example
 *   //Example 1: Just leaveRoom
 *   SkylinkDemo.leaveRoom();
 *
 *   //Example 2: leaveRoom with callback
 *   SkylinkDemo.leaveRoom(function(error, success){
 *     if (error){
 *       console.log("Error happened");
 *     }
 *     else{
 *       console.log("Successfully left room");
 *     }
 *   });
 * @trigger peerLeft, channelClose, streamEnded
 * @component Room
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.leaveRoom = function(stopMediaOptions, callback) {
  var self = this;
  var error; // j-shint !!!
  var stopUserMedia = true;
  var stopScreenshare = true;

  // shift parameters
  if (typeof stopMediaOptions === 'function') {
    callback = stopMediaOptions;
    stopMediaOptions = true;
  } else if (typeof stopMediaOptions === 'undefined') {
    stopMediaOptions = true;
  }

  // stopMediaOptions === null or {} ?
  if (typeof stopMediaOptions === 'object' && stopMediaOptions !== null) {
    stopUserMedia = stopMediaOptions.userMedia !== false;
    stopScreenshare = stopMediaOptions.screenshare !== false;

  } else if (typeof stopMediaOptions !== 'boolean') {
    error = 'stopMediaOptions parameter provided is not a boolean or valid object';
    log.error(error, stopMediaOptions);
    if (typeof callback === 'function') {
      log.log([null, 'Socket', self._selectedRoom, 'Error occurred. ' +
        'Firing callback with error -> '
      ], error);
      callback(new Error(error), null);
    }
    return;

  } else if (stopMediaOptions === false) {
    stopUserMedia = false;
    stopScreenshare = false;
  }

  if (!self._inRoom) {
    error = 'Unable to leave room as user is not in any room';
    log.error(error);
    if (typeof callback === 'function') {
      log.log([null, 'Socket', self._selectedRoom, 'Error occurred. ' +
        'Firing callback with error -> '
      ], error);
      callback(new Error(error), null);
    }
    return;
  }

  // NOTE: ENTER/WELCOME made but no peerconnection...
  // which may result in peerLeft not triggered..
  // WHY? but to ensure clear all
  var peers = Object.keys(self._peerInformations);
  var conns = Object.keys(self._peerConnections);
  var i;
  for (i = 0; i < conns.length; i++) {
    if (peers.indexOf(conns[i]) === -1) {
      peers.push(conns[i]);
    }
  }
  for (i = 0; i < peers.length; i++) {
    self._removePeer(peers[i]);
  }
  self._inRoom = false;
  self._closeChannel();

  self._stopLocalMediaStreams({
    userMedia: stopUserMedia,
    screenshare: stopScreenshare
  });

  self._wait(function() {
    log.log([null, 'Socket', self._selectedRoom, 'User left the room. Callback fired.']);
    self._trigger('peerLeft', self._user.sid, self.getPeerInfo(), true);

    if (typeof callback === 'function') {
      callback(null, {
        peerId: self._user.sid,
        previousRoom: self._selectedRoom
      });
    }
  }, function() {
    return (Object.keys(self._peerConnections).length === 0 &&
      self._channelOpen === false); // &&
      //self._readyState === self.READY_STATE_CHANGE.COMPLETED);
  }, false);
};

/**
 * Locks the currently connected room to prevent other peers
 *   from joining the room.
 * @method lockRoom
 * @example
 *   SkylinkDemo.lockRoom();
 * @trigger roomLock
 * @component Room
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.lockRoom = function() {
  log.log('Update to isRoomLocked status ->', true);
  this._sendChannelMessage({
    type: this._SIG_MESSAGE_TYPE.ROOM_LOCK,
    mid: this._user.sid,
    rid: this._room.id,
    lock: true
  });
  this._roomLocked = true;
  this._trigger('roomLock', true, this._user.sid,
    this.getPeerInfo(), true);
};

/**
 * Unlocks the currently connected room to allow other peers
 *   to join the room.
 * @method unlockRoom
 * @example
 *   SkylinkDemo.unlockRoom();
 * @trigger roomLock
 * @component Room
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.unlockRoom = function() {
  log.log('Update to isRoomLocked status ->', false);
  this._sendChannelMessage({
    type: this._SIG_MESSAGE_TYPE.ROOM_LOCK,
    mid: this._user.sid,
    rid: this._room.id,
    lock: false
  });
  this._roomLocked = false;
  this._trigger('roomLock', false, this._user.sid,
    this.getPeerInfo(), true);
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
  var params = {
    cid: this._key,
    data: message,
    mid: this._user.sid,
    rid: this._room.id,
    type: this._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE
  };

  var listOfPeers = Object.keys(this._peerConnections);
  var isPrivate = false;
  var i;

  if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;

  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (!isPrivate) {
    log.log([null, 'Socket', null, 'Broadcasting message to peers']);

    this._sendChannelMessage({
      cid: this._key,
      data: message,
      mid: this._user.sid,
      rid: this._room.id,
      type: this._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE
    });
  }

  for (i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    // Ignore MCU peer
    if (peerId === 'MCU') {
      continue;
    }

    if (isPrivate) {
      log.log([peerId, 'Socket', null, 'Sending message to peer']);

      this._sendChannelMessage({
        cid: this._key,
        data: message,
        mid: this._user.sid,
        rid: this._room.id,
        target: peerId,
        type: this._SIG_MESSAGE_TYPE.PRIVATE_MESSAGE
      });
    }
  }

  this._trigger('incomingMessage', {
    content: message,
    isPrivate: isPrivate,
    targetPeerId: targetPeerId,
    isDataChannel: false,
    senderPeerId: this._user.sid
  }, this._user.sid, this.getPeerInfo(), true);
};

Skylink.prototype._peerInformations = {};

/**
 * Stores the custom user data information set by developer for self.
 * By default, if no custom user data is set, it is an empty string <code>""</code>.
 * @attribute _userData
 * @type JSON|String
 * @default ""
 * @required
 * @private
 * @component User
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._userData = '';

/**
 * Sets the current custom user data information for self.
 * This sets and overwrites the <code>peerInfo.userData</code> value for self.
 * If self is in the room and connected with other peers, the peers will be notified
 *   with the {{#crossLink "Skylink/peerUpdated:event"}}peerUpdated{{/crossLink}} event.
 * You may get the current customer user data information for self in
 *   {{#crossLink "Skylink/getUserData:method"}}getUserData(){{/crossLink}}.
 * @method setUserData
 * @param {JSON|String} userData The custom (or updated) user data information
 *   for self provided.
 * @example
 *   // Example 1: Intial way of setting data before user joins the room
 *   SkylinkDemo.setUserData({
 *     displayName: "Bobby Rays",
 *     fbUserId: "1234"
 *   });
 *
 *   // Example 2: Way of setting data after user joins the room
 *   var userData = SkylinkDemo.getUserData();
 *   userData.displayName = "New Name";
 *   userData.fbUserId = "1234";
 *   SkylinkDemo.setUserData(userData);
 * @trigger peerUpdated
 * @component User
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.setUserData = function(userData) {
  var self = this;
  // NOTE ALEX: be smarter and copy fields and only if different
  self._parseUserData(userData);

  if (self._inRoom) {
    log.log('Updated userData -> ', userData);
    self._sendChannelMessage({
      type: self._SIG_MESSAGE_TYPE.UPDATE_USER,
      mid: self._user.sid,
      rid: self._room.id,
      userData: self._userData
    });
    self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
  } else {
    log.warn('User is not in the room. Broadcast of updated information will be dropped');
  }
};

/**
 * Gets the current custom user data information for self.
 * You may set the current customer user data information for self in
 *   {{#crossLink "Skylink/setUserData:method"}}setUserData(){{/crossLink}}.
 * @method getUserData
 * @return {JSON|String} The custom (or updated) user data information
 *   for self set.
 * @example
 *   // Example 1: To get other peer's userData
 *   var peerData = SkylinkDemo.getUserData(peerId);
 *
 *   // Example 2: To get own userData
 *   var userData = SkylinkDemo.getUserData();
 * @component User
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.getUserData = function(peerId) {
  if (peerId && peerId !== this._user.sid) {
    // peer info
    var peerInfo = this._peerInformations[peerId];

    if (typeof peerInfo === 'object') {
      return peerInfo.userData;
    }

    return null;
  }
  return this._userData;
};

/**
 * Parses the custom user data information for self provided.
 * @method _parseUserData
 * @param {JSON} [userData] The custom (or updated) user data information
 *   for self provided.
 * @private
 * @component User
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._parseUserData = function(userData) {
  log.debug('Parsing user data:', userData);

  this._userData = userData || '';
};

/**
 * Gets the Peer information.
 * If an invalid Peer ID is provided, or no Peer ID is provided,
 *   the method will return the self peer information.
 * @method getPeerInfo
 * @param {String} [peerId] The Peer information to retrieve the
 *   data from. If the Peer ID is not provided, it will return
 *   the self Peer information.
 * @return {JSON} The Peer information. The parameters relates to the
 *   <code>peerInfo</code> payload given in the
 *   {{#crossLink "Skylink/peerJoined:event"}}peerJoined{{/crossLink}} event.
 * @example
 *   // Example 1: To get other peer's information
 *   var peerInfo = SkylinkDemo.getPeerInfo(peerId);
 *
 *   // Example 2: To get own information
 *   var userInfo = SkylinkDemo.getPeerInfo();
 * @component Peer
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.getPeerInfo = function(peerId) {
  var isNotSelf = this._user && this._user.sid ? peerId !== this._user.sid : false;

  if (typeof peerId === 'string' && isNotSelf) {
    // peer info
    var peerInfo = this._peerInformations[peerId];

    if (typeof peerInfo === 'object') {
      return peerInfo;
    }

    return null;
  } else {

    var mediaSettings = {};

    // add screensharing information
    if (!!this._mediaScreen && this._mediaScreen !== null) {
      mediaSettings = clone(this._screenSharingStreamSettings);
      mediaSettings.bandwidth = clone(this._streamSettings.bandwidth);
    } else {
      mediaSettings = clone(this._streamSettings);
    }

    return {
      userData: clone(this._userData) || '',
      settings: mediaSettings || {},
      mediaStatus: clone(this._mediaStreamsStatus) || {},
      agent: {
        name: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion
      },
      room: clone(this._selectedRoom)
    };
  }
};

Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * Stores the list of Peer connection health timeout objects that
 *   waits for any existing Peer "healthy" state in successful
 *   {{#crossLink "Skylink/_peerConnectionHealth:attr"}}_peerConnectionHealth{{/crossLink}}.
 *   If timeout has reached it's limit and does not have any "healthy" connection state
 *   with Peer connection, it will restart the connection again with
 *   {{#crossLink "Skylink/_restartPeerConnection:method"}}_restartPeerConnection(){{/crossLink}}.
 * @attribute _peerConnectionHealthTimers
 * @param {Object} (#peerId) The timeout object set using <code>setTimeout()</code> that
 *   does the wait for any "healthy" state connection associated with the Peer connection.
 *   This will be removed when the Peer connection has ended or when the Peer
 *   connection has been met with a "healthy" state.
 * @type JSON
 * @private
 * @required
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._peerConnectionHealthTimers = {};

/**
 * Stores the list of Peer connections that has connection
 *   established successfully. When the Peer connection has a
 *   successful ICE connection state of <code>"completed"</code>,
 *   it stores the Peer connection as "healthy".
 * @attribute _peerConnectionHealth
 * @param {Boolean} (#peerId) The flag that indicates if the associated Peer
 *   connection is in a "healthy" state. If the value is <code>true</code>, it means
 *   that the Peer connectin is in a "healthy" state.
 * @type JSON
 * @private
 * @required
 * @component Peer
 * @since 0.5.5
 */
Skylink.prototype._peerConnectionHealth = {};

/**
 * Stores the peer connection priority weight.
 * @attribute _peerPriorityWeight
 * @type Number
 * @private
 * @required
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype._peerPriorityWeight = 0;

/**
 * Starts to initiate the WebRTC layer of handshake connection by
 *   creating the <code>OFFER</code> session description and then
 *   sending it to the associated Peer.
 * The offerer status may be shifted to the other peer depending on
 *   when version of browser that is initiating the connection
 *   to what version of browser to.
 * @method _doOffer
 * @param {String} targetMid The Peer ID to send the <code>OFFER</code> to.
 * @param {JSON} peerBrowser The Peer platform agent information.
 * @param {String} peerBrowser.name The Peer platform browser or agent name.
 * @param {Number} peerBrowser.version The Peer platform browser or agent version.
 * @param {Number} peerBrowser.os The Peer platform name.
 * @param {Function} renegoCallback The callback function that triggers after
 *   the offer has been created or responsed.
 * @private
 * @for Skylink
 * @component Peer
 * @since 0.5.2
 */
Skylink.prototype._doOffer = function(targetMid, peerBrowser) {
  var self = this;
  var pc = self._peerConnections[targetMid] || self._addPeer(targetMid, peerBrowser);
  log.log([targetMid, null, null, 'Checking caller status'], peerBrowser);
  // NOTE ALEX: handle the pc = 0 case, just to be sure
  var inputConstraints = self._room.connection.offerConstraints;
  var sc = self._room.connection.sdpConstraints;
  for (var name in sc.mandatory) {
    if (sc.mandatory.hasOwnProperty(name)) {
      inputConstraints.mandatory[name] = sc.mandatory[name];
    }
  }
  inputConstraints.optional.concat(sc.optional);
  checkMediaDataChannelSettings(peerBrowser.agent, peerBrowser.version,
    function(beOfferer, unifiedOfferConstraints) {
    // attempt to force make firefox not to offer datachannel.
    // we will not be using datachannel in MCU
    if (window.webrtcDetectedType === 'moz' && peerBrowser.agent === 'MCU') {
      unifiedOfferConstraints.mandatory = unifiedOfferConstraints.mandatory || {};
      unifiedOfferConstraints.mandatory.MozDontOfferDataChannel = true;
      beOfferer = true;
    }

    unifiedOfferConstraints.mandatory.iceRestart = true;
    peerBrowser.os = peerBrowser.os || '';

    if (peerBrowser.agent !== 'MCU') {
      /*
       // for windows firefox to mac chrome interopability
      if (window.webrtcDetectedBrowser === 'firefox' &&
        window.navigator.platform.indexOf('Win') === 0 &&
        peerBrowser.agent !== 'firefox' &&
        peerBrowser.agent !== 'MCU' &&
        peerBrowser.os.indexOf('Mac') === 0) {
        beOfferer = false;
      }*/
      if (window.webrtcDetectedBrowser === 'firefox' && peerBrowser.agent !== 'firefox') {
        beOfferer = false;
      }
    }

    if (beOfferer) {
      if (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion >= 32) {
        unifiedOfferConstraints = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        };

        /*if (window.webrtcDetectedVersion > 37) {
          unifiedOfferConstraints = {};
        }*/
      }

      log.debug([targetMid, null, null, 'Creating offer with config:'], unifiedOfferConstraints);

      pc.createOffer(function(offer) {
        log.debug([targetMid, null, null, 'Created offer'], offer);
        self._setLocalAndSendMessage(targetMid, offer);
      }, function(error) {
        self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR,
          targetMid, error);
        log.error([targetMid, null, null, 'Failed creating an offer:'], error);
      }, unifiedOfferConstraints);
    } else {
      log.debug([targetMid, null, null, 'User\'s browser is not eligible to create ' +
        'the offer to the other peer. Requesting other peer to create the offer instead'
        ], peerBrowser);

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.WELCOME,
        mid: self._user.sid,
        rid: self._room.id,
        agent: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        userInfo: self.getPeerInfo(),
        target: targetMid,
        weight: -1,
        sessionType: !!self._mediaScreen ? 'screensharing' : 'stream'
      });
    }
  }, inputConstraints);
};

/**
 * Responses to the <code>OFFER</code> session description received and
 *    creates an <code>ANSWER</code> session description to sent
 *   to the associated Peer to complete the WebRTC handshake layer.
 * @method _doAnswer
 * @param {String} targetMid The Peer ID to send the <code>ANSWER</code> to.
 * @private
 * @for Skylink
 * @component Peer
 * @since 0.1.0
 */
Skylink.prototype._doAnswer = function(targetMid) {
  var self = this;
  log.log([targetMid, null, null, 'Creating answer with config:'],
    self._room.connection.sdpConstraints);
  var pc = self._peerConnections[targetMid];
  if (pc) {
    // No ICE restart constraints for createAnswer as it fails in chrome 48
    // { iceRestart: true }
    pc.createAnswer(function(answer) {
      log.debug([targetMid, null, null, 'Created answer'], answer);
      self._setLocalAndSendMessage(targetMid, answer);
    }, function(error) {
      log.error([targetMid, null, null, 'Failed creating an answer:'], error);
      self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
    });//, self._room.connection.sdpConstraints);
  } else {
    /* Houston ..*/
    log.error([targetMid, null, null, 'Requested to create an answer but user ' +
      'does not have any existing connection to peer']);
    return;
  }
};

/**
 * Starts the waiting timeout for a "healthy" connection
 *   with associated Peer connection.
 * It waits for any existing Peer "healthy" state in successful
 *   {{#crossLink "Skylink/_peerConnectionHealth:attr"}}_peerConnectionHealth{{/crossLink}}.
 * If timeout has reached it's limit and does not have any "healthy" connection state
 *   with Peer connection, it will restart the connection again with
 *   {{#crossLink "Skylink/_restartPeerConnection:method"}}_restartPeerConnection(){{/crossLink}}.
 * This sets the timeout object associated with the Peer into
 *   {{#crossLink "Skylink/_peerConnectionHealthTimers"}}_peerConnectionHealthTimers(){{/crossLink}}.
 * @method _startPeerConnectionHealthCheck
 * @param {String} peerId The Peer ID to start a waiting timeout for a "healthy" connection.
 * @param {Boolean} [toOffer=false] The flag that indicates if Peer connection
 *   is an offerer or an answerer for an accurate timeout waiting time.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._startPeerConnectionHealthCheck = function (peerId, toOffer) {
  var self = this;
  var timer = (self._enableIceTrickle && !self._peerIceTrickleDisabled[peerId]) ?
    (toOffer ? 12500 : 10000) : 50000;
  timer = (self._hasMCU) ? 105000 : timer;

  // increase timeout for android/ios
  /*var agent = self.getPeerInfo(peerId).agent;
  if (['Android', 'iOS'].indexOf(agent.name) > -1) {
    timer = 105000;
  }*/

  timer += self._retryCount*10000;

  log.log([peerId, 'PeerConnectionHealth', null,
    'Initializing check for peer\'s connection health']);

  if (self._peerConnectionHealthTimers[peerId]) {
    // might be a re-handshake again
    self._stopPeerConnectionHealthCheck(peerId);
  }

  self._peerConnectionHealthTimers[peerId] = setTimeout(function () {
    // re-handshaking should start here.
    var connectionStable = false;
    var pc = self._peerConnections[peerId];

    if (pc) {
      var dc = (self._dataChannels[peerId] || {}).main;

      var dcConnected = pc.hasMainChannel ? dc && dc.readyState === self.DATA_CHANNEL_STATE.OPEN : true;
      var iceConnected = pc.iceConnectionState === self.ICE_CONNECTION_STATE.CONNECTED ||
        pc.iceConnectionState === self.ICE_CONNECTION_STATE.COMPLETED;
      var signalingConnected = pc.signalingState === self.PEER_CONNECTION_STATE.STABLE;

      connectionStable = dcConnected && iceConnected && signalingConnected;

      log.debug([peerId, 'PeerConnectionHealth', null, 'Connection status'], {
        dcConnected: dcConnected,
        iceConnected: iceConnected,
        signalingConnected: signalingConnected
      });
    }

    log.debug([peerId, 'PeerConnectionHealth', null, 'Require reconnection?'], connectionStable);

    if (!connectionStable) {
      log.warn([peerId, 'PeerConnectionHealth', null, 'Peer\'s health timer ' +
      'has expired'], 10000);

      // clear the loop first
      self._stopPeerConnectionHealthCheck(peerId);

      log.debug([peerId, 'PeerConnectionHealth', null,
        'Ice connection state time out. Re-negotiating connection']);

      //Maximum increament is 5 minutes
      if (self._retryCount<30){
        //Increase after each consecutive connection failure
        self._retryCount++;
      }

      // do a complete clean
      if (!self._hasMCU) {
        self._restartPeerConnection(peerId, true, true, null, false);
      } else {
        self._restartMCUConnection();
      }
    } else {
      self._peerConnectionHealth[peerId] = true;
    }
  }, timer);
};

/**
 * Stops the waiting timeout for a "healthy" connection associated
 *   with the Peer.
 * @method _stopPeerConnectionHealthCheck
 * @param {String} peerId The Peer ID to stop a waiting
 *   timeout for a "healthy" connection.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._stopPeerConnectionHealthCheck = function (peerId) {
  var self = this;

  if (self._peerConnectionHealthTimers[peerId]) {
    log.debug([peerId, 'PeerConnectionHealth', null,
      'Stopping peer connection health timer check']);

    clearTimeout(self._peerConnectionHealthTimers[peerId]);
    delete self._peerConnectionHealthTimers[peerId];

  } else {
    log.debug([peerId, 'PeerConnectionHealth', null,
      'Peer connection health does not have a timer check']);
  }
};

/**
 * Sets the WebRTC handshake layer session description into the
 *   Peer <code>RTCPeerConnection</code> object <i><code>
 *   RTCPeerConnection.setLocalDescription()</code></i> associated
 *   with the Peer connection.
 * @method _setLocalAndSendMessage
 * @param {String} targetMid The Peer ID to send the session description to
 *   after setting into the associated <code>RTCPeerConnection</code> object.
 * @param {JSON} sessionDescription The <code>OFFER</code> or an <code>ANSWER</code>
 *   session description to set to the associated Peer after setting into
 *   the <code>RTCPeerConnection</code> object.
 * @trigger handshakeProgress
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._setLocalAndSendMessage = function(targetMid, sessionDescription) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  /*if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER && pc.setAnswer) {
    log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Ignoring session description. User has already set local answer'], sessionDescription);
    return;
  }
  if (sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER && pc.setOffer) {
    log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Ignoring session description. User has already set local offer'], sessionDescription);
    return;
  }*/

  // NOTE ALEX: handle the pc = 0 case, just to be sure
  var sdpLines = sessionDescription.sdp.split('\r\n');

  // remove h264 invalid pref
  sdpLines = self._removeSDPFirefoxH264Pref(sdpLines);
  // Check if stereo was enabled
  if (self._streamSettings.hasOwnProperty('audio')) {
    if (self._streamSettings.audio.stereo) {
      self._addSDPStereo(sdpLines);
    }
  }

  log.info([targetMid, null, null, 'Requested stereo:'], (self._streamSettings.audio ?
    (self._streamSettings.audio.stereo ? self._streamSettings.audio.stereo : false) :
    false));

  // set sdp bitrate
  if (self._streamSettings.hasOwnProperty('bandwidth')) {
    var peerSettings = (self._peerInformations[targetMid] || {}).settings || {};

    sdpLines = self._setSDPBitrate(sdpLines, peerSettings);
  }

  // set sdp resolution
  /*if (self._streamSettings.hasOwnProperty('video')) {
    sdpLines = self._setSDPVideoResolution(sdpLines, self._streamSettings.video);
  }*/

  self._streamSettings.bandwidth = self._streamSettings.bandwidth || {};

  self._streamSettings.video = self._streamSettings.video || false;

  log.info([targetMid, null, null, 'Custom bandwidth settings:'], {
    audio: (self._streamSettings.bandwidth.audio || 'Not set') + ' kB/s',
    video: (self._streamSettings.bandwidth.video || 'Not set') + ' kB/s',
    data: (self._streamSettings.bandwidth.data || 'Not set') + ' kB/s'
  });

  if (self._streamSettings.video.hasOwnProperty('frameRate') &&
    self._streamSettings.video.hasOwnProperty('resolution')){
    log.info([targetMid, null, null, 'Custom resolution settings:'], {
      frameRate: (self._streamSettings.video.frameRate || 'Not set') + ' fps',
      width: (self._streamSettings.video.resolution.width || 'Not set') + ' px',
      height: (self._streamSettings.video.resolution.height || 'Not set') + ' px'
    });
  }

  // set video codec
  if (self._selectedVideoCodec !== self.VIDEO_CODEC.AUTO) {
    sdpLines = self._setSDPVideoCodec(sdpLines);
  } else {
    log.log([targetMid, null, null, 'Not setting any video codec']);
  }

  // set audio codec
  if (self._selectedAudioCodec !== self.AUDIO_CODEC.AUTO) {
    sdpLines = self._setSDPAudioCodec(sdpLines);
  } else {
    log.log([targetMid, null, null, 'Not setting any audio codec']);
  }

  sessionDescription.sdp = sdpLines.join('\r\n');

  // NOTE ALEX: opus should not be used for mobile
  // Set Opus as the preferred codec in SDP if Opus is present.
  //sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  // limit bandwidth
  //sessionDescription.sdp = this._limitBandwidth(sessionDescription.sdp);
  log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
    'Updated session description:'], sessionDescription);

  pc.setLocalDescription(sessionDescription, function() {
    log.debug([targetMid, sessionDescription.type, 'Local description set']);
    self._trigger('handshakeProgress', sessionDescription.type, targetMid);
    if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER) {
      pc.setAnswer = 'local';
    } else {
      pc.setOffer = 'local';
    }
    var shouldWaitForCandidates = false;

    if (!(self._enableIceTrickle && !self._peerIceTrickleDisabled[targetMid])) {
      shouldWaitForCandidates = true;
      // there is no sessiondescription created at first go
      if (pc.setOffer === 'remote' || pc.setAnswer === 'remote') {
        shouldWaitForCandidates = false;
      }
    }
    if (!shouldWaitForCandidates) {
      // make checks for firefox session description
      if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER && window.webrtcDetectedBrowser === 'firefox') {
        sessionDescription.sdp = self._addSDPSsrcFirefoxAnswer(targetMid, sessionDescription.sdp);
      }

      self._sendChannelMessage({
        type: sessionDescription.type,
        sdp: sessionDescription.sdp,
        mid: self._user.sid,
        target: targetMid,
        rid: self._room.id
      });
    } else {
      log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
        'Waiting for Ice gathering to complete to prevent Ice trickle']);
    }
  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
    log.error([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Failed setting local description: '], error);
  });
};

Skylink.prototype._privileged = {
	privileged: false,
	autoIntroduce: true,
	parentKey: null,
	session: {
		roomPeers: {},
		introduceHistory: {}
	}
};

/**
 * Whether this user automatically introduce to other peers.
 * @attribute _autoIntroduce
 * @type Boolean
 * @default true
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._autoIntroduce = true;

/**
 * Whether this user is a privileged user.
 * @attribute isPrivileged
 * @type Boolean
 * @default false
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._isPrivileged = false;

/**
 * Parent key in case the current key is alias.
 * If the current key is not alias, this is the same as _appKey
 * @attribute _parentKey
 * @type String
 * @default null
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._parentKey = null;

/**
 * List of peers retrieved from signaling
 * @attribute _peerList
 * @type Object
 * @default null
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._peerList = null;

/**
 * Retrieves the list of rooms and peers under the same realm based
 *   on the Application Key configured in {{#crossLink "Skylink/init:method"}}init(){{/crossLink}}
 *   from the platform signaling.
 * This will only work if self is a privileged Peer.
 * @method getPeers
 * @param {Boolean} [showAll=false] The flag that indicates if returned list should
 *   also include privileged and standard in the list. By default, the value is <code>false</code>.
 *   Which means only unprivileged peers' ID (isPrivileged = autoIntroduce = false) is included.
 * @param {Function} [callback] The callback fired after the receiving the current
 *   list of Peers from platform signaling or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {Object} callback.error The error object received in the callback.
 *   This is the exception thrown that caused the failure for getting self user media.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @example
 *
 *   // To get list of unprivileged peers only
 *   SkylinkDemo.getPeers();
 *
 *   // To get list of all peers, including other privileged peers
 *   SkylinkDemo.getPeers(true);
 *
 *   // To get a list of unprivileged peers then invoke the callback
 *   SkylinkDemo.getPeers(function(error, success){
 *     if (error){
 *       console.log("Error happened. Can not retrieve list of peers");
 *     }
 *     else{
 *       console.log("Success fully retrieved list of peers", success);
 *     }
 *   });
 *
 *   // To get a list of all peers then invoke the callback
 *   SkylinkDemo.getPeers(true, function(error, success){
 *     if (error){
 *       console.log("Error happened. Can not retrieve list of peers");
 *     }
 *     else{
 *       console.log("Success fully retrieved list of peers", success);
 *     }
 *   });
 *
 * @trigger getPeersStateChange
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.getPeers = function(showAll, callback){
	var self = this;
	if (!self._isPrivileged){
		log.warn('Please upgrade your key to privileged to use this function');
		return;
	}
	if (!self._appKey){
		log.warn('App key is not defined. Please authenticate again.');
		return;
	}
	if (!self._parentKey){
		log.warn('Parent key is not defined. Please authenticate again.');
		return;
	}

	// Only callback is provided
	if (typeof showAll === 'function'){
		callback = showAll;
		showAll = false;
	}

	self._sendChannelMessage({
		type: self._SIG_MESSAGE_TYPE.GET_PEERS,
		privilegedKey: self._appKey,
		parentKey: self._parentKey,
		showAll: showAll || false
	});
	self._trigger('getPeersStateChange',self.GET_PEERS_STATE.ENQUIRED, self._user.sid, null);

	log.log('Enquired server for peers within the realm');

	if (typeof callback === 'function'){
		self.once('getPeersStateChange', function(state, privilegedPeerId, peerList){
			callback(null, peerList);
		}, function(state, privilegedPeerId, peerList){
			return state === self.GET_PEERS_STATE.RECEIVED;
		});
	}

};

/**
 * Introduces two Peers to each other to start a connection with each other.
 * This will only work if self is a privileged Peer.
 * @method introducePeer
 * @param {String} sendingPeerId The Peer ID of the peer
 *   that initiates the connection with the introduced Peer.
 * @param {String} receivingPeerId The Peer ID of the
 *   introduced peer who would be introduced to the initiator Peer.
 * @trigger introduceStateChange
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.introducePeer = function(sendingPeerId, receivingPeerId){
	var self = this;
	if (!self._isPrivileged){
		log.warn('Please upgrade your key to privileged to use this function');
		self._trigger('introduceStateChange', self.INTRODUCE_STATE.ERROR, self._user.sid, sendingPeerId, receivingPeerId, 'notPrivileged');
		return;
	}
	self._sendChannelMessage({
		type: self._SIG_MESSAGE_TYPE.INTRODUCE,
		sendingPeerId: sendingPeerId,
		receivingPeerId: receivingPeerId
	});
	self._trigger('introduceStateChange', self.INTRODUCE_STATE.INTRODUCING, self._user.sid, sendingPeerId, receivingPeerId, null);
	log.log('Introducing',sendingPeerId,'to',receivingPeerId);
};


Skylink.prototype._peers = {};

/**
 * Stores the Peer session information.
 * @method _peerCreate
 * @param {String} peerId The Peer session ID.
 * @param {JSON} config The message object that contains the Peer session information.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerCreate = function (peerId, config) {
  var _this = this;

  // Construct the peer object
  _this._peers[peerId] = {
    // The RTCPeerConnection object
    peer: null,
    // The agent information
    agent: {
      name: config.user.agent.name,
      version: config.user.agent.version,
      os: config.user.agent.os
    },
    // The custom data
    data: config.user.data,
    // The stream information
    stream: config.stream,
    // The connection information
    connection: {
      // Dead status when destroying session
      dead: false,
      // ICE connection
      ICE: {
        trickle: config.connection.trickleICE && _this._room.config.current.enableIceTrickle,
        failures: 0,
        candidates: {
          completed: false,
          incoming: {
            queue: [],
            failed: [],
            success: []
          },
          outgoing: []
        }
      },
      // The flag if should allow RTCDataChannel connections
      datachannel: config.connection.datachannel && _this._room.config.current.enableDataChannel,
      // The flag if should allow stereo for OPUS connections
      stereo: config.connection.stereo && _this._user.session.stereo,
      // Health timer
      health: {
        timer: null,
        ok: false,
        retries: 0
      },
      tieBreaker: config.tieBreaker
    },
    // The RTCDataChannels
    channels: {}
  };

  _this._peerConnect(peerId);
  _this._peerConnectMonitor(peerId);

  // RTCPeerConnection.onremovestream
  // RTCPeerConnection.ontrack - not implemented yet

  log.debug([peerId, 'Peer', null, 'Session information has been initialized']);
};

/**
 * Starts the Peer connection.
 * @method _peerConnect
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnect = function (peerId) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring starting of connection as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.debug([peerId, 'Peer', null, 'Ignoring starting of connection as session is dead']);
    return;
  }

  // Construct RTCPeerConnection object
  _this._peers[peerId].peer = new RTCPeerConnection({
    iceServers: _this._user.session.ICE.servers,
    // iceTransportPolicy: "all",
    // bundlePolicy: "balanced",
    // rtcpMuxPolicy: "require",
    // iceCandidatePoolSize: 0,
    // certificates: []
  } , {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  });

  // Reset to defaults
  _this._peers[peerId].connection.ICE.failures = 0;
  _this._peers[peerId].connection.ICE.candidates.completed = false;
  _this._peers[peerId].connection.ICE.candidates.outgoing = [];
  _this._peers[peerId].connection.ICE.candidates.incoming.queue = [];
  _this._peers[peerId].connection.ICE.candidates.incoming.failed = [];
  _this._peers[peerId].connection.ICE.candidates.incoming.success = [];
  _this._peers[peerId].connection.health.timer = null;
  _this._peers[peerId].connection.health.ok = false;


  // RTCPeerConnection.onconnectionstatechange - not implemented yet
  // RTCPeerConnection.onicecandidateerror - not implemented yet
  // RTCPeerConnection.onicecandidate
  _this._peers[peerId].peer.onicecandidate =
    _this._peerConnectReactToOnicecandidate(peerId);

  // RTCPeerConnection.oniceconnectionstatechange
  _this._peers[peerId].peer.oniceconnectionstatechange =
    _this._peerConnectReactToOniceconnectionstatechange(peerId);

  // RTCPeerConnection.onsignalingstatechange
  _this._peers[peerId].peer.onsignalingstatechange =
    _this._peerConnectReactToOnsignalingstatechange(peerId);

  // RTCPeerConnection.onicegatheringstatechange
  _this._peers[peerId].peer.onicegatheringstatechange =
    _this._peerConnectReactToOnicegatheringstatechange(peerId);

  // RTCPeerConnection.onnegotiationneeded
  _this._peers[peerId].peer.onnegotiationneeded =
    _this._peerConnectReactToOnnegotiationneeded(peerId);

  // RTCPeerConnection.ondatachannel
  _this._peers[peerId].peer.ondatachannel =
    _this._peerConnectReactToOndatachannel(peerId);

  // RTCPeerConnection.onaddstream
  _this._peers[peerId].peer.onaddstream =
    _this._peerConnectReactToOnaddstream(peerId);

  // RTCPeerConnection.onremovestream
  _this._peers[peerId].peer.onremovestream =
    _this._peerConnectReactToOnremovestream(peerId);


  log.debug([peerId, 'Peer', null, 'Connection is ready for handshaking']);
};

/**
 * Monitors the Peer connection.
 * @method _peerConnectMonitor
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectMonitor = function (peerId) {
  var _this = this;
  var healthTimeout = 10000;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring configuring connection monitor as session does not exsits']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.debug([peerId, 'Peer', null, 'Ignoring configuring connection monitor as session is dead']);
    return;
  }

  // Check if Peer is offerer, and configure the unit if required
  if (_this._peers[peerId].connection.tieBreaker > _this._user.session.tieBreaker) {
    healthTimeout = 12500;
  }

  // Check if trickle ICE is disabled and increment as it takes longer
  if (!_this._peers[peerId].connection.ICE.trickle) {
    healthTimeout += 40000;
  }

  // Increment the timer for every retry
  healthTimeout += _this._peers[peerId].connection.health.retries * 10000;

  // Start the monitor
  _this._peers[peerId].connection.health.timer = setTimeout(function () {
    if (!_this._peers[peerId]) {
      log.warn([peerId, 'Peer', null, 'Ignoring monitor expiration as session does not exists']);
      return;
    }

    // Check if ICE connection is successful
    var iceConnectionStateStable = ['connected', 'completed'].indexOf(_this._peers[peerId].peer.iceConnectionState) > -1;
    // Check if signaling state is "stable"
    var signalingStateStable = _this._peers[peerId].peer.signalingState === 'stable';
    // Check if "main" RTCDataChannel is connected
    var dataChannelStateStable = _this._peers[peerId].connection.datachannel ?
    // Check if RTCDataChannel is required, else return as true
      _this._peers[peerId].channels.main && _this._peers[peerId].channels.main.channel &&
      _this._peers[peerId].channels.main.channel.readyState === 'open' : true;

    // Check if connection is stable
    if (iceConnectionStateStable && signalingStateStable && dataChannelStateStable) {
      _this._peers[peerId].connection.health.timer = null;
      _this._peers[peerId].connection.health.ok = true;

      log.debug([peerId, 'Peer', null, 'Connection health is healthy']);
      return;
    }

    log.debug([peerId, 'Peer', null, 'Connection status is not healthy, reconnecting ->'], {
      iceConnectionState: iceConnectionStateStable,
      signalingState: signalingStateStable,
      dataChannelState: dataChannelStateStable
    });

    _this._peerReconnect(peerId, false, false);

  }, healthTimeout);

  log.debug([peerId, 'Peer', null, 'Monitoring connection health with timeout ->'], healthTimeout);
};

/**
 * Stops the Peer connection.
 * @method _peerDisconnect
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerDisconnect = function (peerId) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring destroying of connection as session does not exists']);
    return;
  }

  // Close all RTCDataChannel connections
  objForEach(_this._peers[peerId].channels, function (channel, id) {
    log.debug([peerId, 'Peer', null, 'Closing RTCDataChannel connection ->'], id);

    channel.channel.close();
    channel.transfer = {};
  });

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring destroying of connection as connection does not exists']);
    return;
  }

  log.debug([peerId, 'Peer', null, 'Closing connection']);

  // Close RTCPeerConnection connection
  _this._peers[peerId].peer.close();
};

/**
 * Handshake step 1.
 * Generates a local offer RTCSessionDescription for Peer connection.
 * @method _peerConnectHandshakeOffer
 * @param {String} peerId The Peer session ID.
 * @param {Boolean} [iceRestart=false] The flag that indicates if connection should restart ICE.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeOffer = function (peerId, iceRestart) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking offer as connection signalingState is not "stable" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  // Generate local offer RTCSessionDescription
  _this._peers[peerId].peer.createOffer(function (offer) {
    log.debug([peerId, 'Peer', null, 'Generated local offer ->'], offer);

    // Set local offer RTCSessionDescription
    _this._peerConnectHandshakeSetLocal(peerId, offer);

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Failed generating local offer ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);

  }, {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
      iceRestart: iceRestart === true
    }
  });
};

/**
 * Handshake step 2.
 * Generates a local answer RTCSessionDescription for Peer connection based on
 *   remote offer RTCSessionDescription received.
 * @method _peerConnectHandshakeOffer
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} offer The remote offer RTCSessionDescription received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeAnswer = function (peerId, offer) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.signalingState !== 'stable') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking answer as connection signalingState is not "stable" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  _this._peerConnectHandshakeSetRemote(peerId, offer, function () {
    // Generate local answer RTCSessionDescription
    _this._peers[peerId].peer.createAnswer(function (answer) {
      log.debug([peerId, 'Peer', null, 'Generated local answer ->'], answer);

      // Set local answer RTCSessionDescription
      _this._peerConnectHandshakeSetLocal(peerId, answer);

    }, function (error) {
      log.error([peerId, 'Peer', null, 'Failed generating local answer ->'], error);

      _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
    });
  });
};

/**
 * Handshake step 3.
 * Sets the remote answer RTCSessionDescription received.
 * @method _peerConnectHandshakeComplete
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} answer The answer offer RTCSessionDescription received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeComplete = function (peerId, answer) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.signalingState !== 'have-local-offer') {
    log.warn([peerId, 'Peer', null, 'Ignoring handshaking complete as connection signalingState is not "have-local-offer" ->'],
      _this._peers[peerId].peer.signalingState);
    return;
  }

  _this._peerConnectHandshakeSetRemote(peerId, answer, function () {
    log.debug([peerId, 'Peer', null, 'Connection handshake has completed']);
  });
};

/**
 * Sets the local RTCSessionDescription generated.
 * @method _peerConnectHandshakeSetLocal
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} sessionDescription The local RTCSessionDescription generated.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeSetLocal = function (peerId, sessionDescription) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as connection does not exists']);
    return;
  }

  // Start modifications here

  log.debug([peerId, 'Peer', null, 'Setting local ' + sessionDescription.type + ' ->'], sessionDescription);

  _this._peers[peerId].peer.setLocalDescription(sessionDescription, function () {
    log.debug([peerId, 'Peer', null, 'Set local ' + sessionDescription.type + ' successfully']);

    if (!_this._peers[peerId].connection.ICE.trickle) {
      log.debug([peerId, 'Peer', null, 'Awaiting for ICE candidates generation to complete before sending ' +
        'local ' + sessionDescription.type]);
      return;
    }

    if (sessionDescription.type === 'offer') {
      _this._messageConstructOffer(peerId, sessionDescription);
    } else {
      _this._messageConstructAnswer(peerId, sessionDescription);
    }

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Failed setting local ' + sessionDescription.type + ' ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
  });
};

/**
 * Sets the remote RTCSessionDescription received.
 * @method _peerConnectHandshakeSetRemote
 * @param {String} peerId The Peer session ID.
 * @param {RTCSessionDescription} sessionDescription The remote RTCSessionDescription received.
 * @param {Function} callback The callback triggered after setRemoteDescription is successful
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectHandshakeSetRemote = function (peerId, sessionDescription, callback) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type +
      ' as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting local ' + sessionDescription.type +
      ' as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', null, 'Ignoring setting remote ' + sessionDescription.type +
      ' as connection does not exists']);
    return;
  }

  // Start modifications here

  log.debug([peerId, 'Peer', null, 'Setting remote ' + sessionDescription.type + ' ->'], sessionDescription);

  _this._peers[peerId].peer.setRemoteDescription(sessionDescription, function () {
    log.debug([peerId, 'Peer', null, 'Set remote ' + sessionDescription.type + ' successfully']);

    // Add queued remote ICE candidates
    _this._peers[peerId].connection.ICE.candidates.incoming.queue.forEach(function (candidate) {
      var candidateId = candidate.candidate.split(' ')[0];

      log.debug([peerId, 'Peer', candidateId, 'Adding queued remote candidate ->'], candidate);

      _this._peers[peerId].peer.addIceCandidate(candidate, function () {
        log.debug([peerId, 'Peer', candidateId, 'Added queued remote candidate successfully']);
        _this._peers[peerId].connection.ICE.candidates.incoming.success.push(candidate);
      }, function (error) {
        log.debug([peerId, 'Peer', candidateId, 'Failed queued adding remote candidate ->'], error);
        _this._peers[peerId].connection.ICE.candidates.incoming.failed.push(candidate);
      });
    });

    _this._peers[peerId].connection.ICE.candidates.incoming.queue = [];

    callback();

  }, function (error) {
    log.error([peerId, 'Peer', null, 'Failed setting remote ' + sessionDescription.type + ' ->'], error);

    _this._trigger('handshakeProgress', _this.HANDSHAKE_PROGRESS.ERROR, peerId, error);
  });
};

/**
 * Adds the remote RTCIceCandidate received.
 * @method _peerConnectAddCandidate
 * @param {String} peerId The Peer session ID.
 * @param {RTCIceCandidate} candidate The remote RTCIceCandidate received.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectAddCandidate = function (peerId, candidate) {
  var _this = this;
  var candidateId = candidate.candidate.split(' ')[0];

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring setting remote ' + sessionDescription.type +
      ' as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring setting local ' + sessionDescription.type +
      ' as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.warn([peerId, 'Peer', candidateId, 'Ignoring setting remote ' + sessionDescription.type +
      ' as connection does not exists']);
    return;
  }

  if (_this._peers[peerId].peer.remoteDescription && !!_this._peers[peerId].peer.remoteDescription.sdp) {
    log.debug([peerId, 'Peer', candidateId, 'Queueing remote candidate as remoteDescription is not present yet']);
    _this._peers[peerId].connection.ICE.candidates.incoming.queue.push(candidate);
    return;
  }

  var shouldAddCandidate = false;

  _this._user.session.ICE.useCandidates.current.forEach(function (candidateType) {
    if (candidate.candidate.indexOf(candidateType) > -1) {
      shouldAddCandidate = true;
    }
  });

  if (!shouldAddCandidate) {
    log.warn([peerId, 'Peer', candidateId, 'Dropping remote candidate as it does not match candidate types filter ->'], candidate);
    return;
  }

  log.debug([peerId, 'Peer', candidateId, 'Adding remote candidate ->'], candidate);

  _this._peers[peerId].peer.addIceCandidate(candidate, function () {
    log.debug([peerId, 'Peer', candidateId, 'Added remote candidate successfully']);
    _this._peers[peerId].connection.ICE.candidates.incoming.success.push(candidate);
  }, function (error) {
    log.debug([peerId, 'Peer', candidateId, 'Failed adding remote candidate ->'], error);
    _this._peers[peerId].connection.ICE.candidates.incoming.failed.push(candidate);
  });
};

/*
ANSWER SDP for MCU
// if firefox and peer is mcu, replace the sdp to suit mcu needs
  if (window.webrtcDetectedType === 'moz' && targetMid === 'MCU') {
    answer.sdp = answer.sdp.replace(/ generation 0/g, '');
    answer.sdp = answer.sdp.replace(/ udp /g, ' UDP ');
  }
  */

/**
 * Restarts the Peer connection.
 * @method _peerReconnect
 * @param {String} peerId The Peer session ID.
 * @param {Boolean} [hardRestart=false] The flag that indicates if connection should be re-created.
 * @param {Boolean} [iceRestart=false] The flag that indicates if connection should restart ICE.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerReconnect = function (peerId, passedHardRestart, iceRestart) {
  var _this = this;
  var hardRestart = passedHardRestart === true;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring reconnection as session does not exists']);
    return;
  }

  if (_this._peers[peerId].connection.dead) {
    log.debug([peerId, 'Peer', null, 'Ignoring reconnection as session is dead']);
    return;
  }

  if (!_this._peers[peerId].peer) {
    log.debug([peerId, 'Peer', null, 'Constructing connection as it does not exists']);
    _this._peerConnect(peerId);
    hardRestart = true;
  }

  // Check if we have to do a complete restart
  if (hardRestart) {
    // Only hard restarts can be made with P2P only connections
    if (!_this._room.MCU) {
      log.debug([peerId, 'Peer', null, 'Reconstructing connection']);
      _this._peerDisconnect(peerId);
      _this._peerConnect(peerId);
    // Do not do hard restarts for MCU
    } else {
      log.warn([peerId, 'Peer', null, 'Not doing any reconstruction of connection for MCU environment']);
      hardRestart = false;
    }
  }

  if (!hardRestart) {
    var sessionDescription = _this._peers[peerId].peer.localDescription;

    // Check if local RTCSessionDescription exists first
    if (sessionDescription && !!sessionDescription.sdp) {
      // When other Peer connection does not receive our local offer RTCSessionDescription yet
      if (_this._peers[peerId].peer.signalingState === 'have-local-offer') {
        _this._messageConstructOffer(peerId, sessionDescription);
        _this._peerConnectMonitor(peerId);
        return;
      // When other Peer connection does not receive our local answer RTCPeerConnection yet
      } else if (_this._peers[peerId].peer.signalingState === 'have-remote-offer') {
        _this._messageConstructAnswer(peerId, sessionDescription);
        _this._peerConnectMonitor(peerId);
        return;
      }
    }
  }

  // Send the "restart" message scenario
  _this._messageConstructRestart(peerId, hardRestart, iceRestart);
  _this._peerConnectMonitor(peerId);
};

/**
 * Destroys the Peer session information.
 * @method _peerDestroy
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerDestroy = function (peerId) {
  var _this = this;

  if (!_this._peers[peerId]) {
    log.warn([peerId, 'Peer', null, 'Ignoring destroying of session as it does not exists']);
    return;
  }

  log.debug([peerId, 'Peer', null, 'Session is closed. Destroying..']);

  _this._peerDisconnect(peerId);

  // Configure as session dead
  _this._peers[peerId].connection.dead = true;

  if (peerId !== 'MCU') {
    this._trigger('peerLeft', peerId, _this.getPeerInfo(peerId), false);

  } else {
    _this._room.MCU = false;

    this._trigger('serverPeerLeft', peerId, _this.SERVER_PEER_TYPE.MCU);
  }

  // Our "garbage collector"
  // To ensure all the "closed" events gets triggered
  // NOTE: We don't know if this is the best solution though ...
  var dustbin = setInterval(function () {
    var cleanup = function () {
      clearInterval(dustbin);
      delete _this._peers[peerId];

      log.debug([peerId, 'Peer', null, 'Session is destroyed']);
    };

    if (!_this._peers[peerId]) {
      cleanup();
      return;
    }

    if (!_this._peers[peerId].peer) {
      cleanup();
      return;
    }

    // No matter if it's current state is "failed" or "disconnected",
    //   as long as RTCPeerConnection.close() is invoked, it always goes to "closed"
    var iceConnectionStateClosed = _this._peers[peerId].peer.iceConnectionState === 'closed';
    // Should always be "closed" when RTCPeerConnection.close() is invoked
    var signalingStateClosed = _this._peers[peerId].peer.signalingState === 'closed';
    var dataChannelClosed = false;

    if (!_this._peers[peerId].connection.datachannel) {
      dataChannelClosed = true;

    } else {
      objForEach(_this._peers[peerId].channels, function (channel) {
        // No matter what state -> "connecting", "open", when RTCDataChannel.close() is invoked,
        //   it always goes to "closed"
        // Plugin 0.8.863 version readyState is empty "" when invoking .close()
        dataChannelClosed = channel.channel.readyState === 'closed' || !channel.channel.readyState;
      });
    }

    if (iceConnectionStateClosed && signalingStateClosed && dataChannelClosed) {
      cleanup();
    }
  }, 100);
};

/**
 * Reacts to the RTCPeerConnection.onicecandidate event.
 * @method _peerConnectReactToOnicecandidate
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnicecandidate = function (peerId) {
  var _this = this;

  return function (event) {
    var candidate = event.candidate || event;

    // Check if candidate has generation is complete yet
    if (!candidate.candidate) {
      log.debug([peerId, 'Peer', null, 'Generation of local candidates has been completed']);

      _this._peers[peerId].connection.ICE.candidates.completed = true;

      // If ICE trickle is disabled, then send the local RTCSessionDescription object
      if (!_this._peers[peerId].connection.ICE.trickle) {
        var sessionDescription = _this._peers[peerId].peer.localDescription;

        log.debug([peerId, 'Peer', null, 'Sending delayed local sessionDescription ->'], sessionDescription);

        if (sessionDescription.type === 'offer') {
          _this._messageConstructOffer(peerId, sessionDescription);
        } else {
          _this._messageConstructAnswer(peerId, sessionDescription);
        }
      }
      return;
    }

    var shouldSendCandidate = false;
    var candidateId = candidate.candidate.split(' ')[0];

    log.debug([peerId, 'Peer', candidateId, 'Generated local candidate ->'], candidate);

    _this._user.session.ICE.useCandidates.current.forEach(function (candidateType) {
      if (candidate.candidate.indexOf(candidateType) > -1) {
        shouldSendCandidate = true;
      }
    });

    if (!shouldSendCandidate) {
      log.warn([peerId, 'Peer', candidateId, 'Dropping local candidate as it does not match candidate types filter ->'], candidate);
      return;
    }

    _this._peers[peerId].connection.ICE.candidates.outgoing.push(candidate);
    _this._messageConstructCandidate(peerId, candidate);
  };
};

/**
 * Reacts to the RTCPeerConnection.oniceconnectionstatechange event.
 * @method _peerConnectReactToOniceconnectionstatechange
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOniceconnectionstatechange = function (peerId) {
  var _this = this;

  return function () {
    var state = _this._peers[peerId].peer.iceConnectionState;

    log.debug([peerId, 'Peer', null, 'Connection ICE connection state ->'], state);

    _this._trigger('iceConnectionState', state, peerId);

    // Restart ICE connection state is "failed" or "disconnected"
    if (['failed', 'disconnected'].indexOf(state) > -1) {
      var hardRestart = false;

      // When iceConnectionState -> "failed"
      if (state === 'failed') {
        // Increment the failure counter
        _this._peers[peerId].connection.ICE.failures++;

        // Disable trickle ICE if failures counter is 3
        if (_this._peers[peerId].connection.ICE.failures === 3) {
          _this._peers[peerId].connection.ICE.trickle = false;

          // Check if MCU and do a hard restart if MCU
          if (!_this._room.MCU) {
            hardRestart = true;
          }

          _this._trigger('iceConnectionState', _this.ICE_CONNECTION_STATE.TRICKLE_FAILED, peerId);
        }
      }

      _this._peerReconnect(peerId, hardRestart, true);
    }
  };
};

/**
 * Reacts to the RTCPeerConnection.onsignalingstatechange event.
 * @method _peerConnectReactToOnsignalingstatechange
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnsignalingstatechange = function (peerId) {
  var _this = this;

  return function () {
    var state = _this._peers[peerId].peer.signalingState;

    log.debug([peerId, 'Peer', null, 'Connection signaling state ->'], state);

    _this._trigger('peerConnectionState', state, peerId);
  };
};

/**
 * Reacts to the RTCPeerConnection.onicegatheringstatechange event.
 * @method _peerConnectReactToOnicegatheringstatechange
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnicegatheringstatechange = function (peerId) {
  var _this = this;

  return function () {
    var state = _this._peers[peerId].peer.iceGatheringState;

    log.debug([peerId, 'Peer', null, 'Connection ICE gathering state ->'], state);

    _this._trigger('iceGatheringState', state, peerId);
  };
};

/**
 * Reacts to the RTCPeerConnection.ondatachannel event.
 * @method _peerConnectReactToOndatachannel
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOndatachannel = function (peerId) {
  var _this = this;

  return function (event) {
    var channel = event.channel || event;

    log.debug([peerId, 'Peer', null, 'Connection received RTCDataChannel ->'], channel);

    _this._createChannel(peerId, channel);
  };
};

/**
 * Reacts to the RTCPeerConnection.onaddstream event.
 * @method _peerConnectReactToOnaddstream
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnaddstream = function (peerId) {
  var _this = this;

  return function (event) {
    var stream = event.stream || event;
    // The timeout that somehow allows rendering to work
    var magicalTimeout = 0;

    log.debug([peerId, 'Peer', null, 'Connection received remote MediaStream ->'], stream);


    if (_this._peers[peerId].agent.name === 'firefox' && _this._user.agent.name !== 'firefox') {
      magicalTimeout = 1500;
    }

    // NOTE: Add timeouts to the firefox stream received because it seems to have some sort of black stream rendering at first
    // This may not be advisable but that it seems to work after 1500s. (tried with ICE established but it does not work and getStats)
    setTimeout(function () {
      _this._trigger('incomingStream', peerId, stream, false, _this.getPeerInfo(peerId));
    }, magicalTimeout);
  };
};

/**
 * Reacts to the RTCPeerConnection.onnegotiationneeded event.
 * @method _peerConnectReactToOnnegotiationneeded
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnnegotiationneeded = function (peerId) {
  var _this = this;

  return function () {
    log.debug([peerId, 'Peer', null, 'Connection received negotiation request']);
  };
};

/**
 * Reacts to the RTCPeerConnection.onremovestream event.
 * @method _peerConnectReactToOnremovestream
 * @param {String} peerId The Peer session ID.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._peerConnectReactToOnremovestream = function (peerId) {
  var _this = this;

  return function (event) {
    var stream = event.stream || event;
    log.debug([peerId, 'Peer', null, 'Connection removed MediaStream ->'], stream);
  };
};



/**
 * Stores the timestamp of the moment when the last Peers connection
 *   restarts has happened. Used for the restart Peers connection functionality.
 * @attribute _lastRestart
 * @type Object
 * @required
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.9
 */
Skylink.prototype._lastRestart = null;

/**
 * Stores the counter of the number of consecutive
 *   Peers connection restarts retries.
 * @attribute _retryCount
 * @type Number
 * @required
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._retryCount = 0;

/**
 * Stores the list of Peers connection.
 * @attribute _peerConnections
 * @param {Object} (#peerId) The Peer ID associated to the RTCPeerConnection object.
 * @type JSON
 * @required
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._peerConnections = {};

/**
 * Connects to the Peer.
 * @method _addPeer
 * @param {String} targetMid The Peer ID to connect to.
 * @param {JSON} peerBrowser The Peer platform agent information.
 * @param {String} peerBrowser.agent The Peer platform browser or agent name.
 * @param {Number} peerBrowser.version The Peer platform browser or agent version.
 * @param {Number} peerBrowser.os The Peer platform name.
 * @param {Boolean} [toOffer=false] The flag that indicates if the Peer connection
 *   should be start connection as an offerer or as an answerer.
 * @param {Boolean} [restartConn=false] The flag that indicates if the Peer
 *   connection is part of restart functionality use-case.
 * @param {Boolean} [receiveOnly=false] The flag that indicates if the Peer
 *   connection would send Stream or not (receive only).
 * @param {Boolean} [isSS=false] The flag that indicates if the Peer
 *   connection Stream sent is a screensharing stream or not.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._addPeer = function(targetMid, peerBrowser, toOffer, restartConn, receiveOnly, isSS) {
  var self = this;
  if (self._peerConnections[targetMid] && !restartConn) {
    log.error([targetMid, null, null, 'Connection to peer has already been made']);
    return;
  }
  log.log([targetMid, null, null, 'Starting the connection to peer. Options provided:'], {
    peerBrowser: peerBrowser,
    toOffer: toOffer,
    receiveOnly: receiveOnly,
    enableDataChannel: self._enableDataChannel
  });

  log.info('Adding peer', isSS);

  if (!restartConn) {
    self._peerConnections[targetMid] = self._createPeerConnection(targetMid, !!isSS);
  }

  if (!self._peerConnections[targetMid]) {
    log.error([targetMid, null, null, 'Failed creating the connection to peer']);
    return;
  }

  self._peerConnections[targetMid].receiveOnly = !!receiveOnly;
  self._peerConnections[targetMid].hasScreen = !!isSS;
  if (!receiveOnly) {
    self._addLocalMediaStreams(targetMid);
  }
  // I'm the callee I need to make an offer
  if (toOffer) {
    if (self._enableDataChannel) {
      if (typeof self._dataChannels[targetMid] !== 'object') {
        log.error([targetMid, 'RTCDataChannel', null, 'Create offer error as unable to create datachannel ' +
          'as datachannels array is undefined'], self._dataChannels[targetMid]);
        return;
      }

      self._dataChannels[targetMid].main =
        self._createDataChannel(targetMid, self.DATA_CHANNEL_TYPE.MESSAGING, null, targetMid);
      self._peerConnections[targetMid].hasMainChannel = true;
    }
    self._doOffer(targetMid, peerBrowser);
  }

  // do a peer connection health check
  // let MCU handle this case
  if (!self._hasMCU) {
    this._startPeerConnectionHealthCheck(targetMid, toOffer);
  } else {
    log.warn([targetMid, 'PeerConnectionHealth', null, 'Not setting health timer for MCU connection']);
    return;
  }
};

/**
 * Recreates a peer connection.
 * This is the fallback restart mechanism for other platforms.
 * @method _restartPeerConnection
 * @param {String} peerId The Peer ID to recreate the connection with.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.6.6
 */
Skylink.prototype._recreatePeerConnection = function (peerId) {
  var self = this;

  if (!self._peerConnections[peerId]) {
    log.error([peerId, null, null, 'Peer does not have an existing ' +
      'connection. Unable to recreate connection']);
    return;
  }

  // get the value of receiveOnly
  log.log([peerId, null, null, 'Recreating a peer connection']);

   // get the value of receiveOnly
  var receiveOnly = self._peerConnections[peerId] ?
    !!self._peerConnections[peerId].receiveOnly : false;
  var hasScreenSharing = self._peerConnections[peerId] ?
    !!self._peerConnections[peerId].hasScreen : false;

  // close the peer connection and remove the reference
  var iceConnectionStateClosed = false;
  var peerConnectionStateClosed = false;
  var dataChannelStateClosed = !self._enableDataChannel;

  delete self._peerConnectionHealth[peerId];

  self._stopPeerConnectionHealthCheck(peerId);

  if (self._peerConnections[peerId].signalingState !== 'closed') {
    self._peerConnections[peerId].close();
  }

  if (self._peerConnections[peerId].hasStream) {
    self._trigger('streamEnded', peerId, self.getPeerInfo(peerId), false);
  }

  self._peerConnections[peerId].dataChannelClosed = true;

  delete self._peerConnections[peerId];

  log.log([peerId, null, null, 'Re-creating peer connection']);

  self._peerConnections[peerId] = self._createPeerConnection(peerId, !!hasScreenSharing);

  if (self._peerConnections[peerId]){
    self._peerConnections[peerId].receiveOnly = receiveOnly;
    self._peerConnections[peerId].hasScreen = hasScreenSharing;
  }

  return self._peerConnections[peerId];
};

/**
 * Restarts a Peer connection in a P2P environment.
 * This is usually done for replacing the previous Stream attached and restarting
 *   the connection with a new one, or when the ICE connection has issues
 *   streaming video/audio stream in the remote Stream which requires
 *   a refresh in the ICE connection.
 * @method _restartPeerConnection
 * @param {String} peerId The Peer ID to restart the connection with.
 * @param {Boolean} isSelfInitiatedRestart The flag that indicates if the restart action
 *    was caused by self.
 * @param {Boolean} isConnectionRestart The flag that indicates whether the restarting action
 *   is caused by ICE connection or handshake connection failure. Currently, this feature works the same as
 *   <code>explict</code> parameter.
 * @param {Function} callback The callback fired after the Peer connection has
 *   been succesfully initiated with a restart. Set this value to <code>null</code> if you
 *   do not want to pass in any callbacks.
 * @param {Boolean} [explict=false] The flag that indicates whether the restart functionality
 *   is invoked by the application or by Skylink when the ICE connection fails to establish
 *   a "healthy" connection state. Currently, this feature works the same as
 *   <code>isConnectionRestart</code> parameter.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._restartPeerConnection = function (peerId, isSelfInitiatedRestart, isConnectionRestart, callback, explicit) {
  var self = this;

  if (!self._peerConnections[peerId]) {
    log.error([peerId, null, null, 'Peer does not have an existing ' +
      'connection. Unable to restart']);
    return;
  }

  delete self._peerConnectionHealth[peerId];

  self._stopPeerConnectionHealthCheck(peerId);

  var pc = self._peerConnections[peerId];

  var agent = (self.getPeerInfo(peerId) || {}).agent || {};

  // fallback to older versions for mobile users
  if (['Android', 'iOS'].indexOf(agent.name) > -1) {
    pc = self._recreatePeerConnection(peerId);

    if (!pc) {
      var noConnObjError = 'Failed restarting (fallback) with mobile SDKs as peer connection object is not defined';
      log.error([peerId, 'RTCPeerConnection', null, noConnObjError], {
          localDescription: pc.localDescription,
          remoteDescription: pc.remoteDescription
      });
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
        callback(null, new Error(noConnObjError));
      }
      return;
    }
  }

  // This is when the state is stable and re-handshaking is possible
  // This could be due to previous connection handshaking that is already done
  if (pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
    if (self._peerConnections[peerId] && !self._peerConnections[peerId].receiveOnly) {
      self._addLocalMediaStreams(peerId);
    }

    if (isSelfInitiatedRestart){
      log.log([peerId, null, null, 'Sending restart message to signaling server']);

      var lastRestart = Date.now() || function() { return +new Date(); };

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.RESTART,
        mid: self._user.sid,
        rid: self._room.id,
        agent: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        userInfo: self.getPeerInfo(),
        target: peerId,
        isConnectionRestart: !!isConnectionRestart,
        lastRestart: lastRestart,
        // This will not be used based off the logic in _restartHandler
        weight: self._peerPriorityWeight,
        receiveOnly: self._peerConnections[peerId].receiveOnly,
        enableIceTrickle: self._enableIceTrickle,
        enableDataChannel: self._enableDataChannel,
        sessionType: !!self._mediaScreen ? 'screensharing' : 'stream',
        explicit: !!explicit
      });

      self._trigger('peerRestart', peerId, self.getPeerInfo(peerId), false);

      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart callback']);
        callback(null, null);
      }
    } else {
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart callback (receiving peer)']);
        callback(null, null);
      }
    }

    // following the previous logic to do checker always
    self._startPeerConnectionHealthCheck(peerId, false);

  } else {
    // Let's check if the signalingState is stable first.
    // In another galaxy or universe, where the local description gets dropped..
    // In the offerHandler or answerHandler, do the appropriate flags to ignore or drop "extra" descriptions
    if (pc.signalingState === self.PEER_CONNECTION_STATE.HAVE_LOCAL_OFFER ||
      pc.signalingState === self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
      // Checks if the local description is defined first
      var hasLocalDescription = pc.localDescription && pc.localDescription.sdp;
      // By then it should have at least the local description..
      if (hasLocalDescription) {
        self._sendChannelMessage({
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp,
          mid: self._user.sid,
          target: peerId,
          rid: self._room.id,
          restart: true
        });
      } else {
        var noLocalDescriptionError = 'Failed re-sending localDescription as there is ' +
          'no localDescription set to connection. There could be a handshaking step error';
        log.error([peerId, 'RTCPeerConnection', null, noLocalDescriptionError], {
            localDescription: pc.localDescription,
            remoteDescription: pc.remoteDescription
        });
        if (typeof callback === 'function') {
          log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
          callback(null, new Error(noLocalDescriptionError));
        }
      }
    // It could have connection state closed
    } else {
      var unableToRestartError = 'Failed restarting as peer connection state is ' + pc.signalingState;
      log.warn([peerId, 'RTCPeerConnection', null, unableToRestartError]);
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
        callback(null, new Error(unableToRestartError));
      }
    }
  }
};

/**
 * Disconnects the Peer connection and remove object references associated.
 * @method _removePeer
 * @param {String} peerId The Peer ID to disconnect the connection with.
 * @trigger peerLeft
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._removePeer = function(peerId) {
  var peerInfo = clone(this.getPeerInfo(peerId)) || {
    userData: '',
    settings: {},
    mediaStatus: {},
    agent: {},
    room: clone(this._selectedRoom)
  };

  if (peerId !== 'MCU') {
    this._trigger('peerLeft', peerId, peerInfo, false);
  } else {
    this._hasMCU = false;
    log.log([peerId, null, null, 'MCU has stopped listening and left']);
    this._trigger('serverPeerLeft', peerId, this.SERVER_PEER_TYPE.MCU);
  }
  // stop any existing peer health timer
  this._stopPeerConnectionHealthCheck(peerId);

  // check if health timer exists
  if (typeof this._peerConnections[peerId] !== 'undefined') {
    // new flag to check if datachannels are all closed
    this._peerConnections[peerId].dataChannelClosed = true;

    if (this._peerConnections[peerId].signalingState !== 'closed') {
      this._peerConnections[peerId].close();
    }

    if (this._peerConnections[peerId].hasStream) {
      this._trigger('streamEnded', peerId, this.getPeerInfo(peerId), false);
    }

    delete this._peerConnections[peerId];
  }
  // remove peer informations session
  if (typeof this._peerInformations[peerId] !== 'undefined') {
    delete this._peerInformations[peerId];
  }
  if (typeof this._peerConnectionHealth[peerId] !== 'undefined') {
    delete this._peerConnectionHealth[peerId];
  }
  // close datachannel connection
  if (this._enableDataChannel) {
    this._closeDataChannel(peerId);
  }

  log.log([peerId, null, null, 'Successfully removed peer']);
};

/**
 * Creates a Peer connection. This does not start the handshake connection
 *   but creates the Peer connection object ready for connection.
 * @method _createPeerConnection
 * @param {String} targetMid The Peer ID to create the connection object
 *   with.
 * @param {Boolean} [isScreenSharing=false] The flag that indicates if the Peer
 *   connection Stream sent is a screensharing stream or not.
 * @return {Object} The Peer connection object associated with
 *   the provided ID.
 * @private
 * @component Peer
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._createPeerConnection = function(targetMid, isScreenSharing) {
  var pc, self = this;
  // currently the AdapterJS 0.12.1-2 causes an issue to prevent firefox from
  // using .urls feature
  var newRTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection ||
    window.RTCPeerConnection;
  try {
    pc = new newRTCPeerConnection(
      self._room.connection.peerConfig,
      self._room.connection.peerConstraints);
    log.info([targetMid, null, null, 'Created peer connection']);
    log.debug([targetMid, null, null, 'Peer connection config:'],
      self._room.connection.peerConfig);
    log.debug([targetMid, null, null, 'Peer connection constraints:'],
      self._room.connection.peerConstraints);
  } catch (error) {
    log.error([targetMid, null, null, 'Failed creating peer connection:'], error);
    return null;
  }
  // attributes (added on by Temasys)
  pc.setOffer = '';
  pc.setAnswer = '';
  pc.hasStream = false;
  pc.hasScreen = !!isScreenSharing;
  pc.hasMainChannel = false;
  pc.firefoxStreamId = '';

  // datachannels
  self._dataChannels[targetMid] = {};
  // candidates
  self._addedCandidates[targetMid] = {
    relay: [],
    host: [],
    srflx: []
  };

  // callbacks
  // standard not implemented: onnegotiationneeded,
  pc.ondatachannel = function(event) {
    var dc = event.channel || event;
    log.debug([targetMid, 'RTCDataChannel', dc.label, 'Received datachannel ->'], dc);
    if (self._enableDataChannel) {

      var channelType = self.DATA_CHANNEL_TYPE.DATA;
      var channelKey = dc.label;

      // if peer does not have main channel, the first item is main
      if (!pc.hasMainChannel) {
        channelType = self.DATA_CHANNEL_TYPE.MESSAGING;
        channelKey = 'main';
        pc.hasMainChannel = true;
      }

      self._dataChannels[targetMid][channelKey] =
        self._createDataChannel(targetMid, channelType, dc, dc.label);

    } else {
      log.warn([targetMid, 'RTCDataChannel', dc.label, 'Not adding datachannel as enable datachannel ' +
        'is set to false']);
    }
  };
  pc.onaddstream = function(event) {
    var stream = event.stream || event;
    pc.hasStream = true;

    var agent = (self.getPeerInfo(targetMid) || {}).agent || {};
    var timeout = 0;

    // NOTE: Add timeouts to the firefox stream received because it seems to have some sort of black stream rendering at first
    // This may not be advisable but that it seems to work after 1500s. (tried with ICE established but it does not work and getStats)
    if (agent.name === 'firefox' && window.webrtcDetectedBrowser !== 'firefox') {
      timeout = 1500;
    }
    setTimeout(function () {
      self._onRemoteStreamAdded(targetMid, stream, !!pc.hasScreen);
    }, timeout);
  };
  pc.onicecandidate = function(event) {
    log.debug([targetMid, 'RTCIceCandidate', null, 'Ice candidate generated ->'],
      event.candidate);
    self._onIceCandidate(targetMid, event);
  };
  pc.oniceconnectionstatechange = function(evt) {
    checkIceConnectionState(targetMid, pc.iceConnectionState,
      function(iceConnectionState) {
      log.debug([targetMid, 'RTCIceConnectionState', null,
        'Ice connection state changed ->'], iceConnectionState);
      self._trigger('iceConnectionState', iceConnectionState, targetMid);

      // clear all peer connection health check
      // peer connection is stable. now if there is a waiting check on it
      if (iceConnectionState === self.ICE_CONNECTION_STATE.COMPLETED &&
        pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
        log.debug([targetMid, 'PeerConnectionHealth', null,
          'Peer connection with user is stable']);
        self._peerConnectionHealth[targetMid] = true;
        self._stopPeerConnectionHealthCheck(targetMid);
        self._retryCount = 0;
      }

      if (typeof self._ICEConnectionFailures[targetMid] === 'undefined') {
        self._ICEConnectionFailures[targetMid] = 0;
      }

      if (self._ICEConnectionFailures[targetMid] > 2) {
        self._peerIceTrickleDisabled[targetMid] = true;
      }

      if (iceConnectionState === self.ICE_CONNECTION_STATE.FAILED) {
        self._ICEConnectionFailures[targetMid] += 1;

        if (self._enableIceTrickle && !self._peerIceTrickleDisabled[targetMid]) {
          self._trigger('iceConnectionState',
            self.ICE_CONNECTION_STATE.TRICKLE_FAILED, targetMid);
        }
        // refresh when failed. ignore for MCU case since restart is handled by MCU in this case
        if (!self._hasMCU) {
          self._restartPeerConnection(targetMid, true, true, null, false);
        }
      }

      /**** SJS-53: Revert of commit ******
      // resend if failed
      if (iceConnectionState === self.ICE_CONNECTION_STATE.FAILED) {
        log.debug([targetMid, 'RTCIceConnectionState', null,
          'Ice connection state failed. Re-negotiating connection']);
        self._removePeer(targetMid);
        self._sendChannelMessage({
          type: self._SIG_MESSAGE_TYPE.WELCOME,
          mid: self._user.sid,
          rid: self._room.id,
          agent: window.webrtcDetectedBrowser,
          version: window.webrtcDetectedVersion,
          userInfo: self.getPeerInfo(),
          target: targetMid,
          restartNego: true,
          hsPriority: -1
        });
      } *****/
    });
  };
  // pc.onremovestream = function () {
  //   self._onRemoteStreamRemoved(targetMid);
  // };
  pc.onsignalingstatechange = function() {
    log.debug([targetMid, 'RTCSignalingState', null,
      'Peer connection state changed ->'], pc.signalingState);
    self._trigger('peerConnectionState', pc.signalingState, targetMid);

    // clear all peer connection health check
    // peer connection is stable. now if there is a waiting check on it
    if ((pc.iceConnectionState === self.ICE_CONNECTION_STATE.COMPLETED ||
      pc.iceConnectionState === self.ICE_CONNECTION_STATE.CONNECTED) &&
      pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
      log.debug([targetMid, 'PeerConnectionHealth', null,
        'Peer connection with user is stable']);
      self._peerConnectionHealth[targetMid] = true;
      self._stopPeerConnectionHealthCheck(targetMid);
      self._retryCount = 0;
    }
  };
  pc.onicegatheringstatechange = function() {
    log.log([targetMid, 'RTCIceGatheringState', null,
      'Ice gathering state changed ->'], pc.iceGatheringState);
    self._trigger('candidateGenerationState', pc.iceGatheringState, targetMid);
  };

  if (window.webrtcDetectedBrowser === 'firefox') {
    pc.removeStream = function (stream) {
      var senders = pc.getSenders();
      for (var s = 0; s < senders.length; s++) {
        var tracks = stream.getTracks();
        for (var t = 0; t < tracks.length; t++) {
          if (tracks[t] === senders[s].track) {
            pc.removeTrack(senders[s]);
          }
        }
      }
    };
  }

  return pc;
};

/**
 * Refreshes a Peer connection.
 * - This feature can be used to refresh a Peer connection when the
 *   remote Stream received does not stream any audio/video stream.
 * - If there are more than 1 refresh during 5 seconds
 *   or refresh is less than 3 seconds since the last refresh
 *   initiated by the other peer, it will be aborted.
 * - As for MCU connection, the restart mechanism makes the self user
 *    leave and join the currently connected room again.
 * @method refreshConnection
 * @param {String|Array} [targetPeerId] The array of targeted Peers connection to refresh
 *   the connection with.
 * @param {Function} [callback] The callback fired after all targeted Peers connection has
 *   been initiated with refresh or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Array} callback.error.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @param {JSON} callback.error.refreshErrors The list of errors occurred
 *   based on per Peer basis.
 * @param {Object|String} callback.error.refreshErrors.(#peerId) The Peer ID that
 *   is associated with the error that occurred when refreshing the connection.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {Array} callback.success.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @example
 *   SkylinkDemo.on("iceConnectionState", function (state, peerId)) {
 *     if (iceConnectionState === SkylinkDemo.ICE_CONNECTION_STATE.FAILED) {
 *       // Do a refresh
 *       SkylinkDemo.refreshConnection(peerId);
 *     }
 *   });
 * @trigger peerRestart, serverPeerRestart, peerJoined, peerLeft, serverPeerJoined, serverPeerLeft
 * @component Peer
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.refreshConnection = function(targetPeerId, callback) {
  var self = this;

  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerRestarts = [];
  var error = '';
  var listOfPeerRestartErrors = {};

  if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;

  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  if (listOfPeers.length === 0) {
    error = 'There is currently no peer connections to restart';
    log.warn([null, 'PeerConnection', null, error]);

    listOfPeerRestartErrors.self = new Error(error);

    if (typeof callback === 'function') {
      callback({
        refreshErrors: listOfPeerRestartErrors,
        listOfPeers: listOfPeers
      }, null);
    }
    return;
  }

  // To fix jshint dont put functions within a loop
  var refreshSinglePeerCallback = function (peerId) {
    return function (error, success) {
      if (listOfPeerRestarts.indexOf(peerId) === -1) {
        if (error) {
          log.error([peerId, 'RTCPeerConnection', null, 'Failed restarting for peer'], error);
          listOfPeerRestartErrors[peerId] = error;
        }
        listOfPeerRestarts.push(peerId);
      }

      if (listOfPeerRestarts.length === listOfPeers.length) {
        if (typeof callback === 'function') {
          log.log([null, 'PeerConnection', null, 'Invoked all peers to restart. Firing callback']);

          if (Object.keys(listOfPeerRestartErrors).length > 0) {
            callback({
              refreshErrors: listOfPeerRestartErrors,
              listOfPeers: listOfPeers
            }, null);
          } else {
            callback(null, {
              listOfPeers: listOfPeers
            });
          }
        }
      }
    };
  };

  var refreshSinglePeer = function(peerId, peerCallback){
    if (!self._peerConnections[peerId]) {
      error = 'There is currently no existing peer connection made ' +
        'with the peer. Unable to restart connection';
      log.error([peerId, null, null, error]);
      listOfPeerRestartErrors[peerId] = new Error(error);
      return;
    }

    var now = Date.now() || function() { return +new Date(); };

    if (now - self.lastRestart < 3000) {
      error = 'Last restart was so tight. Aborting.';
      log.error([peerId, null, null, error]);
      listOfPeerRestartErrors[peerId] = new Error(error);
      return;
    }

    log.log([peerId, 'PeerConnection', null, 'Restarting peer connection']);

    // do a hard reset on variable object
    self._restartPeerConnection(peerId, true, false, peerCallback, true);
  };

  var toRefresh = function() {
    if(!self._hasMCU) {
      var i;

      for (i = 0; i < listOfPeers.length; i++) {
        var peerId = listOfPeers[i];

        if (Object.keys(self._peerConnections).indexOf(peerId) > -1) {
          refreshSinglePeer(peerId, refreshSinglePeerCallback(peerId));
        } else {
          error = 'Peer connection with peer does not exists. Unable to restart';
          log.error([peerId, 'PeerConnection', null, error]);
          listOfPeerRestartErrors[peerId] = new Error(error);
        }

        // there's an error to trigger for
        if (i === listOfPeers.length - 1 && Object.keys(listOfPeerRestartErrors).length > 0) {
          if (typeof callback === 'function') {
            callback({
              refreshErrors: listOfPeerRestartErrors,
              listOfPeers: listOfPeers
            }, null);
          }
        }
      }
    } else {
      self._restartMCUConnection(callback);
    }
  };

  self._throttle(toRefresh,5000)();

};

/**
 * Restarts all Peers connection in a MCU connection environment.
 * This would require the current user to leave the room and restart all
 *   current existing Peers connection.
 * @method _restartMCUConnection
 * @param {Function} [callback] The callback fired after all targeted Peers connection has
 *   been initiated with refresh or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Array} callback.error.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @param {JSON} callback.error.refreshErrors The list of errors occurred
 *   based on per Peer basis.
 * @param {Object|String} callback.error.refreshErrors.(#peerId) The Peer ID associated
 *   with the error that occurred when refreshing the connection.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {Array} callback.success.listOfPeers The list of Peers that the
 *   refresh connection had been initiated with.
 * @private
 * @trigger peerRestart, serverPeerRestart, peerJoined, peerLeft, serverPeerJoined
 * @component Peer
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._restartMCUConnection = function(callback) {
  var self = this;
  log.info([self._user.sid, null, null, 'Restarting with MCU enabled']);
  // Save room name
  /*var roomName = (self._room.id).substring((self._room.id)
                    .indexOf('_api_') + 5, (self._room.id).length);*/
  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerRestartErrors = {};
  var peerId; // j shint is whinning
  var receiveOnly = false;
  // for MCU case, these dont matter at all
  var lastRestart = Date.now() || function() { return +new Date(); };
  var weight = (new Date()).valueOf();

  self._trigger('serverPeerRestart', 'MCU', self.SERVER_PEER_TYPE.MCU);

  for (var i = 0; i < listOfPeers.length; i++) {
    peerId = listOfPeers[i];

    if (!self._peerConnections[peerId]) {
      var error = 'Peer connection with peer does not exists. Unable to restart';
      log.error([peerId, 'PeerConnection', null, error]);
      listOfPeerRestartErrors[peerId] = new Error(error);
      continue;
    }

    if (peerId === 'MCU') {
      receiveOnly = !!self._peerConnections[peerId].receiveOnly;
    }

    if (peerId !== 'MCU') {
      self._trigger('peerRestart', peerId, self.getPeerInfo(peerId), true);

      log.log([peerId, null, null, 'Sending restart message to signaling server']);

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.RESTART,
        mid: self._user.sid,
        rid: self._room.id,
        agent: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        userInfo: self.getPeerInfo(),
        target: peerId, //'MCU',
        isConnectionRestart: false,
        lastRestart: lastRestart,
        weight: self._peerPriorityWeight,
        receiveOnly: receiveOnly,
        enableIceTrickle: self._enableIceTrickle,
        enableDataChannel: self._enableDataChannel,
        sessionType: !!self._mediaScreen ? 'screensharing' : 'stream',
        explicit: true
      });
    }
  }

  // Restart with MCU = peer leaves then rejoins room
  var peerJoinedFn = function (peerId, peerInfo, isSelf) {
    log.log([null, 'PeerConnection', null, 'Invoked all peers to restart with MCU. Firing callback']);

    if (typeof callback === 'function') {
      if (Object.keys(listOfPeerRestartErrors).length > 0) {
        callback({
          refreshErrors: listOfPeerRestartErrors,
          listOfPeers: listOfPeers
        }, null);
      } else {
        callback(null, {
          listOfPeers: listOfPeers
        });
      }
    }
  };

  self.once('peerJoined', peerJoinedFn, function (peerId, peerInfo, isSelf) {
    return isSelf;
  });

  self.leaveRoom(false, function (error, success) {
    if (error) {
      if (typeof callback === 'function') {
        for (var i = 0; i < listOfPeers.length; i++) {
          listOfPeerRestartErrors[listOfPeers[i]] = error;
        }
        callback({
          refreshErrors: listOfPeerRestartErrors,
          listOfPeers: listOfPeers
        }, null);
      }
    } else {
      //self._trigger('serverPeerLeft', 'MCU', self.SERVER_PEER_TYPE.MCU);
      self.joinRoom(self._selectedRoom);
    }
  });
};
Skylink.prototype._room = {
  connected: false,
  locked: false,
  name: null,
  MCU: false,
  session: {
    path: null,
    protocol: null,
    random: null,
    data: null,
    useXDomainRequest: typeof window.XDomainRequest === 'function' ||
      typeof window.XDomainRequest === 'object'
  },
  config: {
    default: {
      appKey: null,
      defaultRoom: null,
      roomServer: '//api.temasys.com.sg',
      region: null,
      credentials: null,
      forceSSL: false,
      socketTimeout: 20000,
      enableIceTrickle: true,
      enableDataChannel: true,
      enableTURNServer: true,
      enableSTUNServer: true,
      usePublicSTUN: true,
      forceTURN: false,
      forceTURNSSL: false,
      TURNServerTransport: 'any',
      audioFallback: false,
      audioCodec: 'auto',
      videoCodec: 'auto'
    },
    current: {}
  }
};

/**
 * Contains the user session information.
 * @attribute _user
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._user = {
  agent: {
    name: window.webrtcDetectedBrowser,
    version: window.webrtcDetectedVersion,
    os: window.navigator.platform
  },
  data: null,
  session: {
    id: null,
    tieBreaker: null,
    ICE: {
      servers: [],
      useCandidates: {
        default: ['relay', 'host', 'srflx'],
        current: []
      }
    },
    stereo: true
  }
};

/**
 * Fetches for the Room session information.
 * @method _roomFetchSession
 * @param {Function} callback The callback triggered upon error or success.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomFetchSession = function (callback) {
  var _this = this;
  var xhr = null;

  _this._roomConstructSessionPath();

  // Use XDomainRequest
  if (_this._room.session.useXDomainRequest) {
    xhr = new XDomainRequest();
    xhr.setContentType = function (contentType) {
      xhr.contentType = contentType;
    };

    log.log([null, 'Room', _this._room.name, 'Using XDomainRequest to fetch Room session']);

  // Use XMLHttpRequest
  } else {
    xhr = new XMLHttpRequest();
    xhr.setContentType = function (contentType) {
      xhr.setRequestHeader('Content-type', contentType);
    };

    log.log([null, 'Room', _this._room.name, 'Using XMLHttpRequest to fetch Room session']);
  }

  // XMLHttpRequest.onload event
  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}');
    var status = xhr.status || 200;

    log.debug([null, 'Room', _this._room.name, 'Received response from API server ->'], response);

    if (!response.success) {
      log.debug([null, 'Room', _this._room.name, 'Failed initialising session ->'], response.message);

      // READY_STATE_ERROR -> API response
      callback({

        status: xhr.status || 200,
        errorCode: response.error,
        content: new Error(response.info)

      }, null);
      return;
    }

    _this._room.session.data = response;

    // Configure the socket connection
    _this._socket.config.current = _this._socket.config.default;

    // Configure the httpsPortsList
    if (Array.isArray(response.httpsPortList) && response.httpsPortList.length > 0) {
      _this._socket.config.current.ports['https:'] = response.httpsPortList;
    }

    // Configure the httpPortList
    if (Array.isArray(response.httpPortList) && response.httpPortList.length > 0) {
      _this._socket.config.current.ports['http:'] = response.httpPortList;
    }

    // Configure the ipSigserver
    if (typeof response.ipSigserver === 'string') {
      _this._socket.config.current.server = response.ipSigserver;
    }

    log.debug([null, 'Room', _this._room.name, 'Session has been initialized']);

    callback(null, response);
  };

  // XMLHttpRequest.onerror event
  xhr.onerror = function (error) {
    log.error([null, 'Room', _this._room.name, 'Failed retrieving response from API server ->'], error);

    callback({

      status: xhr.status || null,
      content: new Error('Network error occurred with HTTP status ' + xhr.status),
      errorCode: _this.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR

    }, null);
  };

  // XMLHttpRequest.onprogress
  xhr.onprogress = function () {
    log.debug([null, 'Room', _this._room.name, 'Retrieving response from API server']);
  };

  xhr.open('GET', _this._room.session.path, true);
  xhr.send();
};

/**
 * Constructs the Room session path.
 * @method _roomConstructSessionPath
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._roomConstructSessionPath = function () {
  var _this = this;
  var append = '?&';

  // Configure the session protocol
  _this._room.session.protocol = window.location.protocol;
  // Force set to "https:" for forceSSL
  if (_this._room.config.current.forceSSL) {
    _this._room.session.protocol = 'https:';
  }
  // Warn users using custom roomServer
  if (_this._room.config.current.roomServer !== _this._room.config.default.roomServer) {
    log.warn([null, 'Room', _this._room.name,
      'Room is using custom server and this may affect Skylink functionalities ->'],
      _this._room.config.current.roomServer);
  }

  // Construct the path
  _this._room.session.path =
  // Append the protocol
    _this._room.session.protocol + '//' +
  // Append the roomServer
    _this._room.config.current.roomServer + '/api/' +
  // Append the appKey and selected room
    _this._room.config.current.appKey + '/' + _this._room.name;

  // Check if credentials is needed
  if (_this._room.config.current.credentials) {
    _this._room.session.path +=
    // Append the credentials.startDateTime
      _this._room.config.current.credentials.startDateTime + '/' +
    // Append the credentials.duration
      _this._room.config.current.credentials.duration + append +
    // Append the credentials.credentials
      'cred=' + _this._room.config.current.credentials.credentials;
    // Update append
    append = '&';
  }

  // Check if region is needed
  if (_this._room.config.current.region) {
    _this._room.session.path += append +
    // Append the region
      'rg=' + _this._room.config.current.region;
    // Update append
    append = '&';
  }

  // Add the random string
  _this._room.session.random = (new Date()).getTime();
  _this._room.session.path += append + 'rand=' + _this._room.session.random;

  log.debug([null, 'Room', _this._room.name, 'Session path has been constructed']);
};

/**
 * Parses the init() configuration.
 * @method _initParseConfig
 * @param {JSON} config The configuration passed.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._initParseConfig = function (config) {
  var _this = this;

  // Preset to defaults
  _this._room.config.current = clone(_this._room.config.default);

  // init({} -> appKey)
  if (typeof config.appKey === 'string') {
    _this._room.config.current.appKey = config.appKey;
  // init({} -> apiKey)
  } else if (typeof config.apiKey === 'string') {
    _this._room.config.current.appKey = config.apiKey;
  // init({} -> ERROR - no key)
  } else {
    throw new Error('Failed initializing as appKey is not found');
  }

  // init({} -> defaultRoom)
  if (typeof config.defaultRoom === 'string') {
    _this._room.config.current.defaultRoom = config.defaultRoom;
  // Fallback to default
  } else {
    _this._room.config.current.defaultRoom = _this._room.config.current.appKey;
  }

  // Configure the selected room first
  _this._room.name = _this._room.config.current.defaultRoom;

  // init({} -> roomServer)
  if (typeof config.roomServer === 'string') {
    if (config.roomServer !== _this._room.config.default.roomServer) {
      _this._room.config.current.roomServer = config.roomServer;
    }
  }

  // init({} -> region)
  if (typeof config.region === 'string') {
    // Loop to check if option is valid in REGIONAL_SERVER list
    objForEach(_this.REGIONAL_SERVER, function (region) {
      if (options.region === region) {
        _this._room.config.current.region = options.region;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.region === null) {
      throw new Error('Provided region is invalid. ' +
        'Please select the list of options from REGIONAL_SERVER list');
    }
  }

  // init({} -> credentials)
  if (typeof config.credentials === 'object' && config.credentials !== null) {
    // init({} -> credentials.startDateTime)
    if (typeof config.credentials.startDateTime !== 'string') {
      throw new Error('Provided credentials.startDateTime DateTime string (ISO 8601) is invalid');
    }
    // init({} -> credentials.duration)
    if (typeof config.credentials.duration !== 'number') {
      throw new Error('Provided credentials.duration (in hours) is invalid');
    }
    // init({} -> credentials.credentials)
    if (typeof config.credentials.credentials !== 'string') {
      throw new Error('Provided credentials.credentials string is invalid');
    }

    _this._room.config.current.credentials = {
      startDateTime: config.credentials.startDateTime,
      duration: config.credentials.duration,
      credentials: config.credentials.credentials
    };
  }

  // init({} -> forceSSL)
  if (config.forceSSL === true) {
    _this._room.config.current.forceSSL = true;
  }

  // init({} -> socketTimeout)
  if (typeof config.socketTimeout === 'number') {
    if (config.socketTimeout < 5000) {
      throw new Error('Provided socketTimeout is less than mininum value of 5000');
    }
    _this._room.config.current.socketTimeout = config.socketTimeout;
  }

  // init({} -> enableTURNServer)
  if (config.enableTURNServer === false) {
    _this._room.config.current.enableTURNServer = false;
  }

  // init({} -> enableSTUNServer)
  if (config.enableSTUNServer === false) {
    _this._room.config.current.enableSTUNServer = false;
  }

  // init({} -> forceTURN)
  if (config.forceTURN === true) {
    _this._room.config.current.forceTURN = true;
  }

  // init({} -> forceTURNSSL)
  if (config.forceTURNSSL === true) {
    _this._room.config.current.forceTURNSSL = true;
  }

  // init({} -> usePublicSTUN)
  if (config.usePublicSTUN === false) {
    _this._room.config.current.usePublicSTUN = false;
  }

  // init({} -> enableDataChannel)
  if (config.enableDataChannel === false) {
    _this._room.config.current.enableDataChannel = false;
  }

  // init({} -> enableIceTrickle)
  if (config.enableIceTrickle === false) {
    _this._room.config.current.enableIceTrickle = false;
  }

  // init({} -> TURNServerTransport)
  if (typeof config.TURNServerTransport === 'string') {
    objForEach(_this.TURN_TRANSPORT, function (transport) {
      if (options.TURNServerTransport === transport) {
        _this._room.config.current.TURNServerTransport = transport;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.TURNServerTransport === null) {
      throw new Error('Provided TURNServerTransport is invalid. ' +
        'Please select the list of options from TURN_TRANSPORT list');
    }
  }

  // init({} -> audioCodec)
  if (typeof config.audioCodec === 'string') {
    objForEach(_this.AUDIO_CODEC, function (codec) {
      if (options.audioCodec === codec) {
        _this._room.config.current.audioCodec = codec;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.audioCodec === null) {
      throw new Error('Provided audioCodec is invalid. ' +
        'Please select the list of options from AUDIO_CODEC list');
    }
  }

  // init({} -> videoCodec)
  if (typeof config.videoCodec === 'string') {
    objForEach(_this.VIDEO_CODEC, function (codec) {
      if (options.videoCodec === codec) {
        _this._room.config.current.videoCodec = codec;
      }
    });

    // Option is not found, throw error
    if (_this._room.config.current.videoCodec === null) {
      throw new Error('Provided videoCodec is invalid. ' +
        'Please select the list of options from VIDEO_CODEC list');
    }
  }

  // init({} -> audioFallback)
  if (config.audioFallback === true) {
    _this._room.config.current.audioFallback = true;
  }

  log.debug('init() configuration has been parsed');
};

/**
 * Checks and load the init() dependencies.
 * @method _initLoadDependencies
 * @method {Function} callback The callback triggered upon error or success.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._initLoadDependencies = function (callback) {
  var _this = this;

  // When AdapterJS is not loaded
  if (typeof window.AdapterJS !== 'object' || window.AdapterJS === null) {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('AdapterJS dependency is not loaded. ' +
        'Please load AdapterJS version 0.12.3 in https://github.com/Temasys/AdapterJS')

    });
    return;

  // When AdapterJS version is incorrect
  } else if (window.AdapterJS.VERSION !== '0.12.3') {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      content: new Error('Incorrect AdapterJS dependency loaded. ' +
        'Please load the AdapterJS version 0.12.3 in https://github.com/Temasys/AdapterJS')

    });
    return;
  }

  // When socket.io-client is not loaded
  // NOTE: We are unable to determine the version (or any proper documented way at least)
  if (typeof window.io !== 'function') {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT,
      content: new Error('XMLHttpRequest is not supported. ' +
        'Please upgrade your browser with the latest in http://browsehappy.com')

    });
    return;
  }

  // When XMLHttpRequest is not supported
  if (!window.XMLHttpRequest && !_this._room.session.useXDomainRequest) {
    callback({

      status: null,
      errorCode: _this.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      content: new Error('socket.io-client dependency is not loaded. ' +
        'Please load socket.io-client version 1.3.7 in http://socket.io/download/')

    });
    return;
  }

  // Load AdapterJS
  AdapterJS.webRTCReady(function () {
    // When RTCPeerConnection is not loaded and supported with no plugin support
    if (!window.RTCPeerConnection) {
      callback({

        status: null,
        errorCode: _this.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT,
        content: new Error('Your browser does not support WebRTC. Please switch to Chrome, Firefox, Opera ' +
          'or install our Temasys free Plugin for IE and Safari')

      });
      return;
    }

    log.debug('init() WebRTC functions has been loaded');

    callback(null);
  });
};

Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0
};

/**
 * The format string that is printed in every Skylink console logs for Skylink logs identification.<br>
 * <small>Example: <code>"SkylinkJS - <<logs here>>"</code></small>
 * @attribute _LOG_KEY
 * @type String
 * @scoped true
 * @readOnly
 * @private
 * @component Log
 * @for Skylink
 * @since 0.5.4
 */
var _LOG_KEY = 'SkylinkJS';


/**
 * Stores the list of Skylink console logging levels in an array.
 * @attribute _LOG_LEVELS
 * @type Array
 * @required
 * @scoped true
 * @private
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _LOG_LEVELS = ['error', 'warn', 'info', 'log', 'debug'];

/**
 * Stores the current Skylink log level.
 * By default, the value is <code>ERROR</code>.
 * @attribute _logLevel
 * @type String
 * @default Skylink.LOG_LEVEL.ERROR
 * @required
 * @scoped true
 * @private
 * @component Log
 * @for Skylink
 * @since 0.5.4
 */
var _logLevel = 0;

/**
 * The flag that indicates if Skylink debugging mode is enabled.
 * This is not to be confused with {{#crossLink "Skylink/setLogLevel:method"}}setLogLevel(){{/crossLink}}
 *   functionality, as that touches the output Web console log levels, and this
 *   enables the debugging trace of the logs <code>console.trace()</code> or storage of the console logs.
 * @attribute _enableDebugMode
 * @type Boolean
 * @default false
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.4
 */
var _enableDebugMode = false;

/**
 * The flag that indicates if Skylink should store the logs in
 *   {{#crossLink "Skylink/_storedLogs:attribute"}}_storedLogs{{/crossLink}}.
 * @attribute _enableDebugStack
 * @type Boolean
 * @default false
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _enableDebugStack = false;

/**
 * The flag that indicates if Skylink console logs should all output as
 *   <code>console.trace()</code>.
 * If <code>console.trace()</code> is not supported, it will fallback and
 *   output as <code>console.log()</code>.
 * @attribute _enableDebugTrace
 * @type Boolean
 * @default false
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _enableDebugTrace = false;

/**
 * Stores all Skylink console logs.
 * @attribute _storedLogs
 * @type Array
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _storedLogs = [];

/**
 * Gets the stored Skylink console logs from
 *   {{#crossLink "Skylink/_storedLogs:attribute"}}_storedLogs{{/crossLink}}.
 * @method _getStoredLogsFn
 * @param {Number} [logLevel] The specific log level of Skylink console logs
 *   that should be returned. If value is not provided, it will return all stored console logs.
 *  [Rel: Skylink.LOG_LEVEL]
 * @return {Array} The array of stored console logs based on the log level provided.
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _getStoredLogsFn = function (logLevel) {
  if (typeof logLevel === 'undefined') {
    return _storedLogs;
  }
  var returnLogs = [];
  for (var i = 0; i < _storedLogs.length; i++) {
    if (_storedLogs[i][1] === _LOG_LEVELS[logLevel]) {
      returnLogs.push(_storedLogs[i]);
    }
  }
  return returnLogs;
};

/**
 * Clears the stored Skylink console logs in
 *   {{#crossLink "Skylink/_storedLogs:attribute"}}_storedLogs{{/crossLink}}.
 * @method _clearAllStoredLogsFn
 * @param {Number} [logLevel] The specific log level of Skylink console logs
 *   that should be cleared. If value is not provided, it will clear all stored console logs.
 *  [Rel: Skylink.LOG_LEVEL]
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _clearAllStoredLogsFn = function () {
  _storedLogs = [];
};

/**
 * Prints all the stored Skylink console logs into the Web console from
 *   {{#crossLink "Skylink/_storedLogs:attribute"}}_storedLogs{{/crossLink}}.
 * @method _printAllStoredLogsFn
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _printAllStoredLogsFn = function () {
  for (var i = 0; i < _storedLogs.length; i++) {
    var timestamp = _storedLogs[i][0];
    var log = (console[_storedLogs[i][1]] !== 'undefined') ?
      _storedLogs[i][1] : 'log';
    var message = _storedLogs[i][2];
    var debugObject = _storedLogs[i][3];

    if (typeof debugObject !== 'undefined') {
      console[log](message, debugObject, timestamp);
    } else {
      console[log](message, timestamp);
    }
  }
};

/**
 * The object that handles the stored Skylink console logs.
 * - {{#crossLink "Skylink/setDebugMode:method"}}setDebugMode(){{/crossLink}} <code>storeLogs</code> flag
 *   must be set as <code>true</code> to enable the storage of logs.
 * @property SkylinkLogs
 * @type JSON
 * @required
 * @global true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
window.SkylinkLogs = {
  /**
   * Gets the stored Skylink console logs.
   * @property SkylinkLogs.getLogs
   * @param {Number} [logLevel] The specific log level of Skylink console logs
   *   that should be returned.<br>If value is not provided, it will return all stored console logs.
   *  [Rel: Skylink.LOG_LEVEL]
   * @return {Array} The array of stored console logs based on the log level provided.
   * @example
   *  // Example 1: Get logs of specific level
   *  var debugLogs = SkylinkLogs.getLogs(SkylinkDemo.LOG_LEVEL.DEBUG);
   *
   *  // Example 2: Get all logs
   *  var allLogs = SkylinkLogs.getLogs();
   * @type Function
   * @required
   * @global true
   * @component Log
   * @for Skylink
   * @since 0.5.5
   */
  getLogs: _getStoredLogsFn,

  /**
   * Clears the stored Skylink console logs.
   * @property SkylinkLogs.clearAllLogs
   * @param {Number} [logLevel] The specific log level of Skylink console logs
   *   that should be cleared. If value is not provided, it will clear all stored console logs.
   *  [Rel: Skylink.LOG_LEVEL]
   * @type Function
   * @example
   *   SkylinkLogs.clearAllLogs(); // empties all logs
   * @required
   * @global true
   * @component Log
   * @for Skylink
   * @since 0.5.5
   */
  clearAllLogs: _clearAllStoredLogsFn,

  /**
   * Prints all the stored Skylink console logs into the [Web console](https://developer.mozilla.org/en/docs/Web/API/console).
   * @property SkylinkLogs.printAllLogs
   * @type Function
   * @example
   *   SkylinkLogs.printAllLogs(); // check the console
   * @required
   * @global true
   * @component Log
   * @for Skylink
   * @since 0.5.5
   */
  printAllLogs: _printAllStoredLogsFn
};

/**
 * Handles the Skylink logs and stores the console log message in
 *   {{#crossLink "Skylink/_storedLogs:attribute"}}_storedLogs{{/crossLink}}
 *   if {{#crossLink "Skylink/_enableDebugStack:attribute"}}_enableDebugStack{{/crossLink}} is
 *   set to <code>true</code> and prints out the log to the Web console.
 * @method _logFn
 * @param {String} logLevel The console log message log level. [Rel: Skylink.LOG_LEVEL]
 * @param {Array|String} message The console log message contents.
 * @param {String} message.[0] The Peer ID the message is associated with.
 * @param {String} message.1 The interface the message is associated with.
 * @param {String|Array} message.2 Any additional message information that the message is
 *    associated with.
 * @param {String} message.3: The console log message message data.
 * @param {Object|String} [debugObject] The console debugging message object to accompany
 *    and display that associates with the console log message.
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
var _logFn = function(logLevel, message, debugObject) {
  var outputLog = _LOG_KEY;

  if (typeof message === 'object') {
    outputLog += (message[0]) ? ' [' + message[0] + '] -' : ' -';
    outputLog += (message[1]) ? ' <<' + message[1] + '>>' : '';
    if (message[2]) {
      outputLog += ' ';
      if (typeof message[2] === 'object') {
        for (var i = 0; i < message[2].length; i++) {
          outputLog += '(' + message[2][i] + ')';
        }
      } else {
        outputLog += '(' + message[2] + ')';
      }
    }
    outputLog += ' ' + message[3];
  } else {
    outputLog += ' - ' + message;
  }

  if (_enableDebugMode && _enableDebugStack) {
    // store the logs
    var logItem = [(new Date()), _LOG_LEVELS[logLevel], outputLog];

    if (typeof debugObject !== 'undefined') {
      logItem.push(debugObject);
    }
    _storedLogs.push(logItem);
  }

  if (_logLevel >= logLevel) {
    // Fallback to log if failure
    logLevel = (typeof console[_LOG_LEVELS[logLevel]] === 'undefined') ? 3 : logLevel;

    if (_enableDebugMode && _enableDebugTrace) {
      var logConsole = (typeof console.trace === 'undefined') ? logLevel[3] : 'trace';
      if (typeof debugObject !== 'undefined') {
        console[_LOG_LEVELS[logLevel]](outputLog, debugObject);
        // output if supported
        if (typeof console.trace !== 'undefined') {
          console.trace('');
        }
      } else {
        console[_LOG_LEVELS[logLevel]](outputLog);
        // output if supported
        if (typeof console.trace !== 'undefined') {
          console.trace('');
        }
      }
    } else {
      if (typeof debugObject !== 'undefined') {
        console[_LOG_LEVELS[logLevel]](outputLog, debugObject);
      } else {
        console[_LOG_LEVELS[logLevel]](outputLog);
      }
    }
  }
};

/**
 * The object that handles the logging functionality in Skylink.
 * @attribute log
 * @type JSON
 * @param {Function} debug See {{#crossLink "Skylink/log.debug:property"}}log.debug(){{/crossLink}}.
 * @param {Function} log See {{#crossLink "Skylink/log.log:property"}}log.log(){{/crossLink}}.
 * @param {Function} info See {{#crossLink "Skylink/log.info:property"}}log.info(){{/crossLink}}.
 * @param {Function} warn See {{#crossLink "Skylink/log.warn:property"}}log.warn(){{/crossLink}}.
 * @param {Function} error See {{#crossLink "Skylink/log.error:property"}}log.error(){{/crossLink}}.
 * @private
 * @required
 * @scoped true
 * @component Log
 * @for Skylink
 * @since 0.5.4
 */
var log = {
  /**
   * Handles the <code>console.debug</code> console log message.
   * @property log.debug
   * @type Function
   * @param {Array|String} message The console log message contents.
   * @param {String} message.[0] The Peer ID the message is associated with.
   * @param {String} message.1 The interface the message is associated with.
   * @param {String|Array} message.2 Any additional message information that the message is
   *    associated with.
   * @param {String} message.3: The console log message message data.
   * @param {Object|String} [debugObject] The console debugging message object to accompany
   *    and display that associates with the console log message.
   * @example
   *   // Logging for message
   *   log.debug("This is my message", object);
   * @private
   * @required
   * @scoped true
   * @component Log
   * @for Skylink
   * @since 0.5.4
   */
  debug: function (message, object) {
    _logFn(4, message, object);
  },

  /**
   * Handles the <code>console.log</code> console log message.
   * @property log.log
   * @type Function
   * @param {Array|String} message The console log message contents.
   * @param {String} message.[0] The Peer ID the message is associated with.
   * @param {String} message.1 The interface the message is associated with.
   * @param {String|Array} message.2 Any additional message information that the message is
   *    associated with.
   * @param {String} message.3: The console log message message data.
   * @param {Object|String} [debugObject] The console debugging message object to accompany
   *    and display that associates with the console log message.
   * @example
   *   // Logging for message
   *   log.log("This is my message", object);
   * @private
   * @required
   * @scoped true
   * @component Log
   * @for Skylink
   * @since 0.5.4
   */
  log: function (message, object) {
    _logFn(3, message, object);
  },

  /**
   * Handles the <code>console.info</code> console log message.
   * @property log.info
   * @type Function
   * @param {Array|String} message The console log message contents.
   * @param {String} message.[0] The Peer ID the message is associated with.
   * @param {String} message.1 The interface the message is associated with.
   * @param {String|Array} message.2 Any additional message information that the message is
   *    associated with.
   * @param {String} message.3: The console log message message data.
   * @param {Object|String} [debugObject] The console debugging message object to accompany
   *    and display that associates with the console log message.
   * @example
   *   // Logging for message
   *   log.debug("This is my message", object);
   * @private
   * @required
   * @scoped true
   * @component Log
   * @for Skylink
   * @since 0.5.4
   */
  info: function (message, object) {
    _logFn(2, message, object);
  },

  /**
   * Handles the <code>console.warn</code> console log message.
   * @property log.warn
   * @type Function
   * @param {Array|String} message The console log message contents.
   * @param {String} message.[0] The Peer ID the message is associated with.
   * @param {String} message.1 The interface the message is associated with.
   * @param {String|Array} message.2 Any additional message information that the message is
   *    associated with.
   * @param {String} message.3: The console log message message data.
   * @param {Object|String} [debugObject] The console debugging message object to accompany
   *    and display that associates with the console log message.
   * @example
   *   // Logging for message
   *   log.debug("Here's a warning. Please do xxxxx to resolve this issue", object);
   * @private
   * @required
   * @component Log
   * @for Skylink
   * @since 0.5.4
   */
  warn: function (message, object) {
    _logFn(1, message, object);
  },

  /**
   * Handles the <code>console.error</code> console log message.
   * @property log.error
   * @type Function
   * @param {Array|String} message The console log message contents.
   * @param {String} message.[0] The Peer ID the message is associated with.
   * @param {String} message.1 The interface the message is associated with.
   * @param {String|Array} message.2 Any additional message information that the message is
   *    associated with.
   * @param {String} message.3: The console log message message data.
   * @param {Object|String} [debugObject] The console debugging message object to accompany
   *    and display that associates with the console log message.
   * @example
   *   // Logging for external information
   *   log.error("There has been an error", object);
   * @private
   * @required
   * @scoped true
   * @component Log
   * @for Skylink
   * @since 0.5.4
   */
  error: function (message, object) {
    _logFn(0, message, object);
  }
};

/**
 * Configures the Skylink console log level that would determine the
 *   type of console logs that would be printed in the [Web console](https://developer.mozilla.org/en/docs/Web/API/console).
 * @method setLogLevel
 * @param {Number} [logLevel] The log level of console message logs to
 *    be printed in the Web console. [Rel: Skylink.LOG_LEVEL]
 * @example
 *   //Display logs level: Error, warn, info, log and debug.
 *   SkylinkDemo.setLogLevel(SkylinkDemo.LOG_LEVEL.DEBUG);
 * @component Log
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.setLogLevel = function(logLevel) {
  if(logLevel === undefined) {
    logLevel = Skylink.LOG_LEVEL.WARN;
  }
  for (var level in this.LOG_LEVEL) {
    if (this.LOG_LEVEL[level] === logLevel) {
      _logLevel = logLevel;
      log.log([null, 'Log', level, 'Log level exists. Level is set']);
      return;
    }
  }
  log.error([null, 'Log', level, 'Log level does not exist. Level is not set']);
};

/**
 * Configures the Skylink debugging tools.
 * @method setDebugMode
 * @param {Boolean|JSON} [options=false] The debugging settings for Skylink.
 *   If provided options is a <var>typeof</var> <code>boolean</code>,
 *   <code>storeLogs</code> and <code>trace</code> will be set to <code>true</code>.
 * @param {Boolean} [options.trace=false] The flag that indicates if Skylink console
 *   logs should all output as <code>console.trace()</code>.
 *   If <code>console.trace()</code> is not supported, it will fallback and
 *   output as <code>console.log()</code>.
 * @param {Boolean} [options.storeLogs=false] The flag that indicates if
 *   Skylink should store the logs in
 *   {{#crossLink "Skylink/SkylinkLogs:property"}}SkylinkLogs{{/crossLink}}.
 * @example
 *   // Example 1: just to enable
 *   SkylinkDemo.setDebugMode(true);
 *   // or
 *   SkylinkDemo.setDebugMode();
 *
 *   // Example 2: just to disable
 *   SkylinkDemo.setDebugMode(false);
 *
 *   // Example 3: disable storeLogs or trace feature individually
 *   SkylinkDemo.setDebugMode({ trace: true });
 * @component Log
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.setDebugMode = function(isDebugMode) {
  if (typeof isDebugMode === 'object') {
    if (Object.keys(isDebugMode).length > 0) {
      _enableDebugTrace = !!isDebugMode.trace;
      _enableDebugStack = !!isDebugMode.storeLogs;
    } else {
      _enableDebugMode = false;
      _enableDebugTrace = false;
      _enableDebugStack = false;
    }
  }
  if (isDebugMode === false) {
    _enableDebugMode = false;
    _enableDebugTrace = false;
    _enableDebugStack = false;

    return;
  }
  _enableDebugMode = true;
  _enableDebugTrace = true;
  _enableDebugStack = true;
};
Skylink.prototype._EVENTS = {
  /**
   * Event triggered when the socket connection to the platform signaling is opened.
   * - This event means that socket connection is open and self is ready to join the room.
   * @event channelOpen
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  channelOpen: [],

  /**
   * Event triggered when the socket connection to the platform signaling is closed.
   * - This event means that socket connection is closed and self has left the room.
   * @event channelClose
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  channelClose: [],

  /**
   * Event triggered when the socket connection is exchanging messages with the platform signaling.
   * - This event is a debugging feature, and it's not advisable to subscribe to
   *   this event unless you are debugging the socket messages
   *   received from the platform signaling.
   * @event channelMessage
   * @param {JSON} message The socket message object data received from the platform signaling.
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  channelMessage: [],

  /**
   * Event triggered when the socket connection has occurred an exception
   *   during a connection with the platform signaling.
   * - After this event is triggered, it may result in <a href="#event_channelClose">channelClose</a>,
   *   and the socket connection with the platform signaling could be disrupted.
   * @event channelError
   * @param {Object|String} error The error object thrown that caused the exception.
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  channelError: [],

  /**
   * Event triggered when attempting to reconnect the socket connection with the platform signaling.
   * - Depending on the current <code>type</code> triggered in <a href="#event_socketError">
   *   socketError</a> event before, it may or may not attempt the socket reconnection and
   *   this event may not be triggered.
   * - If reconnection attempt fails, it will trigger <a href="#event_socketError">socketError</a> event
   *   again and repeat the stage from there.
   * @event channelRetry
   * @param {String} fallbackType The fallback socket transport that Skylink is attempting to reconnect with.
   *   [Rel: Skylink.SOCKET_FALLBACK]
   * @param {Number} currentAttempt The current reconnection attempt.
   * @component Events
   * @for Skylink
   * @since 0.5.6
   */
  channelRetry: [],

  /**
   * Event triggered when attempt to <em>(re)</em>connect the socket connection with the platform signaling has failed.
   * - Depending on the current <code>type</code> payload, it may or may not attempt the
   *   socket reconnection and <a href="#event_channelRetry">channelRetry</a> event may not be triggered.
   * - If reconnection attempt fails and there are still available ports to reconnect with,
   *   it will trigger <a href="#event_channelRetry">channelRetry</a> event again and
   *   repeat the stage from there.
   * @event socketError
   * @param {String} errorCode The socket connection error code received.
   *   [Rel: Skylink.SOCKET_ERROR]
   * @param {Number|String|Object} error The error object thrown that caused the failure.
   * @param {String} type The socket transport that Skylink has failed to connect with.
   *   [Rel: Skylink.SOCKET_FALLBACK]
   * @component Events
   * @for Skylink
   * @since 0.5.5
   */
  socketError: [],

  /**
   * Event triggered when room connection information is being retrieved from platform server.
   * - This is also triggered when <a href="#method_init">init()</a> is invoked, but
   *   the socket connection events like <a href="#event_channelOpen">channelOpen</a> does
   *   not get triggered but stops at <u>readyStateChange</u> event.
   * @event readyStateChange
   * @param {String} readyState The current ready state of the retrieval when the event is triggered.
   *   [Rel: Skylink.READY_STATE_CHANGE]
   * @param {JSON} [error=null] The error object thrown when there is a failure in retrieval.
   *   If received as <code>null</code>, it means that there is no errors.
   * @param {Number} error.status Http status when retrieving information.
   *   May be empty for other errors.
   * @param {Number} error.errorCode The
   *   <a href="#attr_READY_STATE_CHANGE_ERROR">READY_STATE_CHANGE_ERROR</a>
   *   if there is an <a href="#event_readyStateChange">readyStateChange</a>
   *   event error that caused the failure for initialising Skylink.
   *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
   * @param {Object} error.content The exception thrown that caused the failure
   *   for initialising Skylink.
   * @param {Number} error.status The XMLHttpRequest status code received
   *   when exception is thrown that caused the failure for initialising Skylink.
   * @param {String} room The selected room connection information that Skylink is attempting
   *   to retrieve the information for to start connection to.
   * @component Events
   * @for Skylink
   * @since 0.4.0
   */
  readyStateChange: [],

  /**
   * Event triggered when a Peer handshaking state has changed.
   * - This event may trigger <code>state</code> <code>HANDSHAKE_PROGRESS.ENTER</code> for
   *   self to indicate that broadcast to ping for any existing Peers in the room has
   *   been made.
   * - This event is a debugging feature, and it's used to check the
   *   Peer handshaking connection status.
   * - This starts the Peer connection handshaking, where it retrieves all the Peer
   *   information and then proceeds to start the ICE connection.
   * @event handshakeProgress
   * @param {String} state The Peer connection handshake state.
   *   [Rel: Skylink.HANDSHAKE_PROGRESS]
   * @param {String} peerId The Peer ID associated with the connection
   *   handshake state.
   * @param {Object|String} [error] The error object thrown when there is a failure in
   *   the connection handshaking.
   * @component Events
   * @for Skylink
   * @since 0.3.0
   */
  handshakeProgress: [],

  /**
   * Event triggered when a Peer connection ICE gathering state has changed.
   * - This event is a debugging feature, and it's used to check the
   *   Peer ICE candidate gathering status.
   * - This indicates if the ICE gathering has been completed to
   *   start ICE connection for DataChannel and media streaming connection.
   * @event candidateGenerationState
   * @param {String} state The current ICE gathering state.
   *   <small>See the list of available triggered states in the related link.</small>
   *   [Rel: Skylink.CANDIDATE_GENERATION_STATE]
   * @param {String} peerId The Peer ID associated with the connection
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  candidateGenerationState: [],

  /**
   * Event triggered when a Peer connection signaling state has changed.
   * - This event is a debugging feature, and it's used to check the
   *   Peer signaling connection status.
   * - This event indicates if the session description is received
   *   to start ICE gathering for DataChannel and media streaming connection.
   * @event peerConnectionState
   * @param {String} state The current connection signaling state.
   *   [Rel: Skylink.PEER_CONNECTION_STATE]
   * @param {String} peerId The Peer ID associated with the current connection
   *   signaling state.
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  peerConnectionState: [],

  /**
   * Event triggered when a Peer connection ICE connection state has changed.
   * - This event is a debugging feature, and it's used to check the
   *   Peer ICE connection of added ICE candidates status.
   * - This event indicates if the ICE connection is established for successful
   *   DataChannel and media streaming connection.
   * @event iceConnectionState
   * @param {String} state The current ICE connection state.
   *   [Rel: Skylink.ICE_CONNECTION_STATE]
   * @param {String} peerId The Peer ID associated with the current ICE connection state.
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  iceConnectionState: [],

  /**
   * Event triggered when access to self user media stream has failed.
   * - If <code>audioFallback</code> is enabled in <a href="#method_init">init()</a>,
   *   it will throw an error if audio only user media stream failed after
   *   a failed attempt to retrieve video and audio user media.
   * @event mediaAccessError
   * @param {Object|String} error The error object thrown that caused the failure.
   * @param {Boolean} isScreensharing The flag that indicates if self
   *    Stream object is a screensharing stream or not.
   * @param {Boolean} isAudioFallbackError The flag that indicates if Skylink throws
   *    the error after an audio fallback has been attempted.
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  mediaAccessError: [],

  /**
   * Event triggered when media access fallback has been made.
   * - If <code>audioFallback</code> is enabled in <a href="#method_init">init()</a>,
   *   and if there is a failed attempt to retrieve video and audio user media,
   *   it will attempt to do the audio fallback.
   * - If MediaStream successfully received does not meet to expected tracks, this
   *   event would be triggered.
   * @event mediaAccessFallback
   * @param {JSON} error The error object information.
   * @param {Object|String} error.error The error object thrown that caused the failure
   *   from retrieve video and audio user media stream.
   *   is triggered because (video+audio) error is fallbacking to audio only.
   * @param {JSON} [error.diff=null] The list of expected audio and video tracks and received
   *   tracks.<br>This is only defined when <code>state</code> payload is <code>1</code>.
   * @param {JSON} error.diff.video The expected and received video tracks.
   * @param {Number} error.diff.video.expected The expected video tracks.
   * @param {Number} error.diff.video.received The received video tracks.
   * @param {JSON} error.diff.audio The expected and received audio tracks.
   * @param {Number} error.diff.audio.expected The expected audio tracks.
   * @param {Number} error.diff.audio.received The received audio tracks.
   * @param {Number} state The access fallback state.
   * <small><ul>
   * <li><code>0</code>: Attempting to retrieve access for fallback state.</li>
   * <li><code>1</code>: Fallback access has been completed successfully</li>
   * <li><code>-1</code>: Failed retrieving fallback access</li>
   * </ul></small>
   * @param {Boolean} [isScreensharing=false] The flag that indicates if this event ia an
   *   fallback from failed screensharing retrieval or attaching of audio.
   * @component Events
   * @param {Boolean} [isAudioFallback=false] The flag that indicates if this event is an
   *   audio fallbacking from failed attempt to retrieve video and audio user media.
   * @for Skylink
   * @since 0.6.3
   */
  mediaAccessFallback: [],

  /**
   * Event triggered when access to self user media stream is successfully
   *   attached to Skylink.
   * @event mediaAccessSuccess
   * @param {Object} stream The self user [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
   *   object. To display the MediaStream object to a <code>video</code> or <code>audio</code>, simply invoke:<br>
   *   <code>attachMediaStream(domElement, stream);</code>.
   * @param {Boolean} isScreensharing The flag that indicates if self
   *    Stream object is a screensharing stream or not.
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  mediaAccessSuccess: [],

  /**
   * Event triggered when the application requires to retrieve self
   *   user media stream manually instead of doing it automatically in
   *   {{#crossLink "Skylink/joinRoom:method"}}joinRoom(){{/crossLink}}.
   * - This event triggers based on the configuration of <code>manualGetUserMedia</code>
   *   in the <a href="#method_joinRoom">joinRoom() configuration settings</a>.
   * - Developers must manually invoke <a href="#method_getUserMedia">getUserMedia()</a>
   *   to retrieve the user media stream before self would join the room.
   *   Once the user media stream is attached, self would proceed to join the room
   *   automatically.
   * @event mediaAccessRequired
   * @component Events
   * @for Skylink
   * @since 0.5.5
   */
  mediaAccessRequired: [],

  /**
   * Event triggered when self user media stream attached to Skylink has been stopped.
   * @event mediaAccessStopped
   * @param {Boolean} isScreensharing The flag that indicates if self
   *    Stream object is a screensharing stream or not.
   * @component Events
   * @for Skylink
   * @since 0.5.6
   */
  mediaAccessStopped: [],

  /**
   * Event triggered when a Peer joins the room.
   * @event peerJoined
   * @param {String} peerId The Peer ID of the new peer
   *   that has joined the room.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @component Events
   * @for Skylink
   * @since 0.5.2
   */
  peerJoined: [],

  /**
   * Event triggered when a Peer connection has been restarted for
   *   a reconnection.
   * @event peerRestart
   * @param {String} peerId The Peer ID of the connection that
   *   is restarted for a reconnection.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelfInitiateRestart The flag that indicates if self is
   *    the one who have initiated the Peer connection restart.
   * @component Events
   * @for Skylink
   * @since 0.5.5
   */
  peerRestart: [],

  /**
   * Event triggered when a Peer information have been updated.
   * - This event would only be triggered if self is in the room.
   * - This event triggers when the <code>peerInfo</code> data is updated,
   *   like <code>peerInfo.mediaStatus</code> or the <code>peerInfo.userData</code>,
   *   which is invoked through <a href="#method_muteStream">muteStream()</a> or
   *   <a href="#method_setUserData">setUserData()</a>.
   * @event peerUpdated
   * @param {String} peerId The Peer ID of the peer with updated information.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @component Events
   * @for Skylink
   * @since 0.5.2
   */
  peerUpdated: [],

  /**
   * Event triggered when a Peer leaves the room.
   * @event peerLeft
   * @param {String} peerId The Peer ID of the peer
   *   that had left the room.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @component Events
   * @for Skylink
   * @since 0.5.2
   */
  peerLeft: [],

  /**
   * Event triggered when a Stream is sent by Peer.
   * - This event may trigger for self, which indicates that self has joined the room
   *   and is sending this Stream object to other Peers connected in the room.
   * @event incomingStream
   * @param {String} peerId The Peer ID associated to the Stream object.
   * @param {Object} stream The Peer
   *   [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
   *   object that is sent in this connection.
   *   To display the MediaStream object to a <code>video</code> or <code>audio</code>, simply invoke:<br>
   *   <code>attachMediaStream(domElement, stream);</code>.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @component Events
   * @for Skylink
   * @since 0.5.5
   */
  incomingStream: [],

  /**
   * Event triggered when message data is received from Peer.
   * - This event may trigger for self when sending message data to Peer,
   *   which indicates that self has sent the message data.
   * @event incomingMessage
   * @param {JSON} message The message object received from Peer.
   * @param {JSON|String} message.content The message object content. This is the
   *   message data content passed in {{#crossLink "Skylink/sendMessage:method"}}sendMessage(){{/crossLink}}
   *   and {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}}.
   * @param {String} message.senderPeerId The Peer ID of the peer who
   *   sent the message object.
   * @param {String|Array} [message.targetPeerId=null] The array of targeted Peer
   *   peers or the single targeted Peer the message is
   *   targeted to received the message object. If the value is <code>null</code>, the message
   *   object is broadcasted to all Peer peers in the room.
   * @param {Boolean} message.isPrivate The flag that indicates if the message object is sent to
   *   targeted Peer peers and not broadcasted to all Peer peers.
   * @param {Boolean} message.isDataChannel The flag that indicates if the message object is sent
   *   from the platform signaling socket connection or P2P channel connection (DataChannel connection).
   * @param {String} peerId The Peer ID of peer who sent the
   *   message object.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @component Events
   * @for Skylink
   * @since 0.5.2
   */
  incomingMessage: [],

  /**
   * Event triggered when a data transfer is completed.
   * - This event may trigger for self when transferring data to Peer,
   *   which indicates that self has transferred the data successfully.
   * - For more extensive states like the outgoing and incoming
   *   data transfer progress and rejection of data transfer requests,
   *   you may subscribe to the <a href="#event_dataTransferState">dataTransferState</a> event.
   * - If <code>enableDataChannel</code> disabled in <a href="#method_init">init() configuration
   *   settings</a>, this event will not be triggered at all.
   * @event incomingData
   * @param {Blob|String} data The transferred data object.<br>
   *   For Blob data object, see the
   *   [createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL)
   *   method on how you can convert the Blob data object to a download link.
   * @param {String} transferId The transfer ID of the completed data transfer.
   * @param {String} peerId The Peer ID associated with the data transfer.
   * @param {JSON} transferInfo The transfer data object information.
   * @param {String} [transferInfo.name=transferId] The transfer data object name.
   *   If there is no name based on the Blob given, the name would be the transfer ID.
   * @param {Number} transferInfo.size The transfer data size.
   * @param {String} transferInfo.dataType The type of data transfer initiated.
   *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
   * @param {String} transferInfo.timeout The waiting timeout in seconds that the DataChannel
   *   connection data transfer should wait before throwing an exception and terminating the data transfer.
   * @param {Boolean} transferInfo.isPrivate The flag to indicate if the data transferred
   *   targeted Peer peers and not broadcasted to all Peer peers.
   * @param {Boolean} isSelf The flag that indicates if the data transfer is from self or from
   *   associated Peer.
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  incomingData: [],


  /**
   * Event triggered when there is a request to start a data transfer.
   * - This event may trigger for self when requesting a data transfer to Peer,
   *   which indicates that self has sent the data transfer request.
   * - For more extensive states like the outgoing and incoming
   *   data transfer progress and rejection of data transfer requests,
   *   you may subscribe to the <a href="#event_dataTransferState">dataTransferState</a> event.
   * - If <code>enableDataChannel</code> disabled in <a href="#method_init">init() configuration
   *   settings</a>, this event will not be triggered at all.
   * - <sub>DATA TRANSFER STAGE</sub><br>
   *   <small>
   *   <a href="#event_dataTransferState">dataTransferState</a> &#8594;
   *   <b>incomingDataRequest</b> &#8594;
   *   <a href="#event_incomingData">incomingData</a>
   *   </small>
   * @event incomingDataRequest
   * @param {String} transferId The transfer ID of the data transfer request.
   * @param {String} peerId The Peer ID associated with the data transfer request.
   * @param {JSON} transferInfo The transfer data object information.
   * @param {String} [transferInfo.name=transferId] The transfer data object name.
   *   If there is no name based on the Blob given, the name would be the transfer ID.
   * @param {Number} transferInfo.size The transfer data size.
   * @param {String} transferInfo.dataType The type of data transfer initiated.
   *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
   * @param {String} transferInfo.timeout The waiting timeout in seconds that the DataChannel
   *   connection data transfer should wait before throwing an exception and terminating the data transfer.
   * @param {Boolean} transferInfo.isPrivate The flag to indicate if the data transferred
   *   targeted Peer peers and not broadcasted to all Peer peers.
   * @param {Boolean} isSelf The flag that indicates if the data transfer request is from self or from
   *   associated Peer.
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  incomingDataRequest: [],

  /**
   * Event triggered when the currently connected room lock status have been updated.
   * - If this event is triggered, this means that the room is locked / unlocked which
   *   may allow or prevent any other Peers from joining the room.
   * @event roomLock
   * @param {Boolean} isLocked The flag that indicates if the currently connected room is locked.
   * @param {String} peerId The Peer ID of the peer that updated the
   *   currently connected room lock status.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @component Events
   * @for Skylink
   * @since 0.5.2
   */
  roomLock: [],

  /**
   * Event triggered when a Peer connection DataChannel connection state has changed.
   * - This event is a debugging feature, and it's used to check the
   *   Peer DataChannel connection, which is used for P2P messaging and transfers for
   *   methods like <a href="#method_sendBlobData">sendBlobData()</a>,
   *   <a href="#method_sendURLData">sendURLData()</a> and
   *   <a href="#method_sendP2PMessage">sendP2PMessage()</a>.
   * - If <code>enableDataChannel</code> disabled in <a href="#method_init">init() configuration
   *   settings</a>, this event will not be triggered at all.
   * @event dataChannelState
   * @param {String} state The current DataChannel connection state.
   *   [Rel: Skylink.DATA_CHANNEL_STATE]
   * @param {String} peerId The Peer ID associated with the current DataChannel connection state.
   * @param {Object} [error=null] The error object thrown when there is a failure in
   *   the DataChannel connection.
   *   If received as <code>null</code>, it means that there is no errors.
   * @param {String} channelName The DataChannel connection ID.
   * @param {String} channelType The DataChannel connection functionality type.
   *   [Rel: Skylink.DATA_CHANNEL_TYPE]
   * @component Events
   * @for Skylink
   * @since 0.1.0
   */
  dataChannelState: [],

  /**
   * Event triggered when a data transfer state has changed.
   * - This event triggers more extensive states like the outgoing and incoming
   *   data transfer progress and rejection of data transfer requests.
   *   For simplified events, you may subscribe to the
   *   <a href="#event_incomingDataRequest">incomingDataRequest</a> and
   *   <a href="#event_incomingData">incomingData</a> events.
   * - If <code>enableDataChannel</code> disabled in <a href="#method_init">init() configuration
   *   settings</a>, this event will not be triggered at all.
   * @event dataTransferState
   * @param {String} state The data transfer made to Peer
   *   in a DataChannel connection state.
   *   [Rel: Skylink.DATA_TRANSFER_STATE]
   * @param {String} transferId The transfer ID of the completed data transfer.
   * @param {String} peerId The Peer ID associated with the data transfer.
   * @param {JSON} transferInfo The transfer data object information.
   * @param {Blob|String} transferInfo.data The transfer data object. This is defined
   *   only after the transfer data is completed, when the state is
   *   <code>DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED</code> and
   *   <code>DATA_TRANSFER_STATE.UPLOAD_STARTED</code><br>
   *   For Blob data object, see the
   *   [createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL)
   *   method on how you can convert the Blob data object to a download link.
   * @param {String} [transferInfo.name=transferId] The transfer data object name.
   *   If there is no name based on the Blob given, the name would be the transfer ID.
   * @param {Number} transferInfo.size The transfer data size.
   * @param {String} transferInfo.dataType The type of data transfer initiated.
   *   Available types are <code>"dataURL"</code> and <code>"blob"</code>.
   * @param {String} transferInfo.timeout The waiting timeout in seconds that the DataChannel
   *   connection data transfer should wait before throwing an exception and terminating the data transfer.
   * @param {Boolean} transferInfo.isPrivate The flag to indicate if the data transferred
   *   targeted Peer peers and not broadcasted to all Peer peers.
   * @param {JSON} [error] The error object thrown when there is a failure in transferring data.
   * @param {Object} error.message The exception thrown that caused the failure
   *   for transferring data.
   * @param {String} error.transferType The data transfer type to indicate if the DataChannel is
   *   uploading or downloading the data transfer when the exception occurred.
   *   [Rel: Skylink.DATA_TRANSFER_TYPE]
   * @component Events
   * @for Skylink
   * @since 0.4.1
   */
  dataTransferState: [],

  /**
   * Event triggered when Skylink receives an system action from the platform signaling.
   * @event systemAction
   * @param {String} action The system action that is received from the platform signaling.
   *   [Rel: Skylink.SYSTEM_ACTION]
   * @param {String} message The message received from the platform signaling when
   *   the system action and reason is given.
   * @param {String} reason The reason received from the platform signaling behind the
   *   system action given.
   *   [Rel: Skylink.SYSTEM_ACTION_REASON]
   * @component Events
   * @for Skylink
   * @since 0.5.1
   */
  systemAction: [],

  /**
   * Event triggered when a server Peer joins the room.
   * @event serverPeerJoined
   * @param {String} peerId The Peer ID of the new server peer
   *   that has joined the room.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerJoined: [],

  /**
   * Event triggered when a server Peer leaves the room.
   * @event serverPeerLeft
   * @param {String} peerId The Peer ID of the new server peer
   *   that has left the room.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerLeft: [],

  /**
   * Event triggered when a sever Peer connection has been restarted for
   *   a reconnection.
   * @event serverPeerRestart
   * @param {String} peerId The Peer ID of the new server peer
   *   that has joined the room.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerRestart: [],

  /**
   * Event triggered when a Peer connection Stream streaming has stopped.
   * @event streamEnded
   * @param {String} [peerId=null] The Peer ID associated to the Stream object.
   *   If self is not in the room, the value returned would be <code>null</code>.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @param {Boolean} isScreensharing The flag that indicates if Peer connection
   *    Stream object is a screensharing stream or not.
   * @component Events
   * @for Skylink
   * @since 0.5.10
   */
  streamEnded: [],

  /**
   * Event triggered when a Peer connection Stream streaming audio or video
   *   stream muted status have been updated.
   * @event streamMuted
   * @param {String} peerId The Peer ID associated to the Stream object.
   *   If self is not in the room, the value returned would be <code>null</code>.
   * @param {Object} peerInfo The peer information associated
   *   with the Peer Connection.
   * @param {String|JSON} peerInfo.userData The custom user data
   *   information set by developer. This custom user data can also
   *   be set in <a href="#method_setUserData">setUserData()</a>.
   * @param {JSON} peerInfo.settings The Peer Stream
   *   streaming settings information. If both audio and video
   *   option is <code>false</code>, there should be no
   *   receiving remote Stream object from this associated Peer.
   * @param {Boolean|JSON} [peerInfo.settings.audio=false] The
   *   Peer Stream streaming audio settings. If
   *   <code>false</code>, it means that audio streaming is disabled in
   *   the remote Stream of the Peer.
   * @param {Boolean} [peerInfo.settings.audio.stereo] The flag that indicates if
   *   stereo option should be explictly enabled to an OPUS enabled audio stream.
   *   Check the <code>audioCodec</code> configuration settings in
   *   <a href="#method_init">init()</a>
   *   to enable OPUS as the audio codec. Note that stereo is already enabled
   *   for OPUS codecs, this only adds a stereo flag to the SDP to explictly
   *   enable stereo in the audio streaming.
   * @param {Boolean|JSON} [peerInfo.settings.video=false] The Peer
   *   Stream streaming video settings. If <code>false</code>, it means that
   *   video streaming is disabled in the remote Stream of the Peer.
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer
   *   Stream streaming video resolution settings. Setting the resolution may
   *   not force set the resolution provided as it depends on the how the
   *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number} [peerInfo.settings.video.resolution.width] The Peer
   *   Stream streaming video resolution width.
   * @param {Number} [peerInfo.settings.video.resolution.height] The Peer
   *   Stream streaming video resolution height.
   * @param {Number} [peerInfo.settings.video.frameRate] The Peer
   *   Stream streaming video maximum frameRate.
   * @param {Boolean} [peerInfo.settings.video.screenshare=false] The flag
   *   that indicates if the Peer connection Stream object sent
   *   is a screensharing stream or not.
   * @param {String} [peerInfo.settings.bandwidth] The Peer
   *   streaming bandwidth settings. Setting the bandwidth flags may not
   *   force set the bandwidth for each connection stream channels as it depends
   *   on how the browser handles the bandwidth bitrate. Values are configured
   *   in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.audio] The configured
   *   audio stream channel for the remote Stream object bandwidth
   *   that audio streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.video] The configured
   *   video stream channel for the remote Stream object bandwidth
   *   that video streaming should use in <var>kb/s</var>.
   * @param {String} [peerInfo.settings.bandwidth.data] The configured
   *   datachannel channel for the DataChannel connection bandwidth
   *   that datachannel connection per packet should be able use in <var>kb/s</var>.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream mute
   *   settings for both audio and video streamings.
   * @param {Boolean} [peerInfo.mediaStatus.audioMuted=true] The flag that
   *   indicates if the remote Stream object audio streaming is muted. If
   *   there is no audio streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {Boolean} [peerInfo.mediaStatus.videoMuted=true] The flag that
   *   indicates if the remote Stream object video streaming is muted. If
   *   there is no video streaming enabled for the Peer, by default,
   *   it is set to <code>true</code>.
   * @param {JSON} peerInfo.agent The Peer platform agent information.
   * @param {String} peerInfo.agent.name The Peer platform browser or agent name.
   * @param {Number} peerInfo.agent.version The Peer platform browser or agent version.
   * @param {Number} peerInfo.agent.os The Peer platform name.
   * @param {String} peerInfo.room The current room that the Peer is in.
   * @param {Boolean} isSelf The flag that indicates if self is the Peer.
   * @param {Boolean} isScreensharing The flag that indicates if Peer connection
   *    Stream object is a screensharing stream or not.
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  streamMuted: [],

  /**
   * Event triggered when the retrieval of the list of rooms and peers under the same realm based
   *   on the Application Key configured in <a href="#method_init">init()</a>
   *   from the platform signaling state has changed.
   * - This requires that the provided alias Application Key has privileged feature configured.
   * @event getPeersStateChange
   * @param {String} state The retrieval current status.
   * @param {String} privilegedPeerId The Peer ID of the privileged Peer.
   * @param {JSON} peerList The retrieved list of rooms and peers under the same realm based on
   *   the Application Key configured in <code>init()</code>.
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  getPeersStateChange: [],

  /**
   * Event triggered when introductory state of two Peer peers to each other
   *   selected by the privileged Peer state has changed.
   * - This requires that the provided alias Application Key has privileged feature configured.
   * @event introduceStateChange
   * @param {String} state The Peer introduction state.
   * @param {String} privilegedPeerId The Peer ID of the privileged Peer.
   * @param {String} sendingPeerId The Peer ID of the peer
   *   that initiates the connection with the introduced Peer.
   * @param {String} receivingPeerId The Peer ID of the
   *   introduced peer who would be introduced to the initiator Peer.
   * @param {String} reason The error object thrown when there is a failure in
   *   the introduction with the two Peer peers.
   *   If received as <code>null</code>, it means that there is no errors.
   * @component Events
   * @for Skylink
   * @since 0.6.1
   */
  introduceStateChange: []
};

/**
 * Stores the list of {{#crossLink "Skylink/once:method"}}once(){{/crossLink}}
 *   event subscription handlers.
 * @attribute _onceEvents
 * @param {Array} (#eventName) The array of event subscription handlers that is
 *   subscribed using {{#crossLink "Skylink/once:method"}}once() method{{/crossLink}}
 *   associated with the event name.
 * @param {Function} (#eventName).(#index) The event subscription handler
 *   associated with the event name. This is to be triggered once when condition is met.
 *   Alternatively, the <code>once()</code> event subscription handler can be
 *   unsubscribed with {{#crossLink "Skylink/off:method"}}off(){{/crossLink}} before
 *   condition is met.
 * @type JSON
 * @private
 * @required
 * @component Events
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._onceEvents = {};

/**
 * The throttling function datetime stamp in
 *   [(ISO 8601 format)](https://en.wikipedia.org/wiki/ISO_8601).
 * @attribute _timestamp
 * @type JSON
 * @private
 * @required
 * @component Events
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._timestamp = {
  now: Date.now() || function() { return +new Date(); },
  screen: false
};

/**
 * Triggers event subscription handlers that is associated with the event name.
 * {{#crossLink "Skylink/on:method"}}on() event subscription handlers{{/crossLink}}
 *   will be triggered always, but
 *   {{#crossLink "Skylink/once:method"}}once() event subscription hadlers{{/crossLink}}
 *   will only be triggered once the condition is met.
 * @method _trigger
 * @param {String} eventName The Skylink event name to trigger that would trigger event subscription
 *   handlers associated to the event name with the <code>arguments</code> parameters payload.
 * @for Skylink
 * @private
 * @component Events
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._trigger = function(eventName) {
  //convert the arguments into an array
  var args = Array.prototype.slice.call(arguments);
  var arr = this._EVENTS[eventName];
  var once = this._onceEvents[eventName] || null;
  args.shift(); //Omit the first argument since it's the event name
  if (arr) {
    // for events subscribed forever
    for (var i = 0; i < arr.length; i++) {
      try {
        log.log([null, 'Event', eventName, 'Event is fired']);
        if(arr[i].apply(this, args) === false) {
          break;
        }
      } catch(error) {
        log.error([null, 'Event', eventName, 'Exception occurred in event:'], error);
        throw error;
      }
    }
  }
  if (once){
    // for events subscribed on once
    for (var j = 0; j < once.length; j++) {
      if (once[j][1].apply(this, args) === true) {
        log.log([null, 'Event', eventName, 'Condition is met. Firing event']);
        if(once[j][0].apply(this, args) === false) {
          break;
        }
        if (!once[j][2]) {
          log.log([null, 'Event', eventName, 'Removing event after firing once']);
          once.splice(j, 1);
          //After removing current element, the next element should be element of the same index
          j--;
        }
      } else {
        log.log([null, 'Event', eventName, 'Condition is still not met. ' +
          'Holding event from being fired']);
      }
    }
  }

  log.log([null, 'Event', eventName, 'Event is triggered']);
};

/**
 * Subscribes an event handler associated to the event name.
 * This event handler will always be triggered when the event name is triggered. If you
 *   are looking for subscription event handler to be triggered once, check out
 *   {{#crossLink "Skylink/once:method"}}once() event subscription{{/crossLink}}.
 * @method on
 * @param {String} eventName The Skylink event name to subscribe to.
 * @param {Function} callback The event handler to subsribe to the associated
 *   Skylink event name that would be triggered once the event name is triggered.
 * @example
 *   SkylinkDemo.on("peerJoined", function (peerId, peerInfo) {
 *      alert(peerId + " has joined the room");
 *   });
 * @component Events
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.on = function(eventName, callback) {
  if ('function' === typeof callback) {
    this._EVENTS[eventName] = this._EVENTS[eventName] || [];
    this._EVENTS[eventName].push(callback);
    log.log([null, 'Event', eventName, 'Event is subscribed']);
  } else {
    log.error([null, 'Event', eventName, 'Provided parameter is not a function']);
  }
};

/**
 * Subscribes an event handler associated to the event name that
 *    would only be triggered once the provided condition function has been met.
 * @method once
 * @param {String} eventName The Skylink event name to subscribe to.
 * @param {Function} callback The event handler to subscribe to the associated
 *   Skylink event name to trigger once the condition has met. If
 *   <code>fireAlways</code> option is set toe <code>true</code>, this will
 *   always be fired when condition is met.
 * @param {Function} [condition] The condition function that once the condition has
 *   been met, trigger the event handler once. Return in the condition function <code>true</code>
 *   to pass as meeting the condition.
 *   If the condition function is not provided, the event handler will be triggered
 *     once the Skylink event name is triggered.
 * @param {Boolean} [fireAlways=false] The flag that indicates if Skylink should interrupt this
 *   <code>once()</code> function once the function has been triggered to not unsubscribe the
 *   event handler but to always trigger when the condition has been met.
 * @example
 *   SkylinkDemo.once("peerConnectionState", function (state, peerId) {
 *     alert("Peer has left");
 *   }, function (state, peerId) {
 *     return state === SkylinkDemo.PEER_CONNECTION_STATE.CLOSED;
 *   });
 * @component Events
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype.once = function(eventName, callback, condition, fireAlways) {
  if (typeof condition === 'boolean') {
    fireAlways = condition;
    condition = null;
  }
  fireAlways = (typeof fireAlways === 'undefined' ? false : fireAlways);
  condition = (typeof condition !== 'function') ? function () {
    return true;
  } : condition;

  if (typeof callback === 'function') {

    this._EVENTS[eventName] = this._EVENTS[eventName] || [];
    // prevent undefined error
    this._onceEvents[eventName] = this._onceEvents[eventName] || [];
    this._onceEvents[eventName].push([callback, condition, fireAlways]);
    log.log([null, 'Event', eventName, 'Event is subscribed on condition']);
  } else {
    log.error([null, 'Event', eventName, 'Provided callback is not a function']);
  }
};

/**
 * Unsubscribes an event handler associated to the event name.
 * @method off
 * @param {String} eventName The Skylink event name to unsubscribe to.
 * @param {Function} [callback] The event handler to unsubscribe to the associated
 *   Skylink event name. If the event handler is not provided, Skylink would
 *   unsubscribe all event handlers subscribed to the associated event name.
 * @example
 *   // Example 1: Unsubscribe all event handlers related to the event
 *   SkylinkDemo.off("peerJoined");
 *
 *   // Example 2: Unsubscribe to one event handler
 *   SkylinkDemo.off("peerJoined", callback);
 * @component Events
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.off = function(eventName, callback) {
  if (callback === undefined) {
    this._EVENTS[eventName] = [];
    this._onceEvents[eventName] = [];
    log.log([null, 'Event', eventName, 'All events are unsubscribed']);
    return;
  }
  var arr = this._EVENTS[eventName];
  var once = this._onceEvents[eventName];

  // unsubscribe events that is triggered always
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === callback) {
      log.log([null, 'Event', eventName, 'Event is unsubscribed']);
      arr.splice(i, 1);
      break;
    }
  }
  // unsubscribe events fired only once
  if(once !== undefined) {
    for (var j = 0; j < once.length; j++) {
      if (once[j][0] === callback) {
        log.log([null, 'Event', eventName, 'One-time Event is unsubscribed']);
        once.splice(j, 1);
        break;
      }
    }
  }
};

/**
 * Checks if the first condition is already met before doing an event
 *   handler subscription to wait for the second condition to be met.
 * This method will do a event subscription with
 *   {{#crossLink "Skylink/once:method"}}once(){{/crossLink}} as this
 *   <code>_condition()</code> would only trigger once, unless <code>fireAlways</code>
 *   is set to <code>true</code>.
 * @method _condition
 * @param {String} eventName The Skylink event name to subscribe to.
 * @param {Function} callback The event handler to subscribe to the associated
 *   Skylink event name to trigger once the condition has met. If
 *   <code>fireAlways</code> option is set to <code>true</code>, this will
 *   always be fired when condition is met.
 * @param {Function} [checkFirst] The first condition to check before
 *   doing an event subscription to wait for second condition to meet.
 *   Return in the first condition function <code>true</code> to pass as meeting the condition.
 *   If the first condition is met, the event handler would be triggered
 *   and the event handler will not be subscribed to the event or wait
 *   for second condition to pass.
 * @param {Function} [condition] The second condition function that once the it has
 *   been met, it will trigger the event handler once.
 *   Return in the second condition function <code>true</code> to pass as meeting the condition.
 *   If the second condition is met, the event handler would be triggered and
 *   depending if <code>fireAlways</code> option is set to <code>true</code>, this will
 *   always be fired when condition is met.
 * @param {Boolean} [fireAlways=false] The flag that indicates if Skylink should interrupt the
 *   second condition function once the function has been triggered to not unsubscribe the
 *   event handler but to always trigger when the second condition has been met.
 * @private
 * @component Events
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._condition = function(eventName, callback, checkFirst, condition, fireAlways) {
  if (typeof condition === 'boolean') {
    fireAlways = condition;
    condition = null;
  }
  if (typeof callback === 'function' && typeof checkFirst === 'function') {
    if (checkFirst()) {
      log.log([null, 'Event', eventName, 'First condition is met. Firing callback']);
      callback();
      return;
    }
    log.log([null, 'Event', eventName, 'First condition is not met. Subscribing to event']);
    this.once(eventName, callback, condition, fireAlways);
  } else {
    log.error([null, 'Event', eventName, 'Provided callback or checkFirst is not a function']);
  }
};

/**
 * Starts the interval check for the condition provided to meet before clearing
 *   the interval and triggering the callback provided.
 * This utilises <code>setInterval()</code> function.
 * @method _wait
 * @param {Function} callback The callback fired after the condition provided
 *   has been met.
 * @param {Function} condition The condition function that once the condition has
 *   been met, trigger the callback. Return in the condition function <code>true</code>
 *   to pass as meeting the condition.
 * @param {Number} [intervalTime=50] The interval loop timeout that the interval
 *   check should iterate based on the timeout provided (in ms).
 *   By default, if the value is not configured, it is <code>50</code>ms.
 * @for Skylink
 * @private
 * @component Events
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._wait = function(callback, condition, intervalTime, fireAlways) {
  fireAlways = (typeof fireAlways === 'undefined' ? false : fireAlways);
  if (typeof callback === 'function' && typeof condition === 'function') {
    if (condition()) {
      log.log([null, 'Event', null, 'Condition is met. Firing callback']);
      callback();
      return;
    }
    log.log([null, 'Event', null, 'Condition is not met. Doing a check.']);

    intervalTime = (typeof intervalTime === 'number') ? intervalTime : 50;

    var doWait = setInterval(function () {
      if (condition()) {
        log.log([null, 'Event', null, 'Condition is met after waiting. Firing callback']);
        if (!fireAlways){
          clearInterval(doWait);
        }
        callback();
      }
    }, intervalTime);
  } else {
    if (typeof callback !== 'function'){
      log.error([null, 'Event', null, 'Provided callback is not a function']);
    }
    if (typeof condition !== 'function'){
      log.error([null, 'Event', null, 'Provided condition is not a function']);
    }
  }
};

/**
 * Returns a wrapper of the original function, which fires only once during
 *  a specified amount of time.
 * @method _throttle
 * @param {Function} func The function that should be throttled.
 * @param {Number} wait The amount of time that function need to throttled (in ms).
 * @return {Function} The throttled function.
 * @private
 * @component Events
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._throttle = function(func, wait){
  var self = this;
  return function () {
      if (!self._timestamp.func){
        //First time run, need to force timestamp to skip condition
        self._timestamp.func = self._timestamp.now - wait;
      }
      var now = Date.now();
      if (now - self._timestamp.func < wait) {
          return;
      }
      func.apply(self, arguments);
      self._timestamp.func = now;
  };
};
Skylink.prototype._socket = {
  connected: false,
  socket: null,
  session: {
    path: null,
    protocol: null,
    transport: 'WebSocket',
    port: null,
    retries: {
      max: 3,
      delay: 1000,
      current: 0
    },
    dead: false
  },
  config: {
    default: {
      server: 'signaling.temasys.com.sg',
      ports: {
        'http:': [80, 3000],
        'https:': [443, 3443]
      }
    },
    current: {}
  },
  transports: {
    'WebSocket': ['websocket'],
    'Polling': ['xhr-polling', 'jsonp-polling', 'polling']
  },
  messaging: {
    queue: [],
    timestamp: null,
    interval: 1000,
    throughput: 16,
    timer: null,
    typesToQueue: ['stream', 'updateUserEvent', 'roomLockEvent', 'muteAudioEvent', 'muteVideoEvent', 'public']
  }
};

/**
 * Starts a socket connection to the signaling.
 * @method _socketConnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketConnect = function () {
  var _this = this;

  // Connection is not connected
  _this._socket.connected = false;

  // Construct session path
  _this._socketConstructConnectPath();

  log.debug([null, 'Socket', _this._room.name, 'Connecting to signaling server ->'],
    _this._socket.session.path);

  // Create the socket.io-client io object
  _this._socket.socket = io.connect(_this._socket.session.path, {

    forceNew: true,
    //'sync disconnect on unload' : true,
    reconnection: true,
    reconnectionAttempts: _this._socket.session.retries.max,
    reconectionDelayMax: _this._socket.session.retries.delay,
    timeout: _this._room.config.current.socketTimeout,
    transports: _this._socket.transports[_this._socket.session.transport]

  });

  // io.on('connect_error') event
  _this._socket.socket.on('connect_error', function(error) {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> connect_error'], error);

    if (_this._socket.session.retries.current === 0) {
      _this._trigger('socketError', _this.SOCKET_ERROR.CONNECTION_FAILED,
        error, _this._socket.session.transport);
    }
  });

  // io.on('reconnect_attempt') event
  _this._socket.socket.on('reconnect_attempt', function(attempt) {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> reconnect_attempt'], attempt);

    _this._socket.session.retries.current++;

    _this._trigger('socketError', _this.SOCKET_ERROR.RECONNECTION_ATTEMPT,
      null, _this._socket.session.transport);
    _this._trigger('channelRetry', _this._socket.session.transport,
      _this._socket.session.retries.current);
  });

  // io.on('reconnect_error') event
  _this._socket.socket.on('reconnect_error', function(error) {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> reconnect_error'], error);

    _this._trigger('socketError', _this.SOCKET_ERROR.RECONNECTION_FAILED,
      error, _this._socket.session.transport);
  });

  // io.on('reconnect_failed') event
  _this._socket.socket.on('reconnect_failed', function() {
    log.debug([null, 'Socket', _this._room.name, 'Connection error state -> reconnect_failed']);

    _this._trigger('socketError', _this.SOCKET_ERROR.RECONNECTION_FAILED,
      new Error('Reconnection attempts have failed for port ' + _this._socket.session.port +
      ' and transport "' + _this._socket.session.transport + '"'), _this._socket.session.transport);

    _this._socketReconnect();
  });

  var connectHandler = function() {
    _this._socket.connected = true;

    log.debug([null, 'Socket', _this._room.name, 'Connection to signaling server connection has been opened']);

    _this._trigger('channelOpen');
  };

  // io.on('connect') event
  _this._socket.socket.on('connect', connectHandler);
  // io.on('reconnect') event
  _this._socket.socket.on('reconnect', connectHandler);

  // io.on('error') event
  _this._socket.socket.on('error', function(error) {
    log.error([null, 'Socket', _this._room.name, 'Connection has caught an exception ->'], error);

    _this._trigger('channelError', error);
  });

  // io.on('disconnect') event
  _this._socket.socket.on('disconnect', function() {
    log.debug([null, 'Socket', _this._room.name, 'Connection to signaling server connection has been closed']);

    _this._socket.connected = false;
    _this._trigger('channelClose');
  });

  // io.on('message') event
  _this._socket.socket.on('message', function(messageString) {
    var message = JSON.parse(messageString);

    log.debug([null, 'Socket', _this._room.name, 'Received message ->'], message);
    _this._trigger('channelMessage', message);

    if (message.type === 'group') {
      // NOTE: For those who never follow the protocol, I dont care :(
      message.lists.foreach(function (messageItem) {
        _this._messageReactRouter(messageItem);
      });
    } else {
      _this._messageReactRouter(message);
    }
  });

  log.debug([null, 'Socket', _this._room.name, 'Listening to events']);
};

/**
 * Constructs the socket connection path.
 * @method _socketConstructConnectPath
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketConstructConnectPath = function () {
  var _this = this;

  // Configure the session protocol
  _this._socket.session.protocol = window.location.protocol;

  if (_this._room.config.current.forceSSL) {
    _this._socket.session.protocol = 'https:';
  }

  // Configure the first port if not selected
  if (!_this._socket.session.port) {
    _this._socket.session.port = _this._socket.config.current.ports[_this._socket.session.protocol][0];
  }

  // Configure to set as Polling first if WebSocket is not supported
  if (!window.WebSocket) {
    _this._socket.session.transport = 'Polling';

    log.warn([null, 'Socket', null, 'Your browser does not support WebSocket transports, ' +
      'hence defaulting to Polling transports']);
  }

  // Construct the path
  _this._socket.session.path =
  // Append the protocol
    _this._socket.session.protocol + '//' +
  // Append the url and port
    _this._socket.config.current.server + ':' + _this._socket.session.port;

  log.debug([null, 'Socket', null, 'Session path has been constructed']);
};

/**
 * Restarts the socket connection to the signaling.
 * @method _socketReconnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketReconnect = function () {
  var _this = this;

  // Remove all listeners to socket.io-client object
  if (_this._socket) {
    _this._socket.socket.removeAllListeners('connect_error');
    _this._socket.socket.removeAllListeners('reconnect_attempt');
    _this._socket.socket.removeAllListeners('reconnect_error');
    _this._socket.socket.removeAllListeners('reconnect_failed');
    _this._socket.socket.removeAllListeners('connect');
    _this._socket.socket.removeAllListeners('reconnect');
    _this._socket.socket.removeAllListeners('error');
    _this._socket.socket.removeAllListeners('disconnect');
    _this._socket.socket.removeAllListeners('message');

    _this._socketDisconnect();
  }

  // Select the current port
  var ports = _this._socket.config.current.ports[_this._socket.session.protocol];
  var portIndex = ports.indexOf(_this._socket.session.port);

  if (portIndex < ports.length - 1) {
    _this._socket.session.port = ports[portIndex + 1];
    // Final port, now check the transport type to determine if we want to terminate connection
  } else {
    // Restart from WebSocket to Polling after failure
    if (_this._socket.session.transport === 'WebSocket') {
      _this._socket.session.transport = 'Polling';
      _this._socket.session.port = ports[0];
      // Abort reconnections because it failed
    } else {
      log.error([null, 'Socket', _this._room.name,
        'Failed connecting to server with Socket connection. Retries and transports have been maxed out']);

      _this._socket.session.dead = true;

      _this._trigger('socketError',_this.SOCKET_ERROR.RECONNECTION_ABORTED,
        new Error('Reconnection is aborted as all transports type and ports have been attempted'),
        _this._socket.session.transport);
      return;
    }
  }

  // Restart socket connection
  log.debug([null, 'Socket', _this._room.name,
    'Attempting to reconnect with a different port and transport ->'], {
      port: _this._socket.session.port,
      transport: _this._socket.session.transport
  });

  _this._socketConnect();
};

/**
 * Stops the socket connection with the signaling.
 * @method _socketDisconnect
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketDisconnect = function () {
  var _this = this;

  if (_this._socket.socket) {
    _this._socket.socket.disconnect();
  }

  log.debug([null, 'Socket', _this._room.name, 'Disconnecting']);
};

/**
 * Sends a message with the signaling connection.
 * @method _socketSendMessage
 * @param {JSON} message The message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketSendMessage = function(message) {
  var _this = this;

  _this._socketLimitMessageInterval(function(groupMessage) {
    if (!_this._socket.socket) {
      log.warn([null, 'Socket', _this._room.name,
        'Dropping message as connection is not yet initialized ->'], groupMessage);
      return;
    }

    if (!_this._socket.connected) {
      log.warn([null, 'Socket', _this._room.name,
        'Dropping message as connection is not yet connected ->'], groupMessage);
      return;
    }

    log.debug([null, 'Socket', _this._room.name, 'Sending message ->'], groupMessage);

    // Normal case when messages are sent not so rapidly
    var messageString = JSON.stringify(groupMessage);

    _this._socket.socket.send(messageString);

  }, message);
};

/**
 * Limits broadcasted socket messages and groups them when required
 *   to prevent messages from being dropped.
 * @method _socketLimitMessageInterval
 * @param {Function} fn The function to send delayed messages.
 * @param {JSON} message The message object
 * @param {JSON} groupMessage The grouped (or not) message object.
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._socketLimitMessageInterval = function(fn, message) {
  var _this = this;

  var delayFn = function() {
    if (_this._socket.messaging.queue.length > 0) {
      var data = _this._socket.messaging.queue[0];

      if (_this._socket.messaging.queue.length < _this._socket.messaging.throughput) {
        log.debug([null, 'Socket', _this._room.name, 'Sending delayed messages ->'], _this._socket.messaging.queue);

        // NOTE: What happens when one message rid is different :o
        fn({
          type: 'group',
          lists: _this._socket.messaging.queue.splice(0, _this._socket.messaging.queue.length),
          mid: _this._room.session.data.sid,
          rid: _this._room.session.data.room_key
        });

        clearTimeout(_this._socket.messaging.timer);

        _this._socket.messaging.timer = null;

      } else {
        log.debug([null, 'Socket', _this._room.name, 'Sending delayed first 16 messages ->'], _this._socket.messaging.queue);

        fn({
          type: 'group',
          lists: _this._socket.messaging.queue.splice(0, _this._socket.messaging.throughput),
          mid: data.mid,
          rid: data.rid
        });

        // To send later after sending the first 16
        clearTimeout(_this._socket.messaging.timer);

        _this._socket.messaging.timer = null;
        _this._socket.messaging.timer = setTimeout(delayFn, _this._socket.messaging.interval);
      }

      _this._socket.messaging.timestamp = Date.now() || function() {
        return +new Date();
      };
    }
  };

  //Delay when messages are sent too rapidly
  if ((Date.now() || function() {
      return +new Date();
    }) - _this._socket.messaging.timestamp < _this._socket.messaging.interval &&
    _this._socket.messaging.typesToQueue.indexOf(message.type) > -1) {

    log.warn([null, 'Socket', _this._room.name, 'Messages has been fired too rapidly. Delaying messages with queue']);

    _this._socket.messaging.queue.push(JSON.stringify(message));

    if (!_this._socket.messaging.timer) {
      _this._socket.messaging.timer = setTimeout(delayFn,
        _this._socket.messaging.interval - ((Date.now() || function() {
          return +new Date();
        }) - _this._socket.messaging.timestamp));
    }
    return;
  }

  fn(message);

  _this._socket.messaging.timestamp = Date.now() || function() {
    return +new Date();
  };
};
/**
 * Stores the preferred Peer connection streaming audio codec.
 * @attribute _selectedAudioCodec
 * @type String
 * @default Skylink.AUDIO_CODEC.AUTO
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._selectedAudioCodec = 'auto';

/**
 * Stores the preferred Peer connection streaming video codec.
 * @attribute _selectedVideoCodec
 * @type String
 * @default Skylink.VIDEO_CODEC.AUTO
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._selectedVideoCodec = 'auto';

/**
 * Stores the self user media MediaStream object.
 * @attribute _mediaStream
 * @type Object
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._mediaStream = null;

/**
 * Stores the self screensharing MediaStream.
 * @attribute _mediaScreen
 * @type Object
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype._mediaScreen = null;

/**
 * Stores the self screensharing audio MediaStream
 *   for browsers that do not support bundling of
 *   screensharing MediaStream with <code>audio: true</code>.
 * The current {{#crossLink "Skylink/_mediaScreen:attribute"}}_mediaScreen{{/crossLink}}
 *   clones this MediaStream object and <code>.addTrack()</code> with the
 *   screensharing MediaStream object video MediaStreamTrack object.
 * @attribute _mediaScreenClone
 * @type Object
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype._mediaScreenClone = null;

/**
 * Stores the Skylink default streaming settings.
 * @attribute _defaultStreamSettings
 * @type JSON
 * @param {Boolean|JSON} [audio=false] The
 *   default streaming audio settings. If
 *   <code>false</code>, it means that audio streaming is disabled in
 *   self connection Stream.
 * @param {Boolean} [audio.stereo=false] The default flag that indicates if
 *   stereo should be enabled in self connection Stream
 *    audio streaming.
 * @param {Boolean|JSON} [video=false] The default
 *   streaming video settings. If <code>false</code>, it means that
 *   video streaming is disabled in the remote Stream of the Peer.
 * @param {JSON} [video.resolution] The default
 *   streaming video resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [video.resolution.width] The default
 *   streaming video resolution width.
 * @param {Number} [video.resolution.height] The default
 *   streaming video resolution height.
 * @param {Number} [video.frameRate] The default
 *   streaming video maximum frameRate.
 * @param {String} [bandwidth] The default
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {String} [bandwidth.audio] The default
 *   audio stream channel for self Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {String} [bandwidth.video] The default
 *   video stream channel for self Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {String} [bandwidth.data] The default
 *   datachannel channel for self DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.7
 */
Skylink.prototype._defaultStreamSettings = {
  audio: {
    stereo: false
  },
  video: {
    resolution: {
      width: 640,
      height: 480
    },
    frameRate: 50
  },
  bandwidth: {
    audio: 50,
    video: 256,
    data: 1638400
  }
};

/**
 * Stores self user media Stream streaming settings. If both audio and video
 *   option is <code>false</code>, there should be no
 *   receiving remote Stream object from self connection.
 * @attribute _streamSettings
 * @type JSON
 * @param {Boolean|JSON} [audio=false] The
 *   self Stream streaming audio settings. If
 *   <code>false</code>, it means that audio streaming is disabled in
 *   the remote Stream of self connection.
 * @param {Boolean} [audio.stereo=false] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Array} [audio.optional] The optional constraints for audio streaming
 *   in self user media Stream object. Some of the values are
 *   set by the <code>audio.optional</code> setting in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @param {Boolean|JSON} [video=false] The self
 *   Stream streaming video settings. If <code>false</code>, it means that
 *   video streaming is disabled in the remote Stream of self connection.
 * @param {JSON} [video.resolution] The self
 *   Stream streaming video resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [video.frameRate] The self
 *   Stream streaming video maximum frameRate.
 * @param {Boolean} [video.screenshare=false] The flag
 *   that indicates if the self connection Stream object sent
 *   is a screensharing stream or not. In this case, the
 *   value is <code>false</code> for user media Stream object.
 * @param {Array} [video.optional] The optional constraints for video streaming
 *   in self user media Stream object. Some of the values are
 *   set by the <code>video.optional</code> setting in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @param {String} [bandwidth] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {String} [bandwidth.audio] The configured
 *   audio stream channel for self connection Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {String} [bandwidth.video] The configured
 *   video stream channel for the self connection Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {String} [bandwidth.data] The configured
 *   datachannel channel for self DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._streamSettings = {};

/**
 * Stores self screensharing Stream streaming settings.
 * @attribute _screenSharingStreamSettings
 * @type JSON
 * @param {Boolean|JSON} [audio=false] The
 *   self Stream streaming audio settings. If
 *   <code>false</code>, it means that audio streaming is disabled in
 *   the remote Stream of self connection.
 * @param {Boolean} [audio.stereo=false] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean|JSON} video The self
 *   Stream streaming video settings.
 * @param {Boolean} [video.screenshare=false] The flag
 *   that indicates if the self connection Stream object sent
 *   is a screensharing stream or not. In this case, the
 *   value is <code>true</code> for screensharing Stream object.
 * @param {String} [bandwidth] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._screenSharingStreamSettings = {
  video: {
    screenshare: true
  }
};

/**
 * The flag that indicates if self browser supports the screensharing feature.
 * Currently, Opera does not support screensharing and only premium
 *   Temasys plugins support this screensharing feature.
 * @attribute _screenSharingAvailable
 * @type Boolean
 * @default false
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._screenSharingAvailable = false;

/**
 * Stores the
 *   [getUserMedia MediaStreamConstraints](https://w3c.github.io/mediacapture-main/getusermedia.html#idl-def-MediaStreamConstraints)
 *   parsed from {{#crossLink "Skylink/_streamSettings:attribute"}}_streamSettings{{/crossLink}}
 *   for user media Stream object.
 * @attribute _getUserMediaSettings
 * @type JSON
 * @param {Boolean|JSON} [audio=false] The flag that indicates if self user media
 *   MediaStream would have audio streaming.
 * @param {Array} [audio.optional] The optional constraints for audio streaming
 *   in self user media MediaStream object. Some of the values are
 *   set by the <code>audio.optional</code> setting in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @param {Boolean|JSON} [video=false] The flag that indicates if self user media
 *   MediaStream would have video streaming.
 * @param {Number} [video.mandatory.maxHeight] The self user media
 *   MediaStream video streaming resolution maximum height.
 * @param {Number} [video.mandatory.maxWidth] The self user media
 *   MediaStream video streaming resolution maximum width.
 * @param {Number} [video.mandatory.maxFrameRate] The self user media
 *   MediaStream video streaming maxinmum framerate.
 * @param {Array} [video.optional] The optional constraints for video streaming
 *   in self user media MediaStream object. Some of the values are
 *   set by the <code>video.optional</code> setting in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._getUserMediaSettings = {};

/**
 * Stores self Stream mute settings for both audio and video streamings.
 * @attribute _mediaStreamsStatus
 * @type JSON
 * @param {Boolean} [audioMuted=true] The flag that
 *   indicates if self connection Stream object audio streaming is muted. If
 *   there is no audio streaming enabled for self connection, by default,
 *   it is set to <code>true</code>.
 * @param {Boolean} [videoMuted=true] The flag that
 *   indicates if self connection Stream object video streaming is muted. If
 *   there is no video streaming enabled for self connection, by default,
 *   it is set to <code>true</code>.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._mediaStreamsStatus = {};

/**
 * The flag indicates that when Skylink tries to get both audio and video stream
 *   but Skylink fails to retrieve the user media stream, it should fallback
 *   to retrieve audio streaming for the user media stream only.
 * @attribute _audioFallback
 * @type Boolean
 * @default false
 * @private
 * @required
 * @component Stream
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._audioFallback = false;

/**
 * Handles the event when access to self user media MediaStream is successful.
 * @method _onUserMediaSuccess
 * @param {MediaStream} stream The self user MediaStream object.
 * @param {Boolean} [isScreenSharing=false] The flag that indicates if self
 *    Stream object is a screensharing stream or not.
 * @trigger mediaAccessSuccess
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.3.0
 */
Skylink.prototype._onUserMediaSuccess = function(stream, isScreenSharing) {
  var self = this;
  log.log([null, 'MediaStream', stream.id,
    'User has granted access to local media'], stream);

  var streamEnded = function () {
    log.log([null, 'MediaStream', stream.id, 'Local mediastream has ended'], {
      inRoom: self._inRoom,
      currentTime: stream.currentTime,
      ended: typeof stream.active === 'boolean' ?
        stream.active : stream.ended
    });

    if (self._inRoom) {
      log.debug([null, 'MediaStream', stream.id, 'Sending mediastream ended status']);
      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.STREAM,
        mid: self._user.sid,
        rid: self._room.id,
        cid: self._key,
        sessionType: !!isScreenSharing ? 'screensharing' : 'stream',
        status: 'ended'
      });
    }
    self._trigger('streamEnded', self._user.sid || null, self.getPeerInfo(), true, !!isScreenSharing);
  };

  // chrome uses the new specs
  if (window.webrtcDetectedBrowser === 'chrome' || window.webrtcDetectedBrowser === 'opera') {
    stream.oninactive = streamEnded;
  // Workaround for local stream.onended because firefox has not yet implemented it
  } else if (window.webrtcDetectedBrowser === 'firefox') {
    stream.endedInterval = setInterval(function () {
      if (typeof stream.recordedTime === 'undefined') {
        stream.recordedTime = 0;
      }

      if (stream.recordedTime === stream.currentTime) {
        clearInterval(stream.endedInterval);
        // trigger that it has ended
        streamEnded();

      } else {
        stream.recordedTime = stream.currentTime;
      }

    }, 1000);
  } else {
    stream.onended = streamEnded;
  }

  // check if readyStateChange is done
  if (!isScreenSharing) {
    self._mediaStream = stream;
  } else {
    self._mediaScreen = stream;
  }

  self._muteLocalMediaStreams();

  self._wait(function () {
    self._trigger('mediaAccessSuccess', stream, !!isScreenSharing);
  }, function () {
    if (!isScreenSharing) {
      return self._mediaStream && self._mediaStream !== null;
    } else {
      return self._mediaScreen && self._mediaScreen !== null;
    }
  });

  /*self._condition('readyStateChange', function () {
    // check if users is in the room already
    self._condition('peerJoined', function () {
      self._trigger('incomingStream', self._user.sid, stream, true,
        self.getPeerInfo(), !!isScreenSharing);
    }, function () {
      return self._inRoom;
    }, function (peerId, peerInfo, isSelf) {
      return isSelf;
    });
  }, function () {
    return self._readyState === self.READY_STATE_CHANGE.COMPLETED;
  }, function (state) {
    return state === self.READY_STATE_CHANGE.COMPLETED;
  });*/
};

/**
 * Handles the event when access to self user media MediaStream has failed.
 * @method _onUserMediaError
 * @param {Object} error The error object thrown that caused the failure.
 * @param {Boolean} [isScreenSharing=false] The flag that indicates if self
 *    Stream object is a screensharing stream or not.
 * @param {Boolean} [audioFallback=false] The flag that indicates if stage
 *    of stream media error should do an audio fallback.
 * @trigger mediaAccessError
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._onUserMediaError = function(error, isScreenSharing, audioFallback) {
  var self = this;
  var hasAudioVideoRequest = !!self._streamSettings.video && !!self._streamSettings.audio;

  if (self._audioFallback && hasAudioVideoRequest && audioFallback) {
    // redefined the settings for video as false
    self._streamSettings.video = false;
    self._getUserMediaSettings.video = false;

    log.debug([null, 'MediaStream', null, 'Falling back to audio stream call']);

    self._trigger('mediaAccessFallback', {
      error: error,
      diff: null
    }, 0, false, true);

    window.getUserMedia({
      audio: true
    }, function(stream) {
      self._onUserMediaSuccess(stream);
      self._trigger('mediaAccessFallback', {
        error: null,
        diff: {
          video: { expected: 1, received: stream.getVideoTracks().length },
          audio: { expected: 1, received: stream.getAudioTracks().length }
        }
      }, 1, false, true);
    }, function(error) {
      log.error([null, 'MediaStream', null,
        'Failed retrieving audio in audio fallback:'], error);
      self._trigger('mediaAccessError', error, !!isScreenSharing, true);
      self._trigger('mediaAccessFallback', {
        error: error,
        diff: null
      }, -1, false, true);
    });
  } else {
    log.error([null, 'MediaStream', null, 'Failed retrieving stream:'], error);
   self._trigger('mediaAccessError', error, !!isScreenSharing, false);
  }
};

/**
 * Handles the event when remote MediaStream is received from Peer connection.
 * @method _onRemoteStreamAdded
 * @param {String} targetMid The Peer ID associated with the remote Stream object received.
 * @param {Event}  event The event object received in the <code>RTCPeerConnection.
 *   onaddstream</code>.
 * @param {Boolean} [isScreenSharing=false] The flag that indicates if Peer connection
 *    Stream object is a screensharing stream or not.
 * @trigger incomingStream
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._onRemoteStreamAdded = function(targetMid, stream, isScreenSharing) {
  var self = this;

  if(targetMid !== 'MCU') {
    if (!self._peerInformations[targetMid]) {
      log.error([targetMid, 'MediaStream', stream.id,
          'Received remote stream when peer is not connected. ' +
          'Ignoring stream ->'], stream);
      return;
    }

    if (!self._peerInformations[targetMid].settings.audio &&
      !self._peerInformations[targetMid].settings.video && !isScreenSharing) {
      log.log([targetMid, 'MediaStream', stream.id,
        'Receive remote stream but ignoring stream as it is empty ->'
        ], stream);
      return;
    }
    log.log([targetMid, 'MediaStream', stream.id,
      'Received remote stream ->'], stream);

    if (isScreenSharing) {
      log.log([targetMid, 'MediaStream', stream.id,
        'Peer is having a screensharing session with user']);
    }

    self._trigger('incomingStream', targetMid, stream,
      false, self.getPeerInfo(targetMid), !!isScreenSharing);
  } else {
    log.log([targetMid, null, null, 'MCU is listening']);
  }
};

/**
 * Parses the audio stream settings for self provided.
 * @method _parseAudioStreamSettings
 * @param {Boolean|JSON} [options=false] The flag that indicates if self user media
 *   MediaStream would have audio streaming.
 * @param {Boolean} [options.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Array} [options.optional] The optional constraints for audio streaming
 *   in self user media Stream object. Some of the values are
 *   set by the <code>audio.optional</code> setting in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @return {JSON} The parsed audio stream settings for self.
 *   <ul>
 *     <li><code>return.settings</code>: The output audio stream settings
 *        information for self</li>
 *     <li><code>return.userMedia</code>: The output audio
 *        MediaStreamConstraints to be passed into getUserMedia()</li>
 *  </ul>
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._parseAudioStreamSettings = function (audioOptions) {
  audioOptions = (typeof audioOptions === 'object') ?
    audioOptions : !!audioOptions;

  var hasOptional = false;

  // Cleaning of unwanted keys
  if (audioOptions !== false) {
    audioOptions = (typeof audioOptions === 'boolean') ? {} : audioOptions;
    var tempAudioOptions = {};
    tempAudioOptions.stereo = !!audioOptions.stereo;
    tempAudioOptions.optional = [];

    if (Array.isArray(audioOptions.optional)) {
      tempAudioOptions.optional = audioOptions.optional;
      hasOptional = true;
    }

    audioOptions = tempAudioOptions;
  }

  var userMedia = (typeof audioOptions === 'object') ?
    true : audioOptions;

  if (hasOptional) {
    userMedia = {
      optional: audioOptions.optional
    };
  }

  return {
    settings: audioOptions,
    userMedia: userMedia
  };
};

/**
 * Parses the video stream settings for self provided.
 * @method _parseVideoStreamSettings
 * @param {Boolean|JSON} [options=false] The self
 *   Stream streaming video settings. If <code>false</code>, it means that
 *   video streaming is disabled in the remote Stream of self connection.
 * @param {JSON} [options.resolution] The self
 *   Stream streaming video resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [options.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [options.frameRate] The self
 *   Stream streaming video maximum frameRate.
 * @param {Boolean} [options.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {Array} [options.optional] The optional constraints for video streaming
 *   in self user media Stream object. Some of the values are
 *   set by the <code>video.optional</code> setting in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @return {JSON} The parsed video stream settings for self.
 *   <ul>
 *     <li><code>return.settings</code>: The output video stream settings
 *        information for self</li>
 *     <li><code>return.userMedia</code>: The output video
 *        MediaStreamConstraints to be passed into getUserMedia()</li>
 *  </ul>
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._parseVideoStreamSettings = function (videoOptions) {
  videoOptions = (typeof videoOptions === 'object') ?
    videoOptions : !!videoOptions;

  var userMedia = false;

  // Cleaning of unwanted keys
  if (videoOptions !== false) {
    videoOptions = (typeof videoOptions === 'boolean') ?
      { resolution: {} } : videoOptions;
    var tempVideoOptions = {};
    // set the resolution parsing
    videoOptions.resolution = videoOptions.resolution || {};
    tempVideoOptions.resolution = tempVideoOptions.resolution || {};
    // set resolution
    tempVideoOptions.resolution.width = videoOptions.resolution.width ||
      this._defaultStreamSettings.video.resolution.width;
    tempVideoOptions.resolution.height = videoOptions.resolution.height ||
      this._defaultStreamSettings.video.resolution.height;
    // set the framerate
    tempVideoOptions.frameRate = videoOptions.frameRate ||
      this._defaultStreamSettings.video.frameRate;
    // set the screenshare option
    tempVideoOptions.screenshare = false;

    tempVideoOptions.optional = [];

    if (Array.isArray(videoOptions.optional)) {
      tempVideoOptions.optional = videoOptions.optional;
    }

    videoOptions = tempVideoOptions;

    userMedia = {
      mandatory: {
        //minWidth: videoOptions.resolution.width,
        //minHeight: videoOptions.resolution.height,
        maxWidth: videoOptions.resolution.width,
        maxHeight: videoOptions.resolution.height,
        //minFrameRate: videoOptions.frameRate,
        maxFrameRate: videoOptions.frameRate
      },
      optional: tempVideoOptions.optional
    };

    //Remove maxFrameRate for AdapterJS to work with Safari
    if (window.webrtcDetectedType === 'plugin') {
      delete userMedia.mandatory.maxFrameRate;
    }

    // Check if screensharing is available and enabled
    /*if (this._screenSharingAvailable && videoOptions.screenshare) {
      userMedia.optional.push({ sourceId: AdapterJS.WebRTCPlugin.plugin.screensharingKey });
    }*/

    //For Edge
    if (window.webrtcDetectedBrowser === 'edge') {
      userMedia = true;
    }
  }

  return {
    settings: videoOptions,
    userMedia: userMedia
  };
};

/**
 * Parses the streaming bandwidth settings for self provided.
 * @method _parseBandwidthSettings
 * @param {String} [options] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {String} [options.audio] The configured
 *   audio stream channel for self connection Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {String} [options.video] The configured
 *   video stream channel for the self connection Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {String} [options.data] The configured
 *   datachannel channel for self DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._parseBandwidthSettings = function (bwOptions) {
  bwOptions = (typeof bwOptions === 'object') ?
    bwOptions : {};

  // set audio bandwidth
  bwOptions.audio = (typeof bwOptions.audio === 'number') ?
    bwOptions.audio : 50;
  // set video bandwidth
  bwOptions.video = (typeof bwOptions.video === 'number') ?
    bwOptions.video : 256;
  // set data bandwidth
  bwOptions.data = (typeof bwOptions.data === 'number') ?
    bwOptions.data : 1638400;

  // set the settings
  this._streamSettings.bandwidth = bwOptions;
};

/**
 * Parses the <code>mediaStatus</code> settings for self provided.
 * @method _parseMutedSettings
 * @param {JSON} [options] The self Stream streaming settings.
 * @param {String|JSON} [options.userData] The custom user data
 *   information set by developer. This custom user data can also
 *   be set in {{#crossLink "Skylink/setUserData:method"}}setUserData(){{/crossLink}}.
 * @param {Boolean|JSON} [options.audio=false] The self Stream streaming audio settings.
 *   If <code>false</code>, it means that audio streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [audio.stereo=false] The default flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean} [options.audio.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Boolean|JSON} [options.video=false] The self Stream streaming video settings.
 *   If <code>false</code>, it means that video streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {Boolean} [options.video.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {JSON} [options.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [options.video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [options.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 * @return {JSON} The parsed <code>mediaStatus</code> settings for self.
 *   <ul>
 *     <li><code>return.audioMuted</code>:  The flag that
 *       indicates if self connection Stream object audio streaming is muted. If
 *       there is no audio streaming enabled for self connection, by default,
 *       it is set to <code>true</code>.</li>
 *     <li><code>return.videoMuted</code>: The flag that
 *       indicates if self connection Stream object video streaming is muted. If
 *       there is no video streaming enabled for self connection, by default,
 *       it is set to <code>true</code>.</li>
 *  </ul>
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._parseMutedSettings = function (options) {
  // the stream options
  options = (typeof options === 'object') ?
    options : { audio: false, video: false };

  var updateAudioMuted = (typeof options.audio === 'object') ?
    !!options.audio.mute : !options.audio;
  var updateVideoMuted = (typeof options.video === 'object') ?
    !!options.video.mute : !options.video;

  return {
    audioMuted: updateAudioMuted,
    videoMuted: updateVideoMuted
  };
};

/**
 * Parses the default stream settings received from
 *   the platform signaling.
 * @method _parseDefaultMediaStreamSettings
 * @param {JSON} defaults The default user media settings.
 * @param {Number} [defaults.maxHeight] The default user media
 *   MediaStream video streaming resolution maximum height.
 * @param {Number} [defaults.maxWidth] The default user media
 *   MediaStream video streaming resolution maximum width.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.7
 */
Skylink.prototype._parseDefaultMediaStreamSettings = function(options) {
  var hasMediaChanged = false;

  // prevent undefined error
  options = options || {};

  log.debug('Parsing stream settings. Default stream options:', options);

  options.maxWidth = (typeof options.maxWidth === 'number') ? options.maxWidth :
    640;
  options.maxHeight = (typeof options.maxHeight === 'number') ? options.maxHeight :
    480;

  // parse video resolution. that's for now
  this._defaultStreamSettings.video.resolution.width = options.maxWidth;
  this._defaultStreamSettings.video.resolution.height = options.maxHeight;

  log.debug('Parsed default media stream settings', this._defaultStreamSettings);
};

/**
 * Parses the provided stream settings for self provided.
 * @method _parseMediaStreamSettings
 * @param {JSON} [options] The self Stream streaming settings. If both audio and video
 *   option is <code>false</code>, there should be no audio and video stream
 *   sending from self connection.
 * @param {Boolean|JSON} [options.audio=false] The self Stream streaming audio settings.
 *   If <code>false</code>, it means that audio streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [options.audio.stereo=false] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean} [options.audio.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Boolean|JSON} [options.video=false] The self Stream streaming video settings.
 *   If <code>false</code>, it means that video streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {Boolean} [options.video.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {JSON} [options.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [options.video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [options.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 * @param {JSON} [options.bandwidth] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {Number} [options.bandwidth.audio] The configured
 *   audio stream channel for the self Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {Number} [options.bandwidth.video] The configured
 *   video stream channel for the self Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {Number} [options.bandwidth.data] The configured
 *   datachannel channel for the DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._parseMediaStreamSettings = function(options) {
  var hasMediaChanged = false;

  options = options || {};

  log.debug('Parsing stream settings. Stream options:', options);

  // Set audio settings
  var audioSettings = this._parseAudioStreamSettings(options.audio);
  // check for change
  this._streamSettings.audio = audioSettings.settings;
  this._getUserMediaSettings.audio = audioSettings.userMedia;

  // Set video settings
  var videoSettings = this._parseVideoStreamSettings(options.video);
  // check for change
  this._streamSettings.video = videoSettings.settings;
  this._getUserMediaSettings.video = videoSettings.userMedia;

  // Set user media status options
  var mutedSettings = this._parseMutedSettings(options);

  this._mediaStreamsStatus = mutedSettings;

  log.debug('Parsed user media stream settings', this._streamSettings);

  log.debug('User media status:', this._mediaStreamsStatus);
};

/**
 * Sends self selected Stream object to current Peer connections.
 * If {{#crossLink "Skylink/_mediaScreen:attribute"}}_mediaScreen{{/crossLink}}
 *   is not empty, it will send the screensharing stream, else it will
 *   send the {{#crossLink "Skylink/_mediaStream:attribute"}}_mediaStream{{/crossLink}}
 *   if is not empty.
 * If self does not have any Stream object to send, it will a connection without
 *   any remote Stream sent to the Peer connection.
 * @method _addLocalMediaStreams
 * @param {String} peerId The Peer ID of the connection to send
 *   Stream object to.
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addLocalMediaStreams = function(peerId) {
  // NOTE ALEX: here we could do something smarter
  // a mediastream is mainly a container, most of the info
  // are attached to the tracks. We should iterates over track and print
  try {
    log.log([peerId, null, null, 'Adding local stream']);

    var pc = this._peerConnections[peerId];

    if (pc) {
      if (pc.signalingState !== this.PEER_CONNECTION_STATE.CLOSED) {
        var hasStream = false;
        var hasScreen = false;

        // remove streams
        var streams = pc.getLocalStreams();
        for (var i = 0; i < streams.length; i++) {
          // try removeStream
          pc.removeStream(streams[i]);
        }

        if (this._mediaStream && this._mediaStream !== null) {
          hasStream = true;
        }

        if (this._mediaScreen && this._mediaScreen !== null) {
          hasScreen = true;
        }

        if (hasScreen) {
          log.debug([peerId, 'MediaStream', null, 'Sending screen'], this._mediaScreen);
          pc.addStream(this._mediaScreen);
        } else if (hasStream) {
          log.debug([peerId, 'MediaStream', null, 'Sending stream'], this._mediaStream);
          pc.addStream(this._mediaStream);
        } else {
          log.warn([peerId, 'MediaStream', null, 'No media to send. Will be only receiving']);
        }

      } else {
        log.warn([peerId, 'MediaStream', this._mediaStream,
          'Not adding stream as signalingState is closed']);
      }
    } else {
      log.warn([peerId, 'MediaStream', this._mediaStream,
        'Not adding stream as peerconnection object does not exists']);
    }
  } catch (error) {
    if ((error.message || '').indexOf('already added') > -1) {
      log.warn([peerId, null, null, 'Not re-adding stream as LocalMediaStream is already added'], error);
    } else {
      // Fix errors thrown like NS_ERROR_UNEXPECTED
      log.error([peerId, null, null, 'Failed adding local stream'], error);
    }
  }
};

/**
 * Stops self user media Stream object attached to Skylink.
 * @method stopStream
 * @trigger mediaAccessStopped, streamEnded
 * @example
 *   SkylinkDemo.stopStream();
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.stopStream = function () {
  // if previous line break, recheck again to trigger event
  this._stopLocalMediaStreams({
    userMedia: true
  });
};

/**
 * Handles the muting of audio and video streams in
 *   {{#crossLink "Skylink/_mediaStream:attribute"}}_mediaStream{{/crossLink}},
 *   {{#crossLink "Skylink/_mediaScreen:attribute"}}_mediaScreen{{/crossLink}} and
 *   {{#crossLink "Skylink/_mediaScreenClone:attribute"}}_mediaScreenClone{{/crossLink}},
 * @method _muteLocalMediaStreams
 * @return {JSON} The information of the self MediaStream object attached to
 *   Skylink if they have the specified tracks for the stream settings.
 *   <ul>
 *     <li><code>return.hasAudioTracks</code>: The flag that indicates if
 *        self MediaStream has audio tracks</li>
 *     <li><code>return.hasVideoTracks</code>: The flag that indicates if
 *        self MediaStream has video tracks</li>
 *  </ul>
 * @private
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._muteLocalMediaStreams = function () {
  var hasAudioTracks = false;
  var hasVideoTracks = false;

  var audioTracks;
  var videoTracks;
  var a, v;

  // Loop and enable tracks accordingly (mediaStream)
  if (this._mediaStream && this._mediaStream !== null) {
    audioTracks = this._mediaStream.getAudioTracks();
    videoTracks = this._mediaStream.getVideoTracks();

    hasAudioTracks = audioTracks.length > 0 || hasAudioTracks;
    hasVideoTracks = videoTracks.length > 0 || hasVideoTracks;

    // loop audio tracks
    for (a = 0; a < audioTracks.length; a++) {
      if (this._mediaStreamsStatus.audioMuted) {
        audioTracks[a].enabled = false;
      } else {
        audioTracks[a].enabled = true;
      }
    }
    // loop video tracks
    for (v = 0; v < videoTracks.length; v++) {
      if (this._mediaStreamsStatus.videoMuted) {
        videoTracks[v].enabled = false;
      } else {
        videoTracks[v].enabled = true;
      }
    }
  }

  // Loop and enable tracks accordingly (mediaScreen)
  if (this._mediaScreen && this._mediaScreen !== null) {
    audioTracks = this._mediaScreen.getAudioTracks();
    videoTracks = this._mediaScreen.getVideoTracks();

    hasAudioTracks = hasAudioTracks || audioTracks.length > 0;
    hasVideoTracks = hasVideoTracks || videoTracks.length > 0;

    // loop audio tracks
    for (a = 0; a < audioTracks.length; a++) {
      if (this._mediaStreamsStatus.audioMuted) {
        audioTracks[a].enabled = false;
      } else {
        audioTracks[a].enabled = true;
      }
    }
    // loop video tracks
    for (v = 0; v < videoTracks.length; v++) {
      if (this._mediaStreamsStatus.videoMuted) {
        videoTracks[v].enabled = false;
      } else {
        videoTracks[v].enabled = true;
      }
    }
  }

  // Loop and enable tracks accordingly (mediaScreenClone)
  if (this._mediaScreenClone && this._mediaScreenClone !== null) {
    videoTracks = this._mediaScreen.getVideoTracks();

    hasVideoTracks = hasVideoTracks || videoTracks.length > 0;

    // loop video tracks
    for (v = 0; v < videoTracks.length; v++) {
      if (this._mediaStreamsStatus.videoMuted) {
        videoTracks[v].enabled = false;
      } else {
        videoTracks[v].enabled = true;
      }
    }
  }

  // update accordingly if failed
  if (!hasAudioTracks) {
    this._mediaStreamsStatus.audioMuted = true;
    this._streamSettings.audio = false;
  }
  if (!hasVideoTracks) {
    this._mediaStreamsStatus.videoMuted = true;
    this._streamSettings.video = false;
  }

  log.log('Update to muted status ->', this._mediaStreamsStatus);

  return {
    hasAudioTracks: hasAudioTracks,
    hasVideoTracks: hasVideoTracks
  };
};

/**
 * Handles the stopping of audio and video streams.
 * @method _stopLocalMediaStreams
 * @param {Boolean|JSON} options The stop attached Stream options for
 *   Skylink when leaving the room.
 * @param {Boolean} [options.userMedia=false]  The flag that indicates if leaving the room
 *   should automatically stop and clear the existing user media stream attached to skylink.
 *   This would trigger <code>mediaAccessStopped</code> for this Stream if available.
 * @param {Boolean} [options.screenshare=false] The flag that indicates if leaving the room
 *   should automatically stop and clear the existing screensharing stream attached to skylink.
 *   This would trigger <code>mediaAccessStopped</code> for this Stream if available.
 * @private
 * @for Skylink
 * @since 0.6.3
 */
Skylink.prototype._stopLocalMediaStreams = function (options) {
  var stopUserMedia = false;
  var stopScreenshare = false;
  var triggerStopped = false;

  if (typeof options === 'object') {
    stopUserMedia = options.userMedia === true;
    stopScreenshare = options.screenshare === true;
  }

  var stopTracksFn = function (stream) {
    var audioTracks = stream.getAudioTracks();
    var videoTracks = stream.getVideoTracks();

    for (var i = 0; i < audioTracks.length; i++) {
      audioTracks[i].stop();
    }

    for (var j = 0; j < videoTracks.length; j++) {
      videoTracks[j].stop();
    }
  };

  var stopFn = function (stream, name) {
    //if (window.webrtcDetectedBrowser === 'chrome' && window.webrtcDetectedVersion > 44) {
    // chrome/opera/firefox uses mediastreamtrack.stop()
    if (['chrome', 'opera', 'firefox'].indexOf(window.webrtcDetectedBrowser) > -1) {
      stopTracksFn(stream);
    } else {
      try {
        stream.stop();
      } catch (error) {
        log.warn('Failed stopping MediaStreamTracks for ' + name + '.' +
          ' Stopping MediaStream instead', error);
        stopTracksFn(stream);
      }
    }
  };

  if (stopScreenshare) {
    log.log([null, 'MediaStream', self._selectedRoom, 'Stopping screensharing MediaStream']);

    if (this._mediaScreen && this._mediaScreen !== null) {
      stopFn(this._mediaScreen, '_mediaScreen');
      this._mediaScreen = null;
      triggerStopped = true;
    }

    if (this._mediaScreenClone && this._mediaScreenClone !== null) {
      stopFn(this._mediaScreenClone, '_mediaScreenClone');
      this._mediaScreenClone = null;
    }

    if (triggerStopped) {
      this._trigger('mediaAccessStopped', true);
    }
  } else {
    log.log([null, 'MediaStream', self._selectedRoom, 'Screensharing MediaStream will not be stopped']);
  }

  if (stopUserMedia) {
    log.log([null, 'MediaStream', self._selectedRoom, 'Stopping user\'s MediaStream']);

    if (this._mediaStream && this._mediaStream !== null) {
      stopFn(this._mediaStream, '_mediaStream');
      this._mediaStream = null;
      triggerStopped = true;
    }

    if (triggerStopped) {
      this._trigger('mediaAccessStopped', false);
    }
  } else {
    log.log([null, 'MediaStream', self._selectedRoom, 'User\'s MediaStream will not be stopped']);
  }
};

/**
 * Waits for self MediaStream object to be attached to Skylink based
 *   on the options provided before firing the callback to indicate
 *   that self Stream object is received.
 * This will stop any currently attached Stream object to Skylink.
 * @method _waitForLocalMediaStream
 * @param {Function} callback The callback fired after self MediaStream object
 *   is attached to Skylink based on the options provided.
 * @param {Object} [callback.error=null] The callback error that is defined
 *   when there's an error.
 * @param {Function} callback The callback fired after self MediaStream object
 *   is attached to Skylink based on the options provided successfully or met with
 *   an exception. The callback signature is <code>function (error)</code>.
 * @param {Object} callback.error The error object received in the callback.
 *   If received as <code>undefined</code>, it means that there is no errors.
 * @param {JSON} [options] The self Stream streaming settings. If both audio and video
 *   option is <code>false</code>, there should be no audio and video stream
 *   sending from self connection.
 * @param {Boolean|JSON} [options.audio=false] The self Stream streaming audio settings.
 *   If <code>false</code>, it means that audio streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [options.audio.stereo=false] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean} [options.audio.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Boolean|JSON} [options.video=false] The self Stream streaming video settings.
 *   If <code>false</code>, it means that video streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {Boolean} [options.video.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {JSON} [options.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [options.video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [options.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 * @param {String} [options.bandwidth] The self
 *   streaming bandwidth settings. Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate. Values are configured
 *   in <var>kb/s</var>.
 * @param {String} [options.bandwidth.audio] The configured
 *   audio stream channel for the self Stream object bandwidth
 *   that audio streaming should use in <var>kb/s</var>.
 * @param {String} [options.bandwidth.video] The configured
 *   video stream channel for the self Stream object bandwidth
 *   that video streaming should use in <var>kb/s</var>.
 * @param {String} [options.bandwidth.data] The configured
 *   datachannel channel for the DataChannel connection bandwidth
 *   that datachannel connection per packet should be able use in <var>kb/s</var>.
 * @trigger mediaAccessSuccess, mediaAccessError, mediaAccessRequired
 * @private
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._waitForLocalMediaStream = function(callback, options) {
  var self = this;
  options = options || {};

  // get the stream
  if (options.manualGetUserMedia === true) {
    self._trigger('mediaAccessRequired');
  }
  // If options video or audio false, do the opposite to throw a true.
  var requireAudio = !!options.audio;
  var requireVideo = !!options.video;

  log.log('Requested audio:', requireAudio);
  log.log('Requested video:', requireVideo);

  // check if it requires audio or video
  if (!requireAudio && !requireVideo && !options.manualGetUserMedia) {
    // set to default
    if (options.audio === false && options.video === false) {
      self._parseMediaStreamSettings(options);
    }

    callback(null);
    return;
  }

  // get the user media
  if (!options.manualGetUserMedia && (options.audio || options.video)) {
    self.getUserMedia({
      audio: options.audio,
      video: options.video

    }, function (error, success) {
      if (error) {
        callback(error);
      } else {
        callback(null, success);
      }
    });
  }

  // clear previous mediastreams
  self.stopStream();

  if (options.manualGetUserMedia === true) {
    var current50Block = 0;
    var mediaAccessRequiredFailure = false;
    // wait for available audio or video stream
    self._wait(function () {
      if (mediaAccessRequiredFailure === true) {
        self._onUserMediaError(new Error('Waiting for stream timeout'), false, false);
      } else {
        callback(null, self._mediaStream);
      }
    }, function () {
      current50Block += 1;
      if (current50Block === 600) {
        mediaAccessRequiredFailure = true;
        return true;
      }

      if (self._mediaStream && self._mediaStream !== null) {
        return true;
      }
    }, 50);
  }
};



/**
 * Gets self user media Stream object to attach to Skylink.
 * Do not invoke this function when user has already joined a room as
 *   this may affect any currently attached stream. You may use
 *  {{#crossLink "Skylink/sendStream:method"}}sendStream(){{/crossLink}}
 *  instead if self is already in the room, and allows application to
 *  attach application own MediaStream object to Skylink.
 * @method getUserMedia
 * @param {JSON} [options] The self Stream streaming settings for the new Stream
 *   object attached to Skylink. If this parameter is not provided, the
 *   options value would be <code>{ audio: true, video: true }</code>.
 * @param {Boolean|JSON} [options.audio=false] The self Stream streaming audio settings.
 *   If <code>false</code>, it means that audio streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [options.audio.stereo=false] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean} [options.audio.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Array} [options.audio.optional] The optional constraints for audio streaming
 *   in self user media Stream object. This follows the <code>optional</code>
 *   setting in the <code>MediaStreamConstraints</code> when <code>getUserMedia()</code> is invoked.
 *   Tampering this may cause errors in retrieval of self user media Stream object.
 *   Refer to this [site for more reference](http://www.sitepoint.com/introduction-getusermedia-api/).
 * @param {Boolean|JSON} [options.video=false] The self Stream streaming video settings.
 *   If <code>false</code>, it means that video streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {Boolean} [options.video.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {JSON} [options.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.video.resolution.width] The self
 *   Stream streaming video resolution width.
 *   <i>This sets the <code>maxWidth</code> of the <code>video</code>
 *   constraints passed in <code>getUserMedia()</code></i>.
 * @param {Number} [options.video.resolution.height] The self
 *   Stream streaming video resolution height.
 *   <i>This sets the <code>maxHeight</code> of the <code>video</code>
 *   constraints passed in <code>getUserMedia()</code></i>.
 * @param {Number} [options.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 *   <i>This sets the <code>maxFramerate</code> of the <code>video</code>
 *   constraints passed in <code>getUserMedia()</code></i>.
 * @param {Array} [options.video.optional] The optional constraints for video streaming
 *   in self user media Stream object. This follows the <code>optional</code>
 *   setting in the <code>MediaStreamConstraints</code> when <code>getUserMedia()</code> is invoked.
 *   Tampering this may cause errors in retrieval of self user media Stream object.
 *   Refer to this [site for more reference](http://www.sitepoint.com/introduction-getusermedia-api/).
 * @param {Function} [callback] The callback fired after Skylink has gained
 *   access to self media stream and attached it successfully with the provided
 *   media settings or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {Object} callback.error The error object received in the callback.
 *   This is the exception thrown that caused the failure for getting self user media.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Object} callback.success The success object received in the callback.
 *   The self user media [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
 *   object. To display the MediaStream object to a <code>video</code> or <code>audio</code>, simply invoke:<br>
 *   <code>attachMediaStream(domElement, stream);</code>.
 *   If received as <code>null</code>, it means that there are errors.
 * @example
 *   // Default is to get both audio and video
 *   // Example 1: Get both audio and video by default.
 *   SkylinkDemo.getUserMedia();
 *
 *   // Example 2: Get the audio stream only
 *   SkylinkDemo.getUserMedia({
 *     video: false,
 *     audio: true
 *   });
 *
 *   // Example 3: Set the stream settings for the audio and video
 *   SkylinkDemo.getUserMedia({
 *     video: {
 *        resolution: SkylinkDemo.VIDEO_RESOLUTION.HD,
 *        frameRate: 50
 *      },
 *     audio: {
 *       stereo: true
 *     }
 *   });
 *
 *   // Example 4: Get user media with callback
 *   SkylinkDemo.getUserMedia({
 *     video: false,
 *     audio: true
 *   },function(error,success){
 *      if (error){
 *        console.log(error);
 *      }
 *      else{
 *        console.log(success);
 *     }
 *   });
 * @trigger mediaAccessSuccess, mediaAccessError
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.getUserMedia = function(options,callback) {
  var self = this;

  var errorMsg; // j-shint rocks

  if (typeof options === 'function'){
    callback = options;
    options = {
      audio: true,
      video: true
    };
  }
  else if (typeof options !== 'object' || options === null) {
    if (typeof options === 'undefined') {
      options = {
        audio: true,
        video: true
      };
    } else {
      errorMsg = 'Please provide a valid options';
      log.error(errorMsg, options);
      if (typeof callback === 'function') {
        callback(new Error(errorMsg), null);
      }
      return;
    }
  }
  else if (!options.audio && !options.video) {
    errorMsg = 'Please select audio or video';
    log.error(errorMsg, options);
    if (typeof callback === 'function') {
      callback(new Error(errorMsg), null);
    }
    return;
  }

  /*if (window.location.protocol !== 'https:' && window.webrtcDetectedBrowser === 'chrome' &&
    window.webrtcDetectedVersion > 46) {
    errorMsg = 'getUserMedia() has to be called in https:// application';
    log.error(errorMsg, options);
    if (typeof callback === 'function') {
      callback(new Error(errorMsg), null);
    }
    return;
  }*/

  // parse stream settings
  self._parseMediaStreamSettings(options);

  // if audio and video is false, do not call getUserMedia
  if (!(options.audio === false && options.video === false)) {
    // clear previous mediastreams
    self.stopStream();

    setTimeout(function () {
      try {
        if (typeof callback === 'function'){
          var mediaAccessErrorFn = function (error) {
            callback(error, null);
            self.off('mediaAccessSuccess', mediaAccessSuccessFn);
          };

          var mediaAccessSuccessFn = function (stream) {
            callback(null, stream);
            self.off('mediaAccessError', mediaAccessErrorFn);
          };

          self.once('mediaAccessError', mediaAccessErrorFn);
          self.once('mediaAccessSuccess', mediaAccessSuccessFn);
        }

        window.getUserMedia(self._getUserMediaSettings, function (stream) {
          var isSuccess = false;
          var requireAudio = !!options.audio;
          var requireVideo = !!options.video;
          var hasAudio = !requireAudio;
          var hasVideo = !requireVideo;

          // for now we require one MediaStream with both audio and video
          // due to firefox non-supported audio or video
          if (stream && stream !== null) {
            var notSameTracksError = new Error(
              'Expected audio tracks length with ' +
              (requireAudio ? '1' : '0') + ' and video tracks length with ' +
              (requireVideo ? '1' : '0') + ' but received audio tracks length ' +
              'with ' + stream.getAudioTracks().length + ' and video ' +
              'tracks length with ' + stream.getVideoTracks().length);

            // do the check
            if (requireAudio) {
              hasAudio = stream.getAudioTracks().length > 0;
            }
            if (requireVideo) {
              hasVideo =  stream.getVideoTracks().length > 0;

              /*if (self._audioFallback && !hasVideo) {
                hasVideo = true; // to trick isSuccess to be true
                self._trigger('mediaAccessFallback', notSameTracksError);
              }*/
            }
            if (hasAudio && hasVideo) {
              isSuccess = true;
            }

            if (!isSuccess) {
              self._trigger('mediaAccessFallback', {
                error: notSameTracksError,
                diff: {
                  video: { expected: requireAudio ? 1 : 0, received: stream.getVideoTracks().length },
                  audio: { expected: requireVideo ? 1 : 0, received: stream.getAudioTracks().length }
                }
              }, 1, false, false);
            }

            self._onUserMediaSuccess(stream);
          }
        }, function (error) {
          self._onUserMediaError(error, false, true);
        });
      } catch (error) {
        self._onUserMediaError(error, false, true);
      }
    }, window.webrtcDetectedBrowser === 'firefox' ? 500 : 1);
  } else {
    log.warn([null, 'MediaStream', null, 'Not retrieving stream']);
  }
};

/**
 * Replaces the currently attached Stream object in Skylink and refreshes all
 *   connection with Peer connections to send the updated Stream object.
 * The application may provide their own MediaStream object to send to
 *   all PeerConnections connection.
 * Reference {{#crossLink "Skylink/refreshConnection:method"}}refreshConnection(){{/crossLink}}
 *    on the events triggered and restart mechanism.
 * @method sendStream
 * @param {Object|JSON} options The self Stream streaming settings for the new Stream
 *   object to replace the current Stream object attached to Skylink.
 *   If this parameter is provided as a MediaStream object, the
 *   MediaStream object settings for <code>mediaStatus</code> would be
 *   detected as unmuted by default.
 * @param {Boolean|JSON} [options.audio=false] The self Stream streaming audio settings.
 *   If <code>false</code>, it means that audio streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream audio
 *   user media access is given.
 * @param {Boolean} [options.audio.stereo=false] The flag that indicates if
 *   stereo should be enabled in self connection Stream
 *   audio streaming.
 * @param {Boolean} [options.audio.mute=false] The flag that
 *   indicates if the self Stream object audio streaming is muted.
 * @param {Boolean|JSON} [options.video=false] The self Stream streaming video settings.
 *   If <code>false</code>, it means that video streaming is disabled in
 *   the self Stream. If this option is set to <code>true</code> or is defined with
 *   settings, {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}
 *   will be invoked. Self will not connect to the room unless the Stream video
 *   user media access is given.
 * @param {Array} [options.audio.optional] The optional constraints for audio streaming
 *   in self user media Stream object. This follows the <code>optional</code>
 *   setting in the <code>MediaStreamConstraints</code> when <code>getUserMedia()</code> is invoked.
 *   Tampering this may cause errors in retrieval of self user media Stream object.
 *   Refer to this [site for more reference](http://www.sitepoint.com/introduction-getusermedia-api/).
 * @param {Boolean} [options.video.mute=false] The flag that
 *   indicates if the self Stream object video streaming is muted.
 * @param {JSON} [options.video.resolution] The self Stream streaming video
 *   resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [options.video.resolution.width] The self
 *   Stream streaming video resolution width.
 * @param {Number} [options.video.resolution.height] The self
 *   Stream streaming video resolution height.
 * @param {Number} [options.video.frameRate=50] The self
 *   Stream streaming video maximum frameRate.
 * @param {Array} [options.video.optional] The optional constraints for video streaming
 *   in self user media Stream object. This follows the <code>optional</code>
 *   setting in the <code>MediaStreamConstraints</code> when <code>getUserMedia()</code> is invoked.
 *   Tampering this may cause errors in retrieval of self user media Stream object.
 *   Refer to this [site for more reference](http://www.sitepoint.com/introduction-getusermedia-api/).
 * @param {Function} [callback] The callback fired after Skylink has replaced
 *   the current Stream object successfully with the provided
 *   media settings / MediaStream object or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {Object} callback.error The error object received in the callback.
 *   This is the exception thrown that caused the failure for replacing the current
 *   Stream object. If received as <code>null</code>, it means that there is no errors.
 * @param {Object} callback.success The success object received in the callback.
 *   The self user media [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
 *   object. To display the MediaStream object to a <code>video</code> or <code>audio</code>, simply invoke:<br>
 *   <code>attachMediaStream(domElement, stream);</code>.
 *   If received as <code>null</code>, it means that there are errors.
 * @example
 *   // Example 1: Send a stream object instead
 *   SkylinkDemo.on('mediaAccessSuccess', function (stream) {
 *     SkylinkDemo.sendStream(stream);
 *   });
 *
 *   // Example 2: Send stream with getUserMedia automatically called for you
 *   SkylinkDemo.sendStream({
 *     audio: true,
 *     video: false
 *   });
 *
 *   // Example 3: Send stream with getUserMedia automatically called for you
 *   // and audio is muted
 *   SkylinkDemo.sendStream({
 *     audio: { mute: true },
 *     video: false
 *   });
 *
 *   // Example 4: Send stream with callback
 *   SkylinkDemo.sendStream({
 *    audio: true,
 *    video: true
 *   },function(error,success){
 *    if (error){
 *      console.log('Error occurred. Stream was not sent: '+error)
 *    }
 *    else{
 *      console.log('Stream successfully sent: '+success);
 *    }
 *   });
 *
 * @trigger peerRestart, serverPeerRestart, incomingStream
 * @component Stream
 * @for Skylink
 * @since 0.5.6
 */

Skylink.prototype.sendStream = function(stream, callback) {
  var self = this;
  var restartCount = 0;
  var peerCount = Object.keys(self._peerConnections).length;

  if (typeof stream !== 'object' || stream === null) {
    var error = 'Provided stream settings is invalid';
    log.error(error, stream);
    if (typeof callback === 'function'){
      callback(new Error(error),null);
    }
    return;
  }

  var hasNoPeers = Object.keys(self._peerConnections).length === 0;

  // Stream object
  // getAudioTracks or getVideoTracks first because adapterjs
  // has not implemeneted MediaStream as an interface
  // interopability with firefox and chrome
  //MediaStream = MediaStream || webkitMediaStream;
  // NOTE: eventually we should do instanceof
  if (typeof stream.getAudioTracks === 'function' ||
    typeof stream.getVideoTracks === 'function') {
    // stop playback
    self.stopStream();

    self._streamSettings.audio = stream.getAudioTracks().length > 0;
    self._streamSettings.video = stream.getVideoTracks().length > 0;

    self._mediaStreamsStatus.audioMuted = self._streamSettings.audio === false;
    self._mediaStreamsStatus.videoMuted = self._streamSettings.video === false;

    if (self._inRoom) {
      self.once('mediaAccessSuccess', function (stream) {
        if (self._hasMCU) {
          self._restartMCUConnection();
        } else {
          self._trigger('incomingStream', self._user.sid, self._mediaStream,
            true, self.getPeerInfo(), false);
          for (var peer in self._peerConnections) {
            if (self._peerConnections.hasOwnProperty(peer)) {
              self._restartPeerConnection(peer, true, false, null, true);
            }
          }
        }

        self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
      });
    }

    // send the stream
    if (self._mediaStream !== stream) {
      self._onUserMediaSuccess(stream);
    }

    // The callback is provided and has peers, so require to wait for restart
    if (typeof callback === 'function' && !hasNoPeers) {
      self.once('peerRestart',function(peerId, peerInfo, isSelfInitiatedRestart){
        log.log([null, 'MediaStream', stream.id,
          'Stream was sent. Firing callback'], stream);
        callback(null,stream);
        restartCount = 0; //reset counter
      },function(peerId, peerInfo, isSelfInitiatedRestart){
        if (isSelfInitiatedRestart){
          restartCount++;
          if (restartCount === peerCount){
            return true;
          }
        }
        return false;
      },false);
    }

    // The callback is provided but there is no peers, so automatically invoke the callback
    if (typeof callback === 'function' && hasNoPeers) {
      callback(null, self._mediaStream);
    }

  // Options object
  } else {
    // The callback is provided but there is peers, so require to wait for restart
    if (typeof callback === 'function' && !hasNoPeers) {
      self.once('peerRestart',function(peerId, peerInfo, isSelfInitiatedRestart){
        log.log([null, 'MediaStream', stream.id,
          'Stream was sent. Firing callback'], stream);
        callback(null,stream);
        restartCount = 0; //reset counter
      },function(peerId, peerInfo, isSelfInitiatedRestart){
        if (isSelfInitiatedRestart){
          restartCount++;
          if (restartCount === peerCount){
            return true;
          }
        }
        return false;
      },false);
    }

    if (self._inRoom) {
      self.once('mediaAccessSuccess', function (stream) {
        if (self._hasMCU) {
          self._restartMCUConnection();
        } else {
          self._trigger('incomingStream', self._user.sid, self._mediaStream,
            true, self.getPeerInfo(), false);
          for (var peer in self._peerConnections) {
            if (self._peerConnections.hasOwnProperty(peer)) {
              self._restartPeerConnection(peer, true, false, null, true);
            }
          }
        }

        self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
      });
    }

    // get the mediastream and then wait for it to be retrieved before sending
    self._waitForLocalMediaStream(function (error) {
      if (!error) {
        // The callback is provided but there is not peers, so automatically invoke the callback
        if (typeof callback === 'function' && hasNoPeers) {
          callback(null, self._mediaStream);
        }
      } else {
        callback(error, null);
      }
    }, stream);
  }
};

/**
 * Mutes the currently attached Stream object in Skylink.
 * @method muteStream
 * @param {JSON} options The self Stream streaming muted settings.
 * @param {Boolean} [options.audioMuted=true]  The flag that
 *   indicates if self connection Stream object audio streaming is muted. If
 *   there is no audio streaming enabled for self connection, by default,
 *   it is set to <code>true</code>.
 * @param {Boolean} [options.videoMuted=true] The flag that
 *   indicates if self connection Stream object video streaming is muted. If
 *   there is no video streaming enabled for self connection, by default,
 *   it is set to <code>true</code>.
 * @example
 *   SkylinkDemo.muteStream({
 *     audioMuted: true,
 *     videoMuted: false
 *   });
 * @trigger streamMuted, peerUpdated
 * @component Stream
 * @for Skylink
 * @since 0.5.7
 */
Skylink.prototype.muteStream = function(options) {
  var self = this;
  var hasAudioError = false;
  var hasVideoError = false;

  if (typeof options !== 'object') {
    log.error('Provided settings is not an object');
    return;
  }

  if ((!self._mediaStream || self._mediaStream === null) &&
    (!self._mediaScreen || self._mediaScreen === null)) {
    log.warn('No streams are available to mute / unmute!');
    return;
  }

  // set the muted status
  if (typeof options.audioMuted === 'boolean') {
    if (self._streamSettings.audio === false) {
      log.error('No audio available to mute / unmute');
      hasAudioError = true;
    } else {
      if (options.audioMuted) {
        self._mediaStreamsStatus.audioMuted = true;
      } else {
        self._mediaStreamsStatus.audioMuted = false;
      }
    }
  }
  if (typeof options.videoMuted === 'boolean') {
    if (self._streamSettings.video === false) {
      log.error('No video available to mute / unmute');
      hasVideoError = true;
    } else {
      if (options.videoMuted) {
        self._mediaStreamsStatus.videoMuted = true;
      } else {
        self._mediaStreamsStatus.videoMuted = false;
      }
    }
  }

  var hasTracksOption = self._muteLocalMediaStreams();

  if (self._inRoom) {
    // update to mute status of video tracks
    if (hasTracksOption.hasVideoTracks) {
      // send message
      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.MUTE_VIDEO,
        mid: self._user.sid,
        rid: self._room.id,
        muted: self._mediaStreamsStatus.videoMuted
      });
    }
    // update to mute status of audio tracks
    if (hasTracksOption.hasAudioTracks) {
      // send message
      // set timeout to do a wait interval of 1s
      setTimeout(function () {
        self._sendChannelMessage({
          type: self._SIG_MESSAGE_TYPE.MUTE_AUDIO,
          mid: self._user.sid,
          rid: self._room.id,
          muted: self._mediaStreamsStatus.audioMuted
        });
      }, 1050);
    }

    if (!hasAudioError || !hasVideoError) {
      self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
    }
  }

  if (!hasAudioError || !hasVideoError) {
    self._trigger('streamMuted', self._user.sid || null, self.getPeerInfo(), true,
      !!self._mediaScreen && self._mediaScreen !== null);
  }
};

/**
 * Unmutes the currently attached Stream object audio stream.
 * @method enableAudio
 * @trigger peerUpdated
 * @deprecated Use .muteStream()
 * @example
 *   SkylinkDemo.enableAudio();
 * @trigger streamMuted, peerUpdated
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.enableAudio = function() {
  this.muteStream({
    audioMuted: false
  });
};

/**
 * Mutes the currently attached Stream object audio stream.
 * @method disableAudio
 * @deprecated Use .muteStream()
 * @example
 *   SkylinkDemo.disableAudio();
 * @trigger peerUpdated
 * @trigger streamMuted, peerUpdated
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.disableAudio = function() {
  this.muteStream({
    audioMuted: true
  });
};

/**
 * Unmutes the currently attached Stream object video stream.
 * @method enableVideo
 * @deprecated Use .muteStream()
 * @example
 *   SkylinkDemo.enableVideo();
 * @trigger peerUpdated
 * @trigger streamMuted, peerUpdated
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.enableVideo = function() {
  this.muteStream({
    videoMuted: false
  });
};

/**
 * Mutes the currently attached Stream object video stream.
 * @method disableVideo
 * @depcreated Use .muteStream()
 * @example
 *   SkylinkDemo.disableVideo();
 * @trigger streamMuted, peerUpdated
 * @component Stream
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.disableVideo = function() {
  this.muteStream({
    videoMuted: true
  });
};

/**
 * Shares the current screen with Peer connections and will refresh all
 *    Peer connections to send the screensharing Stream object with
 *    <code>HTTPS</code> protocol accessing application.
 * Reference {{#crossLink "Skylink/refreshConnection:method"}}refreshConnection(){{/crossLink}}
 *    on the events triggered and restart mechanism.
 * This will require our own Temasys Skylink extension to do screensharing.
 * For screensharing feature in IE / Safari with our Temasys Plugin, please
 *   [contact us](https://www.temasys.com.sg/contact-us).
 * Currently, Opera does not support screensharing feature.
 * This does not replace the currently attached user media Stream object in Skylink.
 * @method shareScreen
 * @param {JSON} [enableAudio=false] The flag that indicates if self screensharing
 *   Stream streaming should have audio. If
 *   <code>false</code>, it means that audio streaming is disabled in
 *   the remote Stream of self connection.
 * @param {Function} [callback] The callback fired after Skylink has shared
 *   the screen successfully or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {Object} callback.error The error object received in the callback.
 *   This is the exception thrown that caused the failure for sharing the screen.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Object} callback.success The success object received in the callback.
 *   The self screensharing [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
 *   object. To display the MediaStream object to a <code>video</code> or <code>audio</code>, simply invoke:<br>
 *   <code>attachMediaStream(domElement, stream);</code>.
 *   If received as <code>null</code>, it means that there are errors.
 * @example
 *   // Example 1: Share the screen
 *   SkylinkDemo.shareScreen();
 *
 *   // Example 2: Share screen with callback when screen is ready and shared
 *   SkylinkDemo.shareScreen(function(error,success){
 *      if (error){
 *        console.log(error);
 *      }
 *      else{
 *        console.log(success);
 *     }
 *   });
 * @trigger mediaAccessSuccess, mediaAccessError, incomingStream, peerRestart, serverPeerRestart, peerUpdated
 * @component Stream
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.shareScreen = function (enableAudio, callback) {
  var self = this;
  var hasAudio = false;

  var settings = {
    video: {
      mediaSource: 'window'
    }
  };

  if (typeof enableAudio === 'function') {
    callback = enableAudio;
    enableAudio = true;
  }

  if (typeof enableAudio !== 'boolean') {
    enableAudio = true;
  }

  var triggerSuccessFn = function (sStream) {
    if (hasAudio) {
      if (typeof self._streamSettings.audio === 'object') {
        self._screenSharingStreamSettings.audio = {
          stereo: !!self._streamSettings.audio.stereo
        };
      } else {
        self._screenSharingStreamSettings.audio = true;
      }
    } else {
      log.warn('This screensharing session will not support audio streaming');
      self._screenSharingStreamSettings.audio = false;
    }

    var requireAudio = enableAudio === true;
    var requireVideo = true;
    var checkAudio = !requireAudio;
    var checkVideo = !requireVideo;
    var notSameTracksError = new Error(
      'Expected audio tracks length with ' +
      (requireAudio ? '1' : '0') + ' and video tracks length with ' +
      (requireVideo ? '1' : '0') + ' but received audio tracks length ' +
      'with ' + sStream.getAudioTracks().length + ' and video ' +
      'tracks length with ' + sStream.getVideoTracks().length);

    // do the check
    if (requireAudio) {
      checkAudio = sStream.getAudioTracks().length > 0;
    }
    if (requireVideo) {
      checkVideo =  sStream.getVideoTracks().length > 0;
    }

    if (checkVideo) {
      // no audio but has video for screensharing
      if (!checkAudio) {
        self._trigger('mediaAccessFallback', {
          error: notSameTracksError,
          diff: {
            video: { expected: 1, received: sStream.getVideoTracks().length },
            audio: { expected: requireAudio ? 1 : 0, received: sStream.getAudioTracks().length }
          }
        }, 1, true, false);
      }

      self._onUserMediaSuccess(sStream, true);

    } else {
      self._onUserMediaError(notSameTracksError, true);
    }

    self._timestamp.screen = true;
  };

  if (window.webrtcDetectedBrowser === 'firefox') {
    settings.audio = !!enableAudio;
  }

  var throttleFn = function (fn, wait) {
    if (!self._timestamp.func){
      //First time run, need to force timestamp to skip condition
      self._timestamp.func = self._timestamp.now - wait;
    }
    var now = Date.now();

    if (!self._timestamp.screen) {
      if (now - self._timestamp.func < wait) {
        return;
      }
    }
    fn();
    self._timestamp.screen = false;
    self._timestamp.func = now;
  };

  var toShareScreen = function(){
    try {
      window.getUserMedia(settings, function (stream) {
        self.once('mediaAccessSuccess', function (stream) {
          if (self._inRoom) {
            if (self._hasMCU) {
              self._restartMCUConnection();
            } else {
              self._trigger('incomingStream', self._user.sid, stream,
                true, self.getPeerInfo(), false);
              for (var peer in self._peerConnections) {
                if (self._peerConnections.hasOwnProperty(peer)) {
                  self._restartPeerConnection(peer, true, false, null, true);
                }
              }
            }
          } else if (typeof callback === 'function') {
            callback(null, stream);
          }
        }, function (stream, isScreenSharing) {
          return isScreenSharing;
        });

        if (window.webrtcDetectedBrowser !== 'firefox' && enableAudio) {
          window.getUserMedia({
            audio: true
          }, function (audioStream) {
            try {
              audioStream.addTrack(stream.getVideoTracks()[0]);
              self._mediaScreenClone = stream;
              hasAudio = true;
              triggerSuccessFn(audioStream, true);

            } catch (error) {
              log.error('Failed retrieving audio stream for screensharing stream', error);
              triggerSuccessFn(stream, true);
            }

          }, function (error) {
            log.error('Failed retrieving audio stream for screensharing stream', error);
            triggerSuccessFn(stream, true);
          });
        } else {
          hasAudio = window.webrtcDetectedBrowser === 'firefox' ? enableAudio : false;
          triggerSuccessFn(stream, true);
        }

      }, function (error) {
        self._onUserMediaError(error, true, false);

        self._timestamp.screen = true;

        if (typeof callback === 'function') {
          callback(error, null);
        }
      });

    } catch (error) {
      self._onUserMediaError(error, true, false);

      if (typeof callback === 'function') {
        callback(error, null);
      }
    }
  };

  //self._throttle(toShareScreen,10000)();
  throttleFn(toShareScreen, 10000);
};

/**
 * Stops self screensharing Stream object attached to Skylink.
 * If user media Stream object is available, Skylink will refresh all
 *    Peer connections to send the user media Stream object.
 * Reference {{#crossLink "Skylink/refreshConnection:method"}}refreshConnection(){{/crossLink}}
 *    on the events triggered and restart mechanism.
 * @method stopScreen
 * @example
 *   SkylinkDemo.stopScreen();
 * @trigger mediaAccessStopped, streamEnded, incomingStream, peerRestart, serverPeerRestart
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.stopScreen = function () {
  if (this._mediaScreen && this._mediaScreen !== null) {
    this._stopLocalMediaStreams({
      screenshare: true
    });

    if (this._inRoom) {
      if (this._hasMCU) {
        this._restartMCUConnection();
      } else {
        if (!!this._mediaStream && this._mediaStream !== null) {
          this._trigger('incomingStream', this._user.sid, this._mediaStream, true,
            this.getPeerInfo(), false);
        }
        for (var peer in this._peerConnections) {
          if (this._peerConnections.hasOwnProperty(peer)) {
            this._restartPeerConnection(peer, true, false, null, true);
          }
        }
      }
    }
  }
};
Skylink.prototype._addSDPStereo = function(sdpLines) {
  var opusRtmpLineIndex = 0;
  var opusLineFound = false;
  var opusPayload = 0;
  var fmtpLineFound = false;

  var i, j;
  var line;

  for (i = 0; i < sdpLines.length; i += 1) {
    line = sdpLines[i];

    if (line.indexOf('a=rtpmap:') === 0) {
      var parts = line.split(' ');

      if (parts[1].indexOf('opus/48000/') === 0) {
        opusLineFound = true;
        opusPayload = parts[0].split(':')[1];
        opusRtmpLineIndex = i;
        break;
      }
    }
  }

  // if found
  if (opusLineFound) {
    log.debug([null, 'SDP', null, 'OPUS line is found. Enabling stereo']);

    // loop for fmtp payload
    for (j = 0; j < sdpLines.length; j += 1) {
      line = sdpLines[j];

      if (line.indexOf('a=fmtp:' + opusPayload) === 0) {
        fmtpLineFound = true;
        sdpLines[j] += '; stereo=1';
        break;
      }
    }

    // if line doesn't exists for an instance firefox
    if (!fmtpLineFound) {
      sdpLines.splice(opusRtmpLineIndex, 0, 'a=fmtp:' + opusPayload + ' stereo=1');
    }
  }

  return sdpLines;
};


/**
 * <b>BROKEN (not in use)</b>. Modifies the array of session description received to set
 *   a custom video resolution in the video streaming connection.
 * @method _setSDPVideoResolution
 * @param {Array} sdpLines The array of lines in the session description.
 * @return {Array} The updated array of lines in the session description
 *    with the custom video resolution.
 * @private
 * @component SDP
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._setSDPVideoResolution = function(sdpLines){
  var video = this._streamSettings.video;
  var frameRate = video.frameRate || 50;
  var resolution = {
    width: 320,
    height: 50
  }; //video.resolution || {};

  var videoLineFound = false;
  var videoLineIndex = 0;
  var fmtpPayloads = [];

  var i, j, k;
  var line;

  var sdpLineData = 'max-fr=' + frameRate +
    '; max-recv-width=320' + //(resolution.width ? resolution.width : 640) +
    '; max-recv-height=160'; //+ (resolution.height ? resolution.height : 480);

  for (i = 0; i < sdpLines.length; i += 1) {
    line = sdpLines[i];

    if (line.indexOf('a=video') === 0 || line.indexOf('m=video') === 0) {
      videoLineFound = true;
      videoLineIndex = i;
      fmtpPayloads = line.split(' ');
      fmtpPayloads.splice(0, 3);
      break;
    }
  }

  if (videoLineFound) {
    // loop for every video codec
    // ignore if not vp8 or h264
    for (j = 0; j < fmtpPayloads.length; j += 1) {
      var payload = fmtpPayloads[j];
      var rtpmapLineIndex = 0;
      var fmtpLineIndex = 0;
      var fmtpLineFound = false;
      var ignore = false;

      for (k = 0; k < sdpLines.length; k += 1) {
       line = sdpLines[k];

        if (line.indexOf('a=rtpmap:' + payload) === 0) {
          // for non h264 or vp8 codec, ignore. these are experimental codecs
          // that may not exists afterwards
          if (!(line.indexOf('VP8') > 0 || line.indexOf('H264') > 0)) {
            ignore = true;
            break;
          }
          rtpmapLineIndex = k;
        }

        if (line.indexOf('a=fmtp:' + payload) === 0) {
          fmtpLineFound = true;
          fmtpLineIndex = k;
        }
      }

      if (ignore) {
        continue;
      }

      if (fmtpLineFound) {
        sdpLines[fmtpLineIndex] += ';' + sdpLineData;

      } else {
        sdpLines.splice(rtpmapLineIndex + 1, 0, 'a=fmtp:' + payload + ' ' + sdpLineData);
      }
    }

    log.debug([null, 'SDP', null, 'Setting video resolution (broken)']);
  }
  return sdpLines;
};

/**
 * Modifies the array of session description received to set
 *   a custom bandwidth bitrate (in kbps) in the streaming connection.
 * Setting the bandwidth flags may not
 *   force set the bandwidth for each connection stream channels as it depends
 *   on how the browser handles the bandwidth bitrate.
 * @method _setSDPBitrate
 * @param {Array} sdpLines The array of lines in the session description.
 * @return {Array} The updated array of lines in the session description
 *    with custom bandwidth bitrate (in kbps) settings.
 * @private
 * @component SDP
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._setSDPBitrate = function(sdpLines, settings) {
  // Find if user has audioStream
  var bandwidth = this._streamSettings.bandwidth;
  var hasAudio = !!(settings || {}).audio;
  var hasVideo = !!(settings || {}).video;

  var i, j, k;

  var audioIndex = 0;
  var videoIndex = 0;
  var dataIndex = 0;

  var audioLineFound = false;
  var videoLineFound = false;
  var dataLineFound = false;

  for (i = 0; i < sdpLines.length; i += 1) {
    // set the audio bandwidth
    if (sdpLines[i].indexOf('a=audio') === 0 || sdpLines[i].indexOf('m=audio') === 0) {

      sdpLines.splice(i + 1, 0, 'b=AS:' + bandwidth.audio);

      log.debug([null, 'SDP', null, 'Setting audio bitrate (' +
        bandwidth.audio + ')'], i);
      break;
    }
  }

  for (j = 0; j < sdpLines.length; j += 1) {
    // set the video bandwidth
    if (sdpLines[j].indexOf('a=video') === 0 || sdpLines[j].indexOf('m=video') === 0) {
      sdpLines.splice(j + 1, 0, 'b=AS:' + bandwidth.video);

      log.debug([null, 'SDP', null, 'Setting video bitrate (' +
        bandwidth.video + ')'], j);
      break;
    }
  }

  for (k = 0; k < sdpLines.length; k += 1) {
    // set the data bandwidth
    if (sdpLines[k].indexOf('a=application') === 0 || sdpLines[k].indexOf('m=application') === 0) {
      sdpLines.splice(k + 1, 0, 'b=AS:' + bandwidth.data);

      log.debug([null, 'SDP', null, 'Setting data bitrate (' +
        bandwidth.data + ')'], k);
      break;
    }
  }
  return sdpLines;
};

/**
 * Modifies the array of session description received to configure
 *   the selected video codec to use in the video streaming connection.
 * @method _setSDPVideoCodec
 * @param {Array} sdpLines The array of lines in the session description.
 * @return {Array} The updated array of lines in the session description
 *    with the selected video codec.
 * @private
 * @component SDP
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._setSDPVideoCodec = function(sdpLines) {
  log.log('Setting video codec', this._selectedVideoCodec);
  var codecFound = false;
  var payload = 0;

  var i, j;
  var line;

  for (i = 0; i < sdpLines.length; i += 1) {
    line = sdpLines[i];

    if (line.indexOf('a=rtpmap:') === 0) {
      if (line.indexOf(this._selectedVideoCodec) > 0) {
        codecFound = true;
        payload = line.split(':')[1].split(' ')[0];
        break;
      }
    }
  }

  if (codecFound) {
    for (j = 0; j < sdpLines.length; j += 1) {
      line = sdpLines[j];

      if (line.indexOf('m=video') === 0 || line.indexOf('a=video') === 0) {
        var parts = line.split(' ');
        var payloads = line.split(' ');
        payloads.splice(0, 3);

        var selectedPayloadIndex = payloads.indexOf(payload);

        if (selectedPayloadIndex === -1) {
          payloads.splice(0, 0, payload);
        } else {
          var first = payloads[0];
          payloads[0] = payload;
          payloads[selectedPayloadIndex] = first;
        }
        sdpLines[j] = parts[0] + ' ' + parts[1] + ' ' + parts[2] + ' ' + payloads.join(' ');
        break;
      }
    }
  }
  return sdpLines;
};

/**
 * Modifies the array of session description received to configure
 *   the selected audio codec to use in the audio streaming connection.
 * @method _setSDPAudioCodec
 * @param {Array} sdpLines The array of lines in the session description.
 * @return {Array} The updated array of lines in the session description
 *    with the selected audio codec.
 * @private
 * @component SDP
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._setSDPAudioCodec = function(sdpLines) {
  log.log('Setting audio codec', this._selectedAudioCodec);
  var codecFound = false;
  var payload = 0;

  var i, j;
  var line;

  for (i = 0; i < sdpLines.length; i += 1) {
    line = sdpLines[i];

    if (line.indexOf('a=rtpmap:') === 0) {
      if (line.indexOf(this._selectedAudioCodec) > 0) {
        codecFound = true;
        payload = line.split(':')[1].split(' ')[0];
      }
    }
  }

  if (codecFound) {
    for (j = 0; j < sdpLines.length; j += 1) {
      line = sdpLines[j];

      if (line.indexOf('m=audio') === 0 || line.indexOf('a=audio') === 0) {
        var parts = line.split(' ');
        var payloads = line.split(' ');
        payloads.splice(0, 3);

        var selectedPayloadIndex = payloads.indexOf(payload);

        if (selectedPayloadIndex === -1) {
          payloads.splice(0, 0, payload);
        } else {
          var first = payloads[0];
          payloads[0] = payload;
          payloads[selectedPayloadIndex] = first;
        }
        sdpLines[j] = parts[0] + ' ' + parts[1] + ' ' + parts[2] + ' ' + payloads.join(' ');
        break;
      }
    }
  }
  return sdpLines;
};

/**
 * Modifies the array of session description received to remove the
 *   Firefox 32 H262 preference to prevent breaking connection with nsupported browsers.
 * @method _removeSDPFirefoxH264Pref
 * @param {Array} sdpLines The array of lines in the session description.
 * @return {Array} The updated array of lines in the session description
 *    removed of the Firefox 32 H262 preference.
 * @private
 * @component SDP
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._removeSDPFirefoxH264Pref = function(sdpLines) {
  var invalidLineIndex = sdpLines.indexOf(
    'a=fmtp:0 profile-level-id=0x42e00c;packetization-mode=1');
  if (invalidLineIndex > -1) {
    log.debug([null, 'SDP', null, 'Firefox H264 invalid pref found:'], invalidLineIndex);
    sdpLines.splice(invalidLineIndex, 1);
  }
  return sdpLines;
};

/**
 * Modifies the session description received to append the correct ssrc lines for Firefox.
 * @method _addSDPSsrcFirefoxAnswer
 * @param {String} targetMid The peer connection ID.
 * @param {String} answerSdp The answer session description.
 * @return {String} The update answer session description with correct SSRC lines.
 * @private
 * @component SDP
 * @for Skylink
 * @since 0.6.6
 */
Skylink.prototype._addSDPSsrcFirefoxAnswer = function (targetMid, sdp) {
  var self = this;
  var agent = self.getPeerInfo(targetMid).agent;

  var pc = self._peerConnections[targetMid];

  if (!pc) {
    log.error([targetMid, 'RTCSessionDesription', 'answer', 'Peer connection object ' +
      'not found. Unable to parse answer session description for peer']);
    return;
  }

  var updatedSdp = sdp;

  // for this case, this is because firefox uses Unified Plan and Chrome uses
  // Plan B. we have to remodify this a bit to let the non-ff detect as new mediastream
  // as chrome/opera/safari detects it as default due to missing ssrc specified as used in plan B.
  if (window.webrtcDetectedBrowser === 'firefox' && agent.name !== 'firefox' &&
    //pc.remoteDescription.sdp.indexOf('a=msid-semantic: WMS *') === -1 &&
    updatedSdp.indexOf('a=msid-semantic:WMS *') > 0) {
    // start parsing
    var sdpLines = updatedSdp.split('\r\n');
    var streamId = '';
    var replaceSSRCSemantic = -1;
    var i;
    var trackId = '';

    var parseTracksSSRC = function (track) {
      for (i = 0, trackId = ''; i < sdpLines.length; i++) {
        if (!!trackId) {
          if (sdpLines[i].indexOf('a=ssrc:') === 0) {
            var ssrcId = sdpLines[i].split(':')[1].split(' ')[0];
            sdpLines.splice(i+1, 0, 'a=ssrc:' + ssrcId +  ' msid:' + streamId + ' ' + trackId,
              'a=ssrc:' + ssrcId + ' mslabel:default',
              'a=ssrc:' + ssrcId + ' label:' + trackId);
            break;
          } else if (sdpLines[i].indexOf('a=mid:') === 0) {
            break;
          }
        } else if (sdpLines[i].indexOf('a=msid:') === 0) {
          if (i > 0 && sdpLines[i-1].indexOf('a=mid:' + track) === 0) {
            var parts = sdpLines[i].split(':')[1].split(' ');

            streamId = parts[0];
            trackId = parts[1];
            replaceSSRCSemantic = true;
          }
        }
      }
    };

    parseTracksSSRC('video');
    parseTracksSSRC('audio');

    /*if (replaceSSRCSemantic) {
      for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].indexOf('a=msid-semantic:WMS ') === 0) {
          var parts = sdpLines[i].split(' ');
          parts[parts.length - 1] = streamId;
          sdpLines[i] = parts.join(' ');
          break;
        }
      }

    }*/
    updatedSdp = sdpLines.join('\r\n');

    log.debug([targetMid, 'RTCSessionDesription', 'answer', 'Parsed remote description from firefox'], sdpLines);
  }

  return updatedSdp;
};
window.Skylink = Skylink;
}).call(this);
