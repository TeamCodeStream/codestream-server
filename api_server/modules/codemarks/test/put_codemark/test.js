// handle unit tests for the "PUT /codemarks" request to update a knowledge base codemark

'use strict';

const PutCodeMarkTest = require('./put_codemark_test');

class PutCodeMarkRequestTester {

	test () {
		new PutCodeMarkTest().test();
	}
}

module.exports = new PutCodeMarkRequestTester();
