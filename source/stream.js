//// HANDLES THE STREAMS
//// -- PRIVATE METHODS -----------------------------------------------------
/**
 * Stores the list of streams.
 * @attribute _streams
 * @type JSON
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._streams = {
  stream: null,
  screensharing: null
};

/**
 * Parses the stream settings.
 * @method _parseStreamConfig
 * @private
 * @since 0.6.8
 * @for Skylink
 */
Skylink.prototype._parseStreamConfig = function (options, isScreensharing) {
  var self = this;

  if (typeof options === 'object' && options !== null) {
    var settings = {};
    var constraints = {};

    // Parse video options
    // - If video option is object
    if (typeof options.video === 'object' && options !== null) {
      settings.video = {};
      constraints.video = {};




    // - If video option is boolean
    } else if (typeof options.video === 'boolean') {
      settings.video = options.video;
      constraints.video = options.video;

    // - If video option is not boolean / object, default to false
    } else {
      settings.video = false;
      constraints.video = false;
    }

  // Default options if not valid object
  } else {
    self._streams.stream = {
      stream: null,
      settings: {
        audio: {
          stereo: true
        },
        video: true
      },
      constraints: {
        audio: true,
        video: true
      }
    };
  }
};



/**
 * Gets user media Stream
 */
Skylink.prototype.getUserMedia = function (options) {



};

Skylink.prototype.sendStream = function (options) {
  var self = this;
  var isStreamObject = false;

  // Make checks if it's a MediaStream object passed in (Firefox/Chrome/Opera)
  if (typeof options === 'object' && options !== null) {
    isStreamObject = options.constructor && ['MediaStream', 'LocalMediaStream']
      .indexOf(options.constructor.name) > -1;

  // Make checks if it's a MediaStream object passed in (Safari/IE)
  // MediaStream objects is interpreted as function via plugin
  } else if (typeof options === 'function' && ['IE', 'safari'].indexOf(self._user.agent.name) > -1) {
    isStreamObject = true;
  }

  // If provided object is a MediaStream object
  if (isStreamObject) {
    self._streams.stream = {
      stream: null
    };

    self._streams.stream.settings = self._streams.stream.constraints = {
      audio: true,
      video: true
    };

    self._parseStream(options, false);

  } else {
    self._setStreamConfig(options, false);
  }


};

