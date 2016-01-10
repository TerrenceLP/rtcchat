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

  var self = this;

  // Initialize objects
  self._socket = new SkylinkSocket();
  self._room = new SkylinkRoom();

  // Events
  // SkylinkSocket events
  self._socket.on('connect', function () {
    self._trigger('channelOpen');
  });

  self._socket.on('disconnect', function () {
    self._trigger('channelClose');
  });

  self._socket.on('message', function (message) {
    self._trigger('channelMessage');
    self._processSigMessage(message);
  });

  self._socket.on('connectError', function (state, error, transport) {
    self._trigger('socketError', state, error, transport);
  });

  self._socket.on('connectRetry', function (fallbackMethod, attempt) {
    self._trigger('channelRetry', fallbackMethod, attempt);
  });

  self._socket.on('error', function (error) {
    self._trigger('channelError', error);
  });
}

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
 * Helper function that generates an Unique ID (UUID) string.
 * @method generateUUID
 * @return {String} Generated Unique ID (UUID) string.
 * @example
 *    // Get Unique ID (UUID)
 *    var uuid = SkylinkDemo.generateUUID();
 * @for Skylink
 * @since 0.5.9
 */
Skylink.prototype.generateUUID = function() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
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

this.Skylink = Skylink;
