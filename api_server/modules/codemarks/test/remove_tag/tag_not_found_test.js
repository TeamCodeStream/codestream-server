'use strict';

const RemoveTagTest = require('./remove_tag_test');
const UUID = require('uuid/v4');

class TagNotFoundTest extends RemoveTagTest {

	get description () {
		return 'should return an error when trying to remove a tag that is not a known tag for the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent tag
			this.data.tagId = UUID().split('-').join('');
			callback();
		});
	}
}

module.exports = TagNotFoundTest;
