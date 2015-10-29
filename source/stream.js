/**
 * @class Strean
 * @constructor
 * @param {MediaStream|JSON} stream The MediaStream object to construct as a Stream class object.<br>
 *   If provided as a <i>JSON</i>, it will call for a new MediaStream object to construct a
 *   Stream class object.
 * @param {Boolean|JSON} [stream.audio=false] The audio settings for the Stream object.
 * @param {Boolean} [stream.audio.muted=false] The flag that indicates if audio track should be muted.
 * @param {Array} [stream.audio.optional=[]] The optional audio settings for the Stream object.<br>
 *   <small>Example: <code>optional: [{ sourceId: "xxxxx" }]</code></small>.
 * @param {Boolean|JSON} [stream.video=false] The video settings for the Stream object.
 * @param {Boolean} [stream.video.muted=false] The flag that indicates if video track should be muted.
 * @param {JSON} [stream.video.height] The video stream height settings.<br>
 *   This follows the constraints in <code>getUserMedia()</code>.<br>
 *   This fallbacks to <code>{ mandatory: { minHeight: 0, maxHeight: 1 }}</code> if it's not supported.
 * @param {Number} [stream.video.height.min] The minimum video stream height setting.
 * @param {Number} [stream.video.height.max] The maximum video stream height setting.
 * @param {JSON} [stream.video.width] The video stream width settings.<br>
 *   This follows the constraints in <code>getUserMedia()</code>.
 *   This fallbacks to <code>{ mandatory: { minWidth: 0, maxWidth: 1 }}</code> if it's not supported.
 * @param {Number} [stream.video.width.min] The minimum video stream width setting.
 * @param {Number} [stream.video.width.max] The maximum video stream width setting.
 * @param {JSON} [stream.video.aspectRatio] The video stream aspect ratio settings.<br>
 *   <em>This is experimental hence it's not advisable to use.</em><br>
 * @param {String} [stream.video.aspectRatio.min] The minimum video stream aspect ratio setting.<br>
 *   <small>Format: <code>"width:height"</code> <em>Example: <code>"4:3"</code></em></small>.
 * @param {String} [stream.video.aspectRatio.max] The maximum video stream aspect ratio setting.<br>
 *   <small>Format: <code>"width:height"</code> <em>Example: <code>"4:3"</code></em></small>.
 * @param {Array} [stream.video.optional=[]] The optional video settings for the Stream object.<br>
 *   <small>Example: <code>optional: [{ sourceId: "xxxxx" }]</code></small>.
 */
var Stream = function (stream) {

  'use strict';

  var self = this;

  log.debug('Passed object for constructing new Stream object', stream);

  if (typeof stream !== 'object' || stream === null) {
    throw new Error('Object passed in for constructing a new Stream object is invalid');
  }

  /**
   * The Stream class stream settings.
   * @attribute _streamSettings
   * @param {JSON} MediaStreamConstraints The MediaStreamConstraints to be passed into the
   *   <code>getUserMedia()</code> for a new MediaStream.
   * @param {JSON} [audio=false] The audio setting of the Stream class object passed into
   *   the constructor to get a new MediaStream object.
   * @param {JSON} [video=false] The video setting of the Stream class object passed into
   *   the constructor to get a new MediaStream object.
   * @type JSON
   * @private
   */
  self._streamSettings = {
    audio: false,
    video: false,
    MediaStreamConstraints: {}
  };

  //self.readyState = 'constructed';

  /**
   * The Stream MediaStream object reference.
   * @attribute _ref
   * @type MediaStream
   * @private
   */
  self._ref = null;

  /**
   * The list of audio StreamTrack objects in the Stream.
   * @attribute _audioTracks
   * @type JSON
   * @private
   */
  self._audioTracks = [];

  /**
   * The list of video StreamTrack objects in the Stream.
   * @attribute _videoTracks
   * @type JSON
   * @private
   */
  self._videoTracks = [];

  // Event hook to object for triggering
  Event.mixin(self);

  // Initialise the MediaStream object to handle events
  // Or get a new MediaStream object with getUserMedia
  if (typeof stream.getAudioTracks === 'function' && typeof stream.getVideoTracks === 'function') {
    self._construct(stream);
  } else {
    if (typeof stream.audio === 'object' || typeof stream.audio === 'boolean') {
      self._streamSettings.audio = stream.audio;
    }
    if (typeof stream.video === 'object' || typeof stream.video === 'boolean') {
      self._streamSettings.video = stream.video;
    }

    self._streamSettings.MediaStreamConstraints = self._parseConstraints(self._streamSettings);

    window.navigator.getUserMedia(self._streamSettings.MediaStreamConstraints, function (streamObj) {
      self._construct(streamObj);
    }, function (error) {
      throw error;
    });
  }
};

