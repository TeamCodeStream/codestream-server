'use strict';

const SetPostIdTest = require('./set_post_id_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const Assert = require('assert');

class UpdateMarkerTest extends SetPostIdTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return 'when updating a postless codemark with post ID and stream ID, any marker referenced by the codemark should also get updated';
	}

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(() => {
			this.expectedData.markers = [{
				_id: this.codemark.markerIds[0],
				$set: {
					postStreamId: this.data.streamId,
					postId: this.data.postId,
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
		Assert(data.markers[0].$set.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		this.expectedData.markers[0].$set.modifiedAt = data.markers[0].$set.modifiedAt;
		super.validateResponse(data);
	}
}

module.exports = UpdateMarkerTest;