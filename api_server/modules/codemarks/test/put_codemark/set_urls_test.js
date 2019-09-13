'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class SetUrlsTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.updateUrls = true;
	}

	get description () {
		return 'should return the updated codemark when updating a codemark with urls';
	}

}

module.exports = SetUrlsTest;