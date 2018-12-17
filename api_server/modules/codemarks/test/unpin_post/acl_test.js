'use strict';

const UnpinPostTest = require('./unpin_post_test');

class ACLTest extends UnpinPostTest {

	get description () {
		return `should return an error when trying to unpin a post from a codemark created in a ${this.streamType} stream the user is not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'must be a member of the team or stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTest;
