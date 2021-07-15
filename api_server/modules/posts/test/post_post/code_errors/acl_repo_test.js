'use strict';

const ReviewTest = require('./review_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class ACLRepoTest extends ReviewTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with a changeset from a repo that is not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	addReviewData (callback) {
		BoundAsync.series(this, [
			this.createOtherTeam,
			this.createOtherRepo,
			super.addReviewData,
			this.addChangeset
		], callback);
	}

	createOtherTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				this.otherTeamStream = response.streams[0];
				callback();
			},
			{ token: this.token }
		);
	}

	createOtherRepo (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: this.otherTeamStream.id,
					codemark: {
						type: 'comment',
						text: 'x',
						markers: [{
							file: this.streamFactory.randomFile(),
							remotes: [this.repoFactory.randomUrl()],
							commitHash: this.markerFactory.randomCommitHash(),
							code: RandomString.generate(100)
						}]
					}
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repos[0];
				callback();
			}
		);
	}

	addChangeset (callback) {
		const changesetData = this.reviewFactory.getRandomChangesets(1, { changesetRepoId: this.otherRepo.id });
		this.data.review.reviewChangesets.push(changesetData);
		callback();
	}
}

module.exports = ACLRepoTest;
