'use strict';

const GetByQueryTest = require('./get_by_query_test');

class GetByQueryFieldsTest extends GetByQueryTest {

	get description () {
		return 'should get the correct documents, limited only to the requested fields, when getting several documents by query and specifying certain fields';
	}

	// run the test...
	run (callback) {
		(async () => {
			// do the query
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' },
					{ fields: ['number', 'flag'] }
				);
				this.testDocuments = this.testDocuments.map(document => {
					return {
						id: document.id,
						_id: document._id,
						number: document.number,
						flag: document.flag
					};
				});
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}
}

module.exports = GetByQueryFieldsTest;
