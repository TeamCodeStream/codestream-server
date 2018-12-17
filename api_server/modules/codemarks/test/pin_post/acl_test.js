'use strict';

const PinPostTest = require('./pin_post_test');

class ACLTest extends PinPostTest {

	get description () {
		return `should return an error when trying to pin a post to a codemark created in a ${this.streamType} stream the user is not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'must be a member of the team'
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
