'use strict';

const GetByIdTest = require('./get_by_id_test');

class GetByIdExcludeFieldsTest extends GetByIdTest {

	get description () {
		return 'should get the correct document, but without the requested fields, when getting a document by ID and specifying excluded fields';
	}

	// run the test...
	run (callback) {
		(async () => {
			// get the test document and check that it matches
			let response;
			try {
				response = await this.data.test.getById(this.testDocument.id, { excludeFields: ['number', 'array' ]});
				delete this.testDocument.number;
				delete this.testDocument.array;
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}
}

module.exports = GetByIdExcludeFieldsTest;
