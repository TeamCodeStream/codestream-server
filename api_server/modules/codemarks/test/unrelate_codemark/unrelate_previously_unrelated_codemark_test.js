'use strict';

const UnrelateCodemarkTest = require('./unrelate_codemark_test');
const Assert = require('assert');

class UnrelatePreviouslyUnrelatedCodemarkTest extends UnrelateCodemarkTest {

	constructor (options) {
		super(options);
		this.doPreRelatedCodemarks = true;
	}

	get description () {
		return 'should be ok to remove the relation between two codemarks that are already unrelated to each other';
	}

	init (callback) {
		// unrelate the two codemarks ahead of time, test should still pass
		super.init(error => {
			if (error) { return callback(error); }
			this.unrelateCodemark(callback);
		});
	}
	
	// validate the response to the test request
	validateResponse (data) {
		// the data will just have an empty codemarks array, since they are unchanged
		Assert.deepEqual(data, { codemarks: [] }, 'expected empty codemarks array');
	}
}

module.exports = UnrelatePreviouslyUnrelatedCodemarkTest;
