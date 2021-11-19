'use strict';

const LookupNROrgsTest = require('./lookup_nr_orgs_test');

class EmptyResultTest extends LookupNROrgsTest {

	get description () {
		return 'should return an empty array when looking up NR orgs for unknown account IDs';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				accountIds: [
					this.codeErrorFactory.randomAccountId(),
					this.codeErrorFactory.randomAccountId()
				]
			};
			this.expectedData = [];
			callback();
		});
	}
}

module.exports = EmptyResultTest;
