/**
 * Initialises and configures Skylink to begin any connection.
 * <b>NOTE</b> that this is the first method that has to be called before
 *   using any other functionalities other than debugging features like
 *   {{#crossLink "Skylink/setLogLevel:method"}}setLogLevel(){{/crossLink}} and
 *   {{#crossLink "Skylink/setDebugMode:method"}}setDebugMode(){{/crossLink}} and
 *   after all event subscriptions like {{#crossLink "Skylink/on:method"}}on(){{/crossLink}}
 *   or {{#crossLink "Skylink/once:method"}}once(){{/crossLink}} has been made.
 * This is where the Application Key is configured and attached to Skylink for usage.
 * @method init
 * @param {String|JSON} options The configuration settings for Skylink.
 *   If provided options is a <var>typeof</var> <code>string</code>, it will
 *   be interpreted as the Application Key being provided.
 * @param {String} options.appKey Previously known as <code>apiKey</code>.
 *   The Application Key that Skylink uses for initialising and connecting rooms.
 * @param {String} [options.defaultRoom=options.appKey] The default room that
 *   Skylink should connect to if there is no room provided in
 *   {{#crossLink "Skylink/joinRoom:method"}}joinRoom(){{/crossLink}}.
 *   If this value is not provided, the default room value would be
 *   the Application Key provided.
 * @param {String} [options.roomServer] The platform server URL that Skylink makes a
 *   <code>HTTP /GET</code> to retrieve the connection information required.
 *   This is a debugging feature, and it's not advisable to manipulate
 *     this value unless you are using a beta platform server.
 * @param {String} [options.region] <i>Deprecated feature</i>. The regional server that Skylink
 *    should connect to for fastest connectivity. [Rel: Skylink.REGIONAL_SERVER]
 * @param {Boolean} [options.enableIceTrickle=true] <i>Debugging Feature</i>.
 *    The flag that indicates if PeerConnections
 *    should enable trickling of ICE to connect the ICE connection. Configuring
 *    this value to <code>false</code> may result in a slower connection but
 *    a more stable connection.
 * @param {Boolean} [options.enableDataChannel=true] <i>Debugging feature</i>.
 *   The flag that indicates if PeerConnections
 *   should have any DataChannel connections. Configuring this value to <code>false</code>
 *   may result in failure to use features like
 *   {{#crossLink "Skylink/sendBlobData:method"}}sendBlobData(){{/crossLink}},
 *   {{#crossLink "Skylink/sendP2PMessage:method"}}sendP2PMessage(){{/crossLink}} and
 *   {{#crossLink "Skylink/sendURLData:method"}}sendURLData(){{/crossLink}} or any
 *   DataChannel connection related services.
 * @param {Boolean} [options.enableTURNServer=true] <i>Debugging feature</i>.
 *   The flag that indicates if PeerConnections connection should use any TURN server connection.
 *   Tampering this flag may disable any successful Peer connection
 *   that is behind any firewalls, so set this value at your own risk.
 * @param {Boolean} [options.enableSTUNServer=true] <i>Debugging feature</i>.
 *   The flag that indicates if PeerConnections connection should use any STUN server connection.
 *   Tampering this flag may cause issues to connections, so set this value at your own risk.
 * @param {Boolean} [options.forceTURN=false] The flag that indicates if PeerConnections connection
 *   should only use TURN server connection which enables a quicker connectivity.
 *   This configuration will override the settings for <code>enableTURNServer</code>
 *   and <code>enableSTUNServer</code> and set <code>enableTURNServer</code> as <code>true</code> and
 *   <code>enableSTUNServer</code> as <code>false</code> if the value is set to <code>true</code>.
 * @param {Boolean} [options.usePublicSTUN=true] The flag that indicates if PeerConnections connection
 *   should enable usage of public STUN server connection connectivity.
 *   This configuration would not work if <code>enableSTUNServer</code> is set to <code>false</code>
 *   or <code>forceTURN</code> is set to <code>true</code>.
 * @param {Boolean} [options.TURNServerTransport=Skylink.TURN_TRANSPORT.ANY] <i>Debugging feature</i>.
 *   The TURN server transport to enable for TURN server connections.
 *   Tampering this flag may cause issues to connections, so set this value at your own risk.
 *   [Rel: Skylink.TURN_TRANSPORT]
 * @param {JSON} [options.credentials] The credentials configured for starting a new persistent
 *   room meeting or connecting with Application Keys that do not use CORS authentication.
 *   Setting the <code>startDateTime</code> or the <code>duration</code> will not affect
 *   the actual duration for non persistent rooms. This feature would only affect connections with
 *   Application Keys that is configured for persistent room feature.
 *   To enable persistent room or disable CORS, you may set it in the developer console.
 *   CORS may be disabled by setting the platform to <code>"Other"</code>.
 * @param {String} options.credentials.startDateTime The room start datetime stamp in
 *   <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.
 *   This will start a new meeting based on the starting datetime stamp
 *   in the room that was selected to join for Application Key that is configured
 *   with persistent room feature. You may use
 *   <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString">
 *   Date.toISOString()</a> to retrieve ISO 8601 formatted date time stamp.
 *   The start date time of the room will not affect non persistent room connection.
 * @param {Number} options.credentials.duration The duration (in hours)
 *   that the room duration should be in. This will set the duration starting from
 *   the provided <code>startDateTime</code> onwards and after the duration is over,
 *   the meeting is over and the room is closed for Application Key that is
 *   configured with persistent room feature.
 *   The duration will not affect non persistent room connection.The duration of the meeting in hours.<br>
 *   <small>E.g. <code>0.5</code> for half an hour, <code>1.4</code> for 1 hour and 24 minutes</small>
 * @param {String} options.credentials.credentials The room credentials for Application Key.
 *   This is required for rooms connecting without CORS verification or starting a new persistent room meeting.<br><br>
 *   <u>To generate the credentials:</u><br>
 *   <ol>
 *   <li>Concatenate a string that consists of the room name
 *     the room meeting duration (in hours) and the start date timestamp (in ISO 8601 format).<br>
 *     <small>Format <code>room + "_" + duration + "_" + startDateTimeStamp</code></small></li>
 *   <li>Hash the concatenated string with the Application Key token using
 *     <a href="https://en.wikipedia.org/wiki/SHA-1">SHA-1</a>.
 *     You may use the <a href="https://code.google.com/p/crypto-js/#HMAC">CryptoJS.HmacSHA1</a> function to do so.<br>
 *     <small>Example <code>var hash = CryptoJS.HmacSHA1(concatenatedString, token);</code></small></li>
 *   <li>Convert the hash to a <a href="https://en.wikipedia.org/wiki/Base64">Base64</a> encoded string. You may use the
 *     <a href="https://code.google.com/p/crypto-js/#The_Cipher_Output">CryptoJS.enc.Base64</a> function
 *     to do so.<br><small>Example <code>var base64String = hash.toString(CryptoJS.enc.Base64); </code></small></li>
 *   <li>Encode the Base64 encoded string to a URI component using UTF-8 encoding with
 *     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent()</a>.<br>
 *     <small>Example <code>var credentials = encodeURIComponent(base64String);</code></small></li>
 *   </ol><br>
 * @param {Boolean} [options.audioFallback=false] The flag that indicates if there is a failure in
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}} in retrieving user media
 *   video stream, it should fallback to retrieve audio stream only. This would not work for
 *   {{#crossLink "Skylink/joinRoom:method"}}joinRoom(){{/crossLink}} except
 *   {{#crossLink "Skylink/getUserMedia:method"}}getUserMedia(){{/crossLink}}.
 * @param {Boolean} [options.forceSSL=false] The flag to enforce an SSL platform signaling and platform server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used. This flag is mostly used for self domain accessing protocol
 *   that is <code>http:</code> and enforcing the SSL connections for
 *   platform signaling and platform server connection.
 * @param {String} [options.audioCodec=Skylink.AUDIO_CODEC.AUTO] <i>Debugging Feature</i>.
 *   The preferred audio codec that Peer connection
 *   streaming audio codec should use in the connection when available. If not available, the default
 *   codec would be the browser generated session description selected codec. [Rel: Skylink.AUDIO_CODEC]
 * @param {String} [options.videoCodec=Skylink.VIDEO_CODEC.AUTO] <i>Debugging Feature</i>.
 *   The preferred video codec that Peer connection
 *   streaming video codec should use in the connection when available. If not available, the default
 *   codec would be the browser generated session description selected codec. [Rel: Skylink.VIDEO_CODEC]
 * @param {Number} [options.socketTimeout=20000] The timeout that the socket connection should throw a
 *   timeout exception when socket fails to receive a response from connection. Depending on
 *   the max retries left based on the availability of ports given by the platform server,
 *   the socket will reattempt to establish a socket connection with the signaling server.<br>
 *   The mininum timeout value is <code>5000</code>.
 * @param {Boolean} [options.forceTURNSSL=false] The flag to enforce an SSL TURN server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used. This flag is mostly used for self domain accessing protocol
 *   that is <code>http:</code> and enforcing the SSL connections for
 *   TURN server connection.
 * This will configure TURN server connection using port <code>443</code> only and
 *   if <code>turns:</code> protocol is supported, it will use <code>turns:</code> protocol.
 * @param {Function} [callback] The callback fired after Skylink has been
 *   initialised successfully or have met with an exception.
 *   The callback signature is <code>function (error, success)</code>.
 * @param {JSON} callback.error The error object received in the callback.
 *   If received as <code>null</code>, it means that there is no errors.
 * @param {Number} callback.error.errorCode The
 *   <a href="#attr_READY_STATE_CHANGE_ERROR">READY_STATE_CHANGE_ERROR</a>
 *   if there is an <a href="#event_readyStateChange">readyStateChange</a>
 *   event error that caused the failure for initialising Skylink.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @param {Object} callback.error.error The exception thrown that caused the failure
 *   for initialising Skylink.
 * @param {Number} callback.error.status The XMLHttpRequest status code received
 *   when exception is thrown that caused the failure for initialising Skylink.
 * @param {JSON} callback.success The success object received in the callback.
 *   If received as <code>null</code>, it means that there are errors.
 * @param {String} callback.success.appKey Previously known as <code>apiKey</code>.
 *   The Application Key that Skylink uses for initialising and connecting rooms.
 * @param {String} callback.success.defaultRoom The default room that
 *   Skylink should connect to if there is no room provided in
 *   <a href="#method_joinRoom">joinRoom()</a>.
 * @param {String} callback.success.roomServer The platform server URL that Skylink makes a
 *   <code>HTTP /GET</code> to retrieve the connection information required.
 * @param {Boolean} callback.success.enableIceTrickle The flag that indicates if PeerConnections
 *    should enable trickling of ICE to connect the ICE connection.
 * @param {Boolean} callback.success.enableDataChannel The flag that indicates if PeerConnections
 *   should have any DataChannel connections.
 * @param {Boolean} callback.success.enableTURNServer The flag that indicates if
 *   PeerConnections connection should use any TURN server connection.
 * @param {Boolean} callback.success.enableSTUNServer The flag that indicates if
 *   PeerConnections connection should use any STUN server connection.
 * @param {Boolean} callback.success.TURNServerTransport The TURN server transport
 *   to enable for TURN server connections.
 *   [Rel: Skylink.TURN_TRANSPORT]
 * @param {String} [callback.success.serverRegion] The regional server that Skylink
 *    should connect to for fastest connectivity. [Rel: Skylink.REGIONAL_SERVER]
 * @param {Boolean} callback.success.audioFallback The flag that indicates if there is a failure in
 *   <a href="#method_getUserMedia">getUserMedia()</a> in retrieving user media
 *   video stream, it should fallback to retrieve audio stream only.
 * @param {Boolean} callback.success.forceSSL The flag to enforce an SSL platform signaling and platform server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used.
 * @param {String} callback.success.audioCodec The preferred audio codec that Peer connection
 *   streaming audio codec should use in the connection when available. [Rel: Skylink.AUDIO_CODEC]
 * @param {String} callback.success.videoCodec The preferred video codec that Peer connection
 *   streaming video codec should use in the connection when available. [Rel: Skylink.VIDEO_CODEC]
 * @param {Number} callback.success.socketTimeout The timeout that the socket connection should throw a
 *   timeout exception when socket fails to receive a response from connection. Depending on
 *   the max retries left based on the availability of ports given by the platform server,
 *   the socket will reattempt to establish a socket connection with the signaling server.
 * @param {Boolean} callback.success.forceTURNSSL The flag to enforce an SSL TURN server connection.
 *   If self domain accessing protocol is <code>https:</code>, SSL connections
 *   would be automatically used.
 * This will configure TURN server connection using port <code>443</code> only and
 *   if <code>turns:</code> protocol is supported, it will use <code>turns:</code> protocol.
 * @param {Boolean} callback.success.forceTURN The flag that indicates if PeerConnections connection
 *   should only use TURN server connection which enables a quicker connectivity.
 *   This configuration will override the settings for <code>enableTURNServer</code>
 *   and <code>enableSTUNServer</code> and set <code>enableTURNServer</code> as <code>true</code> and
 *   <code>enableSTUNServer</code> as <code>false</code> if the value is set to <code>true</code>.
 * @param {Boolean} callback.success.usePublicSTUN The flag that indicates if PeerConnections connection
 *   should enable usage of public STUN server connection connectivity.
 *   This configuration would not work if <code>enableSTUNServer</code> is set to <code>false</code>
 *   or <code>forceTURN</code> is set to <code>true</code>.
 * @example
 *   // Note: Default room is appKey when no room
 *   // Example 1: To initalize without setting any default room.
 *   SkylinkDemo.init("YOUR_APP_KEY_HERE");
 *
 *   // Example 2: To initialize with appKey and defaultRoom
 *   SkylinkDemo.init({
 *     appKey: "YOUR_APP_KEY_HERE",
 *     defaultRoom: "mainHangout"
 *   });
 *
 *   // Example 3: To initialize with credentials to set startDateTime and
 *   // duration of the room
 *   var hash = CryptoJS.HmacSHA1(roomname + "_" + duration + "_" +
 *     (new Date()).toISOString(), token);
 *   var credentials = encodeURIComponent(hash.toString(CryptoJS.enc.Base64));
 *   SkylinkDemo.init({
 *     appKey: "YOUR_APP_KEY_HERE",
 *     defaultRoom: "mainHangout"
 *     credentials: {
 *        startDateTime: (new Date()).toISOString(),
 *        duration: 500,
 *        credentials: credentials
 *     }
 *   });
 *
 *   // Example 4: To initialize with callback
 *   SkylinkDemo.init("YOUR_APP_KEY_HERE", function(error,success){
 *     if (error){
 *       console.error("Init failed:", error);
 *     }
 *     else{
 *       console.info("Init succeed:", success);
 *     }
 *   });
 *
 * @trigger readyStateChange
 * @required
 * @component Room
 * @for Skylink
 * @since 0.5.5
 */
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
