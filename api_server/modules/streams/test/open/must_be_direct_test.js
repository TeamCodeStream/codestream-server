'use strict';

const OpenTest = require('./open_test');

class MustBeDirectTest extends OpenTest {

	constructor (options) {
		super(options);
		this.dontCloseFirst = true;
	}

	get description () {
		return 'should return an error when trying to open a channel stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only direct streams can be opened'
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
