'use strict';

const PostEntityTest = require('./post_entity_test');
const Assert = require('assert');

class EntityExistsTest extends PostEntityTest {

	get description () {
		return 'when creating a New Relic entity, if the entity already exists for the team, the existing entity should be updated';
	}

	before (callback) {
		// create the entity before making the test request
		this.expectedVersion = 2;
		super.before(error => {
			if (error) { return callback(error); }
			this.savedData = this.data; // the base test deletes this.data, but we need it for the second try
			setTimeout(() => { // give a little time for our timestamps to change
				this.createEntity(error => {
					if (error) { return callback(error); }
					this.updatedAfter = Date.now();
					this.data = this.savedData;
					callback();
				});
			}, 2);
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data.entity.id, this.entityResponse.entity.id, 'id of returned entity does not match the previously created entity');
		return super.validateResponse(data);
	}
}

module.exports = EntityExistsTest;
