'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class SetExternalProviderTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
		this.updateExternal = true;
	}

	get description () {
		return 'should return the updated codemark when updating a codemark with external provider info';
	}

}

module.exports = SetExternalProviderTest;