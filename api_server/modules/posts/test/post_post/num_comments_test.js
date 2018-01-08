'use strict';

var PostReplyTest = require('./post_reply_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class NumCommentsTest extends PostReplyTest {

	get description () {
		return 'parent post\'s marker should get its numComments attribute incremented when a reply is created for a post';
	}

	// make options to use when creating the test post
	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = true;	// want a code block, then we'll check the marker
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

	// check the marker associated with the code block sent with the post reply
	checkMarker (callback) {
		// get the marker for the code block
		this.doApiRequest(
			{
				method: 'get',
				path: '/markers/' + this.otherPostData.post.codeBlocks[0].markerId,
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
