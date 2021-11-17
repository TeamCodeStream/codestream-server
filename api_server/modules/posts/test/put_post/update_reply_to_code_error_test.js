'use strict';

const PutPostTest = require('./put_post_test');

class UpdateReplyToCodeErrorTest extends PutPostTest {

	constructor (options) {
		super(options);
		this.whichPost = 1;
	}

	get description () {
		return 'should return the updated post when updating a post that is a reply to a code error';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 2,
				claimCodeErrors: true,
				postData: [
					{
						creatorIndex: 1,
						wantCodeError: true
					},
					{
						creatorIndex: 0,
						replyTo: 0
					}
				]
			});
			callback();
		});
	}
}

module.exports = UpdateReplyToCodeErrorTest;
