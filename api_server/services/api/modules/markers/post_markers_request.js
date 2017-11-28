'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var MarkerPublisher = require('./marker_publisher');

class PostMarkerRequest extends PostRequest {

	authorize (callback) {
		if (!this.request.body.teamId) {
			return callback(this.errorHandler.error('attributeRequired', { info: 'teamId' }));
		}
		let teamId = decodeURIComponent(this.request.body.teamId).toLowerCase();
		if (!this.request.body.streamId) {
			return callback(this.errorHandler.error('attributeRequired', { info: 'streamId' }));
		}
		let streamId = decodeURIComponent(this.request.body.streamId).toLowerCase();
		this.user.authorizeStream(streamId, this, (error, stream) => {
			if (error) { return callback(error); }
			if (!stream) {
				return callback(this.errorHandler.error('createAuth'));
			}
			if (stream.get('teamId') !== teamId) {
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			process.nextTick(callback);
		});
	}

	postProcess (callback) {
		this.publishMarker(callback);
	}

	publishMarker (callback) {
		new MarkerPublisher({
			data: this.responseData,
			requestId: this.request.id,
			messager: this.api.services.messager,
			stream: this.creator.stream.attributes,
			logger: this
		}).publishMarker(callback);
	}
}

module.exports = PostMarkerRequest;
