'use strict';

const DeactivatedTagTest = require('./deactivated_tag_test');
const DefaultTags = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/default_tags');

class DeactivatedDefaultTagTest extends DeactivatedTagTest {

	constructor (options) {
		super(options);
		this.tagId = Object.keys(DefaultTags)[4];
	}

	get description () {
		return 'should return an error when trying to remove a tag that has been deactivated from a codemark, even if the tag is a default tag';
	}
}

module.exports = DeactivatedDefaultTagTest;
