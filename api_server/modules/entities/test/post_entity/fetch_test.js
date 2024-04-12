'use strict';

const PostEntityTest = require('./post_entity_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends PostEntityTest {

	get description () {
		return 'should persist an entity when creating a New Relic entity, checked by fetching the entity';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createEntity,
			this.setPath
		], callback);
	}

	setPath (callback) {
		if (!this.entityResponse) { return callback(); }
		this.path = `/entities/${this.entityResponse.entity.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert.strictEqual(data.entity.id, this.entityResponse.entity.id, 'fetched entity not equal to the entity given in the response');
		Assert.strictEqual(data.entity.entityId, this.entityResponse.entity.entityId, 'entityId of fetched entity does not match the entityId sent');
	}
}

module.exports = FetchTest;
