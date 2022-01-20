'use strict';

const UnrelateCodemarkTest = require('./unrelate_codemark_test');
const ObjectId = require('mongodb').ObjectId;

class CodemarkNotFoundTest extends UnrelateCodemarkTest {

	get description () {
		const which = this.whichCodemark === 0 ? 'first' : 'second';
		return `should return an error when trying to remove the relation between two codemarks and the ${which} does not exist`;
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
				this.path = `/unrelate-codemark/${ObjectId()}/${this.testCodemarks[1].id}`;
			}
			else {
				this.path = `/unrelate-codemark/${this.testCodemarks[0].id}/${ObjectId()}`;
			}
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