/**
 * Parses and inteprets the constraints to be passed into <code>getUserMedia()</code>
 * @method _parseConstraints
 * @param {JSON} constraints The constraints passed into the constructor to get a
 *   new MediaStream object.
 * @return {JSON} The output MediaStreamConstraints.
 */
Stream.prototype._parseConstraints = function (constaints) {
  var mediaStreamConstraints = {
    audio: false,
    video: false
  };

  if (constraints.audio) {
    if (typeof constraints.audio === 'object') {
      mediaStreamConstraints.audio = {};

      if (Array.isArray(constraints.audio.optional)) {
        mediaStreamConstraints.audio.optional = constraints.audio.optional;
      }
    } else {
      mediaStreamConstraints.audio = true;
    }
  }

  if (constraints.video) {
    if (typeof constraints.video === 'object') {
      mediaStreamConstraints.video = {};

      if (Array.isArray(constraints.video.optional)) {
        mediaStreamConstraints.video.optional = constraints.video.optional;
      }

      var useOlderSpecsWHA = true;

      // Chrome / Opera uses older specs still even though it's deprecated.
      // Safari still uses the older specs
      // Only Firefox 38+ uses the new one
      // Correct specs
      /*
        {
          height: { min: 123, max: 1234 },
          width: { min:23, max: 234 },
          aspectRatio: { min: '1:3', max: '3:4' }
        }
      */
      // NOTE: Could be updated
      if (window.webrtcDetectedBrowser === 'firefox' || window.webrtcDetectedVersion > 38) {
        useOlderSpecsWHA = false;
      }

      // Check the values passed into specs
      var checkSpecsWHAVal = function (key, type, value) {
        var error = null;
        var setVal = false;

        if (key === 'aspectRatio') {
          if (typeof value === 'string') {
            try {
              var ratio = value.split(':');
              var w = parseInt(ratio[0], 10);
              var h = parseInt(ratio[1], 10);

              if (typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0) {
                setVal = true;
              }
            } catch (errorObj) {
              error = errorObj;
            }
          }
        } else if (typeof value === 'number' && value > -1) {
          setVal = true;
        }

        if (setVal) {
          if (!useOlderSpecsWHA) {
            mediaStreamConstraints.video[key][type] = value;
          } else {
            var newKey = key[0].toUpperCase() + key.substring(1, key.length);
            if (typeof mediaStreamConstraints.video.mandatory !== 'object') {
              mediaStreamConstraints.video.mandatory = {};
            }
            mediaStreamConstraints.video.mandatory[type + newKey] = value;
          }
        } else {
          log.debug('Not setting string for video.' + key + '.' + type + ' as invalid or not found', value, error);
        }
      };

      // Since we have not moved to the latest adapterjs in https://github.com/webrtc/adapter/blob/master/adapter.js
      // as of October 28 (latest checked)
      // Move to minHeight / minWidth manually
      var convertToOlderSpecsWHA = function (key, specs) {
        if (typeof specs === 'object') {
          checkSpecsWHAVal(key, 'min', key.min);
          checkSpecsWHAVal(key, 'max', key.max);
        }
      };

      convertToOlderSpecsWHA('height', constraints.video.height);
      convertToOlderSpecsWHA('width', constraints.video.width);
      convertToOlderSpecsWHA('aspectRatio', constraints.video.aspectRatio);
    }
  }

  return mediaStreamConstraints;
};

/**
 * Listens the MediaStream events after being constructed.
 * @method _construct
 * @param {JSON} constraints The constraints passed into the constructor to get a
 *   new MediaStream object.
 * @return {JSON} The output MediaStreamConstraints.
 */
