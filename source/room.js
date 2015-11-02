var Room = function(options){

	var self = this;

	self.options = options;

	self.name = null;

	self.locked = false;

	self.readyState = 'constructed';

	self.secure = false;

	self.roomType = 'single';

	self.start = null;

	self.duration = null;

	self.id = null;

	self._credentials = null;

	self._serverKey = null;

	self._owner = null;

	self._socket = new Socket();

	self._peers = []; // other peers

	self._self = null; // current peer

	self._mcu = null; // mcu peer

	SkylinkEvent._mixin(self);

};

Room.prototype.join = function(){
	var self = this;
	self._trigger('join');
};

Room.prototype.leave = function(){
	self._trigger('leave');
};

Room.prototype.lock = function(){
	self._trigger('lock');
};

Room.prototype.unlock = function(){
	self._trigger('unlock');
}