'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class ReplyToNonNRObjectReplyTest extends CreateNRCommentTest {

	get description () {
		return 'should return an error when trying to reply to a post that is a reply to a post that is not associated with an NR object';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodemark: true,
				wantMarkers: 1
			});
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'POST-1007',
			reason: 'the parent post is a reply to an object that does not match the object referenced in the submitted reply'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createReply
		], callback);
	}

	createReply (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					text: RandomString.generate(100),
					streamId: this.teamStream.id,
					parentPostId: this.postData[0].post.id
				},
				token: this.token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.data.parentPostId = response.post.id;
				callback();
			}
		);
	}
}

module.exports = ReplyToNonNRObjectReplyTest;
