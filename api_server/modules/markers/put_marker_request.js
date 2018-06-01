// handle the PUT /markers request to edit attributes of a marker

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const MarkerPublisher = require('./marker_publisher');

class PutMarkerRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the marker, only someone on the team can update it
		const marker = await this.data.markers.getById(this.request.params.id);
		if (!marker) {
			throw this.errorHandler.error('notFound', { info: 'marker' });
		}
		if (!this.user.hasTeam(marker.get('teamId'))) {
			throw this.errorHandler.error('updateAuth');
		}
	}

	// after the marker is updated...
	async postProcess () {
		await this.publishMarker();
	}

	// publish the marker to the appropriate messager channel(s)
	async publishMarker () {
		await new MarkerPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.updater.stream,
			postStream: this.updater.postStream
		}).publishMarker();
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
