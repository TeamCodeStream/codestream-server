'use strict';

const CodeErrorTest = require('./code_error_test');

class NoStreamIdOkTest extends CodeErrorTest {

	get description () {
		return 'when creating a code error, should be ok not to provide a stream ID (it is ignored anyway)';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = NoStreamIdOkTest;
