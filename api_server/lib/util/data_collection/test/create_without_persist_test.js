'use strict';

var Get_By_Id_From_Cache_Test = require('./get_by_id_from_cache_test');

class Create_Without_Persist_Test extends Get_By_Id_From_Cache_Test {

	get description () {
		return 'should create a model that can then be fetched from the cache by its ID';
	}
}

module.exports = Create_Without_Persist_Test;
