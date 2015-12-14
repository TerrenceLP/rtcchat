'use strict';

var test = require('tape-catch');

test('testout', function (t) {
  t.plan(1);

  window.getUserMedia({ audio: true, video: true }, function (stream) {
    if (window.webrtcDetectedBrowser === 'firefox') {
      //t.fail('fairefox fail');
      throw stream;
    } else {
      t.pass('yes');
    }
  }, function (error) {
    throw error;
  });
});