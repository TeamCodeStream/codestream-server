'use strict';

const ReadItemTest = require('./read_item_test');

class NumRepliesRequiredTest extends ReadItemTest {

	get description () {
		return `should return error when attempting to set last read item for a post but not specifying numReplies`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'numReplies'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the specified attribute from the data to use in the request
			delete this.data.numReplies;
			callback();
		});
	}
}

module.exports = NumRepliesRequiredTest;
