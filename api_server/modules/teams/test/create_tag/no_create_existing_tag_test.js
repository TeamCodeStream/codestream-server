'use strict';

const CreateTagTest = require('./create_tag_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class NoCreateExistingTagTest extends CreateTagTest {

	get description () {
		return 'should return an error when trying to create a tag for a team when a tag matching its ID already exists';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1004'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createExistingTag 		// create a tag, then we'll use its ID for the test
		], callback);
	}

	// create a tag, then we'll use its ID for the test
	createExistingTag (callback) {
		const id = this.data.id;
		this.createTag(error => {
			if (error) { return callback(error); }
			this.data = {
				id,
				color: RandomString.generate(6),
				label: RandomString.generate(10),
				sortOrder: Math.floor(Math.random() * 100)
			};
			callback();
		});
	}
}

module.exports = NoCreateExistingTagTest;
