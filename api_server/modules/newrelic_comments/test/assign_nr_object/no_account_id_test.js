'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');

class NoAccountIdTest extends AssignNRObjectTest {

	get description () {
		return 'should return an error when making a request to assign a user to a New Relic object but not providing the account ID header';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeNRRequestData (callback) {
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'];
			callback();
		});
	}
}

module.exports = NoAccountIdTest;
