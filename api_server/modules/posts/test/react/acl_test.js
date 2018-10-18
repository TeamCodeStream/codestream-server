'use strict';

const ReactTest = require('./react_test');

class ACLTest extends ReactTest {

	get description () {
		return 'should return an error when trying to react to a post in a stream i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	setTestOptions (callback) { 
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			this.streamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTest;
