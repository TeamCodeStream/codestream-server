// provides a socketcluster wrapper client, sparing the caller some of the implementation details

'use strict';

const SocketCluster = require('socketcluster-client');
const UUID = require('uuid/v4');

class SocketClusterClient {

	constructor (config = {}) {
		this.config = config;
		this.messageListeners = {};		// callbacks for each channel when message is received
		this.channelPromises = {};		// promises for channel subscriptions
		this.subscribedUserPromises = {};	// promises for requests to know subscribed users
	}

	init () {
		return new Promise((resolve, reject) => {
			this.socket = SocketCluster.create({ 
				hostname: this.config.host,
				port: this.config.port,
				multiplex: false,	// don't allow reusing connections
				rejectUnauthorized: this.config.strictSSL,
				secure: true
			}); 
			this.socket.on('connect', () => {
				if (this._connected) {
					return;
				}
				this._connected = true;
				resolve();

				this._log('SENDING AUTH: ' + this.config.authKey);
				this.socket.emit('auth', {
					token: this.config.authKey,
					uid: this.config.uid,
					subscriptionCheat: this.config.subscriptionCheat
				});
			});
			this.socket.on('error', error => {
				if (!this._connected) {
					reject(error);
				}
				this._warn('SOCKET ERROR: ', JSON.stringify(error));
			});
			this.socket.on('subscribe', this._handleSubscribe.bind(this));

			this.socket.on('authed', this._handleAuthed.bind(this));
			this.socket.on('subscribedUsers', this._handleSubscribedUsers.bind(this));
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

	// grant read and/or write permission to the specified channel for the specified
	// set of tokens (keys)
	async grant (/*tokens, channel, options = {}*/) {
	}

	// grant read and/or write permission to multiple channels for the specified token
	async grantMultiple (/*token, channels, options = {}*/) {
	}

	// revoke read and/or write permission for the specified channel for the specified
	// set of tokens (keys)
	async revoke (tokens, channel, options = {}) {
		const userIds = options.userIds || [];
		await Promise.all(userIds.map(async userId => {
			await this.revokeToken(userId, channel, options);
		}));
	}

	async revokeToken (userId, channel, options = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have revoked access for ${userId} to ${channel}`, options);
			return;
		}
		this._log(`Revoking access for ${userId} to ${channel}`, options);
		this.socket.emit('desubscribe', { userId, channel });
	}

	// get list of users (by ID) currently subscribed to the passed channel
	getSubscribedUsers (channel) {
		const requestId = UUID();
		const promise = new Promise((resolve, reject) => {
			this.subscribedUserPromises[requestId] = { resolve, reject };
		});
		this.socket.emit('getSubscribedUsers', { requestId, channel });
		return promise;
	}

	_handleSubscribedUsers (data) {
		const promise = this.subscribedUserPromises[data.requestId];
		if (!promise) { return; }
		if (data.error) {
			promise.reject(data.error);
		}
		else {
			promise.resolve(data.userIds);
		}
		delete this.subscribedUserPromises[data.requestId];
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
