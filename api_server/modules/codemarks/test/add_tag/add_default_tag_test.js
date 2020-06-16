'use strict';

const AddTagTest = require('./add_tag_test');
const DefaultTags = require(process.env.CS_API_TOP + '/modules/teams/default_tags');

class AddDefaultTagTest extends AddTagTest {

	constructor (options) {
		super(options);
		this.tagId = Object.keys(DefaultTags)[4];
	}

	get description () {
		return 'should be ok to add a default tag to a codemark';
	}
}

module.exports = AddDefaultTagTest;
