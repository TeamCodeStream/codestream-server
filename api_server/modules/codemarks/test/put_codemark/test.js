// handle unit tests for the "PUT /codemarks" request to update a knowledge base codemark

'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const SetPostIdTest = require('./set_post_id_test');

class PutCodemarkRequestTester {

	test () {
		new PutCodemarkTest().test();
		new SetPostIdTest().test();
	}
}

module.exports = new PutCodemarkRequestTester();
