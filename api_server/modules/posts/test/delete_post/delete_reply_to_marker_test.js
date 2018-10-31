'use strict';

const DeletePostTest = require('./delete_post_test');
const Assert = require('assert');

class DeleteReplyToMarkerTest extends DeletePostTest {

	get description () {
		return 'should decrement numComments for the marker when a reply to a marker post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 2,
				postData: [
					{ wantMarker: 1 },
					{ replyTo: 0 }
				]
			});
			this.testPost = 1;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedMarker = {
			_id: this.postData[0].post.markers[0].markerId,
			$set: {
				version: 3
			},
			$version: {
				before: 2,
				after: 3
			},
			$inc: {
				numComments: -1
			}
		};
		Assert.deepEqual(data.markers[0], expectedMarker, 'expected marker op is not correct');
		delete data.markers;
		super.validateResponse(data);
	}
}

module.exports = DeleteReplyToMarkerTest;
