/*
 * How this demo should work:
 * Peers A and B initiate a very basic RTCPeerConnection
 * Each peer then initiate a RTCDataChannel for its connection with the other peer
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample
 * TODO: Data channel readyState is not set to closing/closed when invoking close(). What happened ?
 */

(function() {

  // Define "global" variables
  
  var connectButton = null;
  var disconnectButton = null;
  var sendButton = null;
  var messageInputBox = null;
  var receiveBox = null;
  var statusBox = null;
  
  var localConnection = null;   // RTCPeerConnection for our "local" connection
  var remoteConnection = null;  // RTCPeerConnection for the "remote"
  
  var sendChannel = null;       // RTCDataChannel for the local (sender)
  var receiveChannel = null;    // RTCDataChannel for the remote (receiver)
  
  // Functions
  
  // Set things up, connect event listeners, etc.
  
  function startup() {
    connectButton = document.getElementById('connectButton');
    disconnectButton = document.getElementById('disconnectButton');
    sendButton = document.getElementById('sendButton');
    messageInputBox = document.getElementById('message');
    receiveBox = document.getElementById('receivebox');
    statusBox = document.getElementById('statusbox');

    // Set event listeners for user interface widgets

    connectButton.addEventListener('click', connectPeers, false);
    disconnectButton.addEventListener('click', disconnectPeers, false);
    sendButton.addEventListener('click', sendMessage, false);
  }

  // Connect the two peers. Normally you look for and connect to a remote
  // machine here, but we're just connecting two local objects, so we can
  // bypass that step.
  function connectPeers() {
    // Create the local connection and its event listeners
    
    localConnection = new RTCPeerConnection();
    
    // Create the data channel and establish its event listeners
    sendChannel = localConnection.createDataChannel("sendChannel");

    bindHandlers(sendChannel);
    
    // Create the remote connection and its event listeners
    remoteConnection = new RTCPeerConnection();
    remoteConnection.ondatachannel = receiveChannelCallback;
    
    // Set up the ICE candidates for the two peers
    
    localConnection.onicecandidate = e => !e.candidate
        || remoteConnection.addIceCandidate(e.candidate);

    remoteConnection.onicecandidate = e => !e.candidate
        || localConnection.addIceCandidate(e.candidate);
    
    // Now create an offer to connect; this starts the process
    
    /*localConnection.createOffer()
    .then(offer => localConnection.setLocalDescription(offer))
    .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
    .then(() => remoteConnection.createAnswer())
    .then(answer => remoteConnection.setLocalDescription(answer))
    .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
    .catch(handleCreateDescriptionError);*/

    localConnection.createOffer(gotLocalDescription);
    
  }

  function bindHandlers(channel){
    channel.onopen = handleSendChannelStatusChange;
    channel.onclose = handleSendChannelStatusChange;
  }
    
  // Callback executed when the createAnswer() request for
  // the remote connection finishes up.
  
  function gotRemoteDescription(theDescription) {
    remoteConnection.setLocalDescription(theDescription);
    localConnection.setRemoteDescription(theDescription);
  }

  function gotLocalDescription(desc){
	  localConnection.setLocalDescription(desc);
	  remoteConnection.setRemoteDescription(desc);
	  remoteConnection.createAnswer(gotRemoteDescription);
	}
  
  // Handle ICE callback for the remote connection.
  
  /*function remoteICECallback(event) {
    if (event.candidate) {
      localConnection.addIceCandidate(event.candidate,
              handleLocalAddCandidateSuccess, handleRemoteAddCandidateError);
    }
  }*/
  
  // Handle errors attempting to create a description;
  // this can happen both when creating an offer and when
  // creating an answer. In this simple example, we handle
  // both the same way.
  
  function handleCreateDescriptionError(error) {
    //console.log("Unable to create an offer: " + error.toString());
    updateStatusBox('CreateDescriptionError')
  }
  
  // Handle successful addition of the ICE candidate
  // on the "local" end of the connection.
  
  function handleLocalAddCandidateSuccess() {
    updateStatusBox('LocalAddCandidateSuccess')
  }

  function updateStatusBox(status){
    statusBox.value += '\n'+status;
  }

  // Handle successful addition of the ICE candidate
  // on the "remote" end of the connection.
  
  function handleRemoteAddCandidateSuccess() {
    updateStatusBox('RemoteAddCandidateSuccess')
  }

  // Handle an error that occurs during addition of ICE candidate.
  
  function handleAddCandidateError() {
    updateStatusBox('AddCandidateError');
  }

  // Handles clicks on the "Send" button by transmitting
  // a message to the remote peer.
  
  function sendMessage() {
    var message = messageInputBox.value;
    sendChannel.send(message);
    
    // Clear the input box and re-focus it, so that we're
    // ready for the next message.
    
    messageInputBox.value = "";
    messageInputBox.focus();
  }
  
  // Handle status changes on the send channel.
  
  function handleSendChannelStatusChange() {
    if (sendChannel) {
      updateStatusBox('SendChannelStatusChange: '+sendChannel.readyState);
    }
  }
  
  // Handle events that occur on the receiver's channel.
  
  function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    bindHandlers(receiveChannel);
    receiveChannel.onmessage = handleReceiveMessage;
  }
  
  // Handle onmessage events for the receiving channel.
  // These are the data messages sent by the sending channel.
  
  function handleReceiveMessage(event) {
    var el = document.createElement("p");
    var txtNode = document.createTextNode(event.data);
    
    el.appendChild(txtNode);
    receiveBox.appendChild(el);
  }
  
  // Handle status changes on the receiver's channel.
  
  function handleReceiveChannelStatusChange() {
    if (receiveChannel) {
      updateStatusBox('ReceiveChannelStatusChange: '+receiveChannel.readyState);
    }
    
    // Here you would do stuff that needs to be done
    // when the channel's status changes.
  }
  
  // Close the connection, including data channels if they're open.
  // Also update the UI to reflect the disconnected status.
  
  function disconnectPeers() {

    updateStatusBox('Closing channel');
  
    // Close the RTCDataChannels if they're open.
    
    sendChannel.close();
    receiveChannel.close();

    updateStatusBox(sendChannel.readyState);
    updateStatusBox(receiveChannel.readyState);
    
    // Close the RTCPeerConnections
    
    localConnection.close();
    remoteConnection.close();

    sendChannel = null;
    receiveChannel = null;
    localConnection = null;
    remoteConnection = null;

    messageInputBox.value = "";
    
  }
  
  // Set up an event listener which will run the startup
  // function once the page is done loading.
  
  window.addEventListener('load', startup, false);
})();
