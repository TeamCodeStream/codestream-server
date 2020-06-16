'use strict';

const GetByIdTest = require('./get_by_id_test');

class GetByIdFieldsTest extends GetByIdTest {

	get description () {
		return 'should get the correct document, but limited to the requested fields, when getting a document by ID and specifying fields';
	}

	// run the test...
	run (callback) {
		(async () => {
			// get the test document and check that it matches
			let response;
			try {
				response = await this.data.test.getById(this.testDocument.id, { fields: ['number', 'array' ]});
				this.testDocument = {
					id: this.testDocument.id,
					_id: this.testDocument._id,
					number: this.testDocument.number,
					array: [...this.testDocument.array]
				};
				delete this.expectedVersion;
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}
}

module.exports = GetByIdFieldsTest;
