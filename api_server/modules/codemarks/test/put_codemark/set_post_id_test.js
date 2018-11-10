'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class SetPostIdTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
		this.updatePostId = true;
	}

	get description () {
		return 'should return the updated codemark when updating a codemark with post ID and stream ID';
	}

}

module.exports = SetPostIdTest;