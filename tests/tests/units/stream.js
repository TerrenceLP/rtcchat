'use strict';

var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;

// Custom timeouts for this tests
var proceedToNextCase = function (waitingTimeout) {
  if (window.webrtcDetectedBrowser !== 'safari' &&
    window.webrtcDetectedBrowser !== 'IE') {
    return waitingTimeout / 1000;
  }
  return waitingTimeout;
};

describe('Constructor', function () {

  before(function (done) {
    this.timeout(7500);
    var proceedToNext = 5
    AdapterJS.webRTCReady(function () {
      done();
    });
  });

  // Test the input constraints
  describe('new Stream ([JSON] constraints)', function () {
    var testCase = function (constraints) {
      it('Should pass when\n' + JSON.stringify(constraints), function () {
        var stream = new Stream(constraints);

        var expectedConstraints = {
          audio: {
            options: { stereo: true },
            constraints: true,
            muted: false,
            stereo: true
          },
          video: {
            options: { screenshare: false },
            constraints: true,
            muted: false
          }
        };

        // Stream initial variables state before .fetch()
        // stream.id
        expect(stream.id).to.be.null;
        // stream._ref
        expect(stream._ref).to.be.null;
        // stream._refClone
        expect(stream._refClone).to.be.null;

        // Parse the expected constraints
        if (typeof constraints === 'object' && constraints !== null) {
          // Parse the expected audio constraints
          if (typeof constraints.audio === 'object' && constraints.audio !== null) {
            expectedConstraints.audio.constraints = {};
            // Check if there is stereo
            if (typeof constraints.audio.stereo === 'boolean') {
              expectedConstraints.audio.options.stereo = expectedConstraints.audio.stereo =
                constraints.audio.stereo;
            }
            // Check if there is optional
            if (Array.isArray(constraints.audio.optional)) {
              expectedConstraints.audio.options.optional = expectedConstraints.audio.constraints.optional =
                constraints.audio.optional;
            }
            // Check if there is mute
            if (typeof constraints.audio.mute === 'boolean') {
              expectedConstraints.audio.muted = constraints.audio.mute;
            }

          } else if (constraints.audio !== true) {
            expectedConstraints.audio.options = false;
            expectedConstraints.audio.constraints =  false;
          }

          // Parse the expected video constraints
          if (typeof constraints.video === 'object' && constraints.video !== null) {
            expectedConstraints.video.constraints = {
              mandatory: {}
            };
            // Check if there is resolution
            if (typeof constraints.video.resolution === 'object' && constraints.video.resolution !== null) {
              expectedConstraints.video.options.resolution = {
                width: 640,
                height: 480
              };

              if (typeof constraints.video.resolution.width === 'number' && constraints.video.resolution.width > 0) {
                expectedConstraints.video.options.resolution.width = constraints.video.resolution.width;
              }

              if (typeof constraints.video.resolution.height === 'number' && constraints.video.resolution.height > 0) {
                expectedConstraints.video.options.resolution.height = constraints.video.resolution.height;
              }

              // NOTE: max is only supported for now due to issues causing in the browsers
              // Until things turn to be more standardized, we have to wait
              if (stream.video.supports.newWHA) {
                expectedConstraints.video.constraints.mandatory = {
                  height: {
                    max: expectedConstraints.video.options.resolution.height
                  },
                  width: {
                    max: expectedConstraints.video.options.resolution.width
                  }
                };
              } else {
                expectedConstraints.video.constraints.mandatory = {
                  maxHeight: expectedConstraints.video.options.resolution.height,
                  maxWidth: expectedConstraints.video.options.resolution.width
                };
              }
            }
            // Check if there is frameRate
            if (typeof constraints.video.frameRate === 'number' && stream.video.supports.frameRate) {
              expectedConstraints.video.options.frameRate = 50;

              if (constraints.video.frameRate > 0) {
                expectedConstraints.video.options.frameRate = constraints.video.frameRate;
              }

              // NOTE: Currently maxFrameRate support as well due to issues cross-browsers
              expectedConstraints.video.constraints.mandatory.maxFrameRate = expectedConstraints.video.options.frameRate;
            }
            // Check if there is optional
            if (Array.isArray(constraints.video.optional)) {
              expectedConstraints.video.options.optional = expectedConstraints.video.constraints.optional =
                constraints.video.optional;
            }
            // Check if there is mute
            if (typeof constraints.video.mute === 'boolean') {
              expectedConstraints.video.muted = constraints.video.mute;
            }
            // Check if there is screenshare
            if (typeof constraints.video.screenshare === 'boolean') {
              // Check if it is supported
              if (constraints.video.supports.screenshare) {
                expectedConstraints.video.screenshare = constraints.video.screenshare;

                if (expectedConstraints.video.screenshare) {
                  expectedConstraints.video.constraints = {
                    mediaSource: 'window'
                  };
                }
              }
            }

          } else if (constraints.video !== true) {
            expectedConstraints.video.options = false;
            expectedConstraints.video.constraints =  false;
          }
        }

        // Check audio options
        // stream.audio.options
        expect(stream.audio.options).to.deep.equal(expectedConstraints.audio.options);
        // stream.audio.constraints
        expect(stream.audio.constraints).to.deep.equal(expectedConstraints.audio.constraints);
        // stream.audio.muted
        expect(stream.audio.muted).to.deep.equal(expectedConstraints.audio.muted);
        // stream.audio.stereo
        expect(stream.audio.stereo).to.deep.equal(expectedConstraints.audio.stereo);
        // Check video options
        // stream.video.options
        expect(stream.video.options).to.deep.equal(expectedConstraints.video.options);
        // stream.video.constraints
        expect(stream.video.constraints).to.deep.equal(expectedConstraints.video.constraints);
        // stream.video.muted
        expect(stream.video.muted).to.deep.equal(expectedConstraints.video.muted);
      });
    };

    testCase();
    testCase(null);
    testCase(1);
    testCase(1.5);
    testCase(false);
    testCase(true);
    testCase('string');
    testCase({ audio: true, video: true });
    testCase({ audio: false, video: true });
    testCase({ audio: true, video: false });
    testCase({ audio: false, video: false });
    testCase({ audio: {}, video: true });
    testCase({ audio: { optional: [{ sourceId: 'test' }] }, video: true });
    testCase({ audio: { stereo: false, optional: [{ sourceId: 'test' }] }, video: true });
    testCase({ audio: { stereo: true, optional: [{ sourceId: 'test' }] }, video: true });
    testCase({ audio: { stereo: true, mute: true }, video: true });
    testCase({ audio: { stereo: true, mute: false }, video: true });
    testCase({ audio: true, video: {} });
    testCase({ audio: true, video: { resolution: {} } });
    testCase({ audio: true, video: { resolution: { width: 1000 } } });
    testCase({ audio: true, video: { resolution: { width: 1800, height: 800 } } });
    testCase({ audio: true, video: { resolution: { height: 500 } } });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: 56 } });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: -1 } });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: 0 } });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: -1 }, mute: true });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: -1 }, mute: false });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: -1 }, screenshare: true });
    testCase({ audio: true, video: { resolution: { height: 500 }, frameRate: -1 }, screenshare: true, mute: true });
  });

  // Test the input stream object passed in
  describe('new Stream ([MediaStream] stream)', function () {
    this.timeout(15000);

    var testCase = function (constraints, muteConstraints) {
      it('Should pass when stream object with \n' + JSON.stringify(constraints), function (done) {
        this.timeout(5000 + proceedToNextCase(5000));

        window.navigator.getUserMedia(constraints, function (streamObj) {
          muteConstraints = muteConstraints || {};

          // Polyfill the mute constraints first
          if (typeof muteConstraints.audio !== 'boolean') {
            muteConstraints.audio = false;
          }
          if (typeof muteConstraints.video !== 'boolean') {
            muteConstraints.video = false;
          }

          var audioTracks = streamObj.getAudioTracks();
          var videoTracks = streamObj.getVideoTracks();

          for (var i = 0; i < audioTracks.length; i++) {
            audioTracks[i].enabled = !muteConstraints.audio;
          }
          for (var i = 0; i < videoTracks.length; i++) {
            videoTracks[i].enabled = !muteConstraints.video;
          }

          var stream = new Stream(streamObj);

          // Stream variables to be set
          // stream.id
          expect(stream.id).to.be.equal(streamObj.id);
          // stream._ref
          expect(stream._ref).to.be.equal(streamObj);
          // stream._refClone
          expect(stream._refClone).to.be.null;

          var expectedConstraints = {
            audio: {
              options: { stereo: true },
              constraints: true,
              muted: false,
              stereo: true
            },
            video: {
              options: { screenshare: false },
              constraints: true,
              muted: false
            }
          };

          if (streamObj.getAudioTracks().length > 0) {
            var tracks = streamObj.getAudioTracks();
            var hasActiveTrack = false;

            for (var i = 0; i < tracks.length; i++) {
              if (tracks[i].enabled === true) {
                hasActiveTrack = true;
                break;
              }
            }

            if (!hasActiveTrack) {
              expectedConstraints.audio.muted = true;
            }
          } else {
            expectedConstraints.audio.options = false;
            expectedConstraints.audio.constraints = false;
          }

          if (streamObj.getVideoTracks().length > 0) {
            var tracks = streamObj.getVideoTracks();
            var hasActiveTrack = false;

            for (var i = 0; i < tracks.length; i++) {
              if (tracks[i].enabled === true) {
                hasActiveTrack = true;
                break;
              }
            }

            if (!hasActiveTrack) {
              expectedConstraints.video.muted = true;
            }
          } else {
            expectedConstraints.video.options = false;
            expectedConstraints.video.constraints = false;
          }

          // Check audio options
          // stream.audio.options
          expect(stream.audio.options).to.deep.equal(expectedConstraints.audio.options);
          // stream.audio.constraints
          expect(stream.audio.constraints).to.deep.equal(expectedConstraints.audio.constraints);
          // stream.audio.muted
          expect(stream.audio.muted).to.deep.equal(expectedConstraints.audio.muted);
          // stream.audio.stereo
          expect(stream.audio.stereo).to.deep.equal(expectedConstraints.audio.stereo);
          // Check video options
          // stream.video.options
          expect(stream.video.options).to.deep.equal(expectedConstraints.video.options);
          // stream.video.constraints
          expect(stream.video.constraints).to.deep.equal(expectedConstraints.video.constraints);
          // stream.video.muted
          expect(stream.video.muted).to.deep.equal(expectedConstraints.video.muted);

          done();

        }, function (error) {
          throw error;
        });
      });
    };

    testCase({ audio: true, video: true});
    testCase({ audio: false, video: true });
    testCase({ audio: true, video: false });
    testCase({ audio: true, video: true }, { audio: true, video: true });
    testCase({ audio: true, video: true }, { audio: false, video: true });
    testCase({ audio: true, video: true }, { audio: false, video: false });
    testCase({ audio: true, video: true }, { audio: true, video: false });
    testCase({ audio: true, video: true }, { audio: true, video: true });
    testCase({ audio: true, video: false }, { audio: true, video: true });
    testCase({ audio: false, video: true }, { audio: true, video: true });
    testCase({ audio: true, video: false }, { audio: true, video: false });
  });
});

