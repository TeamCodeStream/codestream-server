'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class GetStreamsTest extends CodeStreamAPITest {

	before (callback) {
		this.usersByTeam = {};
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepoWithMe,
			this.createRepoWithoutMe,
			this.createChannelDirectStreams,
			this.createFileStreams,
			this.setPath
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepoWithMe (callback) {
		let options = {
			withEmails: [this.currentUser.email],
			withRandomEmails: 2,
			token: this.otherUserData.accessToken
		};
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myTeam = response.team;
				this.usersByTeam[this.myTeam._id] = response.users.filter(user => {
					return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
				});
				callback();
			},
			options
		);
	}

	createRepoWithoutMe (callback) {
		let options = {
			withEmails: [this.usersByTeam[this.myTeam._id][0].email],
			withRandomEmails: 1,
			token: this.otherUserData.accessToken
		};
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				this.usersByTeam[this.foreignTeam._id] = response.users;
				callback();
			},
			options
		);
	}

	createChannelDirectStreams (callback) {
		this.streamsByTeam = {};
		BoundAsync.forEachSeries(
			this,
			[this.myTeam, this.foreignTeam],
			this.createChannelDirectStreamsForTeam,
			callback
		);
	}

	createChannelDirectStreamsForTeam (team, callback) {
		this.streamsByTeam[team._id] = [];
		BoundAsync.forEachSeries(
			this,
			['channel', 'direct'],
			(type, foreachCallback) => {
				this.createStreamsForTeam(team, type, foreachCallback);
			},
			callback
		);
	}

	createStreamsForTeam (team, type, callback) {
		BoundAsync.timesSeries(
			this,
			2,
			(n, timesCallback) => {
				this.createStreamForTeam(team, type, n, timesCallback);
			},
			callback
		);
	}

	createStreamForTeam (team, type, n, callback) {
		let user = this.usersByTeam[team._id][n];
		let options = {
			teamId: team._id,
			type: type,
			memberIds: [user._id],
			token: this.otherUserData.accessToken
		};
		if (n % 2 === 1) {
			options.memberIds.push(this.currentUser._id);
		}

		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streamsByTeam[team._id].push(response.stream);
				callback();
			},
			options
		);
	}

	createFileStreams (callback) {
		this.streamsByRepo = {};
		BoundAsync.forEachSeries(
			this,
			[this.myRepo, this.foreignRepo],
			this.createFileStreamsForRepo,
			callback
		);
	}

	createFileStreamsForRepo (repo, callback) {
		this.streamsByRepo[repo._id] = [];
		BoundAsync.timesSeries(
			this,
			3,
			(n, timesCallback) => {
				this.createFileStreamForRepo(repo, timesCallback);
			},
			callback
		);
	}

	createFileStreamForRepo (repo, callback) {
		let options = {
			teamId: repo.teamId,
			repoId: repo._id,
			type: 'file',
			token: this.otherUserData.accessToken
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streamsByRepo[repo._id].push(response.stream);
				callback();
			},
			options
		);
	}

	validateResponse (data) {
		this.validateMatchingObjects(this.myStreams, data.streams, 'streams');
		this.validateSanitizedObjects(data.streams, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamsTest;
