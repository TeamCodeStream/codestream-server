'use strict';

const RelatedCodemarksTest = require('./related_codemarks_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class RelatedCodemarksDifferentTeamTest extends RelatedCodemarksTest {

	get description () {
		return 'should return an error when attempting to create a post with a codemark with related codemarks that aren\'t on the same team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user does not have access to all related codemark'
		};
	}

	// form the data to use in trying to create the codemark
	makePostData (callback) {
		// create another team, invite the current user to it, then create another codemark in that team
		// we'll try to create a relation to that codemark, which should fail
		BoundAsync.series(this, [
			super.makePostData,
			this.makeOtherTeam,
			this.inviteCurrentUser,
			this.makeOtherCodemark
		], callback);
	}

	makeOtherTeam (callback) {
		this.companyFactory.createRandomCompany((error, response) => {
			if (error) { return callback(error); }
			this.otherTeam = response.team;
			this.otherTeamToken = response.accessToken;
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
				token: this.otherTeamToken
			},
			callback
		);
	}

	makeOtherCodemark (callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.otherTeam.id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.otherTeamToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.codemark.relatedCodemarkIds[1] = response.codemark.id;
				callback();
			}
		);
	}
}

module.exports = RelatedCodemarksDifferentTeamTest;
