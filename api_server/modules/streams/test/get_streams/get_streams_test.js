// provide a base class for most tests of the "GET /streams" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class GetStreamsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numStreams = 3;
	}

	// before the test runs...
	before (callback) {
		this.usersByTeam = {};
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepoWithMe,		// create a repo and a team with the current user as a member
			this.createRepoWithoutMe,	// create another repo and team without the current user as a member
			this.createChannelDirectStreams,	// create some channel and direct streams in both repos
			this.createFileStreams,		// create some file-type streams in both repos
			this.setPath				// set the path to use when issuing the test request, this must be overridden by the derived class 
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo with the current user as a member of the team that owns the repo
	createRepoWithMe (callback) {
		let options = {
			withEmails: [this.currentUser.email],	// include current user in the team
			withRandomEmails: 2,					// create a few extra (unregistered) users for good measure
			token: this.otherUserData.accessToken	// the "other" user will create the team and repo
		};
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myTeam = response.team;
				this.myTeamStream = response.streams[0];
				// keep track of the additional users in this team, and put them in the other team as well
				this.usersByTeam[this.myTeam._id] = response.users.filter(user => {
					return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
				});
				callback();
			},
			options
		);
	}

	// create a repo without the current user as a member of the team that owns the repo
	createRepoWithoutMe (callback) {
		if (this.dontDoForeign) { return callback(); }	// no need for a foreign repo, skip 
		let options = {
			withEmails: [this.usersByTeam[this.myTeam._id][0].email],	// put one of the users from the other team in this team, too ... why not?
			withRandomEmails: 1,	// and put another random unregistered user in this team ... why not?
			token: this.otherUserData.accessToken	// the "other" user creates this team and repo
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

	// create some channel and direct streams in the main team, and in the "foreign" team as needed
	createChannelDirectStreams (callback) {	
		if (this.dontDoTeamStreams) {	// not needed for this test, skip it
			return callback();
		}
		this.streamsByTeam = {};
		let teams = [this.myTeam];
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
		let user = this.usersByTeam[team._id][n % this.usersByTeam[team._id].length];
		let isTeamStream = type === 'channel' && n === this.whichIsTeamStream;
		let isPublic = type === 'channel' && n === this.whichIsPublic;
		let options = {
			teamId: team._id,
			type: type,
			memberIds: isTeamStream || isPublic ? undefined : [user._id],
			token: this.otherUserData.accessToken,	// the "other" user creates this stream
			isTeamStream: isTeamStream,
			privacy: isPublic ? 'public' : undefined
		};
		if (n % 2 === 1 && !isTeamStream && !isPublic) {
			// every other stream has the current user as a member
			options.memberIds.push(this.currentUser._id);
		}

		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streamsByTeam[team._id].push(response.stream);
				setTimeout(callback, this.streamCreateThrottle || 0);	// slow it down to avoid overloading pubnub (which has to do access grants)
			},
			options
		);
	}

	// create some file-type streams in the main repo, and in the "foreign" repo as needed
	createFileStreams (callback) {
		this.streamsByRepo = {};
		let repos = [this.myRepo];
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
		this.streamsByRepo[repo._id] = [];
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
		let options = {
			teamId: repo.teamId,
			repoId: repo._id,
			type: 'file',
			token: this.otherUserData.accessToken	// the "other" user creates this stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streamsByRepo[repo._id].push(response.stream);
				setTimeout(callback, this.streamCreateThrottle || 0);
			},
			options
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the streams we expected, and that they contain no attributes
		// that clients shouldn't see
		this.validateMatchingObjects(this.myStreams, data.streams, 'streams');
		this.validateSanitizedObjects(data.streams, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamsTest;
