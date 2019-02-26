// provides a socketcluster wrapper client, sparing the caller some of the implementation details

'use strict';

const SocketCluster = require('socketcluster-client');
const UUID = require('uuid/v4');

class SocketClusterClient {

	constructor (config = {}) {
		this.config = config;
		this.messageListeners = {};		// callbacks for each channel when message is received
		this.channelPromises = {};		// promises for channel subscriptions
	}

	init () {
		return new Promise((resolve, reject) => {
			this.socket = SocketCluster.create({ 
				port: this.config.port,
				multiplex: false,	// don't allow reusing connections
				rejectUnauthorized: !this.config.dontRejectUnauthorized,
				secure: true
			}); 
			this.socket.on('connect', () => {
				this._connected = true;
				resolve();
			});
			this.socket.on('error', error => {
				if (!this._connected) {
					reject(error);
				}
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				this._warn('SOCKET ERROR: ', message);
			});
			this.socket.on('subscribe', this._handleSubscribe.bind(this));

			this.socket.on('authed', this._handleAuthed.bind(this));
			this.socket.emit('auth', {
				token: this.config.authKey,
				uid: this.config.uid,
				secret: this.config.authSecret
			});

		});
	}

	// publish a message to the specified channel
	publish (message, channel, options = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log('Would have sent PubNub message to ' + channel, options);
			return;
		}
		if (typeof message === 'object') {
			message.messageId = message.messageId || UUID();
		}
		return new Promise((resolve, reject) => {
			this.socket.publish(channel, message, error => {
				if (error) reject(error);
				else resolve();
			});
		});
	}

	// subscribe to the specified channel, providing a listener callback for the
	// actual message ... the callback is just whether the subscribe succeeded
	subscribe (channel, listener) {
		// subscribe to the channel, but success or failure comes back in a
		// status message, handled by _handleStatus
		this.messageListeners[channel] = listener;
		const promise = new Promise((resolve, reject) => {
			this.channelPromises[channel] = { resolve, reject };
		});
		if (!this._authed) {
			this._queuedSubscribes = this._queuedSubscribes || [];
			this._queuedSubscribes.push(channel);
			return promise;
		}
		this._subscribeHelper(channel);
		return promise;
	}

	_subscribeHelper (channel) {
		const channelObject = this.socket.subscribe(channel);
		channelObject.watch(message => {
			this._handleMessage({
				channel: channel,
				message
			});
		});
		channelObject.on('subscribeFail', error => {
			this._handleSubscribeFail(error, channel);
		});
	}

	// unsubscribe from the specified channel
	unsubscribe (channel) {
		this.socket.unsubscribe(channel);
		this._stopListening(channel);
	}

	unsubscribeAll () {
		Object.keys(this.messageListeners).forEach(channel => {
			this.unsubscribe(channel);
		});
	}

	// remove a listener for messages from a particular channel
	removeListener (channel) {
		this._stopListening(channel);
	}

	_handleSubscribeFail (error, channel) {
		const promise = this.channelPromises[channel];
		if (promise) {
			promise.reject(error);
			delete this.channelPromises[channel];
		}
	}

	_handleSubscribe (channel) {
		const promise = this.channelPromises[channel];
		if (promise) {
			promise.resolve();
			delete this.channelPromises[channel];
		}
	}

	_handleAuthed () {
		this._authed = true;
		const subscribes = this._queuedSubscribes || [];
		for (let channel of subscribes) {
			this._subscribeHelper(channel);
		}
		delete this._queuedSubscribes;
	}

	/*
	// fetch the history for a particular channel
	async history (channel) {
		const response = await this.pubnub.history(
			{ channel: channel }
		);
		if (!response || !(response.messages instanceof Array)) {
			throw 'no messages array';
		}
		return response.messages.map(message => message.entry);
	}
	*/

	// grant read and/or write permission to the specified channel for the specified
	// set of tokens (keys)
	async grant (/*tokens, channel, options = {}*/) {
		/*	
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		tokens = tokens.filter(token => typeof token === 'string' && token.length > 0);
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have granted access for ${tokens} to ${channel}`, options);
			return;
		}
		else {
			this._log(`Granting access for ${tokens} to ${channel}`, options);
		}
		const result = await this.pubnub.grant(
			{
				channels: [channel],
				authKeys: tokens,
				read: options.read === false ? false: true,
				write: options.write === true ? true : false,
				ttl: options.ttl || 0
			}
		);

		if (result.error) {
			this._warn(`Unable to grant access for ${tokens} to ${channel}: ${JSON.stringify(result.errorData)}`, options);
			throw result.errorData;
		}
		this._log(`Successfully granted access for ${tokens} to ${channel}`, options);
		if (options.includePresence) {
			// doing presence requires granting access to this channel as well
			await this.grant(tokens, channel + '-pnpres', { request: options.request });
		}
		*/
	}

	// grant read and/or write permission to multiple channels for the specified token
	async grantMultiple (/*token, channels, options = {}*/) {
		/*
		const channelNames = channels.reduce((currentChannels, channel) => {
			if (typeof channel === 'object' && typeof channel.name === 'string') {
				currentChannels.push(channel.name);
				if (channel.includePresence) {
					currentChannels.push(`${channel.name}-pnpres`);
				}
			}
			else if (typeof channel === 'string') {
				currentChannels.push(channel);
			}
			return currentChannels;
		}, []);

		// Pubnub imposes a maximum on the number of channels per grant call,
		// so just in case we get more than this, we'll split the requests
		const SET_SIZE = 180;
		let numSets = Math.floor(channelNames.length / SET_SIZE) + 1;
		for (let set = 0; set < numSets; set++) {
			const channelSlice = channelNames.slice(set * SET_SIZE, (set + 1) * SET_SIZE);
			if (channelSlice.length > 0) {
				await this._grantMultipleHelper(token, channelSlice, options);
			}
		}
		*/
	}

	async _grantMultipleHelper (/*token, channels, options*/) { 
		/*
		const result = await this.pubnub.grant(
			{
				channels,
				authKeys: [token],
				read: options.read === false ? false : true,
				write: options.write === true ? true : false,
				ttl: options.ttl || 0
			}
		);

		if (result.error) {
			this._warn(`Unable to grant access for ${token} to ${JSON.stringify(channels, undefined, 3)}: ${JSON.stringify(result.errorData)}`, options);
			throw result.errorData;
		}
		this._log(`Successfully granted access for ${token} to ${JSON.stringify(channels, undefined, 3)}`, options);
		*/
	}

	// revoke read and/or write permission for the specified channel for the specified
	// set of tokens (keys)
	async revoke (tokens, channel, options = {}) {
		await Promise.all(tokens.map(async token => {
			await this.revokeToken(token, channel, options);
		}));
	}

	async revokeToken (token, channel, options = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have revoked access for ${token} to ${channel}`, options);
			return;
		}
		this._log(`Revoking access for ${token} to ${channel}`, options);
		this.socket.emit('desubscribe');
		/*		
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have revoked access for ${tokens} to ${channel}`, options);
			return;
		}
		this._log(`Revoking access for ${tokens} to ${channel}`, options);
		const result = await this.pubnub.grant(
			{
				channels: [channel],
				authKeys: tokens,
				read: false,
				write: false,
				manage: false
			}
		);
		if (result.error) {
			this._warn(`Unable to revoke access for ${tokens} to ${channel}: ${JSON.stringify(result.errorData)}`, options);
			throw result.errorData;
		}
		this._log(`Successfully revoked access for ${tokens} to ${channel}`, options);
		if (options.includePresence) {
			// doing presence requires revoking access to this channel as well
			await this.revoke(tokens, channel + '-pnpres', { request: options.request });
		}
		*/		
	}

	// get list of users (by ID) currently subscribed to the passed channel
	async getSubscribedUsers (/*channel, options = {}*/) {
		// not supported for now
		return [];
	}

	disconnect () {
		this.socket.disconnect();
	}

	// handle a message coming in on any channel
	_handleMessage (message) {
		// check for a listener callback for that channel and pass on the message
		if (
			message.channel &&
			this.messageListeners[message.channel]
		) {
			this.messageListeners[message.channel](null, message);
		}
	}

	// stop listening for anything relevant to a particular channel, including
	// messages and status updates
	_stopListening (channel) {
		delete this.messageListeners[channel];
	}

	// determine if special header was sent with the request that says to block pubnub messages
	_requestSaysToBlockMessages (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-message-sends']
		);
	}

	_log (message) {
		if (this.config.logger) {
			this.config.logger.log(message);
		}
	}

	_warn (message) {
		if (this.config.logger) {
			this.config.logger.warn(message);
		}
	}
}

module.exports = SocketClusterClient;
