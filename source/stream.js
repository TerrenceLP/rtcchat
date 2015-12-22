/**
 * @class Stream
 * @constructor
 * @param {Any} [options] The configuration options. If MediaStream
 *   object is provided, it will just parse the information. Else
 *   if provided object is invalid or when there is no options is provided,
 *   it will be indicated as <code>{ audio: true, video: true }</code>.
 * @param {Any} [options.audio=false] The audio configuration.
 * @param {Boolean} [options.audio.stereo=true] The configuration flag
 *   that indicates if stereo should be enabled for OPUS call.
 * @param {Boolean} [options.audio.mute=false] The configuration flag
 *   that indicates if retrieved MediaStream audio should be muted.
 * @param {Array} [options.audio.optional] The audio MediaStreamConstraint
 *   optional field.
 * @param {Any} [options.video=false] The video configuration.
 * @param {JSON} [options.video.resolution] The video maximum resolution
 *   configuration.
 * @param {Number} [options.video.resolution.height=640] The video
 *   maximum resolution for height.
 * @param {Number} [options.video.resolution.width=480] The video
 *   maximum resolution for width.
 * @param {Number} [options.video.frameRate] The video maximum frameRate configuration.
 *   If invalid values is provided, it will go to <code>50</code>.
 * @param {Boolean} [options.video.screenshare=false] The configuration flag
 *   that indicates if video should be a screensharing video. Note that this will
 *   override all the resolution, frameRate and optional settings.
 * @param {Boolean} [options.video.mute=false] The configuration flag
 *   that indicates if retrieved MediaStream video should be muted.
 * @param {Array} [options.video.optional] The video MediaStreamConstraint
 *   optional field.
 * @param {Boolean} [options.audioFallback=false] The configuration flag if
 *   audio fallback should be performed if request for the
 *   retrieval of (video+audio) fails.
 * @private
 * @since 0.6.7
 */
var Stream = function (options) {
  // Hook events
  SkylinkEvent._mixin(this);

  // Hook logging
  Logger.mixin(function () {
    return ['<<Stream>>', '(' + (this.id || '-') + ')'];
  }, this);

  // Parse all the browser video supports
  this._parseVideoSupports();

  // Preset to defaults
  // Preset to default for audio settings
  this.audio.options = false;
  this.audio.constraints = false;
  this.audio.muted = false;
  // Preset to default for video settings
  this.video.options = false;
  this.video.constraints = false;
  this.video.muted = false;
  // Preset to default for audio fallback
  this.audioFallback = false;

  // Check if it is an external MediaStream object provided.
  var externalStream = false;

  // Make checks for Chrome/Firefox/Opera usecase
  if (typeof options === 'object' && options !== null) {
    if (options.constructor && ['MediaStream', 'LocalMediaStream'].indexOf(options.constructor.name) > -1) {
      externalStream = true;
    }
  } else if (typeof options === 'function' && ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
    externalStream = true;
  }

  if (externalStream) {
    this._parseMediaStreamObject(options);
    return;
  }

  // Parse normal options
  var parseOptions = {};

  if (typeof options === 'object' && options !== null) {
    parseOptions = clone(options);
  } else {
    parseOptions = {
      audio: true,
      video: true
    };
  }

  // Starting parsing data
  this._parseAudioOptions(parseOptions.audio);
  this._parseVideoOptions(parseOptions.video);

  // Start parsing for individual items
  // Parse for audioFallback settings
  if (typeof parseOptions.audioFallback === 'boolean') {
    this.audioFallback = parseOptions.audioFallback;
  }

  this._log.info('Stream settings has been initialized and ready for fetching', options);
};

