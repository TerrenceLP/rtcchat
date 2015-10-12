// Globals used by test
var peer = null;
var peerId = Date.now().toString(); //util.generateUUID();
var peerUserData = {
  test: 'This is SPARTA!....',
  spartan: true
};

// Redefine Peer class
before(function(done) {
  peer = new Peer({
  	id: peerId,
    userData: peerUserData,
    isPrivileged: true,
    constraints: {
    	iceServers: [{
				url: 'turn:leticia.choo@temasys.com.sg@numb.viagenie.ca',
				credential: 'xxxxxxxxxxx'
			}, {
				url: 'stun:leticia.choo@temasys.com.sg@numb.viagenie.ca'
			}]
    },

  });
  done();
});

/**
 * @test Peer
 * @for Skylink
 * @updated 1.0.0
 */
describe('Peer', function() {

	/**
	 * Attributes
	 */
  describe('#id', function() {
    it('is typeof "string"', function(done) {
      this.timeout(testItemTimeout);
      assert.typeOf(peer.id, 'string');
      done();
    });
    it('matches given ID', function(done) {
      this.timeout(testItemTimeout);
      expect(peer.id).to.equal(peerId);
      done();
    });
  });

  describe('#userData', function() {
    it('is typeof "object"', function(done) {
      this.timeout(testItemTimeout);
      assert.typeOf(peer.userData, 'object');
      done();
    });
    it('matches given userData', function(done) {
      this.timeout(testItemTimeout);
      expect(peer.userData).to.equal(peerUserData);
      done();
    });
  });

  describe('#agent', function() {
    it('is typeof "object"', function(done) {
      this.timeout(testItemTimeout);
      assert.typeOf(peer.agent, 'object');
      done();
    });

    describe('#name', function() {
      it('is typeof "string"', function(done) {
        this.timeout(testItemTimeout);
        assert.typeOf(peer.agent.name, 'string');
        done();
      });
    });

    describe('#version', function() {
      it('is typeof "number"', function(done) {
        this.timeout(testItemTimeout);
        assert.typeOf(peer.agent.version, 'number');
        done();
      });
    });

    describe('#os', function() {
      it('is typeof "string"', function(done) {
        this.timeout(testItemTimeout);
        assert.typeOf(peer.agent.os, 'string');
        done();
      });
    });
  });

  describe('#privileged', function() {
    it('is typeof "boolean"', function(done) {
      this.timeout(testItemTimeout);
      assert.typeOf(peer.privileged, 'boolean');
      done();
    });
    it('matches given isPrivileged', function(done) {
      this.timeout(testItemTimeout);
      expect(peer.privileged).to.equal(true);
      done();
    });
  });

  describe('#_ref', function() {
    it('is typeof "object"', function(done) {
      this.timeout(testItemTimeout);
      expect(typeof peer._ref).to.equal('object');
      done();
    });
    it('is null by default', function(done) {
      this.timeout(testItemTimeout);
      expect(peer._ref).to.equal(null);
      done();
    });
  });

  describe('#_constraints', function() {
    it('is typeof "object"', function(done) {
      this.timeout(testItemTimeout);
      expect(peer._constraints).to.equal(null);
      done();
    });
    it('is null by default', function(done) {
      this.timeout(testItemTimeout);
      expect(peer._constraints).to.equal(null);
      done();
    });
  });

  /**
	 * Methods
	 */

});