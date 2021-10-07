'use strict';

const PutCompanyTest = require('./put_company_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutCompanyTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request to update a company`;
	}

	// form the data for the company update
	makeCompanyData (callback) {
		super.makeCompanyData(() => {
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const set = data.company.$set;
		Assert(set[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
