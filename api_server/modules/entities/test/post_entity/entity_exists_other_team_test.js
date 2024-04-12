'use strict';

const PostEntityTest = require('./post_entity_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class EntityExistsOtherTeamTest extends PostEntityTest {

	constructor (options) {
		super(options);
		this.otherUserCreatesEntity = true;
	}
	
	get description () {
		return 'when creating a New Relic entity, if the entity already exists but for another team, the entity will be created for this team';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherTeam,
			this.createEntity,
			this.restoreData
		], callback);
	}

   	// create another team that the current user is not on
	createOtherTeam (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.teamId = response.team.id;
				this.useToken = response.accessToken;
				callback();
			},
			{
				token: this.users[1].accessToken 
			}
		);
	}

	// restore data to be used in the test request after munging it
	restoreData (callback) {
		this.data = {
			entityId: this.entityResponse.entity.entityId,
			teamId: this.team.id
		};
		this.otherUserCreatesEntity = false;
		callback();
	}

	validateResponse (data) {
		Assert.notStrictEqual(data.entity.id, this.entityResponse.entity.id, 'entity created by test request is equal to the entity created on the other team');
		return super.validateResponse(data);
	}
}

module.exports = EntityExistsOtherTeamTest;
