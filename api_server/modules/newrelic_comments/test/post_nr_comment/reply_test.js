'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ReplyTest extends CreateNRCommentTest {

	get description () {
		return 'should be able to reply, via the New Relic comment engine, to a code error previously created through the comment engine';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.makeReplyData
		], callback);
	}

	makeReplyData (callback) {
		const { post } = this.nrCommentResponse;
		this.data = {
			...this.requestData,
			accountId: post.accountId,
			objectId: post.objectId,
			objectType: post.objectType,
			parentPostId: post.id
		};
		this.expectedResponse.post.seqNum++;
		callback();
	}
}

module.exports = ReplyTest;
