'use strict';

const EntityExistsTest = require('./entity_exists_test');
const Assert = require('assert');

class EntityExistsOtherUserTest extends EntityExistsTest {

	constructor (options) {
		super(options);
		this.otherUserCreatesEntity = true;
	}
	
	get description () {
		return 'when creating a New Relic entity, if the entity already exists for the team, the existing entity should be updated, and the user ID should be updated to the user making the request';
	}

	validateResponse (data) {
		Assert.strictEqual(this.entityResponse.entity.lastUserId, this.users[1].user.id, 'entity originally created does not have id of entity creator for creatorId');
		return super.validateResponse(data);
	}
}

module.exports = EntityExistsOtherUserTest;
