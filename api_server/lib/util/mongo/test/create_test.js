'use strict';

var GetByIdTest = require('./get_by_id_test');

class CreateTest extends GetByIdTest {

	get description () {
		return 'should create a document that can then be fetched by its ID';
	}
}

module.exports = CreateTest;
