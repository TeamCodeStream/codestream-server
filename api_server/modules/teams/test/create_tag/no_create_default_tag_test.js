'use strict';

const CreateTagTest = require('./create_tag_test');
const DefaultTags = require('../../default_tags');

class NoCreateDefaultTagTest extends CreateTagTest {

	get description () {
		return 'should return an error when trying to create a tag for a team with an ID that matches one of the default tags';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1004'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.id = DefaultTags[0].id;	// use one of the default tag IDs
			callback();
		});
	}
}

module.exports = NoCreateDefaultTagTest;