Stream.prototype._construct = function (stream) {
  var self = this;
  // Chrome M47 and above deprecations
  if (window.webrtcDetectedBrowser === 'chrome') {
    if (window.webrtcDetectedVersion > 36) {
      stream.oninactive = function () {
        // trigger ended here
      };
    } else {
      stream.onended = function () {
        // trigger ended here
      };
    }
  // firefox no trigger so it's okay
  //} else if (window.webrtcDetectedBrowser === 'firefox') {

  // opera 32 (do the other way. follows chrome)
  } else if (window.webrtcDetectedBrowser === 'opera') {
    if (window.webrtcDetectedVersion > 31) {
      stream.oninactive = function () {
        // trigger ended here
      };
    } else {
      stream.onended = function () {
        // trigger ended here
      };
    }
  // safari / IE uses .stop() only no deprecation
  } else {
    stream.onended = function () {
      // trigger ended here
    };
  }

  var audioTracks = stream.getAudioTracks();
  var videoTracks = stream.getVideoTracks();

  var i, j;

  for (i = 0; i < audioTracks.length; i++) {
    // construct new StreamTrack object
  }

  for (j = 0; j < videoTracks.length; j++) {
    // construct new StreamTrack object
  }
};

/*
// getAudioTracks function. Returns AudioStreamTrack objects.
Stream.prototype.getAudioTracks = function () {
  var self = this;

  return self._audioTracks;
};

// getVideoTracks function. Returns VideoStreamTrack objects.
Stream.prototype.getVideoTracks = function () {
  var self = this;

  return self._videoTracks;
};

// stop the stream itself.
Stream.prototype.stop = function () {
  var self = this;

  try {
    self._objectRef.stop();

  } catch (error) {
    // MediaStream.stop is not implemented.
    // Stop all MediaStreamTracks

    var i, j;

    for (i = 0; i < self._audioTracks.length; i += 1) {
      self._audioTracks[i].stop();
    }

    for (j = 0; j < self._videoTracks.length; j += 1) {
      self._videoTracks[j].stop();
    }
  }

  self.readyState = 'stopped';
  self.trigger('stopped', {});
};

// attach the video element with the stream
Stream.prototype.attachStream = function (dom) {
  var self = this;

  // check if IE or Safari
  // muted / autoplay is not supported in the object element
  if (window.webrtcDetectedBrowser === 'safari' ||
    window.webrtcDetectedBrowser === 'IE') {

    // NOTE: hasAttribute is only supported from IE 8 onwards
    if (dom.hasAttribute('muted')) {
      dom.removeAttribute('muted');
    }

    if (dom.hasAttribute('autoplay')) {
      dom.removeAttribute('autoplay');
    }
  }

  window.attachMediaStream(dom, self._objectRef);
};

// append listeners
Stream.prototype._appendListeners = function (mstream) {
  var self = this;

  self._objectRef = mstream;

  var i, j;

  var audioTracks = mstream.getAudioTracks();
  var videoTracks = mstream.getVideoTracks();

  for (i = 0; i < audioTracks.length; i += 1) {
    self._audioTracks[i] = new StreamTrack(audioTracks[i]);
  }

  for (j = 0; j < videoTracks.length; j += 1) {
    self._videoTracks[j] = new StreamTrack(videoTracks[j]);
  }

  self.readyState = 'streaming';
  self.trigger('streaming', {});
};

// initialise the stream object and subscription of events
Stream.prototype.start = function (constraints, mstream) {
  var self = this;

  // we don't manage the parsing of the stream.
  // just your own rtc getUserMedia stuff here :)
  self._constraints = constraints;

  // reset to null if undefined to have a fixed null if empty
  if (typeof self._constraints === 'undefined') {
    self._constraints = null;
  }

  if (typeof mstream === 'object' && mstream !== null) {

    if (typeof mstream.getAudioTracks === 'function' &&
      typeof mstream.getVideoTracks === 'function') {
      self._appendListeners(mstream);
      return;

    } else {
      return Util.throw(new Error('Provided mstream object is not a MediaStream object'));
    }

  } else {

    window.navigator.getUserMedia(self._constraints, function (mstreamrecv) {
      self._appendListeners(mstreamrecv);
    }, function (error) {
      // NOTE: throw is not support for older IEs (ouch)
      return Util.throw(error);
    });
  }
};*/