var DataChannel = function(channel){

	var self = this;

	self.label = channel.label;

	self.readyState = 'constructed';

	self._channelType = 'generic';

	self._objectRef = null;

	SkylinkEvent._mixin(this);

	self._bindHandlers(channel);

};

DataChannel.prototype.disconnect = function(){
	var self = this;
	if (self._objectRef.readyState !== 'closing' && self._objectRef.readyState !== 'closed'){
		self._objectRef.close();
	} 
};

DataChannel.prototype.send = function(msg){
	var self = this;
	self._objectRef.send(msg);
};

DataChannel.prototype._bindHandlers = function(channel){
	var self = this;

	if (channel){
		self._objectRef = channel;
	}
	else{
		throw 'DataChannel undefined';
	}

	self._objectRef.onopen = function(event){
		self.readyState = self._objectRef.readyState;
		console.log('open',event);
		self._trigger('connected', event);
	};

	self._objectRef.onmessage = function(event){
		self.readyState = self._objectRef.readyState;
		self._trigger('message', event);
	};

	self._objectRef.onclose = function(event){
		self.readyState = self._objectRef.readyState;
		console.log('close',event);
		self._trigger('disconnected', event);
	};

	self._objectRef.onerror = function(event){
		self.readyState = self._objectRef.readyState;
		self._trigger('error', event);
	};

/*	// The native RTCDataChannel is actually opening
	if (self._objectRef.readyState === 'open'){

		

	}
	else{
		throw 'The WebRTC DataChannel is not open. Can not bind handlers';
	}*/

};