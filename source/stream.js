/**
 * @class Stream
 * @constructor
 * @param {JSON} options The configuration options.
 * @private
 * @since 0.6.7
 */
var Stream = function (options) {
  // Stream ID
  this.id = null;

  // Stream audio tracks
  this.audio = {
    options: false,
    constraints: false,
    muted: false,
    stereo: true // use OPUS
  };

  // Stream video tracks
  this.video = {
    options: false,
    constraints: false,
    muted: false,
    supports: {
      newWHA: false,
      screenshare: false,
      frameRate: true
    }
  };

  // Stream audioFallback flag
  this.audioFallback = false;

  // Make checks if stream provided is an external stream
  // Stream is external flag
  this.externalStream = (function () {
    // Make checks for Chrome/Firefox/Opera usecase
    if (typeof options === 'object' && options !== null) {
      if (options.constructor && ['MediaStream', 'LocalMediaStream'].indexOf(options.constructor.name) > -1) {
        return true;
      }
    } else if (typeof options === 'function' && ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
      return true;
    }
    return false;
  })();

  // Stream MediaStream object reference
  this._ref = null;

  // Stream MediaStream clone object reference
  this._refClone = null;

  // Parse the video supports
  this._parseVideoSupports();

  // Hook events
  SkylinkEvent._mixin(this);


  // Parse external stream
  if (this.externalStream) {
    this._parseExternalStream(options);
    log.debug('Stream object has been initialized with provided MediaStream object', options);
  // Normal usecase
  } else {
    var parseOptions = {};

    if (typeof options === 'object' && options !== null) {
      parseOptions = clone(options);
    } else {
      parseOptions = {
        audio: true,
        video: true
      };
    }

    this._parseAudioOptions(parseOptions.audio);
    this._parseVideoOptions(parseOptions.video);

    log.debug('Stream settings has been initialized and ready for fetching', options);
  }
};

Stream.prototype._parseExternalStream = function (stream) {
  var self = this;

  if (typeof stream.getAudioTracks !== 'function' && typeof stream.getVideoTracks !== 'function') {
    var invalidStreamError = 'Failed initializing Stream. Provided MediaStream object is invalid';
    log.error(invalidStreamError, stream);
    throw new Error(invalidStreamError);
  }

  var audioTracks = stream.getAudioTracks();
  var videoTracks = stream.getVideoTracks();

  var checkTracks = function (type) {
    var methodName = 'get' + (type[0].toUpperCase() + type.substring(1, type.length)) + 'Tracks';
    var tracks = stream[methodName]();
    // check if audio tracks is available and used
    for (var i = 0; i < tracks.length; i++) {
      // readyState is implemented by chrome/opera
      if (!tracks[i].ended && tracks[i].readyState !== 'ended') {
        if (type === 'audio') {
          self[type].options = {};
          self[type].options.stereo = self[type].stereo;
          self[type].constraints = true;
        } else {
          self[type].options = { screenshare: false };
          self[type].constraints = true;
        }
      }
    }
    // check if audio tracks is muted
    if (self[type].options) {
      var hasActiveTrack = false;
      for (var a = 0; a < tracks.length; a++) {
        if (tracks[a].enabled === true) {
          hasActiveTrack = true;
          break;
        }
      }
      if (!hasActiveTrack) {
        self[type].muted = true;
      }
    }
  };

  checkTracks('audio');
  checkTracks('video');

  if (!self.audio.options && !self.video.options) {
    var inactiveTracksError = 'Failed initializing Stream. Provided MediaStream has no active tracks';
    log.error(inactiveTracksError, stream);
    throw new Error(inactiveTracksError);
  }

  self.externalStream = true;
  self._hookEvents(stream);
};

