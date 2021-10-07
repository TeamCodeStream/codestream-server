'use strict';

const JoiningTest = require('./joining_test');

class NoEmptyStringForCodeHostJoiningTest extends JoiningTest {

	get description () {
		return `should return an error when trying to allow code host-based joining for an empty host`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				codeHostJoining: 'invalid code host'
			}
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.codeHostJoining.push('');
			callback();
		});
	}
}

module.exports = NoEmptyStringForCodeHostJoiningTest;
