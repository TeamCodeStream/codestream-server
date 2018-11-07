'use strict';

const CloseTest = require('./close_test');

class ACLTest extends CloseTest {

	get description () {
		return 'should return an error when trying to close a stream the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only members can close this stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			this.teamOptions.creatorIndex = 1;
			Object.assign(this.streamOptions, {
				creatorIndex: 1,
				members: [2]
			});
			callback();
		});
	}
}

module.exports = ACLTest;
