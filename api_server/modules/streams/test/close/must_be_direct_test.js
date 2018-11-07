'use strict';

const CloseTest = require('./close_test');

class MustBeDirectTest extends CloseTest {

	get description () {
		return 'should return an error when trying to close a channel stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only direct streams can be closed'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.type = 'channel';
			callback();
		});
	}
}

module.exports = MustBeDirectTest;
