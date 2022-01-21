'use strict';

const DeleteTagTest = require('./delete_tag_test');
const UUID = require('uuid').v4;

class TagNotFoundTest extends DeleteTagTest {

	get description () {
		return 'should return an error when an attempt to delete a non-existent tag for a team is made';
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
			const tagId = UUID().split('-').join('');
			this.path = `/team-tags/${this.team.id}/${tagId}`; // substitute an ID for a non-existent tag
			callback();
		});
	}
}

module.exports = TagNotFoundTest;
