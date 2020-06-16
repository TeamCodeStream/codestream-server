'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const RandomString = require('randomstring');

class SetParentPostIdTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return 'should be ok to update a codemark\'s parentPostId if it has providerType';
	}

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(error => {
			if (error) { return callback(error); }
			this.data.parentPostId = RandomString.generate(8);
			this.expectedData.codemark.$set.parentPostId = this.data.parentPostId;
			callback();
		});
	}
}

module.exports = SetParentPostIdTest;