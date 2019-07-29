'use strict';

const RelateCodemarkTest = require('./relate_codemark_test');
const Assert = require('assert');

class RelatePreviouslyRelatedCodemarkTest extends RelateCodemarkTest {

	constructor (options) {
		super(options);
		this.doPreRelatedCodemarks = true;
	}

	get description () {
		return 'should be ok to relate two codemarks that are already related to each other';
	}

	init (callback) {
		// relate the two codemarks ahead of time, test should still pass
		super.init(error => {
			if (error) { return callback(error); }
			this.relateCodemark(callback);
		});
	}
	
	// validate the response to the test request
	validateResponse (data) {
		// the data will just have an empty codemarks array, since they are unchanged
		Assert.deepEqual(data, { codemarks: [] }, 'expected empty codemarks array');
	}
}

module.exports = RelatePreviouslyRelatedCodemarkTest;
