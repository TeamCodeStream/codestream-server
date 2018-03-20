// provides a pubnub wrapper client, sparing the caller some of the implementation details

'use strict';

class PubNubClient {

	constructor (options) {
		Object.assign(this, options);
		this.messageListeners = {};		// callbacks for each channel when message is received
		this.statusCallbacks = {};		// callbacks for each channel indicating subscibe success or failure
		this.statusTimeouts = {};		// timeouts for attempts to subscribe
		this.pubnub.addListener({
			message: this._handleMessage.bind(this),
			presence: this._handleMessage.bind(this),
			status: this._handleStatus.bind(this)
		});
	}

	// publish a message to the specified channel
	publish (message, channel, callback, options = {}) {
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			if (options.request) {
				options.request.log('Would have sent PubNub message to ' + channel);
				return callback();
			}
		}
		this.pubnub.publish(
			{
				message: message,
				channel: channel
			},
			(result) => {
				if (result.error) {
					return callback(result.errorData);
				}
				else {
					return callback();
				}
			}
		);
	}

	// subscribe to the specified channel, providing a listener callback for the
	// actual message ... the callback is just whether the subscribe succeeded
	subscribe (channel, listener, callback, options = {}) {
		// subscribe to the channel, but success or failure comes back in a
		// status message, handled by _handleStatus
		this.messageListeners[channel] = listener;
		this.statusCallbacks[channel] = callback;
		this.statusTimeouts[channel] = setTimeout(() => {
			this._handleSubscribeTimeout(channel);
		}, 5000);
		this._lastChannelSubscribed = channel;
		this.pubnub.subscribe(Object.assign({}, options, {
			channels: [channel]
		}));
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
	history (channel, callback) {
		this.pubnub.history(
			{ channel: channel },
			(status, response) => {
				if (status.error) {
					return callback(status.errorData);
				}
				else if (!response || !(response.messages instanceof Array)) {
					return callback('no messages array');
				}
				callback(null, response.messages.map(message => message.entry));
			}
		);
	}

	// grant read and/or write permission to the specified channel for the specified
	// set of tokens (keys)
	grant (tokens, channel, callback, options = {}) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		if (this._requestSaysToBlockMessages(options)) {
			// we are blocking PubNub messages, for testing purposes
			if (options.request) {
				options.request.log(`******* Would have granted access for ${tokens} to ${channel}`);
				return callback();
			}
		}
		else if (options.request) {
			options.request.log(`Granting access for ${tokens} to ${channel}`);
		}
		this.pubnub.grant(
			{
				channels: [channel],
				authKeys: tokens,
				read: options.read === false ? false: true,
				write: options.write === true ? true : false,
				ttl: options.ttl || 0
			},
			(result) => {
				if (result.error) {
					if (options.request) {
						options.request.warn(`Unable to grant access for ${tokens} to ${channel}: ${JSON.stringify(result.errorData)}`);
					}
					return callback(result.errorData);
				}
				else {
					if (options.request) {
						options.request.log(`Successfully granted access for ${tokens} to ${channel}`);
					}
					if (options.includePresence) {
						// doing presence requires granting access to this channel as well
						this.grant(tokens, channel + '-pnpres', callback, { request: options.request });
					}
					else {
						return callback();
					}
				}
			}
		);
	}

	// revoke read and/or write permission for the specified channel for the specified
	// set of tokens (keys)
	revoke (tokens, channel, callback) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		this.pubnub.grant(
			{
				channels: [channel],
				authKeys: tokens,
				read: false,
				write: false,
				manage: false
			},
			(result) => {
				if (result.error) {
					return callback(result.errorData);
				}
				else {
					return callback();
				}
			}
		);
	}

	// get list of users (by ID) currently subscribed to the passed channel
	getSubscribedUsers (channel, callback, options = {}) {
		this.pubnub.hereNow(
			{
				channels: [channel],
				includeUUIDs: true
			},
			(status, response) => {
				if (status.error) {
					return callback(status.errorData);
				}
				if (
					typeof response.channels !== 'object' ||
					typeof response.channels[channel] !== 'object' ||
					!(response.channels[channel].occupants instanceof Array)
				) {
					return callback('unable to obtain occupants');
				}
				let userIds = response.channels[channel].occupants.map(occupant => {
					return occupant.uuid.split('/')[0];
				});
				if (options.request) {
					options.request.log(`Here now for ${channel}: ${userIds}`);
				}
				callback(null, userIds);
			}
		);
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
		for (let channel in this.statusCallbacks) {
			if (
				status.subscribedChannels instanceof Array &&
				status.subscribedChannels.indexOf(channel) !== -1
			) {
				// successfully subscribed to this channel
				this.statusCallbacks[channel]();
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
				this.statusCallbacks[this._lastChannelSubscribed]
			) {
				let channel = this._lastChannelSubscribed;
				this.statusCallbacks[channel](status);
				this._stopListening(channel);
			}
		}

	}
	// handle a channel that has not been successfully subscribed to after
	// a timeout period ... return a timeout error to the caller
	_handleSubscribeTimeout (channel) {
		if (this.statusCallbacks[channel]) {
			this.statusCallbacks[channel]({ error: 'timeout' });
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
		delete this.statusCallbacks[channel];
		if (this.statusTimeouts[channel]) {
			clearTimeout(this.statusTimeouts[channel]);
		}
		delete this.statusTimeouts[channel];
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

}

module.exports = PubNubClient;
