'use strict';

const GetByIdFromCacheTest = require('./get_by_id_from_cache_test');

// we derive from the GetByIdFromCacheTest, which is the base to many other classes, but we're not really doing anything
// different ... we just create a document and fetch it, which should fetch it from the local cache
class CreateWithoutPersistTest extends GetByIdFromCacheTest {

	get description () {
		return 'should create a model that can then be fetched from the cache by its ID';
	}
}

module.exports = CreateWithoutPersistTest;
