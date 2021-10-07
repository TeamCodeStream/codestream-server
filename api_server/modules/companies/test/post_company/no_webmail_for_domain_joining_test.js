'use strict';

const JoiningTest = require('./joining_test');

class NoWebmailForDomainJoiningTest extends JoiningTest {

	get description () {
		return `should return an error when trying to allow domain-based joining for a webmail domain`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				domainJoining: 'these domains are webmail and not allowed as joinable'
			}
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.domainJoining.push('gmail.com');
			callback();
		});
	}
}

module.exports = NoWebmailForDomainJoiningTest;
