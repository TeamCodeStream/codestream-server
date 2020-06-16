'use strict';

class MockPubnub {
	
	constructor (options) {
		Object.assign(this, options);
		this.history = {};
		this.listeners = [];
		this.grants = {};
	}

	init (config) {
		Object.assign(this, config);
		if (!this.isServer) {
			this._initClient();
		}
		else {
			this._initServer();
		}
		this.inited = true;
	}

	_initServer () {
		this.ipc.on('subscribe', this._handleClientSubscribe.bind(this));
	}

	_initClient () {
		this.ipc.of[this.serverId].on('message', this._handleServerMessage.bind(this));
		this.ipc.of[this.serverId].on('status', this._handleStatus.bind(this));
	}

	addListener (listener) {
		if (!this.inited) { this.init(); }
		this.listeners.push(listener);
	}

	subscribe (options) {
		if (!this.inited) { this.init(); }
		const { channels } = options;
		const message = {
			authKey: this.authKey,
			channels
		};
		this._emit('subscribe', message);
	}

	publish (options) {
		const message = {
			channel: options.channel,
			message: options.message
		};
		this._emit('message', message);
		return {};
	}

	unsubscribe (channels) {
		if (!(channels instanceof Array)) {
			channels = [channels];
		}
		channels.forEach(channel => {
			this._unsubscribeChannel(channel);
		});
	}

	_unsubscribeChannel (channel) {
		delete this.history[channel];
		if (Object.keys(this.history).length === 0) {
			this.disconnect();
			if (this.isServer) {
				this.ipc.stop();
			}
		}
	}

	disconnect () {
		this.listeners = [];
		this.inited = false;
	}

	async grant (options) {
		const { authKeys, channels, read, write } = options;
		for (let authKey of authKeys) {
			for (let channel of channels) {
				this._grantChannel(authKey, channel, read, write);
			}
		}
		return {};
	}

	async history (options) {
		const { channel } = options;
		if (this.history[channel] === undefined) {
			throw `client not subscribed to ${channel}`;
		}
		return {
			messages: this.history[channel].map(entry => {
				return { entry };
			})
		};
	}

	_grantChannel (authKey, channel, read, write) {
		const existingGrant = this.grants[authKey] ?
			this.grants[authKey][channel] :
			null;
		if (existingGrant) {
			this.grants[authKey][channel] = this._grantChannelToExisting(existingGrant, read, write);
		}
		else {
			this._grantChannelToNew(authKey, channel, read, write);
		}
	}

	_grantChannelToExisting(existingGrant, read, write) {
		const existingRead = existingGrant.includes('read');
		const existingWrite = existingGrant.includes('write');
		const newRead = read || (read === undefined && existingRead);
		const newWrite = write || (write === undefined && existingWrite);
		const newGrant = [];
		if (newRead) {
			newGrant.push('read');
		}
		if (newWrite) {
			newGrant.push('write');
		}
		return newGrant;
	}

	_grantChannelToNew (authKey, channel, read, write) {
		if (!read && !write) {
			return;
		}
		this.grants[authKey] = this.grants[authKey] || {};
		this.grants[authKey][channel] = [];
		if (read) {
			this.grants[authKey][channel].push('read');
		}
		if (write) {
			this.grants[authKey][channel].push('write');
		}
	}

	_handleClientSubscribe (message, socket) {
		message = this._parse(message);
		const { authKey, channels } = message;
		this.socket = socket;
		for (let channel of channels) {
			if (
				!this.grants[authKey] ||
				!this.grants[authKey][channel] ||
				!this.grants[authKey][channel].includes('read')
			) {
				this._emit('status', {
					error: 'not granted',
					operation: 'PNSubscribeOperation'
				});
			}
			else {
				this._emit('status', {
					subscribedChannels: Object.keys(this.grants[authKey])
				});
			}
		}
	}

	_handleSubscribed (message) {
		message = this._parse(message);
		const { channels } = message;
		channels.forEach(channel => {
			this.history[channel] = this.history[channel] || [];
		});
	}

	_handleServerMessage (message) {
		message = this._parse(message);
		for (let listener of this.listeners) {
			if (listener.message) {
				listener.message(message);
			}
		}
	}

	_handleStatus (message) {
		message = this._parse(message);
		for (let listener of this.listeners) {
			if (listener.status) {
				listener.status(message);
			}
		}
	}

	_emit (type, data) {
		data = JSON.stringify(data);
		if (this.isServer) {
			if (this.socket) {
				this.ipc.emit(this.socket, type, data);
			}
		}
		else {
			this.ipc.of[this.serverId].emit(type, data);
		}
	}

	_parse (json) {
		let data = {};
		try {
			data = JSON.parse(json);
		}
		catch (error) {
			return data;
		}
		return data;
	}
}

module.exports = MockPubnub;
