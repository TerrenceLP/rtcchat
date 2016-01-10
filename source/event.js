var SkylinkEvent = {

  on: function(event, callback) {
    this.listeners.on[event] = this.listeners.on[event] || [];
    this.listeners.on[event].push(callback);
    return this;
  },

  off: function(event, callback) {

    //Remove all listeners if event is not provided
    if (typeof event === 'undefined') {
      this.listeners.on = {};
      this.listeners.once = {};
    }

    //Remove all callbacks of the specified events if callback is not provided
    if (typeof callback === 'undefined') {
      this.listeners.on[event] = [];
      this.listeners.once[event] = [];
    } else {

      //Remove single on callback
      if (this.listeners.on[event]) {
        this._removeListener(this.listeners.on[event], callback);
      }

      //Remove single once callback
      if (this.listeners.once[event]) {
        this._removeListener(this.listeners.once[event], callback);
      }
    }
    return this;
  },

  once: function(event, callback, condition) {
    this.listeners.once[event] = this.listeners.once[event] || [];
    if (typeof condition !== 'function') {
      condition = function() {
        return true;
      };
    }
    this.listeners.once[event].push([callback, condition]);
    return this;
  },

  _trigger: function(event) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (this.listeners.on[event]) {
      for (var i = 0; i < this.listeners.on[event].length; i++) {
        this.listeners.on[event][i].apply(this, args);
      }
    }

    if (this.listeners.once[event]) {
      for (var j = 0; j < this.listeners.once[event].length; j++) {
        if (this.listeners.once[event][j][1].apply(this, args)) {
          this.listeners.once[event][j][0].apply(this, args);
          this.listeners.once[event].splice(j, 1);
          j--;
        }
      }
    }

    return this;
  },

  _removeListener: function(listeners, listener) {
    for (var i = 0; i < listeners.length; i++) {
      var listenerIndex = listeners[i];
      // Use the callback not the once condition
      if (Array.isArray(listenerIndex)) {
        listenerIndex = listeners[i][0];
      }
      if (listenerIndex === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  },

  _mixin: function(object) {
    var methods = ['on', 'off', 'once', '_trigger', '_removeListener'];
    for (var i = 0; i < methods.length; i++) {
      if (SkylinkEvent.hasOwnProperty(methods[i])) {
        if (typeof object === 'function') {
          object.prototype[methods[i]] = SkylinkEvent[methods[i]];
        } else {
          object[methods[i]] = SkylinkEvent[methods[i]];
        }
      }
    }

    object.listeners = {
      on: {},
      once: {}
    };

    return object;
  }
};
