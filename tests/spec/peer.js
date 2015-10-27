/**
 * Constructor test
 */
describe('- constructor', function () {

  describe.skip('#socketRef: To be confirmed to use socketRef', function () {});

  describe('#config', function () {

    var shouldError = function (config) {
      (function (config) {
        it('throw an error when (.., ' + printJSON(config) + ')', function () {
          expect(function () {
            var peer = new Peer(null, config);
          }).to.throw(Error);
        });
      })(config);
    };

    var shouldSuccess = function (config) {
      (function (config) {
        it('does not throw an error when (.., ' + printJSON(config) + ')', function () {
          expect(function () {
            var peer = new Peer(null, config);
          }).to.not.throw(Error);
        });
      })(config);
    };

    // Error cases
    shouldError(null);
    shouldError({});
    shouldError({ id: null });
    shouldError({ id: 123 });
    shouldError({ id: '232323' });
    shouldError({ id: '232323', agent: null });
    shouldError({ id: '232323', agent: 'wwewe' });
    shouldError({ id: '232323', agent: 123123 });
    shouldError({ id: '232323', agent: {}, iceServers: null });
    shouldError({ id: '232323', agent: {}, iceServers: 123123 });
    shouldError({ id: '232323', agent: {}, iceServers: '123123' });
    shouldError({ id: '232323', agent: {}, iceServers: [] });
    shouldError({ id: '232323', agent: {}, iceServers: [], room: null });
    shouldError({ id: '232323', agent: {}, iceServers: [], room: 123123 });
    shouldError({ id: '232323', agent: {}, iceServers: [], room: {} });

    // Success cases
    shouldSuccess({ id: 'dsdsd', agent: {}, iceServers: [], room: 'xxx' });
    shouldSuccess({ id: 'dsdsd', agent: {}, iceServers: [{}], room: 'xxx' });

  });

});

/**
 * Attributes test
 */
describe('- attributes', function () {
  // globals used by test
  var peer = null;
  var config = {
    id: generateUUID(),
    userData: 'test',
    iceServers: [{
      url: 'turn:leticia.choo@temasys.com.sg@numb.viagenie.ca',
      credential: 'xxxxxxxxxxx'
    }, {
      url: 'stun:leticia.choo@temasys.com.sg@numb.viagenie.ca'
    }],
    agent: {
      name: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion,
      os: window.navigator.platform
    },
    room: 'test-room'
  };

  before(function (done) {
    peer = new Peer(null, config);
    done();
  });

  describe('#id', function() {
    it('is typeof "string"', function(done) {
      assert.typeOf(peer.id, 'string');
      done();
    });
    it('matches given ID', function(done) {
      expect(peer.id).to.equal(config.id);
      done();
    });
  });

  describe('#userData', function() {
    it('is an existing property', function(done) {
      expect(peer).to.have.ownProperty('userData');
      done();
    });
    it('matches given userData', function(done) {
      expect(peer.userData).to.equal(config.userData);
      done();
    });
  });

  describe('#agent', function() {
    it('is typeof "object"', function(done) {
      assert.typeOf(peer.agent, 'object');
      done();
    });

    describe('#name', function() {
      it('is typeof "string"', function(done) {
        assert.typeOf(peer.agent.name, 'string');
        done();
      });
      it('matches given agent.name', function(done) {
        expect(peer.agent.name).to.equal(config.agent.name);
        done();
      });
    });

    describe('#version', function() {
      it('is typeof "number"', function(done) {
        assert.typeOf(peer.agent.version, 'number');
        done();
      });
      it('matches given agent.version', function(done) {
        expect(peer.agent.version).to.equal(config.agent.version);
        done();
      });
    });

    describe('#os', function() {
      it('is typeof "string"', function(done) {
        assert.typeOf(peer.agent.os, 'string');
        done();
      });
      it('matches given agent.os', function(done) {
        expect(peer.agent.os).to.equal(config.agent.os);
        done();
      });
    });
  });

  describe('#_iceServers', function() {
    it('is typeof "object"', function(done) {
      expect(typeof peer._iceServers).to.equal('object');
      done();
    });
    it('is Array', function(done) {
      assert.isArray(peer._iceServers);
      done();
    });
    it('matches given iceServers', function(done) {
      expect(peer._iceServers).to.equal(config.iceServers)
      done();
    });
  });

});