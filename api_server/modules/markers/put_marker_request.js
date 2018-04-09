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
}

module.exports = PutMarkerRequest;
