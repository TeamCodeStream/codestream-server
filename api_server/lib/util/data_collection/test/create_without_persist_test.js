'use strict';

var GetByIdFromCacheTest = require('./get_by_id_from_cache_test');

class CreateWithoutPersistTest extends GetByIdFromCacheTest {

	get description () {
		return 'should create a model that can then be fetched from the cache by its ID';
	}
}

module.exports = CreateWithoutPersistTest;
