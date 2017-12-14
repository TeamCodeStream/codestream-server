'use strict';

var PostReplyTest = require('./post_reply_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class NumCommentsTest extends PostReplyTest {

	get description () {
		return 'parent post\'s marker should get its numComments attribute incremented when a reply is created for a post';
	}

	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = true;
			callback();
		});
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.checkMarker
		], callback);
	}

	checkMarker (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/markers/' + this.otherPostData.post.codeBlocks[0].markerId,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.marker.numComments === 2, 'numComments is not 2, it is ' + response.marker.numComments);
				callback();
			}
		);
	}
}

module.exports = NumCommentsTest;
