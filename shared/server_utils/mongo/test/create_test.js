'use strict';

const GetByIdTest = require('./get_by_id_test');

// since the GetByIDTest creates a document for its test, we don't need to do anything else here to test the create function
class CreateTest extends GetByIdTest {

	get description () {
		return 'should create a document that can then be fetched by its ID';
	}
}

module.exports = CreateTest;
