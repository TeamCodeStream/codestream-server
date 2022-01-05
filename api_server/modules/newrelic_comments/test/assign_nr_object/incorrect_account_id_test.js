'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');

class IncorrectAccountIdTest extends AssignNRObjectTest {

	get description () {
		return 'should return an error when making a request to assign a user to a New Relic object but providing an account ID in the header which does not match the account ID of the object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	makeNRRequestData (callback) {
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = 'incorrect!';
			callback();
		});
	}
}

module.exports = IncorrectAccountIdTest;
