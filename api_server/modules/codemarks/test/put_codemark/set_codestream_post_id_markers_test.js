'use strict';

const SetCodeStreamPostIdTest = require('./set_codestream_post_id_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const Assert = require('assert');

class SetCodeStreamPostIdMarkersTest extends SetCodeStreamPostIdTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return 'when updating a postless codemark with codestream post ID, any marker referenced by the codemark should also get updated';
	}

	createPost (callback) {
		super.createPost(error => {
			if (error) { return callback(error); }
			this.expectedData.markers = [{
				_id: this.codemark.markerIds[0],	// DEPRECATE ME
				id: this.codemark.markerIds[0],
				$set: {
					postStreamId: this.stream.id,
					postId: this.post.id,
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
			this.expectedMarker = DeepClone(this.markers[0]);
			Object.assign(this.expectedMarker, this.expectedData.markers[0].$set);
			callback();
		});
	}

	validateResponse (data) {
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(data.markers[0].$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		this.expectedData.markers[0].$set.modifiedAt = data.markers[0].$set.modifiedAt;
		super.validateResponse(data);
	}
}

module.exports = SetCodeStreamPostIdMarkersTest;