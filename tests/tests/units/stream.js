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

before(function (done) {
  this.timeout(7500);
  AdapterJS.webRTCReady(function () {
    done();
  });
});

describe.skip('Constructor', function () {

  // Test the input constraints
  describe('new Stream ([JSON] constraints) -> success', function () {
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
          },
          audioFallback: false
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

          // Parse the expected audio fallback
          if (typeof constraints.audioFallback === 'boolean') {
            expectedConstraints.audioFallback = constraints.audioFallback;
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
        // stream.audioFallback
        expect(stream.audioFallback).to.deep.equal(expectedConstraints.audioFallback);
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
    testCase({ audioFallback: true, audio: true });
    testCase({ audioFallback: false, video: false });
  });

  // Test the input stream object passed in
  describe('new Stream ([MediaStream] stream) -> success', function () {
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
            },
            audioFallback: false
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
          // stream.audioFallback
          expect(stream.audioFallback).to.deep.equal(expectedConstraints.audioFallback);

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

  // Test the input stream object passed in
  describe('new Stream ([MediaStream] stream) -> failure', function () {
    this.timeout(15000);

    it('Should fail when passing in an invalid MediaStream object', function (done) {
      var testFn = function (streamObj) {
        streamObj.getAudioTracks = null;
        streamObj.getVideoTracks = null;

        expect(function () {
          var stream = new Stream(streamObj);
        }).to.throw(Error, 'Failed initializing Stream. Provided MediaStream object is invalid');

        done();
      };

      if (window.webrtcDetectedBrowser === 'IE' || window.webrtcDetectedBrowser === 'safari') {
        testFn(function () {});
      } else {
        window.getUserMedia({ audio: true, video: true }, testFn, function (error) {
          throw error;
        });
      }
    });

    (function () {
      if (window.webrtcDetectedBrowser === 'firefox') {
        it.skip('Ignoring test for as Firefox does not have implementation of .ended status.\r\n' +
          'Test: Should fail when passing an inactive MediaStream object', function () {});
      } else {
        it('Should fail when passing an inactive MediaStream object', function (done) {
          window.getUserMedia({ audio: true, video: true }, function (streamObj) {
            // Prevent errors for stopping MediaStream object
            try {
              streamObj.stop();
            } catch (error) {
              var tracks = (streamObj.getAudioTracks()).concat(streamObj.getVideoTracks());
              for (var i = 0; i < tracks.length; i++) {
                tracks[i].stop();
              }
            }

            var errorMsg = 'Failed initializing Stream. Provided MediaStream has no active tracks';

            expect(function () {
              var stream = new Stream(streamObj);
            }).to.throw(Error, errorMsg);

            done();
          }, function (error) {
            throw error;
          });
        });
      }
    })();

  });
});

describe('Methods', function () {

  // Test the .fetch() method
  describe('#fetch', function () {

    var testCase = function (constraints) {
      var isScreensharingMode = constraints && constraints.video && constraints.video.screenshare;

      // Skips the test for chrome because of loading the extension
      if (window.webrtcDetectedBrowser === 'chrome' && isScreensharingMode) {
        it.skip('Chrome screensharing test requires loading of extension.Test: ' +
          'Should pass when\n' + JSON.stringify(constraints), function () { });
      } else {
        it('Should pass when\n' + JSON.stringify(constraints), function (done) {
          this.timeout(15000);

          var stream = new Stream(constraints);

          stream.once('error', function (error, isAudioFallback) {
            if (isScreensharingMode && !constraints.video.supports.screenshare) {
              // Should trigger as it is not supported
              expect(error).to.equal(new Error('Failed retrieving screensharing MediaStream. ' +
                'Current browser does not have screensharing support'));
              // Should be false always
              expect(isAudioFallback).to.equal(false);
              done();
            }
            // Should not trigger error event
            assert.notOk(error, 'Triggers error event');
          });

          stream.once('started', function (id) {
            if (isScreensharingMode && !constraints.video.supports.screenshare) {
              // Should not trigger as it is not supported
              assert.notOk(id, 'Triggers started event');
              done();
            }
            // Triggers the event as expected
            assert.ok(id, 'Triggers started event');
            // Check the stream MediaStream object reference
            expect(stream._ref).to.not.equal(null);
            assert.typeOf(stream._ref.id, 'string');
            assert.typeOf(stream._ref.getAudioTracks, 'function');
            assert.typeOf(stream._ref.getVideoTracks, 'function');

            // Check if there is any audio tracks
            if (!!stream.audio.options) {
              expect(stream._ref.getAudioTracks()).to.have.length.above(0);
            } else {
              expect(stream._ref.getAudioTracks()).to.have.length(0);
            }

            // Check if there is any video tracks
            if (!!stream.video.options) {
              expect(stream._ref.getVideoTracks()).to.have.length.above(0);
            } else {
              expect(stream._ref.getVideoTracks()).to.have.length(0);
            }

            // Check if there is a required need for MediaStream clone
            if (isScreensharingMode && !stream.video.supports.screenshareBundleAudio) {
              expect(stream._refClone).to.not.equal(null);
              assert.typeOf(stream._refClone.id, 'string');
              assert.typeOf(stream._refClone.getAudioTracks, 'function');
              assert.typeOf(stream._refClone.getVideoTracks, 'function');
            } else {
              expect(stream._refClone).to.equal(null);
            }
          });
        });
      }
    };

    testCase({ audio: true, video: true });
    testCase({ audio: false, video: true });
    testCase({ audio: { mute: true }, video: true });
    testCase({ audio: { mute: false }, video: true });
    testCase({ audio: { mute: false, stereo: true }, video: true });
    testCase({ audio: { mute: true, stereo: false }, video: true });
    testCase({ audio: { mute: true, optional: [{ echo: true }] }, video: true });
    testCase({ audio: {}, video: {} });
    testCase({ audio: false, video: {} });
    testCase({ audio: true, video: {} });
    testCase({ audio: {}, video: false });
    testCase({ audio: true, video: {} });
    testCase({ audio: true, video: { screenshare: true } });
    testCase({ audio: true, video: { screenshare: false } });
    testCase({ audio: true, video: { screenshare: false, mute: true } });
    testCase({ audio: true, video: { screenshare: false, mute: false } });
    testCase({ audio: true, video: { screenshare: true, optional: [], resolution: {} } });
    testCase({ audio: true, video: { screenshare: false, resolution: { height: 500, width: 700 } } });
    testCase({ audio: true, video: { screenshare: false, resolution: { height: 500, width: 700 }, frameRate: -1 } });
    testCase({ audio: true, video: { screenshare: true, resolution: { height: 500, width: 300 }, frameRate: -1 } });

  });
});