Stream.prototype._parseVideoWHAConstraint = function (key, type, value) {
  var setVal = false;

  if (key === 'aspectRatio') {
    if (typeof value === 'string') {
      try {
        var ratio = value.split(':');
        var w = parseInt(ratio[0], 10);
        var h = parseInt(ratio[1], 10);

      } catch (error) {
        log.error('Failed parsing aspectRatio values', error);
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
};

Stream.prototype._parseVideoSupports = function () {
  // Firefox supports video: { height: { min: ..., max: ... } }
  if (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion > 38) {
    this.video.supports.newWHA = false;
  }

  // Opera does not support screensharing yet
  if (window.webrtcDetectedBrowser === 'chrome' || window.webrtcDetectedBrowser === 'firefox') {
    this.video.supports.screenshare = true;
    log.warn('These browsers supports but requires screensharing extensions installed');

  } else if (window.webrtcDetectedBrowser === 'safari' || window.webrtcDetectedBrowser === 'IE') {
    var hasFeature = !!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature;
    var isAvailable = !!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable;
    this.video.supports.screenshare = hasFeature && isAvailable;
    log.warn('Plugin screensharing supports', { feature: hasFeature, available: isAvailable });

  } else {
    log.warn('This browser does not support screensharing');
  }

  // setting maxFrameRate causes issue in plugin browsers
  if (window.webrtcDetectedBrowser !== 'safari' && window.webrtcDetectedBrowser !== 'IE') {
    this.video.supports.frameRate = true;
  }
};

Stream.prototype._parseAudioOptions = function (options) {
  if (options === null) {
    log.warn('Provided options for audio is null. Ignoring settings.');
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
};

Stream.prototype._parseVideoOptions = function (options) {
  if (options === null) {
    log.warn('Provided options for video is null. Ignoring settings.');
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
        this.video.options.screenshare = true;
      }
      this.video.constraints = {
        mediaSource: 'window'
      };
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
};

Stream.prototype._hookEvents = function (stream) {
  var self = this;

  // polyfill stream.getTracks just incase it is not available
  if (typeof stream.getTracks !== 'function') {
    stream.getTracks = function () {
      var audioTracks = stream.getAudioTracks();
      var videoTracks = stream.getVideoTracks();
      return audioTracks.concat(videoTracks);
    };
  }

  var tracks = stream.getTracks();

  if (typeof stream.id === 'string') {
    self.id = stream.id;
  } else if (typeof stream.label === 'string') {
    self.id = stream.label;
  } else {
    self.id = Date.now();
  }

  var onEnded = function () {
    if (window.webrtcDetectedBrowser !== 'chrome' && window.webrtcDetectedBrowser !== 'opera') {
      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        log.debug(track.id + ':' + track.kind + ' has ended');
        self._trigger('trackEnded', track.id, track.kind);
      }
    }
    self._trigger('ended', self.id);
  };

  // Uses .oninactive event
  if (window.webrtcDetectedBrowser === 'chrome' || window.webrtcDetectedBrowser === 'opera') {
    stream.oninactive = onEnded;
  } else if (window.webrtcDetectedBrowser === 'firefox') {
    var streamOnInactive = setInterval(function () {
      if (typeof stream.recordedTime === 'undefined') {
        stream.recordedTime = 0;
      }
      // this indicates that the stream has stopped looping
      if (stream.recordedTime === stream.currentTime) {
        clearInterval(streamOnInactive);
        onEnded();
      } else {
        stream.recordedTime = stream.currentTime;
      }
    }, 1000);
  } else {
    stream.onended = onEnded;
  }

  for (var j = 0; j < tracks.length; j++) {
    self._hookTrackEvents(tracks[j]);
  }

  self._ref = stream;
  self._trigger('started', self.id);
};

Stream.prototype._hookTrackEvents = function (track) {
  var self = this;

  // Firefox as of I know, does not support onended event
  if (window.webrtcDetectedBrowser === 'chrome' || window.webrtcDetectedBrowser === 'opera') {
    track.onended = function () {
      log.debug(track.id + ':' + track.kind + ' has ended');
      self._trigger('trackEnded', track.id, track.kind);
    };
  }

  if (typeof track.muted === 'boolean') {
    track.onmute = function () {
      log.warn(track.id + ':' + track.kind + ' has been disrupted');
      self._trigger('trackDisrupted', track.id, track.kind, true);
    };
    track.onunmute = function () {
      log.warn(track.id + ':' + track.kind + ' has been undisrupted');
      self._trigger('trackDisrupted', track.id, track.kind, false);
    };
  }
};

Stream.prototype.fetch = function () {
  var self = this;
  var constraints = {
    audio: self.audio.constraints,
    video: self.video.constraints
  };

  if (self._ref && self._ref !== null) {
    log.debug('Ignoring retrieval of stream as object is already defined');
    return;
  }

  // For screensharing
  if (self.video.options && self.video.options.screenshare) {
    constraints.audio = false;

    if (self.audio.options && window.webrtcDetectedBrowser === 'firefox') {
      constraints.audio = self.audio.constraints;
    }

    window.navigator.getUserMedia(constraints, function (stream) {
      log.debug('Retrieved screensharing stream');

      if (window.webrtcDetectedBrowser !== 'firefox') {
        log.debug('Retrieving screensharing clone stream for audio');
        // Retrieve stream clone for audio
        var constraintsClone = {
          audio: self.audio.constraints
        };
        window.navigator.getUserMedia(constraintsClone, function (streamClone) {
          log.debug('Retrieved screensharing clone stream for audio');
          try {
            streamClone.addTrack(stream.getVideoTracks()[0]);
            self._refClone = stream;
            self._hookEvents(streamClone);

          } catch (errorAttachClone) {
            log.warn('Failed attaching video track to clone screensharing stream. ' +
              'Proceeding stream without audio.', errorAttachClone);
            self._refClone = streamClone;
            self._trigger('fallback', errorAttachClone);
            self._hookEvents(stream);
          }
        }, function (errorClone) {
          log.warn('Failed retrieving screensharing clone stream for audio. ' +
            'Proceeding stream without audio.', errorClone);
          self._trigger('fallback', errorClone);
          self._hookEvents(stream);
        });
      } else {
        self._hookEvents(stream);
      }
    }, function (error) {
      log.error('Failed retrieving screensharing stream', error);
      self._trigger('error', error);
    });
  } else {
    window.navigator.getUserMedia(constraints, function (stream) {
      log.debug('Retrieved stream');
      self._hookEvents(stream);
    }, function (error) {
      log.error('Failed retrieving stream', error);
      self._trigger('error', error);
    });
  }
};

Stream.prototype.stop = function () {
  if (!this._ref || this._ref === null) {
    log.debug('Ignoring stopping of stream as object is not defined');
    return;
  }

  if (window.webrtcDetectedBrowser === 'chrome' || window.webrtcDetectedBrowser === 'opera') {
    var tracks = this._ref.getTracks();
    var i;
    for (i = 0; i < tracks.length; i++) {
      tracks[i].stop();
    }

    if (this._refClone && this._refClone !== null) {
      var cloneTracks = this._refClone;
      for (i = 0; i < cloneTracks.length; i++) {
        var cloneTrack = cloneTracks[i];
        log.debug(cloneTrack.id + ':' + cloneTrack.kind + ' clone track is stopping.');
        cloneTracks[i].stop();
      }
    }

  } else {
    this._ref.stop();

    if (this._refClone && this._refClone !== null) {
      log.debug('Clone stream is stopping.');
      this._refClone.stop();
    }
  }
};

Stream.prototype.muteAudio = function () {
  if (!this._ref || this._ref === null) {
    log.debug('Ignoring muting of audio tracks as stream object is not defined');
    return;
  }

  if (this.audio.muted) {
    log.debug('Ignoring muting of audio tracks as stream object is muted already');
    return;
  }

  var tracks = this._ref.getAudioTracks();

  if (tracks.length === 0) {
    log.debug('Ignoring muting of audio tracks as audio tracks is not present in stream');
    return;
  }

  for (var i = 0; i < tracks.length; i++) {
    tracks[i].enabled = false;
    log.debug(tracks[i].id + ':audio has been muted');
    this._trigger('trackMuted', tracks[i].id, 'audio', true);
  }

  this.audio.muted = true;
};

Stream.prototype.muteVideo = function () {
  if (!this._ref || this._ref === null) {
    log.debug('Ignoring muting of video tracks as stream object is not defined');
    return;
  }

  if (this.video.muted) {
    log.debug('Ignoring muting of video tracks as stream object is muted already');
    return;
  }

  var tracks = this._ref.getVideoTracks();

  if (tracks.length === 0) {
    log.debug('Ignoring muting of video tracks as video tracks is not present in stream');
    return;
  }

  for (var i = 0; i < tracks.length; i++) {
    tracks[i].enabled = false;
    log.debug(tracks[i].id + ':video has been muted');
    this._trigger('trackMuted', tracks[i].id, 'video', true);
  }

  this.video.muted = true;
};

Stream.prototype.unmuteAudio = function () {
  if (!this._ref || this._ref === null) {
    log.debug('Ignoring unmuting of audio tracks as stream object is not defined');
    return;
  }

  if (!this.audio.muted) {
    log.debug('Ignoring unmuting of audio tracks as stream object is unmuted already');
    return;
  }

  var tracks = this._ref.getAudioTracks();

  if (tracks.length === 0) {
    log.debug('Ignoring unmuting of audio tracks as audio tracks is not present in stream');
    return;
  }

  for (var i = 0; i < tracks.length; i++) {
    tracks[i].enabled = true;
    log.debug(tracks[i].id + ':audio has been unmuted');
    this._trigger('trackMuted', tracks[i].id, 'audio', false);
  }

  this.audio.muted = false;
};

Stream.prototype.unmuteVideo = function () {
  if (!this._ref || this._ref === null) {
    log.debug('Ignoring unmuting of video tracks as stream object is not defined');
    return;
  }

  if (!this.video.muted) {
    log.debug('Ignoring unmuting of video tracks as stream object is unmuted already');
    return;
  }

  var tracks = this._ref.getVideoTracks();

  if (tracks.length === 0) {
    log.debug('Ignoring unmuting of video tracks as video tracks is not present in stream');
    return;
  }

  for (var i = 0; i < tracks.length; i++) {
    tracks[i].enabled = true;
    log.debug(tracks[i].id + ':video has been unmuted');
    this._trigger('trackMuted', tracks[i].id, 'video', false);
  }

  this.video.muted = false;
};