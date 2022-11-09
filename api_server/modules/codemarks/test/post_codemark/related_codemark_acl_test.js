'use strict';

const RelatedCodemarksTest = require('./related_codemarks_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class RelatedCodemarkACLTest extends RelatedCodemarksTest {

	get description () {
		return 'should return an error when attempting to create a codemark with a related codemark that is not accessible to the user';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user does not have access to all related codemarks'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// in addition to generating the test data, create another team which the current user is not on,
		// and create a codemark in that team, then add it to the list of related codemarks
		BoundAsync.series(this, [
			super.makeCodemarkData,
			this.createOtherTeam,
			this.createOtherCodemark
		], callback);
	}

	// create another team that the current is not on
	createOtherTeam (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeamResponse = response;
				callback();
			},
			{
				token: this.users[1].accessToken 
			}
		);
	}

	// create a codemark on the other team, the current user will not have access to this codemark
	createOtherCodemark (callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.otherTeamResponse.team.id,
			providerType: this.data.providerType,
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		codemarkData.markers = [this.markerFactory.getRandomMarkerData()];
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.otherTeamResponse.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.relatedCodemarkIds.push(response.codemark.id);
				callback();
			}
		);
	}
}

module.exports = RelatedCodemarkACLTest;
