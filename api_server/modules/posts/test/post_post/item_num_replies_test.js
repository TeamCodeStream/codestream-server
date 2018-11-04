'use strict';

const PostReplyTest = require('./post_reply_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class ItemNumRepliesTest extends PostReplyTest {

	get description () {
		return 'parent post\'s item should get its numReplies attribute incremented when a reply is created for a post with an item';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantItem = true;
			callback();
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkItem	// ...we'll check the item
		], callback);
	}

	// check the item associated with the parent post
	checkItem (callback) {
		// get the item
		this.doApiRequest(
			{
				method: 'get',
				path: '/items/' + this.postData[0].item._id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented
				Assert.equal(response.item.numReplies, 1, 'numReplies should be 1');
				callback();
			}
		);
	}
}

module.exports = ItemNumRepliesTest;
