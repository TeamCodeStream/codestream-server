'use strict';

const GetPostTest = require('./get_post_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetReplyToCodeErrorTest extends GetPostTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			wantCodeError: true,
			creatorIndex: 0
		});
	}

	get description () {
		return 'should return a valid post with a code error when requesting a post created with an attached code error';
	}

	// get the fields expected to be returned by the request being tested
	getExpectedFields () {
		// no teamId in code error posts
		const expectedFields = [...(super.getExpectedFields().post)];
		const idx = expectedFields.findIndex(field => field === 'teamId'); 
		expectedFields.splice(idx, 1);
		return { post: expectedFields };
	}
	
	// before the test is run...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.claimCodeError,
			this.createReply
		], callback);
	}

	// claim code error for the team, as requested
	claimCodeError (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + this.team.id,
				data: {
					objectId: this.postData[0].codeError.objectId,
					objectType: this.postData[0].codeError.objectType
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// reply to the code error
	createReply (callback) {
		const token = this.replyFromUser ? this.users[this.replyFromUser].accessToken : this.token;
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.postData[0].post.id,
					streamId: this.postData[0].post.streamId,
					text: RandomString.generate(100)
				},
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				this.path = '/posts/' + this.post.id;
				callback();
			}
		);
	}
}

module.exports = GetReplyToCodeErrorTest;
