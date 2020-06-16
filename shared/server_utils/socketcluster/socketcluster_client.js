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

	async init () {
		if (this.config.ignoreHttps) {
			this._log('NOTE: SocketCluster connection using http, will not be secure');
		}
		if (!this.config.strictSSL) {
			this._log('NOTE: SocketCluster connection not using strict SSL, self-signed certificates will be allowed');
		}
		this.socket = SocketCluster.create({ 
			hostname: this.config.host,
			port: this.config.port,
			multiplex: false,	// don't allow reusing connections
			wsOptions: { rejectUnauthorized: this.config.strictSSL },
			secure: !this.config.ignoreHttps
		});
		(async () => {
			for await (let data of this.socket.listener('connectAbort')) {
				this._warn('SocketCluster connection aborted: ' + JSON.stringify(data));
			}
		})();
		await this.authorizeConnection();
	}

	// authorize the connection with the socketcluster server
	async authorizeConnection () {
		this._log('Authorizing socketcluster connection...');
		try {
			await this.socket.invoke('auth', {
				token: this.config.authKey,
				uid: this.config.uid,
				subscriptionCheat: this.config.subscriptionCheat
			});
			this._log('Socketcluster connection authorized');
			this._authed = true;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.socket.disconnect();
			delete this.socket;
			throw `Socketcluster authorization error: ${message}`;
		}
	}

	// publish a message to the specified channel
	async publish (message, channel, options = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log('Would have sent PubNub message to ' + channel, options);
			return;
		}
		if (typeof message === 'object') {
			message.messageId = message.messageId || UUID();
		}
		await this.socket.transmit('message', { channel, message });
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
		(async () => {
			this.chs = this.chs || [];
			const ch = this.socket.subscribe(channel);
			this.chs.push(ch);
			for await (
				let message of ch
			) {
				this._handleMessage({ channel, message });
			}
		})();
		(async () => {
			for await (let data of this.socket.listener('subscribeFail')) {
				this._handleSubscribeFail(data, channel);
			}
		})();
		(async () => {
			for await (let data of this.socket.listener('subscribe')) {
				this._handleSubscribe(data.channel);
			}
		})();
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

		this.chs = this.chs || [];
		for (let ch of this.chs) {
			ch.unsubscribe();
			ch.close();
		}
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
		try {
			await this.socket.invoke('desubscribe', { userId, channel });
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._warn(`Failed to desubscribe: ${message}`);
		}
	}

	// get list of users (by ID) currently subscribed to the passed channel
	async getSubscribedUsers (channel) {
		const requestId = UUID();
		try {
			return await this.socket.invoke('getSubscribedUsers', { requestId, channel });
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._warn(`Failed to get subscribed users: ${message}`);
		}
	}

	disconnect () {
		this.socket.killAllListeners();
		this.socket.killAllReceivers();
		this.socket.killAllProcedures();
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
