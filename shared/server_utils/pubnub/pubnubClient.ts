// provides a pubnub wrapper client, sparing the caller some of the implementation details

'use strict';

import * as UUID from "uuid";
import * as Pubnub from "pubnub";

export interface PubnubClientOptions {
	pubnub: Pubnub,
	publishKey?: string,
	subscribeKey?: string,
	secretKey?: string,
	ssl?: boolean,
	keepAlive?: boolean,
	uuid?: string,
	authKey?: string
}

export interface PubnubPublishOptions {
	request?: any,
	logger?: any
}

export interface PubnubError {
	error: any
}

interface StatusPromise {
	resolve: () => void,
	reject: (error: PubnubError) => void
}

export type MessageListener = (message: { [key: string]: any }) => void;

export class PubnubClient {

	private _options: PubnubClientOptions;
	private _messageListeners: {
		[key: string]: MessageListener
	} = {};
	private _statusPromises: {
		[key: string]: StatusPromise
	} = {};
	private _statusTimeouts: {
		[key: string]: NodeJS.Timer
	} = {};
	private _pubnub: Pubnub;
	private _lastChannelSubscribed: string = '';

	constructor (options: PubnubClientOptions) {
		this._options = options;
		this._pubnub = options.pubnub;
	}

	init () {
		this._pubnub.addListener({
			message: this._handleMessage.bind(this),
			presence: this._handleMessage.bind(this),
			status: this._handleStatus.bind(this)
		});
	}

	// publish a message to the specified channel
	async publish (message: { [key: string]: any }, channel: string, options: PubnubPublishOptions = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log('Would have sent PubNub message to ' + channel, options);
			return;
		}
		message.messageId = message.messageId || UUID();
		const result = await this._pubnub.publish(
			{
				message: message,
				channel: channel
			}
		);
		if ((result as any).error) {
			throw (result as any).errorData;
		}
	}

	// subscribe to the specified channel, providing a listener callback for the
	// actual message ... the callback is just whether the subscribe succeeded
	async subscribe (channel: string, listener: MessageListener, options = {}) {
		// subscribe to the channel, but success or failure comes back in a
		// status message, handled by _handleStatus
		this._messageListeners[channel] = listener;
		this._statusTimeouts[channel] = setTimeout(() => {
			this._handleSubscribeTimeout(channel);
		}, 5000);
		this._lastChannelSubscribed = channel;
		this._pubnub.subscribe({ ...options, channels: [channel] });
		return new Promise((resolve, reject) => {
			this._statusPromises[channel] = { resolve, reject };
		});
	}

	// unsubscribe from the specified channel
	unsubscribe (channel: string) {
		this._pubnub.unsubscribe({
			channels: [channel]
		});
		this._stopListening(channel);
	}

	unsubscribeAll () {
		for (let channel in this._messageListeners) {
			this.unsubscribe(channel);
		}
	}

	// remove a listener for messages from a particular channel
	removeListener (channel: string) {
		this._stopListening(channel);
	}

/*
	// fetch the history for a particular channel
	async history (channel: string) {
		const response = await this._pubnub.history(
			{ channel: channel }
		);
		if (!response || !(response.messages instanceof Array)) {
			throw 'no messages array';
		}
		return response.messages.map(message => message.entry);
	}

	// grant read and/or write permission to the specified channel for the specified
	// set of tokens (keys)
	async grant (tokens: string | string[], channel: string, options = {}) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		tokens = tokens.filter(token => token.length > 0);
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			this._log(`Would have granted access for ${tokens} to ${channel}`, options);
			return;
		}
		else {
			this._log(`Granting access for ${tokens} to ${channel}`, options);
		}
		const result = await this._pubnub.grant(
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
	}

	// grant read and/or write permission to multiple channels for the specified token
	async grantMultiple (token: string, channels: string[], options = {}) {
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
	}

	async _grantMultipleHelper (token, channels, options) { 
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
	}

	// revoke read and/or write permission for the specified channel for the specified
	// set of tokens (keys)
	async revoke (tokens, channel, options = {}) {
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
	}

	// get list of users (by ID) currently subscribed to the passed channel
	async getSubscribedUsers (channel, options = {}) {
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
	}
*/

	// handle a message coming in on any channel
	_handleMessage (message: Pubnub.MessageEvent | Pubnub.PresenceEvent) {
		// check for a listener callback for that channel and pass on the message
		if (
			message.channel &&
			this._messageListeners[message.channel]
		) {
			this._messageListeners[message.channel](message);
		}
	}

	// handle a status message concerning any channel
	_handleStatus (status: Pubnub.StatusEvent | any) {
		if ((status as any).error) {
			// handle errors separately
			return this._handleStatusError(status as Pubnub.StatusEvent);
		}
		status = status as Pubnub.StatusEvent;

		// check for any channels for which we are waiting on a connection
		for (let channel in this._statusPromises) {
			if (
				status.subscribedChannels instanceof Array &&
				status.subscribedChannels.includes(channel)
			) {
				// successfully subscribed to this channel
				this._statusPromises[channel].resolve();
				return this._stopStatusListening(channel);
			}
		}
	}

	_handleStatusError (status: Pubnub.StatusEvent) {
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
				this._statusPromises[this._lastChannelSubscribed]
			) {
				const channel = this._lastChannelSubscribed;
				this._statusPromises[channel].reject((status as any).error);
				this._stopListening(channel);
			}
		}

	}
	// handle a channel that has not been successfully subscribed to after
	// a timeout period ... return a timeout error to the caller
	_handleSubscribeTimeout (channel: string) {
		if (this._statusPromises[channel]) {
			this._statusPromises[channel].reject({ error: 'timeout' });
			this._stopListening(channel);
		}
	}

	// stop listening for anything relevant to a particular channel, including
	// messages and status updates
	_stopListening (channel: string) {
		this._stopStatusListening(channel);
		delete this._messageListeners[channel];
	}

	// stop listening only to status updates for a particular channel
	_stopStatusListening (channel: string) {
		delete this._statusPromises[channel];
		if (this._statusTimeouts[channel]) {
			clearTimeout(this._statusTimeouts[channel]);
		}
		delete this._statusTimeouts[channel];
	}

	// determine if special header was sent with the request that says to block pubnub messages
	_requestSaysToBlockMessages (options: PubnubPublishOptions) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-message-sends']
		);
	}

	_log (message: string, options: PubnubPublishOptions) {
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

	_warn (message: string, options: PubnubPublishOptions) {
		if (
			options &&
			typeof options.request === 'object' &&
			typeof options.request.warn === 'function'
		) {
			options.request.warn(message);
		}
		else if (
			options &&
			typeof options.logger === 'object' &&
			typeof options.logger.warn === 'function'
		) {
			options.logger.warn(message);
		}
	}
}

