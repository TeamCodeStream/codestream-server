'use strict';

const GetByIdsTest = require('./get_by_ids_test');

class GetByIdsFieldsTest extends GetByIdsTest {

	get description () {
		return 'should get the correct documents, with only the specified fields, when getting several documents by ID, and restricting to certain fields';
	}

	// run the test...
	run (callback) {
		(async () => {
			// get the documents we want, and verify we didn't get any others
			let ids = this.testDocuments.map(document => { return document.id; });
			let response;
			try {
				response = await this.data.test.getByIds(ids, { fields: ['number', 'flag'] });
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

module.exports = GetByIdsFieldsTest;
