'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class NoLastActivityAtAndStreamIdTest extends GetCodeErrorsTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}
	
	get description () {
		return 'should return error if byLastActivityAt and streamId are provided to code errors query at the same time';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = `/code-errors?teamId=${this.team.id}&streamId=${this.teamStream.id}&byLastActivityAt=1`;
		callback();
	}
}

module.exports = NoLastActivityAtAndStreamIdTest;
