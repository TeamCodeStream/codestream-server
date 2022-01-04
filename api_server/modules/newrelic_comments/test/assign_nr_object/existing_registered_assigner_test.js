'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');
const Assert = require('assert');

class ExistingRegisteredAssignerTest extends AssignNRObjectTest {

	get description () {
		return 'when assigning a user to a New Relic object, if the user already exists as a registered user, make that user the creator of the comment, if the object does not exist yet';
	}

	makeNRRequestData (callback) {
		// use an existing registered as the assigner
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			const { user } = this.users[0];
			this.data.creator.email = user.email;
			this.apiRequestOptions.headers['X-CS-Want-CS-Response'] = this.apiConfig.sharedSecrets.commentEngine;
			callback();
		});
	}

	validateResponse (data) {
		const registeredUserId = this.users[0].user.id;
		const assignmentCreatorId = data.codeStreamResponse.post.creatorId;
		Assert.equal(assignmentCreatorId, registeredUserId, 'creator of the code error (by virtue of assigning someone to it) is not the same as the registered user');
		delete data.codeStreamResponse;
		super.validateResponse(data);
	}
}

module.exports = ExistingRegisteredAssignerTest;
