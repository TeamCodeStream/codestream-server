'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const Assert = require('assert');

class ExistingObjectTest extends CreateNRCommentTest {

	get description () {
		return 'when creating a New Relic comment, if the object already exists then the comment should be attached to the existing object';
	}

	setTestOptions (callback) {
		// create an existing code error object
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 1,
				creatorIndex: 1,
				wantCodeError: true
			});
			callback();
		});
	}

	makeNRCommentData (callback) {
		// use the existing code error object instead of a new one
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			const codeError = this.postData[0].codeError;
			Object.assign(this.data, {
				objectId: codeError.objectId,
				accountId: codeError.accountId
			});
			Object.assign(this.expectedResponse.post, {
				objectId: codeError.objectId,
				accountId: codeError.accountId
			});
			this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = codeError.accountId;
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.post.parentPostId, this.postData[0].post.id, 'comment was not attached to the existing object');
		super.validateResponse(data);
	}
}

module.exports = ExistingObjectTest;
