'use strict';

const IPC = require('node-ipc');

const MOCK_PUBNUB_CLIENT_ID = 'mock_pubnub_client';
const MOCK_PUBNUB_SERVER_ID = 'mock_pubnub_server';

class MockPubnub {
	
	constructor (options) {
		Object.assign(this, options);
		this.history = {};
		this.listeners = [];
		this.grants = {};
		IPC.config.silent = true;
	}

	init () {
		if (!this.isServer) {
			this._initClient();
		}
		else {
			this._initServer();
		}
		this.inited = true;
	}

	_initServer () {
		IPC.config.id = MOCK_PUBNUB_SERVER_ID;
		IPC.serve(() => {
			IPC.server.on('message', this._handleClientMessage.bind(this));
			IPC.server.on('subscribe', this._handleClientSubscribe.bind(this));
		});
		IPC.server.start();
	}

	_initClient () {
		IPC.config.id = MOCK_PUBNUB_CLIENT_ID;
		IPC.connectTo(MOCK_PUBNUB_SERVER_ID, () => {
			IPC.of[MOCK_PUBNUB_SERVER_ID].on('message', this._handleServerMessage.bind(this));
			IPC.of[MOCK_PUBNUB_SERVER_ID].on('status', this._handleStatus.bind(this));
		});
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
			this.stop();
		}
		if (this.isServer) {
			IPC.server.stop();
		}
	}

	stop () {
		this.listeners = [];
		IPC.disconnect(MOCK_PUBNUB_SERVER_ID);
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

	_handleClientMessage (message) {
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
				IPC.server.emit(this.socket, type, data);
			}
		}
		else {
			IPC.of[MOCK_PUBNUB_SERVER_ID].emit(type, data);
		}
	}

	_parse (json) {
		let data;
		try {
			data = JSON.parse(json);
		}
		catch (error) {
			console.error('Unable to parse data: ' + error);
		}
		return data;
	}
}

module.exports = MockPubnub;
