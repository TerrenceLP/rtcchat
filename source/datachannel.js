var DataChannel = function(channel){

	var self = this;

	self.label = channel.label;

	self.readyState = 'constructed';

	self._channelType = 'generic';

	self._objectRef = channel;

	Event.mixin(this);

	self._bindHandlers();

};

DataChannel.prototype.disconnect = function(){
	var self = this;
	objectRef.close();
};

DataChannel._bindHandlers = function(){
	var self = this;

	// The native RTCDataChannel is actually opening
	if (self._objectRef.readyState === 'open'){
		self._objectRef.onopen = function(event){
			this._trigger('connected', event);
		};

		self._objectRef.onmessage = function(event){
			this._trigger('message', event);
		};

		self._objectRef.onclose = function(event){
			this._trigger('disconnected', event);
		};

		self._objectRef.onerror = function(event){
			this._trigger('error', event);
		};
	}
	else{
		throw 'The WebRTC DataChannel is not open. Can not bind handlers';
	}

}