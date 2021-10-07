// handle publishing a new or updated code code error to the appropriate broadcaster channel

'use strict';

class CodeErrorPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	async publishCodeError () {
		const channel = `object-${this.codeError.id}`;
		const message = Object.assign({}, this.data, {
			requestId: this.request.request.id
		});
		try {
			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish code error update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = CodeErrorPublisher;
