// handle publishing a new or updated codemark to the appropriate messager channel

'use strict';

class CodemarkPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	async publishCodemark () {
		let channel;
		// for third-party codemarks, we have no stream channels, so we have to send
		// the update out over the team channel ... known security flaw, for now
		if (this.codemark.get('providerType')) {
			channel = `team-${this.codemark.get('teamId')}`;
		}
		else {
			const stream = this.stream || await this.request.data.streams.getById(this.codemark.get('streamId'));
			if (!stream) { return; } // sanity
			channel = stream.get('isTeamStream') ? 
				`team-${this.codemark.get('teamId')}` : 
				`stream-${stream.id}`;
		}
		const message = Object.assign({}, this.data, {
			requestId: this.request.request.id
		});
		try {
			await this.request.api.services.messager.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish codemark update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = CodemarkPublisher;
