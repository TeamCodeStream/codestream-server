'use strict';

var Get_By_Id_Test = require('./get_by_id_test');

class Create_Test extends Get_By_Id_Test {

	get description () {
		return 'should create a document that can then be fetched by its ID';
	}
}

module.exports = Create_Test;
