'use strict';

const SetCodeStreamPostIdTest = require('./set_codestream_post_id_test');

class ACLPostTest extends SetCodeStreamPostIdTest {

	constructor (options) {
		super(options);
		this.otherUserCreatesPost = true;
	}
	
	get description () {
		return 'should return an error when trying to link a codemark to a post the user did not create';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user must be the author of the post being linked'
		};
	}
}

module.exports = ACLPostTest;
