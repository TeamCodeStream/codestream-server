'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class TooManyKeysTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when the there are too many keys provided in a preferences update request';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/preferences';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: 'too many keys'
		};
	}

	before (callback) {
		this.data = {};
		for (let i = 0; i < 10; i++) {
			this.data[i] = {};
			for (let j = 0; j < 5; j++) {
				this.data[i][j] = {};
				for (let k = 0; k < 3; k++) {
					this.data[i][j][k] = `${i}${j}${k}`;
				}
			}
		}
		callback();
	}
}

module.exports = TooManyKeysTest;
