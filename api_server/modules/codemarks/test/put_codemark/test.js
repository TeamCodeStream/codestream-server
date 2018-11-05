// handle unit tests for the "PUT /codemarks" request to update a knowledge base codemark

'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class PutCodemarkRequestTester {

	test () {
		new PutCodemarkTest().test();
	}
}

module.exports = new PutCodemarkRequestTester();
