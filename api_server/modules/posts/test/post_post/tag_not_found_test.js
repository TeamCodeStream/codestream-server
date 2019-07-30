'use strict';

const TagsTest = require('./tags_test');
const UUID = require('uuid/v4');

class TagNotFoundTest extends TagsTest {

	get description () {
		return 'should return an error when attempting to create a post with a codemark with a tag that is not known to the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			// substitute a non-existent tag
			this.data.codemark.tags[2] = UUID().split('-').join('');
			callback();
		});
	}
}

module.exports = TagNotFoundTest;