/**
 * Stores the Stream object ID.
 * @attribute id
 * @type String
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.id = null;

/**
 * Stores the Stream audio settings.
 * @attribute audio
 * @type JSON
 * @param {Any} [options=false] The audio configuration.
 * @param {Any} [constraints=false] The audio MediaStreamConstraints.
 * @param {Boolean} [muted=false] The audio muted status.
 * @parma {Boolean} [stereo=true] The audio stereo configuration.
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.audio = {
  options: false,
  constraints: false,
  muted: false,
  stereo: true // use OPUS
};

/**
 * Stores the Stream video settings.
 * @attribute video
 * @type JSON
 * @param {Any} [options=false] The video configuration.
 * @param {Any} [constraints=false] The audio configuration.
 * @param {Boolean} [muted=false] The video muted status.
 * @param {JSON} supports The video MediaStreamConstraints supports.
 * @param {Boolean} [newWHA=false] The flag that indicates if
 *   <code>{ height: { min: MIN_HEIGHT, max: MAX_HEIGHT } }</code>
 *   format is supported in this browser.
 * @param {Boolean} [screenshare=false] The flag that indicates if
 *   screensharing functionality is available in this browser.
 * @param {Boolean} [frameRate=true] The flag that indicates if
 *   frameRate MediaStreamConstraint option is supported in
 *   this browser.
 * @param {Boolean} [screenshareBundleAudio=false] The flag that indicates if
 *   screensharing MediaStream received supports the bundle with
 *   the audio MediaStreamConstraint.
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.video = {
  options: false,
  constraints: false,
  muted: false,
  supports: {
    newWHA: false,
    screenshare: false,
    frameRate: true,
    screenshareBundleAudio: false
  }
};

/**
 * The flag that indicates if Stream should just only request
 *   (audio) as fallback when (video+audio) request fails.
 * @attribute audioFallback
 * @type Boolean
 * @default false
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.audioFallback = false;

/**
 * The flag that indicates if Stream is initialized with
 *   custom MediaStream object provided as options in constructor.
 * @attribute external
 * @type Boolean
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.external = false;

/**
 * Stores the MediaStream object reference.
 * @attribute _ref
 * @type MediaStream
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._ref = null;

/**
 * Stores the MediaStream that contains the cloned
 *   screensharing video for Chrome object reference
 * @attribute _refClone
 * @type MediaStream
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._refClone = null;

// These will be overwritten at mixin level, but for documentation purposes
Stream.prototype.listeners = {
  on: {
    /**
     * MediaStream object has started and is ready to be used.
     * @event started
     * @param {String} id The stream class object ID.
     * @for Stream
     * @since 0.6.7
     */
    started: [],

    /**
     * MediaStream object has ended.
     * @event ended
     * @param {String} id The MediaStream object ID.
     * @for Stream
     * @since 0.6.7
     */
    ended: [],

    /**
     * Retrieval for MediaStream object failed.
     * @event error
     * @param {Error} error The exception object received.
     * @param {Boolean} [isAudioFallback=false] The flag that indicates
     *   if the error is a failure of audio fallbacking.
     * @for Stream
     * @since 0.6.7
     */
    error: [],

    /**
     * MediaStreamTrack has ended.
     * @event trackEnded
     * @param {String} id The MediaStream object ID.
     * @param {String} trackId The MediaStreamTrack ID.
     * @param {String} trackKind The kind of MediaStreamTrack - "audio" or "video".
     * @for Stream
     * @since 0.6.7
     */
    trackEnded: [],

    /**
     * MediaStreamTrack has been disrupted.
     * @event trackDisrupted
     * @param {Boolean} disrupted The flag that indicates if
     *   the current MediaStreamTrack object is disrupted.
     * @param {String} id The MediaStream object ID.
     * @param {String} trackId The MediaStreamTrack ID.
     * @param {String} trackKind The kind of MediaStreamTrack - "audio" or "video".
     * @for Stream
     * @since 0.6.7
     */
    trackDisrupted: [],

    /**
     * MediaStream audio MediaStreamTracks has been muted.
     * @event audioMuted
     * @param {Boolean} muted The flag that indicates if
     *   the current MediaStream audio MediaStreamTracks have been muted.
     * @param {String} id The MediaStream object ID.
     * @for Stream
     * @since 0.6.7
     */
    audioMuted: [],

    /**
     * MediaStream video MediaStreamTracks has been muted.
     * @event videoMuted
     * @param {Boolean} muted The flag that indicates if
     *   the current MediaStream video MediaStreamTracks have been muted.
     * @param {String} id The MediaStream object ID.
     * @for Stream
     * @since 0.6.7
     */
    videoMuted: []
  }
};

