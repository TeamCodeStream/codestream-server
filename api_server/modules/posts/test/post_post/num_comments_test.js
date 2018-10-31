'use strict';

const PostReplyTest = require('./post_reply_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class NumCommentsTest extends PostReplyTest {

	get description () {
		return 'parent post\'s marker should get its numComments attribute incremented when a reply is created for a post';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantMarker = true;
			this.streamOptions.type = 'file';
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkMarker	// ...we'll check the marker
		], callback);
	}

	// check the marker associated with the marker sent with the post reply
	checkMarker (callback) {
		// get the marker for the marker
		this.doApiRequest(
			{
				method: 'get',
				path: '/markers/' + this.postData[0].post.markers[0].markerId,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numComments attribute has been incremented
				Assert(response.marker.numComments === 2, 'numComments is not 2, it is ' + response.marker.numComments);
				callback();
			}
		);
	}
}

module.exports = NumCommentsTest;
