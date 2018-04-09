// handle publishing an edited marker to the messager channel(s)
// since a marker can refer to code referenced by one stream (a file stream),
// and can be used in a different stream (any kind of stream), a message
// might need to go out to both streams

'use strict';

class MarkerPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish the marker to the team that owns the file-stream the marker is
	// associated with, and potentially to the stream channel for the stream that
	// is referencing the marker, if needed
	async publishMarker () {
		await this.publishToTeam();
		await this.publishToStream();
	}

	// publish an updated marker to the team channel for the file-stream the
	// marker is associated with
	async publishToTeam () {
		const teamId = this.stream.get('teamId');
		const channel = 'team-' + teamId;
		const message = {
			marker: this.data.marker,
			requestId: this.request.request.id
		};
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish marker message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish the updated marker to the channel for the stream that actually
	// references the marker, if it is not a file-type stream (for which only
	// a team update would be necessary anyway)
	async publishToStream () {
		if (!this.postStream || this.postStream.get('type') === 'file') {
			return;
		}
		const streamId = this.postStream.id;
		const channel = 'stream-' + streamId;
		const message = {
			marker: this.data.marker,
			requestId: this.request.request.id
		};
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish marker message to stream ${streamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = MarkerPublisher;
