// handle the PUT /markers request to edit attributes of a marker

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');

class PutMarkerRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the marker, only someone on the team can update it
		this.marker = await this.data.markers.getById(this.request.params.id);
		if (!this.marker) {
			throw this.errorHandler.error('notFound', { info: 'marker' });
		}
		if (!this.user.hasTeam(this.marker.get('teamId'))) {
			throw this.errorHandler.error('updateAuth');
		}
	}

	// after the marker is updated...
	async postProcess () {
		await this.publishMarker();
	}

	// publish the marker to the appropriate messager channel(s)
	async publishMarker () {
		const teamId = this.marker.get('teamId');
		const channel = 'team-' + teamId;
		const message = {
			marker: this.responseData.marker,
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish marker message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'User must be a member of the team that owns the file stream to which the marker belongs';
		description.input = {
			summary: description.input,
			looksLike: {
				'commitHashWhenCreated': '<If specified, updates the original commit hash for which this marker was created>'
			}
		};
		description.publishes = {
			summary: 'Publishes the updated marker attributes to the team channel for the team that owns the file stream the marker is associated with; if the marker is referenced by a post in a stream that is not a file stream, the updated marker is also published to the stream channel for that stream',
			looksLike: {
				'marker': '<@@#marker object#marker@@>'
			}
		};
		return description;
	}
}

module.exports = PutMarkerRequest;
