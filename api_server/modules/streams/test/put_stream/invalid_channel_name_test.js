'use strict';

const PutStreamTest = require('./put_stream_test');

class InvalidChannelNameTest extends PutStreamTest {

	get description () {
		return `should return an error when trying to update a channel stream with a "${this.illegalCharacter}" in the name`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				name: 'invalid channel name'
			}
		};
	}

	// before the test runs...
	makeStreamData (callback) {
		// substitute channel name with illegal character
		super.makeStreamData(() => {
			this.data.name = `ill${this.illegalCharacter}egal`;
			callback();
		});
	}
}

module.exports = InvalidChannelNameTest;
