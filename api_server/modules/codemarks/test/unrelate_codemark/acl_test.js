'use strict';

const UnrelateCodemarkTest = require('./unrelate_codemark_test');

class ACLTest extends UnrelateCodemarkTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
	}

	get description () {
		return 'should return an error when trying to remove the relation between two codemarks on a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
