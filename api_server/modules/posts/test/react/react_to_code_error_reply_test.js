'use strict';

const ReactTest = require('./react_test');

class ReactToCodeErrorReplyTest extends ReactTest {

	constructor (options) {
		super(options);
		this.whichPost = 1;
	}

	get description () {
		return 'should return a directive for updating reactions when a user reacts to a post, when the post is a reply to a code error';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 2,
				claimCodeErrors: true,
				postData: [
					{
						wantCodeError: true
					},
					{
						replyTo: 0
					}
				]
			});
			callback();
		});
	}
}

module.exports = ReactToCodeErrorReplyTest;
