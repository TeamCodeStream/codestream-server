'use strict';

const RelateCodemarkTest = require('./relate_codemark_test');
const ObjectID = require('mongodb').ObjectID;

class CodemarkNotFoundTest extends RelateCodemarkTest {

	get description () {
		const which = this.whichCodemark === 0 ? 'first' : 'second';
		return `should return an error when trying to relate two codemarks and the ${which} does not exist`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'codemark'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent codemark, for one of the codemarks to be related
			if (this.whichCodemark === 0) {
				this.path = `/relate-codemark/${ObjectID()}/${this.testCodemarks[1].id}`;
			}
			else {
				this.path = `/relate-codemark/${this.testCodemarks[0].id}/${ObjectID()}`;
			}
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
