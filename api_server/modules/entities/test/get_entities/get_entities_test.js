'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class GetEntitiesTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.numEntities = 5;
	}

	get description () {
		return 'should return New Relic entities when requested';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath,
			this.createEntities
		], callback);
	}

	// set the path to use for the test request
	setPath (callback) {
		this.path = `/entities?teamId=${this.team.id}`;
		callback();
	}

	// create the entities
	createEntities (callback) {
		this.expectedResponse = { entities: [] };
		BoundAsync.timesSeries(
			this,
			this.numEntities,
			this.createEntity,
			callback
		);
	}

	createEntity (n, callback) {
		const entityData = this.entityFactory.getRandomEntityData();
		entityData.teamId = this.team.id;
		const token = (this.currentUserNotOnTeam || (n % 2)) ? this.users[1].accessToken : this.currentUser.accessToken;
		this.doApiRequest(
			{
				method: 'post',
				path: '/entities',
				data: entityData,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedResponse.entities.push(response.entity);
				callback();
			}
		);
	}

	// validate the request response
	validateResponse (data) {
		// sort both arrays by id, to make sure they match
		this.expectedResponse.entities.sort((a, b) => {
			return b.id - a.id;
		});
		data.entities.sort((a, b) => {
			return b.id - a.id;
		});

		// response should exactly equal the response we got when we created the entities
		Assert.deepStrictEqual(data, this.expectedResponse, 'incorrect response');
	}
}

module.exports = GetEntitiesTest;
