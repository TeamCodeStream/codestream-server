'use strict';

const TagsTest = require('./tags_test');
const UUID = require('uuid').v4;

class TagNotFoundTest extends TagsTest {

	get description () {
		return 'should return an error when trying to update a codemark with tags that aren\'t known for the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			// add a non-existent tag
			const tagId = UUID().split('-').join('');
			this.data.tags.push(tagId);
			callback();
		});
	}
}

module.exports = TagNotFoundTest;
