// provide a base class for most tests of the "GET /streams" request

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const StreamTestConstants = require('../stream_test_constants');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class GetStreamsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numStreams = 3;
		this.userOptions.numRegistered = 3;
		this.teamOptions.numAdditionalInvites = 3;
		this.repoOptions.creatorIndex = 0;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignTeam,			// create another team without the current user as a member
			this.wait1Sec,
			this.createChannelDirectStreams,	// create some channel and direct streams in both teams
			this.createFileStreams,		// create some file-type streams in both team
			this.setPath				// set the path to use when issuing the test request, this should be overridden by derived test classes
		], callback);
	}

	// wait one second, to ensure IDs of streams created are greater than IDs of the other objects created
	// (though not necessary in "mock mode", since we don't go through mongo)
	wait1Sec (callback) {
		const wait = this.mockMode ? 0 : 1000;
		setTimeout(callback, wait);
	}

	// create a "foreign" team, for which the current user is not a member
	createForeignTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[1].accessToken
			}),
			repoOptions: {
				creatorIndex: 1
			},
			userOptions: this.userOptions
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.foreignTeam = response.team;
			this.foreignRepo = response.repo;
			this.usersByTeam = {
				[this.team.id]: this.users,
				[this.foreignTeam.id]: response.users
			};
			callback();
		});
	}

	// create some channel and direct streams in the main team, and in the "foreign" team as needed
	createChannelDirectStreams (callback) {	
		this.streamsByTeam = {};
		const teams = [this.team];
		if (!this.dontDoForeign) {	// don't need any streams in the "foreign" team
			teams.push(this.foreignTeam);
		}
		BoundAsync.forEachSeries(
			this,
			teams,
			this.createChannelDirectStreamsForTeam,
			callback
		);
	}

	// create some channel and direct streams in the given team
	createChannelDirectStreamsForTeam (team, callback) {
		this.streamsByTeam[team.id] = [];
		const which = this.dontDoDirectStreams ? ['channel'] : ['channel', 'direct'];
		BoundAsync.forEachSeries(
			this,
			which,
			(type, foreachCallback) => {
				this.createStreamsForTeam(team, type, foreachCallback);
			},
			callback
		);
	}

	// create some streams of the given type in the given team
	createStreamsForTeam (team, type, callback) {
		// for channels, we'll create twice as many, because we have more to test (public, team-stream)
		const numStreams = type === 'channel' ? this.numStreams * 2 : this.numStreams;
		BoundAsync.timesSeries(
			this,
			numStreams,
			(n, timesCallback) => {
				this.createStreamForTeam(team, type, n, timesCallback);
			},
			callback
		);
	}

	// create a single stream of the given type in the given team
	createStreamForTeam (team, type, n, callback) {
		// we'll include some of the random unregistered users in the stream on a rotating basis
		const unregisteredUsers = this.usersByTeam[team.id].filter(user => !user.user.isRegistered);
		const user = unregisteredUsers[n % unregisteredUsers.length];
		const isTeamStream = type === 'channel' && n === this.whichIsTeamStream;
		const isPublic = type === 'channel' && n === this.whichIsPublic;
		const options = {
			teamId: team.id,
			type: type,
			memberIds: isTeamStream || isPublic ? undefined : [user.user.id],
			token: this.users[1].accessToken,	
			isTeamStream: isTeamStream,
			privacy: isPublic ? 'public' : undefined
		};
		if (n % 2 === 1 && !isTeamStream && !isPublic) {
			// every other stream has the current user as a member
			options.memberIds.push(this.currentUser.user.id);
		}

		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.testLog(`CREATED RANDOM STREAM ${response.stream.id} FOR TEAM ${team.id} type=${type} isTeamStream=${isTeamStream} public=${isPublic} memberIds=${options.memberIds}`);
				this.streamsByTeam[team.id].push(response.stream);
				setTimeout(callback, this.streamCreateThrottle || 0);	// slow it down to avoid overloading pubnub (which has to do access grants)
			},
			options
		);
	}

	// create some file-type streams in the main repo, and in the "foreign" repo as needed
	createFileStreams (callback) {
		if (this.dontDoFileStreams) {	// not needed for this test, skip it
			return callback();
		}
		this.streamsByRepo = {};
		const repos = [this.repo];
		if (!this.dontDoForeign) {	// don't need streams in the "foreign" repo, skip
			repos.push(this.foreignRepo);
		}
		BoundAsync.forEachSeries(
			this,
			repos,
			this.createFileStreamsForRepo,
			callback
		);
	}

	// create some file-type streams in the given repo
	createFileStreamsForRepo (repo, callback) {
		this.streamsByRepo[repo.id] = [];
		BoundAsync.timesSeries(
			this,
			this.numStreams,
			(n, timesCallback) => {
				this.createFileStreamForRepo(repo, timesCallback);
			},
			callback
		);
	}

	// create a single file-type stream in the given repo
	createFileStreamForRepo (repo, callback) {
		const options = {
			teamId: repo.teamId,
			repoId: repo.id,
			type: 'file',
			token: this.users[1].accessToken	
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streamsByRepo[repo.id].push(response.stream);
				setTimeout(callback, this.streamCreateThrottle || 0);
			},
			options
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the streams we expected, and that they contain no attributes
		// that clients shouldn't see
		this.validateMatchingObjects(this.expectedStreams, data.streams, 'streams');
		this.validateSanitizedObjects(data.streams, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamsTest;
