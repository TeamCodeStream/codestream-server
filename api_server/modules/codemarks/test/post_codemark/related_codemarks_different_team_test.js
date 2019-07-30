'use strict';

const RelatedCodemarksTest = require('./related_codemarks_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class RelatedCodemarksDifferentTeamTest extends RelatedCodemarksTest {

	get description () {
		return 'should return an error when attempting to create a codemark with related codemarks that aren\'t on the same team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'all related codemarks must be for the same team'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// create another team, invite the current user to it, then create another codemark in that team
		// we'll try to create a relation to that codemark, which should fail
		BoundAsync.series(this, [
			super.makeCodemarkData,
			this.makeOtherTeam,
			this.inviteCurrentUser,
			this.makeOtherCodemark
		], callback);
	}

	makeOtherTeam (callback) {
		this.teamFactory.createRandomTeam((error, response) => {
			if (error) { return callback(error); }
			this.otherTeam = response.team;
			callback();
		}, { token: this.users[1].accessToken });
	}

	inviteCurrentUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.otherTeam.id,
					email: this.currentUser.user.email
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	makeOtherCodemark (callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.otherTeam.id,
			providerType: this.data.providerType,
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.relatedCodemarkIds[1] = response.codemark.id;
				callback();
			}
		);
	}
}

module.exports = RelatedCodemarksDifferentTeamTest;
