'use strict';

const NestedCommentTest = require('./nested_comment_test');

class ReplyToWrongCodeErrorTest extends NestedCommentTest {

	get description () {
		return 'should return an error when trying to reply to an NR object that does not match the object submitted with the reply';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodeError: true
			});
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'POST-1007',
			reason: 'the parent post\'s object ID does not match the object referenced in the submitted reply'
		};
	}

	setParentPost (callback) {
		super.setParentPost(error => {
			if (error) { return callback(error); }
			this.data.parentPostId = this.postData[0].codeError.postId;
			callback();
		});
	}
}

module.exports = ReplyToWrongCodeErrorTest;
