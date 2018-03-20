// handle the PUT /markers request to edit attributes of a marker

'use strict';

var PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
var MarkerPublisher = require('./marker_publisher');

class PutMarkerRequest extends PutRequest {

	// authorize the request for the current user
	authorize (callback) {
		// get the marker, only someone on the team can update it
		this.data.markers.getById(
			this.request.params.id,
			(error, marker) => {
				if (error) { return callback(error); }
				if (!marker) {
					return callback(this.errorHandler.error('notFound', { info: 'marker' }));
				}
				if (!this.user.hasTeam(marker.get('teamId'))) {
					return callback(this.errorHandler.error('updateAuth'));
				}
				return callback();
			}
		);
	}

	// after the marker is updated...
	postProcess (callback) {
		this.publishMarker(callback);
	}

	// publish the marker to the appropriate messager channel(s)
	publishMarker (callback) {
		new MarkerPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.updater.stream,
			postStream: this.updater.postStream
		}).publishMarker(callback);
	}
}

module.exports = PutMarkerRequest;
