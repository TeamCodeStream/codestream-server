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
		this.revokedTokens = {};
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
			uuid: this.uuid,
			v3Token: this.v3Token,
			channels
		};
		this._emit('subscribe', message);
	}

	publish (options) {
		const message = {
			channel: options.channel,
			message: options.message
		};
		this._log(`Transmitting message ${message.message.messageId} for channel ${message.channel} as mock Pubnub server...`, options);
		this._emit('message', message);
		this._log(`Published ${message.message.messageId} to ${message.channel}`, options);
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

	setToken (token) {
		this.v3Token = token;
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

	async grantToken (options) {
		const { ttl, authorized_uuid, resources } = options;
		const timestamp = Math.floor(Date.now() / 1000);
		const random = Math.floor(Math.random() * 10000000000);
		let token = `${random}|${ttl}|${timestamp}|${authorized_uuid}|`;
		const channels = [];
		for (let channel in resources.channels) {
			const channelObject = resources.channels[channel];
			if (channelObject.read && !channels.includes(`${channel}#read`)) {
				channels.push(`${channel}#read`);
			}
			if (channelObject.write && !channel.includes(`${channel}#write`)) {
				channels.push(`${channel}#write`);
			}
		}
		token += channels.join(':');
		return token;
	}

	parseToken (token) {
		const parsedToken = token.split('|');
		if (parsedToken.length !== 5) {
			throw new Error('unable to parse');
		}
		const ttl = parseInt(parsedToken[1], 10);
		const timestamp = parseInt(parsedToken[2], 10);
		const uuid = parsedToken[3];
		const channels = parsedToken[4].split(':');
		const channelsObject = { };
		for (let channel of channels) {
			const [name, perm] = channel.split('#');
			channelsObject[name] = channelsObject[name] || {};
			channelsObject[name][perm] = true;
		}
		return {
			version: 2,
			ttl,
			timestamp,
			authorized_uuid: uuid,
			resources: {
				channels: channelsObject
			}
		};
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

	async revokeToken (token, options) {
		this.revokedTokens[token] = true;
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
		let errorMessage;
		message = this._parse(message);
		const { authKey, v3Token, channels, uuid } = message;
		let authorizedChannels;
		if (v3Token) {
			const result = this._validateV3Token(v3Token, uuid);
			errorMessage = result.errorMessage;
			authorizedChannels = result.channels;
		}

		this.socket = socket;
		for (let channel of channels) {
			if (
				(
					authorizedChannels &&
					!authorizedChannels.includes(channel)
				) ||
				(
					!authorizedChannels &&
					(
						!this.grants[authKey] ||
						!this.grants[authKey][channel] ||
						!this.grants[authKey][channel].includes('read')
					)
				)
			) {
				errorMessage = errorMessage || 'Not authorized';
				this._emit('status', {
					error: true,
					operation: 'PNSubscribeOperation',
					statusCode: 403,
					errorData: {
					  message: errorMessage,
					  error: true,
					  service: 'Access Manager',
					  status: 403
					},
					category: 'PNAccessDeniedCategory'
				});
			}
			else {
				this._emit('status', {
					subscribedChannels: authorizedChannels || Object.keys(this.grants[authKey])
				});
			}
		}
	}

	_validateV3Token (token, uuid) {
		const result = {};
		if (this.revokedTokens[token]) {
			result.errorMessage = 'Token is revoked';
			return result;
		}

		let parsedToken;
		try {
			parsedToken = this.parseToken(token);
		} catch (error) {
			result.errorMessage = 'Malformed token';
			return result;
		}

		if (!parsedToken.ttl || !parsedToken.timestamp || !parsedToken.authorized_uuid) {
			result.errorMessage = 'Invalid token';
			return result;
		} 
		if (uuid !== parsedToken.authorized_uuid) {
			result.errorMessage = 'Unauthorized UUID';
			return result;
		}

		const ttlInMS = parseInt(parsedToken.ttl, 10) * 60 * 1000;
		const tsInMS = parseInt(parsedToken.timestamp, 10) * 1000;
		if (!ttlInMS || isNaN(ttlInMS) || !tsInMS || isNaN(tsInMS)) {
			result.errorMessage = 'Invalid time signature';
			return result;
		}
		const expiresAt = tsInMS + ttlInMS;

		if (expiresAt <= Date.now()) {
			result.errorMessage = 'Token is expired';
			return result;
		}

		result.channels = Object.keys(parsedToken.resources.channels).filter(channel => {
			return parsedToken.resources.channels[channel].read;
		});
		return result;
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

	_log(message, options) {
		if (
			options &&
			typeof options.request === 'object' &&
			typeof options.request.log === 'function'
		) {
			options.request.log(message);
		}
		else if (
			options &&
			typeof options.logger === 'object' &&
			typeof options.logger.log === 'function'
		) {
			options.logger.log(message);
		}
	}

	_warn(message, options) {
		if (
			options &&
			typeof options.request === 'object' &&
			typeof options.request.warn === 'function'
		) {
			return options.request.warn(message);
		}
		else if (
			options &&
			typeof options.logger === 'object' &&
			typeof options.logger.warn === 'function'
		) {
			return options.logger.warn(message);
		}
	}
}

module.exports = MockPubnub;
