'use strict';

class PubNub_Broadcaster {

	constructor (options) {
		Object.assign(this, options);
	}

	publish (message, channel, callback) {
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

	subscribe (channel) {
		if (!this.have_listener) {
			this.pubnub.addListener({
				message: (m) => {
					console.warn('M: ' + JSON.stringify(m));
				}
			});
			this.have_pubnub_listener = true;
		}
		this.pubnub.subscribe({
			channels: [channel]
		});
	}

	handle_pubnub_message (message) {
		let stringified = JSON.stringify(message.messagE);
		console.warn(`MESSAGE FROM PUBNUB ON ${message.channel}: ${stringified}`);
	}

	unsubscribe (channel) {
		this.pubnub.unsubscribe({
			channels: [channel]
		});
	}
}

module.exports = PubNub_Broadcaster;
