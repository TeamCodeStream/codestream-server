'use strict';

const ReactTest = require('./react_test');

class NonBooleanTest extends ReactTest {

	get description () {
		return 'should return an error when trying to react to a post with a non-boolean reaction value';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'must be boolean'
		};
	}

	// form the data for the reaction
	makePostData (callback) {
		// substitute a non-boolean reaction value
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data[this.reaction] = 1;
			callback();
		});
	}
}

module.exports = NonBooleanTest;
