'use strict';

const ReactTest = require('./react_test');

class ACLTest extends ReactTest {

	constructor (options) {
		super(options);
		this.withoutUserInStream = true;
	}

	get description () {
		return 'should return an error when trying to react to a post in a stream i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
