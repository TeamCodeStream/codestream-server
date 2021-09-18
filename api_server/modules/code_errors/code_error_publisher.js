// handle publishing a new or updated code code error to the appropriate broadcaster channel

'use strict';

class CodeErrorPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	async publishCodeError () {
		let channel;
		const stream = this.stream || await this.request.data.streams.getById(this.codeError.get('streamId'));
		if (!stream) { return; } // sanity
		if (!stream.get('isTeamStream')) {
			throw 'stream channels are deprecated';
		}
		channel = `team-${this.codeError.get('teamId')}`;
		/*
		channel = stream.get('isTeamStream') ? 
			`team-${this.codeError.get('teamId')}` : 
			`stream-${stream.id}`;
		*/
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
