'use strict';

const MessageTest = require('./message_test');

class NumCommentsMessageTest extends MessageTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 2,
				postData: [
					{ wantCodeBlock: 1 },
					{ replyTo: 0 }
				]
			});
			this.testPost = 1;
			callback();
		});
	}

	get description () {
		return 'members of the team should receive a message with the numComments field decremented for the deletion of a reply to a post with a code block';
	}

}

module.exports = NumCommentsMessageTest;
