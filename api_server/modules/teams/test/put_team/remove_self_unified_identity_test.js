'use strict';

const RemoveSelfTest = require('./remove_self_test');

class RemoveSelfUnifiedIdentityTest extends RemoveSelfTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}

	get description () {
		return 'under unified identity, should return an error when attempting to remove yourself from a team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1002'
		};
	}
}

module.exports = RemoveSelfUnifiedIdentityTest;
