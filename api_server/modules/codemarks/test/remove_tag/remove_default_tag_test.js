'use strict';

const RemoveTagTest = require('./remove_tag_test');
const DefaultTags = require(process.env.CS_API_TOP + '/modules/teams/default_tags');

class RemoveDefaultTagTest extends RemoveTagTest {

	constructor (options) {
		super(options);
		this.tagId = Object.keys(DefaultTags)[4];
	}

	get description () {
		return 'should be ok to remove a default tag from a codemark';
	}
}

module.exports = RemoveDefaultTagTest;
