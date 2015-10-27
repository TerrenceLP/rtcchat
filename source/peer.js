/**
 * @class Peer
 * @constructor
 * @param {Socket} socketRef The Socket object reference that the Peer class object would relay events to.
 * @param {JSON} config The configuration settings for the Peer class object.
 * @param {String} config.id The Peer ID.
 * @param {Object} [config.userData=null] The Peer custom data.
 * @param {JSON} config.agent The peer connecting agent platform.
 * @param {String} config.agent.name The platform agent name that Peer is connecting from.
 * @param {Number} config.agent.version The version of the platform agent.
 * @param {String} config.agent.os The platform operating system the agent is running from.
 * @param {Array} config.iceServers The list of ICE servers that the Peer connection would attempt to use for successful ICE connection.
 * @param {String} config.room The room that the Peer is connected to.
 */
var Peer = function (socketRef, config) {

  'use strict';

  // Reference object
  var self = this;

  log.debug('Passed configuration for constructing new Peer object', config);

  if ((!config && typeof config !== 'object') || config === null) {
    throw new Error('Configuration passed in for constructing new Peer object is invalid');
  }

  if (typeof config.id !== 'string') {
    throw new Error('Configuration ID passed in for constructing new Peer object is invalid', config.id);
  }

  if ((!config.agent && typeof config.agent !== 'object') || config.agent === null) {
    throw new Error('Configuration agent passed in for constructing new Peer object is invalid', config.agent);
  }

  if (typeof config.room !== 'string') {
    throw new Error('Configuration room passed in for constructing new Peer object is invalid', config.room);
  }

  if (!Array.isArray(config.iceServers)) {
    throw new Error('Configuration ICE servers passed in for constructing new Peer object is invalid', config.iceServers);
  }

/***************************************************
 = ATTRIBUTES (The ones that requires declaration from config) [use @attribute for attributes]
 ***************************************************/
  /**
   * The Peer ID.
   * @attribute id
   * @type String
   * @readOnly
   */
  self.id = config.id;

  /**
   * The Peer custom data.
   * @attribute userData
   * @type Object
   * @readOnly
   */
  self.userData = config.userData || null;

  /**
   * The Peer connecting agent platform.
   * @attribute userData
   * @type JSON
   * @param {String} [name="unknown"] The platform agent name that Peer is connecting from.
   * @param {Number} [version=0] The version of the platform agent.
   * @param {String} [os="unknown"] The platform operating system the agent is running from.
   * @readOnly
   */
  self.agent = {
    // Define the objects to prevent undefined errors
    name: config.agent.name || 'unknown',
    version: config.agent.version || 0,
    os: config.agent.os || 'unknown'
  };

  /**
   * The room that the Peer is connected to.
   * @attribute room
   * @type String
   * @readOnly
   */
  self.room = config.room;

  /**
   * The list of ICE servers that the RTCPeerConnection would attempt to use for successful ICE connection.
   * @attribute _iceServers
   * @type Array
   * @private
   */
  self._iceServers = config.iceServers;

  /**
   * The Peer RTCPeerConnection object reference
   * @attribute _ref
   * @type RTCPeerConnection
   * @private
   */
  //self._ref = new RTCPeerConnection()
};
