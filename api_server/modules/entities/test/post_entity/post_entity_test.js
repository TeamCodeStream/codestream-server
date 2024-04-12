// base class for many tests of the "POST /entities" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const EntityTestConstants = require('../entity_test_constants');
const CommonInit = require('./common_init');

class PostEntityTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
	}

	get description () {
		return 'should return a valid entity when creating a New Relic entity';
	}

	get method () {
		return 'post';
	}

	getExpectedFields () {
		return { entity: EntityTestConstants.EXPECTED_ENTITY_FIELDS };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back an entity with the attributes we specified
		const { entity } = data;
		const errors = [];
		const lastUpdated = this.updatedAfter ? entity.modifiedAt : entity.createdAt;
		const updatedAfter = this.updatedAfter || this.createdAfter;
		const creatorId = this.otherUserCreatesEntity ? this.users[1].user.id : this.currentUser.user.id;
		const expectedVersion = this.expectedVersion || 1;
		const result = (
			((entity.id === entity._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((entity.entityId === this.data.entityId) || errors.push('entity does not match')) &&
			((entity.teamId === this.team.id) || errors.push('teamId does not match the test team')) &&
			((entity.companyId === this.company.id) || errors.push('companyId does not match the test company')) &&
			((entity.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof entity.createdAt === 'number') || errors.push('createdAt is not a number')) &&
			((entity.createdAt >= this.createdAfter) || errors.push('createdAt not greater than or equal to when the entity should have been created')) && 
			((typeof entity.lastUpdated === 'number') || errors.push('lastUpdated is not a number')) &&
			((entity.modifiedAt >= updatedAfter) || errors.push('modifiedAt not greater than or equal to after the entity should have been updated')) &&
			((entity.lastUpdated === lastUpdated) || errors.push('lastUpdated not equal to expected value')) &&
			((entity.creatorId === creatorId) || errors.push('creatorId not equal to expected creator')) &&
			((entity.lastUserId === this.currentUser.user.id) || errors.push('lastUserId not equal to current user id')) &&
			((entity.version === expectedVersion) || errors.push('version is incorrect'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the entity in the response has no attributes that should not go to clients
		this.validateSanitized(entity, EntityTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostEntityTest;
