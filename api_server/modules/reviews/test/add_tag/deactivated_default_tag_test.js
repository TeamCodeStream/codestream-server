'use strict';

const DeactivatedTagTest = require('./deactivated_tag_test');
const DefaultTags = require(process.env.CS_API_TOP + '/modules/teams/default_tags');

class DeactivatedDefaultTagTest extends DeactivatedTagTest {

	constructor (options) {
		super(options);
		this.tagId = Object.keys(DefaultTags)[4];
	}

	get description () {
		return 'should return an error when trying to add a tag that has been deactivated to a review, even if the tag is a default tag';
	}
}

module.exports = DeactivatedDefaultTagTest;
