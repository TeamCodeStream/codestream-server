'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ReplyTest extends GetNRCommentTest {

	get description () {
		return 'should return a New Relic comment when requested, if the comment is a reply to another comment';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createNRComment // this ends up creating a reply to the first comment
		], callback);
	}

	// form the data for the generating the NewRelic comment
	makeNRCommentData () {
		// the first time, generate a regular comment, but the second time, make the comment a reply
		// to the first comment
		if (!this.nrCommentResponse) {
			return super.makeNRCommentData();
		} else {
			const data = this.nrCommentFactory.getRandomNRCommentData(this.nrCommentOptions);
			const { post } = this.nrCommentResponse;
			Object.assign(data, {
				objectId: post.objectId,
				objectType: post.objectType,
				accountId: post.accountId,
				parentPostId: post.id 
			});
			return data;
		}
	}
}

module.exports = ReplyTest;
