'use strict';

const ReactTest = require('./react_test');
const RandomString = require('randomstring');

class TooManyReactionsTest extends ReactTest {

	get description () {
		return 'should return an error when trying to react to a post with more than 10 reactions';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'no more than 10 reactions'
		};
	}

	// form the data for the reaction
	makePostData (callback) {
		// add some more reactions to the reaction data we're sending
		super.makePostData(error => {
			if (error) { return callback(error); }
			for (let i = 0; i < 10; i++) {
				const reaction = RandomString.generate(8);
				this.data[reaction] = true;
			}
			callback();
		});
	}
}

module.exports = TooManyReactionsTest;
