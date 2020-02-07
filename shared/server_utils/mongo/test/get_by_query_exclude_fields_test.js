'use strict';

const GetByQueryTest = require('./get_by_query_test');

class GetByQueryExcludeFieldsTest extends GetByQueryTest {

	get description () {
		return 'should get the correct documents, without the requested fields, when getting several documents by query and specifying certain fields to exclude';
	}

	// run the test...
	run (callback) {
		(async () => {
			// do the query
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' },
					{ excludeFields: ['number', 'flag'] }
				);
				this.testDocuments.forEach(document => {
					delete document.number;
					delete document.flag;
				});
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}
}

module.exports = GetByQueryExcludeFieldsTest;
