// provides a pubnub wrapper client, sparing the caller some of the implementation details

'use strict';

const UUID = require('uuid').v4;

 // PubNub claims a 32KB limit on payload, but experimentation indicates it is a good deal lower than this,
 // not sure what accounts for the difference, but setting a very safe limit here just in case
const MAX_MESSAGE_LENGTH = 10000;
const MAX_MESSAGE_SLICE_LIMIT = 1000; // effecively setting a 10MB upper limit on the total message size

class PubNubClient {

	constructor (options) {
		Object.assign(this, options);
		this.messageListeners = {};		// callbacks for each channel when message is received
		this.statusPromises = {};		// callbacks for each channel indicating subscibe success or failure
		this.statusTimeouts = {};		// timeouts for attempts to subscribe
	}

	async init () {
		this.pubnub.addListener({
			message: this._handleMessage.bind(this),
			presence: this._handleMessage.bind(this),
			status: this._handleStatus.bind(this)
		});
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

		const json = JSON.stringify(message);
		if (json.length > MAX_MESSAGE_LENGTH) {
			return await this.publishParts(json, channel);
		}

		this._log(`Transmitting message ${message.messageId} for channel ${channel} to Pubnub server, ${json.length} bytes...`, options);
		if (json.length > 2000) {
			this._log('NOTE: Message is more than 2K bytes', options);
		}
		const result = await this.pubnub.publish(
			{
				message: message,
				channel: channel,
				sendByPost: true
			}
		);
		this._log(`Published ${message.messageId} to ${channel}`, options);

		if (result.error) {
			throw result.errorData;
		}
	}

	// publish a long message in parts
	async publishParts (json, channel) {
		const fullMessageId = UUID();
		let n = 0;
		let totalParts = Math.floor(json.length / MAX_MESSAGE_LENGTH) + 1;
		if (json.length % MAX_MESSAGE_LENGTH === 0) {
			totalParts--;
		}

		while (json.length > 0 && n < MAX_MESSAGE_SLICE_LIMIT) {
			const part = json.slice(0, MAX_MESSAGE_LENGTH);
			json = json.slice(MAX_MESSAGE_LENGTH);
			if (part.length > 0) {
				const partialMessage = {
					messageId: UUID(),
					fullMessageId,
					part: n,
					totalParts,
					message: part
				};
				const result = await this.pubnub.publish(
					{
						message: partialMessage,
						channel: channel,
						sendByPost: true
					}
				);
				if (result.error) {
					throw result.errorData;
				}
			}
			n++;
		}
	}

	// subscribe to the specified channel, providing a listener callback for the
	// actual message ... returns a promise for when the subscribe is confirmed
	subscribe (channel, listener, options = {}) {
		// subscribe to the channel, but success or failure comes back in a
		// status message, handled by _handleStatus
		this.messageListeners[channel] = listener;
		const promise = new Promise((resolve, reject) => {
			this.statusPromises[channel] = { resolve, reject };
		});
		this.statusTimeouts[channel] = setTimeout(() => {
			this._handleSubscribeTimeout(channel);
		}, 5000);
		this._lastChannelSubscribed = channel;
		this.pubnub.subscribe(Object.assign({}, options, {
			channels: [channel]
		}));
		return promise;
	}

	// unsubscribe from the specified channel
	unsubscribe (channel) {
		this.pubnub.unsubscribe({
			channels: [channel]
		});
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

	// grant read and/or write permission to the specified channel for the specified
	// set of tokens (keys)
	async grant (tokens, channel, options = {}) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		tokens = tokens.filter(token => typeof token === 'string' && token.length > 0);
		const displayTokens = tokens.map(token => {
			const len = token.length;
			return `${token.slice(0, 6)}${'*'.repeat(len-12)}${token.slice(-6)}`;
		});
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have granted access for ${displayTokens} to ${channel}`, options);
			return;
		}
		else {
			this._log(`Granting access for ${displayTokens} to ${channel}`, options);
		}

		return this._grantMultipleHelper(tokens, [channel], options);

		/*
		return Promise.all(tokens.map(async token => {
			const channels = [channel];
			//if (options.includePresence) {
			//	channels.push(`${channel}-pnpres`);
			//}
			await this._grantMultipleHelper(token, channels, options);
		}));
		*/
	}

	// grant read and/or write permission to multiple channels for the specified token
	async grantMultiple (token, channels, options = {}) {
		const channelNames = channels.reduce((currentChannels, channel) => {
			if (typeof channel === 'object' && typeof channel.name === 'string') {
				currentChannels.push(channel.name);
				/*
				if (channel.includePresence) {
					currentChannels.push(`${channel.name}-pnpres`);
				}
				*/
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
				await this._grantMultipleHelper([token], channelSlice, options);
			}
		}
	}

	async _grantMultipleHelper (tokens, channels, options) {
		let result;
		let retries = 0;
		let lastError;
		const displayTokens = tokens.map(token => {
			const len = token.length;
			return `${token.slice(0, 6)}${'*'.repeat(len-12)}${token.slice(-6)}`;
		});
		while (retries < 3) {
			try {
				lastError = null;
				result = await this.pubnub.grant(
					{
						channels,
						authKeys: tokens,
						read: options.read === false ? false : true,
						write: options.write === true ? true : false,
						ttl: options.ttl || 0
					}
				);
			}
			catch (error) {
				this._warn(`Failed to grant access for ${JSON.stringify(displayTokens)} to ${JSON.stringify(channels, undefined, 3)}, retry #${retries}: ${JSON.stringify(error)}`, options);
				lastError = error;
				retries++;
			}

