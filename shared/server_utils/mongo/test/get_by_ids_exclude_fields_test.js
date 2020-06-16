'use strict';

const GetByIdsTest = require('./get_by_ids_test');

class GetByIdsExcludeFieldsTest extends GetByIdsTest {

	get description () {
		return 'should get the correct documents, without the specified fields, when getting several documents by ID, and excluding certain fields';
	}

	// run the test...
	run (callback) {
		(async () => {
			// get the documents we want, and verify we didn't get any others
			let ids = this.testDocuments.map(document => { return document.id; });
			let response;
			try {
				response = await this.data.test.getByIds(ids, { excludeFields: ['number', 'flag'] });
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

module.exports = GetByIdsExcludeFieldsTest;
