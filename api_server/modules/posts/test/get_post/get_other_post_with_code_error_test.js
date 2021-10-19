'use strict';

const GetPostWithCodeErrorTest = require('./get_post_with_code_error_test');
const RandomString = require('randomstring');

class GetOtherPostWithCodeErrorTest extends GetPostWithCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return a valid post with a code error when requesting a post created with an attached code error by someone else who has mentioned me in the code error stream';
	}

	before (callback) {
		// in order for this work, the user who created the code error has to mention the current user
		super.before(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'post',
					path: '/posts',
					data: {
						parentPostId: this.postData[0].post.id,
						streamId: this.postData[0].post.streamId,
						text: RandomString.generate(10),
						mentionedUserIds: [this.users[0].user.id]
					},
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = GetOtherPostWithCodeErrorTest;