			if (!lastError && result.error) {
				this._warn(`Unable to grant access for ${JSON.stringify(displayTokens)} to ${JSON.stringify(channels, undefined, 3)}, retry #${retries}: ${JSON.stringify(result.errorData)}`, options);
				lastError = result.errorData;
				retries++;
			}
			else if (!lastError) {
				break;
			}
		}
		if (lastError) {
			throw lastError;
		}
		this._log(`Successfully granted access for ${JSON.stringify(displayTokens)} to ${JSON.stringify(channels, undefined, 3)}`, options);
	}

	// grant access via PubNub's V3 Access Manager
	// other methods of granting access to V2 should be deprecated once clients are fully upgraded to use V3 tokens
	async grantMultipleV3 (userId, channels, options = {}) {
		const channelsObject = channels.reduce((obj, channel) => {
			const name = typeof channel === 'object' ? channel.name : channel;
			obj[name] = { read: true };
			return obj;
		}, {});

		try {
			const token = await this.pubnub.grantToken({
				ttl: 43200,
				authorized_uui: userId,
				resources: {
					channels: channelsObject
				}
			});
			return token;
		} catch (error) {
			const message = `Failed to grant access for ${userId} to ${JSON.stringify(channels, undefined, 3)}: ${JSON.stringify(error.status)}`;
			this._warn(message, options);
			throw new Error(message);
		}
	}

	// revoke read and/or write permission for the specified channel for the specified
	// set of tokens (keys)
	async revoke (tokens, channel, options = {}) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		const displayTokens = tokens.map(token => {
			const len = token.length;
			return `${token.slice(0, 6)}${'*'.repeat(len-12)}${token.slice(-6)}`;
		});
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have revoked access for ${displayTokens} to ${channel}`, options);
			return;
		}
		this._log(`Revoking access for ${displayTokens} to ${channel}`, options);
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
			this._warn(`Unable to revoke access for ${displayTokens} to ${channel}: ${JSON.stringify(result.errorData)}`, options);
			throw result.errorData;
		}
		this._log(`Successfully revoked access for ${displayTokens} to ${channel}`, options);
		/*
		if (options.includePresence) {
			// doing presence requires revoking access to this channel as well
			await this.revoke(tokens, channel + '-pnpres', { request: options.request });
		}
		*/
	}

	// get list of users (by ID) currently subscribed to the passed channel
	async getSubscribedUsers (channel, options = {}) {
		throw 'getSubscribedUsers is no longer supported';
		/*
		const response = await this.pubnub.hereNow(
			{
				channels: [channel],
				includeUUIDs: true
			}
		);
		if (
			typeof response.channels !== 'object' ||
			typeof response.channels[channel] !== 'object' ||
			!(response.channels[channel].occupants instanceof Array)
		) {
			throw 'unable to obtain occupants';
		}
		const userIds = response.channels[channel].occupants.map(occupant => {
			return occupant.uuid.split('/')[0];
		});
		this._log(`Here now for ${channel}: ${userIds}`, options);
		return userIds;
		*/
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

	// handle a status message concerning any channel
	_handleStatus (status) {
		if (status.error) {
			// handle errors separately
			return this._handleStatusError(status);
		}

		// check for any channels for which we are waiting on a connection
		for (let channel in this.statusPromises) {
			if (
				status.subscribedChannels instanceof Array &&
				status.subscribedChannels.includes(channel)
			) {
				// successfully subscribed to this channel
				this.statusPromises[channel].resolve();
				return this._stopStatusListening(channel);
			}
		}
	}

	_handleStatusError (status) {
		// look for a subscribe error, but also a heartbeat error (which sometimes
		// is the only message we get if there is a failure)
		if (
			status.operation === 'PNSubscribeOperation' ||
			status.operation === 'PNHeartbeatOperation'
		) {
			// this sucks ... pubnub does not send us the channel that failed,
			// meaning that if we try to subscribe to two channels around the same
			// time, we can't know which one this is a status error for ...
			// we'll assume it is the last channel subscribed (which is not a great
			// assumption) ... but we'll have timeouts in place for other channnels.
			// The gist of this is that you really can't subscribe to two channels
			// at the same time, you have to wait for one to be successful before
			// you can subscribe to the next (otherwise if one fails, and it is NOT
			// the last one, we'll show the other one as failing).
			// Like I said ... that REALLY SUCKS.
			if (
				this._lastChannelSubscribed &&
				this.statusPromises[this._lastChannelSubscribed]
			) {
				let channel = this._lastChannelSubscribed;
				this.statusPromises[channel].reject(status);
				this._stopListening(channel);
			}
		}

	}
	// handle a channel that has not been successfully subscribed to after
	// a timeout period ... return a timeout error to the caller
	_handleSubscribeTimeout (channel) {
		if (this.statusPromises[channel]) {
			this.statusPromises[channel].reject({ error: 'timeout' });
			this._stopListening(channel);
		}
	}

	// stop listening for anything relevant to a particular channel, including
	// messages and status updates
	_stopListening (channel) {
		this._stopStatusListening(channel);
		delete this.messageListeners[channel];
	}

	// stop listening only to status updates for a particular channel
	_stopStatusListening (channel) {
		delete this.statusPromises[channel];
		if (this.statusTimeouts[channel]) {
			clearTimeout(this.statusTimeouts[channel]);
		}
		delete this.statusTimeouts[channel];
	}

	disconnect () {
		this.pubnub.disconnect();
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

	_log (message, options) {
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

	_warn (message, options) {
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

module.exports = PubNubClient;

