'use strict';

const FetchTest = require('./fetch_test');
const DefaultTags = require(process.env.CS_API_TOP + '/modules/teams/default_tags');

class RemoveDefaultTagFetchTest extends FetchTest {

	constructor (options) {
		super(options);
		this.tagId = Object.keys(DefaultTags)[4];
	}

	get description () {
		return 'should be ok to remove a default tag from a codemark, checked by fetching the codemark';
	}
}

module.exports = RemoveDefaultTagFetchTest;
