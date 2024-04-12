'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const EntityTestConstants = require('../entity_test_constants');

class GetEntityTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return a valid entity when requesting an entity created by me';
	}

	getExpectedFields () {
		return { entity: EntityTestConstants.EXPECTED_ENTITY_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createEntity,
			this.setPath
		], callback);
	}

	// create an entity to fetch
	createEntity (callback) {
		const entityData = this.entityFactory.getRandomEntityData();
		entityData.teamId = this.team.id;
		const token = this.teamCreatorCreatesEntity ? this.users[1].accessToken : this.currentUser.accessToken;
		this.doApiRequest(
			{
				method: 'post',
				path: '/entities',
				data: entityData,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.entity = response.entity;
				callback();
			}
		);
	}

	// set the path for the test request
	setPath (callback) {
		// fetch the entity created
		this.path = '/entities/' + this.entity.id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got the expected entity
		this.validateMatchingObject(this.entity.id, data.entity, 'entity');
		// make sure we didn't get attributes not suitable for the client 
		this.validateSanitized(data.entity, EntityTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetEntityTest;
