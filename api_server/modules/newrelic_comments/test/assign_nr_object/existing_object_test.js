'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');
const Assert = require('assert');

class ExistingObjectTest extends AssignNRObjectTest {

	get description () {
		return 'should be OK to assign a user to a New Relic object if the object already exists';
	}

	setTestOptions (callback) {
		// create an existing code error object
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 1,
				creatorIndex: 0,
				wantCodeError: true
			});
			callback();
		});
	}

	makeNRRequestData (callback) {
		// use the existing code error object instead of a new one
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			const codeError = this.postData[0].codeError;
			Object.assign(this.data, {
				objectId: codeError.objectId,
				accountId: codeError.accountId
			});
			this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = codeError.accountId;
			callback();
		});
	}
}

module.exports = ExistingObjectTest;
