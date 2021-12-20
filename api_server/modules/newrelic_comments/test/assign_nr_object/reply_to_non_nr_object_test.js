'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class ReplyToNonNRObjectTest extends CreateNRCommentTest {

	get description () {
		return 'should return an error when trying to reply to a post that is not associated with an NR object';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1
			});
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'POST-1007',
			reason: 'the parent post is not associated with a New Relic object'
		};
	}

	makeNRCommentData (callback) {
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			this.data.parentPostId = this.postData[0].post.id;
			callback();
		});
	}
}

module.exports = ReplyToNonNRObjectTest;
