'use strict';

const PostCompanyTest = require('./post_company_test');

class NoAttributeTest extends PostCompanyTest {

	get description () {
		return `should return an error when attempting to create a company with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a company, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ...delete the attribute of interest
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
