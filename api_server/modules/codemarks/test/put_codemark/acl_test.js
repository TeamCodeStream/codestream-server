'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class ACLTest extends PutCodemarkTest {

	get description () {
		return 'should return an error when trying to update a codemark authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the creator of the codemark can make this update'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTest;
