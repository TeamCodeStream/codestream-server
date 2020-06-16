'use strict';

const ReactTest = require('./react_test');
const Assert = require('assert');

class EmptyReactionsTest extends ReactTest {

	get description () {
		return 'should be able to pass an empty reactions structure';
	}

	// form the data for the reaction
	makePostData (callback) {
		// just pass an empty body
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data = {};
			this.expectedData = {};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, {}, 'request should return empty response');
	}
}

module.exports = EmptyReactionsTest;