/**
 * Parses the video height, width and aspectRatio MediaStreamConstraints
 *   based on the format support that browser has.
 * @method _parseVideoWHAConstraint
 * @param {String} key The constraint key - "width", "height" or "aspectRatio".
 * @param {String} type The constraint type - "min" or "max".
 * @param {Any} value The constraint value for the constraint key and type.
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._parseVideoWHAConstraint = function (key, type, value) {
  var setVal = false;

  if (key === 'aspectRatio') {
    if (typeof value === 'string') {
      try {
        var ratio = value.split(':');
        var w = parseInt(ratio[0], 10);
        var h = parseInt(ratio[1], 10);

      } catch (error) {
        this._log.error('Failed parsing aspectRatio values', error);
      }
    }
  }

  if (this.video.supports.newWHA) {
    // Redefine it first
    if (!this.video.constraints.mandatory[key]) {
      this.video.constraints.mandatory[key] = {};
    }
    this.video.constraints.mandatory[key][type] = value;
  } else {
    var newKey = key[0].toUpperCase() + key.substring(1, key.length);
    this.video.constraints.mandatory[type + newKey] = value;
  }

  this._log.debug('Parsed "' + type + '" of "' + key + '" for video MediaStreamConstraints with', value);
};

/**
 * Parses the video MediaStreamConstraints supports.
 * @method _parseVideoSupports
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._parseVideoSupports = function () {
  // Firefox supports video: { height: { min: ..., max: ... } }
  if (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion > 38) {
    this.video.supports.newWHA = false;
  }

  // Opera does not support screensharing yet
  if (['chrome', 'firefox'].indexOf(window.webrtcDetectedBrowser) > -1) {
    this.video.supports.screenshare = true;
    this._log.warn('This browsers supports screensharing but requires skylink extension installed');

  } else if (['safari', 'IE'].indexOf(window.webrtcDetectedBrowser) > -1) {
    var hasFeature = !!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature;
    var isAvailable = !!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable;
    this.video.supports.screenshare = hasFeature && isAvailable;
    this._log.warn('Plugin screensharing support',
      { feature: hasFeature, available: isAvailable, enabled: hasFeature && isAvailable });

  } else {
    this._log.warn('This browser does not support screensharing');
  }

  // Setting maxFrameRate causes issue in plugin browsers
  if (['safari', 'IE'].indexOf(window.webrtcDetectedBrowser) - 1) {
    this.video.supports.frameRate = true;
  }

  // Setting the support if screensharing bundle audio
  // { video:{ mediaScreen: 'window' }, audio: true }
  if (window.webrtcDetectedBrowser === 'firefox') {
    this.video.supports.screenshareBundleAudio = true;
  }

  this._log.log('Parsed video supports', this.video.supports);
};

/**
 * Parses the audio constraints and settings based on the options provided.
 * @method _parseAudioOptions
 * @param {Any} [options] The audio options provided.
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._parseAudioOptions = function (options) {
  if (options === null) {
    this._log.warn('Provided options for audio is null. Ignoring settings.');
    return;

  } else if (typeof options === 'object') {
    this.audio.options = {};
    this.audio.options.stereo = this.audio.stereo;
    this.audio.constraints = {};

    if (typeof options.stereo === 'boolean') {
      this.audio.options.stereo = options.stereo;
      this.audio.stereo = options.stereo;
    }

    if (Array.isArray(options.optional)) {
      this.audio.options.optional = options.optional;
      this.audio.constraints.optional = options.optional;
    }

    if (typeof options.mute === 'boolean') {
      this.audio.muted = options.mute;
    }

  } else if (typeof options === 'boolean') {
    this.audio.options = options;
    this.audio.constraints = options;

    if (this.audio.options) {
      this.audio.options = {};
      this.audio.options.stereo = this.audio.stereo;
    }
  }

  this._log.log('Parsed audio settings', this.audio);
};

/**
 * Parses the video constraints and settings based on the options provided.
 * @method _parseVideoOptions
 * @param {Any} [options] The video options provided.
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._parseVideoOptions = function (options) {
  if (options === null) {
    this._log.warn('Provided options for video is null. Ignoring settings.');
    return;

  } else if (typeof options === 'object') {
    this.video.options = {
      screenshare: false
    };
    this.video.constraints = {
      mandatory: {}
    };

    if (typeof options.resolution === 'object') {
      this.video.options.resolution = {
        width: 640,
        height: 480
      };

      if (typeof options.resolution.width === 'number' && options.resolution.width > 0) {
        this.video.options.resolution.width = options.resolution.width;
      }

      if (typeof options.resolution.height === 'number' && options.resolution.height > 0) {
        this.video.options.resolution.height = options.resolution.height;
      }

      this._parseVideoWHAConstraint('width', 'max', this.video.options.resolution.width);
      this._parseVideoWHAConstraint('height', 'max', this.video.options.resolution.height);

      // setting minWidth / minHeight causes issue in plugin browsers
      // NOTE: uncommenting out as this is causing an issue somehow
      /*if (window.webrtcDetectedBrowser !== 'safari' && window.webrtcDetectedBrowser !== 'IE') {
        this._parseVideoWHAConstraint('width', 'min', this.video.options.resolution.width);
        this._parseVideoWHAConstraint('height', 'min', this.video.options.resolution.height);
      }*/
    }

    if (typeof options.frameRate === 'number') {
      // Check if supported first
      if (this.video.supports.frameRate) {
        this.video.options.frameRate = 50;

        if (options.frameRate > 0) {
          this.video.options.frameRate = options.frameRate;
        }

        this.video.constraints.mandatory.maxFrameRate = this.video.options.frameRate;
        // NOTE: uncommenting out as this is causing an issue somehow
        // this.video.constraints.mandatory.minFrameRate = this.video.options.frameRate;
      }
    }

    if (typeof options.screenshare === 'boolean') {
      if (options.screenshare) {
        this.video.options = { screenshare: true };
        this.video.constraints = {
          mediaSource: 'window'
        };
      }
    }

    if (Array.isArray(options.optional)) {
      this.video.options.optional = options.optional;
      this.video.constraints.optional = options.optional;
    }

    if (typeof options.mute === 'boolean') {
      this.video.muted = options.mute;
    }

  } else if (typeof options === 'boolean') {
    this.video.options = options;
    this.video.constraints = options;

    if (this.video.options) {
      this.video.options = {};
      this.video.options.screenshare = false;
    }
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    // just incase, because edge may not have support for constraints yet
    if (!!this.video.options) {
      this.video.constraints = true;
    }
  }

  this._log.log('Parsed video settings', this.video);
};

