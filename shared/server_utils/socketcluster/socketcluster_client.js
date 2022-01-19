// provides a socketcluster wrapper client, sparing the caller some of the implementation details

'use strict';

const SocketCluster = require('socketcluster-client');
const UUID = require('uuid').v4;
const EventEmitter = require('events');

// enable if we expect the broadcaster to acknowledge reception of messages from the API server
const AckServerMessages = true;

class SocketClusterClient extends EventEmitter {

	constructor (config = {}) {
		super();
		this.config = config;
		this.messageListeners = {};		// callbacks for each channel when message is received
		this.channelPromises = {};		// promises for channel subscriptions
		this.messageQueue = [];			// messages needing acknowledgement
	}

	async init () {
		await this._initHelper();
		this.haveStarted = true;
	}

	async _initHelper () {
		if (this.initing) { return; }
		this.initing = true;
		this._log('Initializing SocketCluster connection...');
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
			secure: !this.config.ignoreHttps,
			autoReconnect: true
		});
		(async () => {
			for await (let data of this.socket.listener('connectAbort')) {
				this._warn('SocketCluster connection aborted: ' + JSON.stringify(data));
				this.emit('setAlert', 'broadcasterConnectionFailure');
				if (this.socket) {
					this.socket.disconnect();
					delete this.socket;
				}
				if (this.haveStarted) {
					if (!this._disconnectInitTimeout) {
						this._disconnectInitTimeout = setTimeout(() => { 
							delete this._disconnectInitTimeout;
							this._initHelper(); 
						}, 3000);
					}
				}
			}
		})();
		if (!await this.authorizeConnection()) {
			return false; 
		}

		// upon a successful connection, check if we have any unacknowledged messages, that may have been
		// missed due to a broadcaster restart ... if so, transmit the first of those messages, once
		// we get an acknowledgement we will drain the queue
		if (AckServerMessages && this.socket && this.messageQueue.length > 0) {
			const unacknowledgedMessage = this.messageQueue[0];
			if (unacknowledgedMessage) {
				const { channel, message, options } = unacknowledgedMessage;
				this._log(`Publishing unacknowledged message ${message.messageId} on channel ${channel}`);
				await this.publish(message, channel, { ...options, force: true });
			}
		}

		this.initing = false;
		this.emit('clearAlert', 'broadcasterConnectionFailure');
	}

	// drain the message queue by publishing all messages
	async drainMessageQueue () {
		this._log(`Draining message queue of ${this.messageQueue.length} messages...`);
		while (this.messageQueue.length > 0) {
			const unacknowledgedMessage = this.messageQueue.shift();
			const { channel, message, options } = unacknowledgedMessage;
			this._log(`Publishing unacknowledged message ${message.messageId} on channel ${channel}`);
			await this.publish(message, channel, options);
		
			await new Promise(r => {
				setTimeout(r, 100);
			});
		}
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

			if (AckServerMessages) {
				(async () => {
					// we expect an acknowledgement of messages sent, this appears to be the only way
					// to handle a dropped connection due to a broadcaster restart
					for await (let data of this.socket.receiver('ack')) {
						this.emit('clearAlert', 'broadcasterAcknowledgementFailure');
						for (let i in this.messageQueue) {
							if (this.messageQueue[i].message.messageId === data) {
								clearTimeout(this.messageQueue[i].timeout);
								if (this.messageQueue[i].channel !== 'echo') {
									this._log(`Message ${data} was acknowledged`);
								}
								this.messageQueue.splice(i, 1);
								break;
							}
						}
						if (this.ackFailureInProgress && this.messageQueue.length > 0) {
							this.ackFailureInProgress = false;
							this.drainMessageQueue();
						}
					}
				})();
			}

			this._log('Socketcluster connection authorized');
			this._authed = true;
			return true;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			if (this.socket) {
				this.socket.disconnect();
				delete this.socket;
			}
			this.initing = false;
			this.emit('setAlert', 'broadcasterConnectionFailure');
			if (!this.haveStarted) {
				throw `Socketcluster authorization error: ${message}`;
			} else {
				return false;
			}
		}
	}

	// publish a message to the specified channel
	async publish (message, channel, options = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking SocketCluster messages, for testing purposes
			this._log('Would have sent SocketCluster message to ' + channel);
			return;
		}
		if (!this.socket) {
			this._warn('No active socket, cannot publish to ' + channel);
			return;
		}

		let messageId;
		if (typeof message === 'object') {
			messageId = message.messageId = message.messageId || UUID();
		} else if (typeof message === 'string') {
			messageId = message;
		}

		let timeout = null;
		if (this.ackFailureInProgress && !options.force && channel !== 'echo') {
			this._warn(`Ack failure in progress, will not transmit message ${messageId} until a message is acknowledged`);
		} else {
			if (channel !== 'echo') {
				this._log(`Transmitting message ${messageId} for channel ${channel} to SocketCluster server...`);
			}
			await this.socket.transmit('message', { channel, message });
			if (channel !== 'echo') {
				this._log(`Published ${messageId} to ${channel}`);
			}
		
			// wait for acknowledgement that the message has been received by the broadcaster,
			// this appears to be the only way to ensure message reception in case the connection is dropped,
			// which can happen if the broadcaster is restarted
			if (typeof message !== 'object') { return; }

			if (AckServerMessages) {
				timeout = setTimeout(() => {
					this.emit('setAlert', 'broadcasterAcknowledgementFailure');
					this._warn(`Message ${messageId} to broadcaster was not acknowledged, will re-initiate the connection`);
					if (this.socket) {
						this.socket.disconnect();
						delete this.socket;
					}
					this._initHelper();
					this.ackFailureInProgress = true;
				}, 3000);
			}
		}

		if (AckServerMessages) {
			if (this.messageQueue.length >= 1000) {
				const unacknowledgedMessage = this.messageQueue.shift();
				this._warn(`Message queue is full, unacknowledged message ${unacknowledgedMessage.message.id} must be dropped`);
			}
			if (options.force) {
				this.messageQueue[0].timeout = timeout;
			} else {
				this.messageQueue.push({ message, channel, timeout, options});
			}
		}
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
			this._log(`Would have revoked access for ${userId} to ${channel}`);
			return;
		}
		this._log(`Revoking access for ${userId} to ${channel}`);
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
		throw 'getSubscribedUsers is no longer supported';
		/*
		const requestId = UUID();
		try {
			return await this.socket.invoke('getSubscribedUsers', { requestId, channel });
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._warn(`Failed to get subscribed users: ${message}`);
		}
		*/
	}

	disconnect () {
		if (this.socket) {
			this.socket.killAllListeners();
			this.socket.killAllReceivers();
			this.socket.killAllProcedures();
			this.socket.disconnect();
		}
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
