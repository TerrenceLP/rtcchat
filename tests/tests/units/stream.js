'use strict';

var test = require('tape-catch');

test('Constructor', function (m) {
  m.plan(2);

  m.test('new Stream ([JSON] constraints)', function (t) {
    t.plan(29);

    var testCase = function (constraints) {
      t.test('Should pass when\n' + JSON.stringify(constraints), function (tc) {
        tc.plan(7);

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

        // Stream initial variables state
        t.deepEqual(stream.id, null, 'Is empty at first');
        t.deepEqual(stream._ref, null, 'Is empty at first');
        t.deepEqual(stream._refClone, null, 'Is empty at first');

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
        t.deepEqual(stream.audio.options, expectedConstraints.audio.options, 'Is correct (audio.options)');
        t.deepEqual(stream.audio.constraints, expectedConstraints.audio.constraints, 'Is correct (audio.constraints)');
        t.deepEqual(stream.audio.muted, expectedConstraints.audio.muted, 'Is correct (audio.muted)');
        t.deepEqual(stream.audio.stereo, expectedConstraints.audio.stereo, 'Is correct (audio.stereo)');
        // Check video options
        t.deepEqual(stream.video.options, expectedConstraints.video.options, 'Is correct (video.options)');
        t.deepEqual(stream.video.constraints, expectedConstraints.video.constraints, 'Is correct (video.constraints)');
        t.deepEqual(stream.video.muted, expectedConstraints.video.muted, 'Is correct (video.muted)');
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

  m.test('new Stream ([MediaStream] stream)', function (t) {
    t.end();
  });
});