/**
 * Parses the external MediaStream object provided in constructor as options.
 * @method _parseMediaStreamObject
 * @param {MediaStream} stream The provided external MediaStream object.
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._parseMediaStreamObject = function (stream) {
  // Check if the stream has the following methods, or else it's fake (invalid)
  if (typeof stream.getAudioTracks !== 'function' && typeof stream.getVideoTracks !== 'function') {
    var invalidStreamError = 'Failed initializing Stream. Provided MediaStream object is invalid';
    this._log.error(invalidStreamError, stream);
    throw new Error(invalidStreamError);
  }

  var audioTracks = stream.getAudioTracks();
  var videoTracks = stream.getVideoTracks();

  // Loop out all audio tracks
  for (var a = 0; a < audioTracks.length; a++) {
    var at = audioTracks[a];

    // Firstly, check if audio tracks is available and used
    if (!this.audio.options) {
      // readyState is implemented by chrome/opera
      if (!at.ended && at.readyState !== 'ended') {
        this.audio.options = {};
        this.audio.options.stereo = this.audio.stereo;
        this.audio.constraints = true;
        this.audio.muted = true;
      }
    }

    // If there is audio available
    if (this.audio.options) {
      // Check if there is any active tracks
      if (at.enabled) {
        this.audio.muted = false;
        break;
      }
    }
  }

  // Loop out all video tracks
  for (var v = 0; v < videoTracks.length; v++) {
    var vt = videoTracks[v];

    // Firstly, check if video tracks is available and used
    if (!this.video.options) {
      // readyState is implemented by chrome/opera
      if (!vt.ended && vt.readyState !== 'ended') {
        this.video.options = { screenshare: false };
        this.video.constraints = true;
        this.video.muted = true;
      }
    }

    // If there is video available
    if (this.video.options) {
      // Check if there is any active tracks
      if (vt.enabled) {
        this.video.muted = false;
        break;
      }
    }
  }

  if (!this.audio.options && !this.video.options) {
    var inactiveTracksError = 'Failed initializing Stream. Provided MediaStream has no active tracks';
    this._log.error(inactiveTracksError, stream);
    throw new Error(inactiveTracksError);
  }

  this.external = true;
  this._listenToMediaStreamObject(stream);

  this._log.debug('Parsed external MediaStream object with audio options', this.audio);
  this._log.debug('Parsed external MediaStream object with video options', this.video);
  this._log.info('Stream has been initialized with provided MediaStream object and is ready to use');
};

/**
 * Listens to MediaStream object events.
 * @method _listenToMediaStreamObject
 * @param {MediaStream} stream The MediaStream object to handle.
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._listenToMediaStreamObject = function (stream) {
  var self = this;
  var browsersTrackEndedSupport = ['chrome', 'opera'];

  self._ref = stream;
  self.id = stream.id;

  // Get all the tracks to append or subscribe events to
  var tracks = stream.getAudioTracks().concat(stream.getVideoTracks());

  // Handlers
  // Handler for track .onended event
  var ontrackendedHandler = function (track) {
    return function () {
      self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack has ended');
      self._trigger('trackEnded', stream.id, track.id, track.kind);
    };
  };
  // Handler for track .onmute / .onunmute event
  var ontrackdisruptedHandler = function (track, disrupted) {
    return function () {
      self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack has been disrupted ->', disrupted);
      self._trigger('trackDisrupted', disrupted, stream.id, track.id, track.kind);
    };
  };
  // Handler for stream .onended event
  var onendedHandler = function () {
    // These browsers does not support MediaStreamTrack.onended event
    if (browsersTrackEndedSupport.indexOf(window.webrtcDetectedBrowser) === -1) {
      tracks.forEach(function(track) {
        ontrackendedHandler(track);
      });
    }
    self._log.debug('MediaStream has ended');
    self._trigger('ended', stream.id);
  };

  // Make subscriptions for MediaStream.onended event
  // Make checks for Firefox as firefox does not have .onended event but
  // can be checked against with .currentTime looping.
  if (window.webrtcDetectedBrowser === 'firefox') {
    stream.onendedInterval = setInterval(function () {
      if (typeof stream.recordedTime === 'undefined') {
        stream.recordedTime = 0;
      }

      if (stream.recordedTime !== stream.currentTime) {
        stream.recordedTime = stream.currentTime;

      } else {
        self._log.debug('LocalMediaStream has currentTime has stopped. Triggering ended event');
        clearInterval(stream.onendedInterval);
        onendedHandler();
      }
    }, 1000);
  } else {
    stream.onended = onendedHandler;
  }

  // Make subscriptions for MediaStreamTrack.onended / .onmute / .onunmute event
  tracks.forEach(function (track) {
    if (browsersTrackEndedSupport.indexOf(window.webrtcDetectedBrowser) > -1) {
      track.onended = ontrackendedHandler(track);
      self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack ended event is listened');
    }

    // Make subscription for MediaStreamTrack.onmute / .onunmute event if supported
    if (typeof track.muted === 'boolean') {
      track.onmute = ontrackdisruptedHandler(track, true);
      track.onunmute = ontrackdisruptedHandler(track, false);
      self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack disruption events is listened');
    }

    self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack events is listened');
  });

  self._log.log('MediaStream events is listened');
};

/**
 * Fetches the MediaStream object for non-screensharing.
 * @method _fetchUserMediaStreamObject
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._fetchUserMediaStreamObject = function () {
  var self = this;
  var constraints = {
    audio: self.audio.constraints,
    video: self.video.constraints
  };

  self._log.debug('Retrieving MediaStream object based off the following constraints', constraints);

  window.navigator.getUserMedia(constraints, function (stream) {
    self._log.log('Retrieved MediaStream object', stream);
    self._listenToMediaStreamObject(stream);

  }, function (error) {
    self._log.error('Failed retrieving MediaStream object based off the following constraints', constraints, error);

    // Check if audio fallback is enabled and available
    if (constraints.video && constraints.audio && self._audioFallback) {
      // Updated constraints
      var updatedConstraints = {
        audio: self.audio.constraints
      };

      self._log.warn('Retrying retrieval of MediaStream object with audio fallback with ' +
        'the following constraints', updatedConstraints);
      // Trigger the event
      self._trigger('fallback', error, true);

      // Do an audio fallback here
      window.navigator.getUserMedia(updatedConstraints, function (stream) {
        self._log.log('Retrieved audio fallback MediaStream object', stream);
        self._listenToMediaStreamObject(stream);

      }, function (audioFallbackError) {
        self._log.error('Failed retrieving audio fallback MediaStream object based off the following constraints',
          updatedConstraints, audioFallbackError);
        // Trigger the error for the audio fallback
        self._trigger('error', error, true);
      });
    } else {
      // Trigger the error because there is no fallback available or enabled
      self._trigger('error', error, false);
    }
  });
};

/**
 * Fetches the MediaStream object for screensharing.
 * @method _fetchScreensharingMediaStreamObject
 * @private
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype._fetchScreensharingMediaStreamObject = function () {
  var self = this;
  var constraints = {
    video: self.video.constraints
  };

  if (self.video.supports.screenshareBundleAudio) {
    constraints.audio = self.audio.constraints;
    self._log.debug('Bundling MediaStream audio constraints', constraints);
  }

  self._log.debug('Retrieving screensharing MediaStream object based off the following constraints', constraints);

  window.navigator.getUserMedia(constraints, function (videoStream) {
    self._log.log('Retrieved screensharing MediaStream object', videoStream);

    if (self.video.supports.screenshareBundleAudio) {
      self._log.debug('Ignoring retrieval of audio MediaStream object as this supports bundling of audio ' +
        'in screensharing stream');
      self._listenToMediaStreamObject(videoStream);
      return;
    }

    var audioConstraints = self.audio.constraints;

    var videoFallback = function (error) {
      self._trigger('fallback', error, false);
      self._log.warn('Proceeding screensharing stream without audio');
      self._listenToMediaStreamObject(videoStream);
    };

    // Get and retrieve the audio stream track
    window.navigator.getUserMedia(audioConstraints, function (audioStream) {
      self._log.log('Retrieved audio MediaStream object', videoStream);
      self._log.debug('Proceeding to attach screensharing MediaStream video track to audio MediaStream object');

      try {
        audioStream.addTrack(videoStream.getVideoTracks()[0]);
        self._log.debug('Attached screensharing MediaStream video track to audio MediaStream object');
        // Attach the reference clone
        self._refClone = videoStream;
        self._listenToMediaStreamObject(audioStream);

      } catch (audioAttachError) {
        self._log.error('Failed attaching screensharing MediaStream video track to audio MediaStream object',
          audioAttachError);
        // Trigger fallback to screensharing video event
        videoFallback(audioAttachError);
      }

    }, function (audioRetrievalError) {
      self._log.error('Failed retrieving audio MediaStream object based off the following constraints',
        audioConstraints, audioRetrievalError);
      // Trigger fallback to screensharing video event
      videoFallback(audioRetrievalError);
    });

  }, function (error) {
    self._log.error('Failed retrieving screensharing MediaStream object based off the following constraints',
      constraints, error);
    self._trigger('error', error, false);
  });
};

/**
 * Fetches the MediaStream object based on the options configured.
 * @method fetch
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.fetch = function () {
  var self = this;

  if (self._ref && self._ref !== null) {
    self._log.debug('Ignoring retrieval of stream as object is already defined');
    return;
  }

  // Select the case for screensharing
  if (self.video.options && self.video.options.screenshare === true) {
    if (self.video.supports.screenshareBundleAudio) {
      var ssBundleConstraints = {
        video: self.video.constraints,
        audio: self.audio.constraints
      };
      getMedia(ssBundleConstraints, function (stream) {
        self._log.debug('Retrieved screensharing stream successfully with the following constraints',
          ssBundleConstraints, stream.id);
        self._hookEvents(stream, true);
      });
    // Fallback for non-bundle
    } else {
      var ssVideoConstraints = {
        video: self.video.constraints
      };
      var ssAudioConstraints = {
        audio: self.audio.constraints
      };

      // Get screensharing video stream
      getMedia(ssVideoConstraints, function (streamClone) {
        self._log.debug('Retrieved screensharing video stream successfully with the following constraints',
          ssVideoConstraints, streamClone.id);

        // The internal method that handles the screensharing fallbacks
        var screensharingFallback = function (fallbackStream, error) {
          self._log.warn('Proceeding to fallback to sending only video track in screensharing stream');
          self._trigger('fallback', error, true);
          self._handleEvents(fallbackStream, true);
        };

        self._log.debug('Proceeding to retrieve screensharing audio stream', ssAudioConstraints);

        // Get screensharing audio stream
        getMedia(ssAudioConstraints, function (stream) {
          self._log.debug('Retrieved screensharing audio stream successfully with the following constraints',
            ssAudioConstraints, stream.id);

          self._log.debug('Proceeding to add screensharing video stream track to audio stream');

          // Append and addTrack of the video screensharing stream to the audio stream
          try {
            stream.addTrack(stream.getVideoTracks()[0]);
            self._log.debug('Attached screensharing video track to audio stream successfully');
            self._handleEvents(stream, true);
          } catch (error) {
            self._log.error('Failed attaching screensharing video track to audio stream', error);
            self._handleEvents(stream, false);
            screensharingFallback(streamClone, error);
          }
        }, function (error) {
          self._log.error('Failed retrieving screensharing audio stream with the following constraints',
            ssAudioConstraints, error);
          screensharingFallback(streamClone, error);
        });
      });
    }
    self._fetchScreensharingMediaStreamObject();
  } else {
    self._fetchUserMediaStreamObject();
  }

  self._log.log('Retrieving MediaStream object', {
    audio: self.audio.constraints,
    video: self.video.constraints
  });
};

/**
 * Stops the MediaStream object.
 * @method stop
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.stop = function () {
  var self = this;
  if (!self._ref || self._ref === null) {
    self._log.debug('Ignoring stopping of stream as object is not defined');
    return;
  }

  var browsersTrackStopSupport = ['chrome', 'opera', 'firefox'];

  if (browsersTrackStopSupport.indexOf(window.webrtcDetectedBrowser) > -1) {
    var tracks = self._ref.getAudioTracks().concat(self._ref.getVideoTracks());
    var cloneTracks = self._ref.getVideoTracks();

    // Stop _ref MediaStreamTracks object
    tracks.forEach(function (track) {
      self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack is stopping');
      track.stop();
    });

    // Stop _refClone MediaStreamTracks object
    cloneTracks.forEach(function (track) {
      self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'Cloned MediaStreamTrack is stopping');
      track.stop();
    });
  } else {
    // Stop _ref MediaStream object
    self._log.debug('MediaStream is stopping');
    self._ref.stop();
    // Stop _refClone MediaStream object
    self._log.debug('Cloned MediaStream is stopping');
    self._refClone.stop();
  }

  self._log.log('MediaStream has been stopped');
};

/**
 * Toggle mutes for audio.
 * @method toggleMuteAudio
 * @param {Boolean} [muted=false] The configuration flag that
 *   indicates if audio should be muted.
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.toggleMuteAudio = function (muted) {
  var self = this;
  if (!self._ref || self._ref === null) {
    self._log.debug('Ignoring updating of audio tracks muted status as MediaStream object is not defined', muted);
    return;
  }

  var audioTracks = self._ref.getAudioTracks();

  audioTracks.forEach(function (track) {
    track.enabled = muted;
    self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack audio muted status ->', muted);
  });

  self.audio.muted = muted;

  self._log.log('Updated audio MediaStreamTracks muted status ->', muted);
  self._trigger('audioMuted', muted, stream.id);
};

/**
 * Toggle mutes for video.
 * @method toggleMuteVideo
 * @param {Boolean} [muted=false] The configuration flag that
 *   indicates if video should be muted.
 * @for Stream
 * @since 0.6.7
 */
Stream.prototype.toggleMuteVideo = function (muted) {
  var self = this;
  if (!self._ref || self._ref === null) {
    self._log.debug('Ignoring updating of video tracks muted status as MediaStream object is not defined', muted);
    return;
  }

  var videoTracks = self._ref.getVideoTracks();
  var cloneVideoTracks = [];

  if (self._refClone && self._refClone !== null) {
    cloneVideoTracks = self._refClone.getVideoTracks();
  }

  videoTracks.forEach(function (track) {
    track.enabled = muted;
    self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'MediaStreamTrack video muted status ->', muted);
  });

  cloneVideoTracks.forEach(function (track) {
    track.enabled = muted;
    self._log.debug('-> (' + track.id + ':' + track.kind + ')', 'Cloned MediaStreamTrack muted status ->', muted);
  });

  self.video.muted = muted;

  self._log.log('Updated video MediaStreamTracks muted status ->', muted);
  self._trigger('videoMuted', muted, stream.id);
};