/**
 * Utility functions that could be accessed from tests/spec/ scripts
 */
var TestUtil = {

  /**
   * Prints out JSON parameters as a string to display in output karma console.
   * If spaces is not provided, it defaults to 2.
   * This will return the output formatted string from the JSON object provided.
   */
  printJSON: function (obj, spaces) {
    spaces = typeof spaces !== 'number' ? 2 : spaces;

    if (typeof obj === 'undefined') {
      return '';
    }

    // make indentation
    var makeIndentation = function (spaces) {
      var str = '';
      var i;

      for (i = 0; i < spaces; i += 1) {
        str += ' ';
      }

      return str;
    };

    var opening = '{';
    var closing = '}';

    if (obj instanceof Array) {
      opening = '[';
      closing = ']';
    }

    // parse object
    var outputStr = makeIndentation(spaces - 2) + opening;
    var val;


    if (!(obj instanceof Array)) {
      var key;

      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          outputStr += '\n\t' + makeIndentation(spaces) + '"' + key + '": ';

          val = obj[key];

          if (typeof val === 'object') {
            outputStr += printJSON(val, spaces + 2);

          } else if (typeof val === 'string') {
            outputStr += '"' + val + '"';

          } else {
            outputStr += val;
          }

          outputStr += ',';
        }
      }
    } else {
      var i;

      for (i = 0; i < obj.length; i += 1) {
        val = obj[i];

        if (typeof val === 'object') {
          outputStr += printJSON(val, spaces + 2);

        } else if (typeof val === 'string') {
          outputStr += '"' + val + '"';

        } else {
          outputStr += val;
        }

        if (i < (obj.length - 1)) {
          outputStr += ',';
        }
      }
    }

    outputStr += '\n\t' + makeIndentation(spaces - 2) + closing;

    return outputStr;
  },

  /**
   * Checks if the video that is playing is empty.
   * Used to check if stream attached to video has issues.
   * The callback will be triggered after the check has been completed.
   * In the callback, it will contain a boolean flag isEmpty,
   *   that indicates true if the video element has not only black pixels
   *   or false if there is only black pixels in the video.
   */
  checkEmptyVideo: function (v, callback) {
    var checkCanvas = function (ctx, width, height) {
      var nimg = ctx.getImageData(0, 0, width, height);

      var d = nimg.data;

      var i;

      for (i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];

        if (r !== 0 || g !== 0 || b !== 0) {
          return true;
        }
      }

      return false;
    };

    var draw = function (v,c,w,h) {
      if(v.paused || v.ended) {
        return false;
      }
      c.drawImage(v,0,0,w,h);
      setTimeout(draw,20,v,c,w,h);
    };

    var canvas = document.getElementById('test');

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'test';
      document.body.appendChild(canvas);
    }

    var context = canvas.getContext('2d');

    var cw = Math.floor(canvas.clientWidth);
    var ch = Math.floor(canvas.clientHeight);
    canvas.width = cw;
    canvas.height = ch;

    draw(v,context,cw,ch);

    setTimeout(function () {
      v.pause();

      callback( checkCanvas(context, cw, ch) );
    }, 50);
  },

  /**
   * Generate a Unique ID.
   * This will return a randomly generated Unique ID string.
   */
  generateUUID: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }
};