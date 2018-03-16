// base class for testing multiple editing indicators for the "PUT /editing" request

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class MultipleCommonInit {

	init (callback) {
		// set up test parameters
		this.numFileStreams = 8;
		this.numChannelStreams = 2;
		this.numDirectStreams = 2;
		this.userHasBeenEditing = [1, 3, 5, 6];
		this.otherUserHasBeenEditing = [2, 3, 5, 7];
		this.userWillEditByStreamId = [2, 4, 5];
		this.userWillEditByFile = [3, 7];

		// set up test data
		BoundAsync.series(this, [
			this.createOtherUser,		// create another registered user
			this.createRandomRepo,		// create a random repo (and team) for the test
			this.createForeignRepo,		// create another random repo excluding the current user
			this.createStreams,			// create several streams in each repo
			this.setAlreadyEditing, 	// set that the users are already editing some files
			this.makeEditingData		// make the data to be used during the update
		], callback);
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo to use for the test
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 2,					// a few extra users for good measure
				withEmails: [this.currentUser.email],	// include "current" user
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// create a second repo to use for the test, which does not include the current user
	createForeignRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				this.foreignUsers = response.users;
				callback();
			},
			{
				withRandomEmails: 2,					// a few extra users for good measure
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// create several streams in each team/repo
	createStreams (callback) {
		this.myFileStreams = [];
		this.foreignFileStreams = [];
		this.myChannelStreams = [];
		this.foreignChannelStreams = [];
		this.myDirectStreams = [];
		this.foreignDirectStreams = [];
		const teamInfo = [
			{ team: this.team, repo: this.repo, users: this.users },
			{ team: this.foreignTeam, repo: this.foreignRepo, users: this.foreignUsers }
		];
		BoundAsync.forEachSeries(
			this,
			teamInfo,
			this.createStreamsInTeam,
			callback
		);
	}

	// create several streams in a team
	createStreamsInTeam (teamInfo, callback) {
		const types = {
			channel: this.numChannelStreams,
			direct: this.numDirectStreams,
			file: this.numFileStreams
		};
		BoundAsync.forEachSeries(
			this,
			Object.keys(types),
			(type, forEachCallback) => {
				this.createTypedStreamsInTeam(teamInfo, type, types[type], forEachCallback);
			},
			callback
		);
	}

	// create several streams of a given type in a given team
	createTypedStreamsInTeam (teamInfo, type, howMany, callback) {
		BoundAsync.timesSeries(
			this,
			howMany,
			(n, timesCallback) => {
				this.createStream(teamInfo, type, timesCallback);
			},
			callback
		);
	}

	// create a stream of the given type in a given team
	createStream (teamInfo, type, callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.classifyStream(response.stream);
				callback();
			},
			{
				type: type,
				teamId: teamInfo.team._id,
				repoId: type === 'file' ? teamInfo.repo._id : undefined, // file-type streams must have repoId
				memberIds: type !== 'file' ? teamInfo.users.map(user => user._id) : undefined, // channel/direct must have members
				token: this.otherUserData.accessToken // the "other user" is the stream creator
			}
		);
	}

	// classify a stream we created according to whether it is a foreign stream, and by type
	classifyStream (stream) {
		if (stream.teamId === this.team._id) {
			if (stream.type === 'channel') {
				this.myChannelStreams.push(stream);
			}
			else if (stream.type === 'direct') {
				this.myDirectStreams.push(stream);
			}
			else {
				this.myFileStreams.push(stream);
			}
		}
		else {
			if (stream.type === 'channel') {
				this.foreignChannelStreams.push(stream);
			}
			else if (stream.type === 'direct') {
				this.foreignDirectStreams.push(stream);
			}
			else {
				this.foreignFileStreams.push(stream);
			}
		}
	}

	// set several streams in the repo as already being edited
	setAlreadyEditing (callback) {
		const alreadyEditingInfo = [
			{ token: this.token, which: this.userHasBeenEditing },
			{ token: this.otherUserData.accessToken, which: this.otherUserHasBeenEditing }
		];
		BoundAsync.forEachSeries(
			this,
			alreadyEditingInfo,
			this.setAlreadyEditingForUser,
			callback
		);
	}

	// set several streams in the repo as already being edited by the given user
	setAlreadyEditingForUser (info, callback) {
		BoundAsync.forEachSeries(
			this,
			info.which,
			(index, forEachCallback) => {
				this.setAlreadyEditingStreamForUser(info, index, forEachCallback);
			},
			callback
		);
	}

	// set a particular file stream (referenced by index) as already being edited by
	// the given user
	setAlreadyEditingStreamForUser (info, index, callback) {
		const stream = this.myFileStreams[index];
		const data = {
			teamId: this.team._id,
			repoId: this.repo._id,
			streamId: stream._id,
			editing: {
				commitHash: this.repoFactory.randomCommitHash()
			}
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/editing',
				data: data,
				token: info.token
			},
			callback
		);
	}

	// form the data to be used in the test request
	makeEditingData (callback) {
		// user will specify several streams by stream ID that they are editing,
		// some of these are already being edited by the user
		let streamIds = this.userWillEditByStreamId.map(index => {
			return this.myFileStreams[index]._id;
		});
		streamIds = [
			...streamIds,
			this.myChannelStreams[0]._id,
			this.myDirectStreams[1]._id,
			this.foreignChannelStreams[1]._id,
			this.foreignDirectStreams[0]._id,
			this.foreignFileStreams[0]._id,
			this.foreignFileStreams[1]._id
		];

		// user will specify several streams by filename that they are editing,
		// some of these are already being edited by the user
		let files = this.userWillEditByFile.map(index => {
			return this.myFileStreams[index].file;
		});
		// user will also specify some files that don't have streams associated with them at all
		this.newFiles = [this.streamFactory.randomFile(), this.streamFactory.randomFile()];
		files = [...files, ...this.newFiles];

		// combine the stream IDs and files into the request, and say they are all
		// being edited as of the same commit hash
		this.data = {
			teamId: this.team._id,
			repoId: this.repo._id,
			streamIds,
			files,
			editing: { commitHash: this.repoFactory.randomCommitHash() }
		};
		this.editedAfter = Date.now();
		callback();
	}

	// confirm the response to the request or message generation
	confirmResponse (data) {
		// find and validate the streams we expect to be adjusted
		for (let index = 0; index < this.numFileStreams; index++) {
			this.findStreamInExpectedResponse(index, data.streams);
		}

		// find and validate streams we expect to be created
		for (let index = 0; index < this.newFiles; index++) {
			this.findCreatedStreamInResponse(index, data.streams);
		}

		// ensure no foreign streams were touched
		this.confirmNoForeignStreams(data.streams);
	}

	// given an index into the array of file streams, find the part of the response
	// expected for the indexed stream
	findStreamInExpectedResponse (index, streams) {
		const stream = this.myFileStreams[index];
		const responseStream = streams.find(inStream => inStream._id === stream._id);
		if (this.userHasBeenEditing.includes(index)) {
			if (
				!this.userWillEditByStreamId.includes(index) &&
				!this.userWillEditByFile.includes(index)
			) {
				Assert(responseStream, `stream ${stream._id} not found in response`);
				Assert(responseStream.$set.modifiedAt > this.editedAfter, `modifiedAt for ${stream._id} not properly set`);
				Assert.equal(responseStream.$unset[`editingUsers.${this.currentUser._id}`], true, `editingUsers for ${stream._id} not unset`);
			}
			else if (responseStream) {
				Assert.fail(`stream ${responseStream._id} not expected in response`);
			}
		}
		else if (
			this.userWillEditByStreamId.includes(index) ||
			this.userWillEditByFile.includes(index)
		) {
			Assert(responseStream, `stream ${stream._id} not found in response`);
			Assert(responseStream.$set.modifiedAt > this.editedAfter, `modifiedAt for ${stream._id} not properly set`);
			const set = responseStream.$set[`editingUsers.${this.currentUser._id}`];
			Assert.equal(set.commitHash, this.data.editing.commitHash, `editingUsers for ${stream._id} has incorrect commitHash`);
			Assert(set.startedAt > this.editedAfter, `startedAt for ${stream._id} not properly set`);
		}
		else if (responseStream) {
			Assert.fail(`stream ${responseStream._id} not expected in response`);
		}
	}

	// given an index into streams that we expected to be created, find the part of
	// the response that has that stream
	findCreatedStreamInResponse (index, streams) {
		const file = this.newFiles[index];
		const responseStream = streams.find(inStream => inStream.file === file);
		Assert(responseStream, `stream for new stream ${file} not found in response`);
		Assert(responseStream.teamId === this.team._id, `incorrect team ID in stream created for ${file}`);
		Assert(responseStream.repoId === this.repo._id, `incorrect repo ID in stream created for ${file}`);
		Assert(responseStream.createdAt > this.editedAfter, `incorrect createdAt in stream created for ${file}`);
		Assert(responseStream.modifiedAt > this.editedAfter, `incorrect modifiedAt in stream created for ${file}`);
		Assert(responseStream.type === 'file', `incorrect type in stream created for ${file}`);
		const entry = responseStream.editingUsers[`editingUsers.${this.currentUser._id}`];
		Assert(entry, `no entry for editing user in stream created for ${file}`);
		Assert(entry.commitHash === this.data.editing.commitHash, `commitHash is not correct for stream created for ${file}`);
		Assert(entry.startedAt > this.editedAfter, `startedAt is not correct for stream created for ${file}`);
	}

	// confirm no foreign streams are in the request response, these should not be
	// affected in any way
	confirmNoForeignStreams (streams) {
		const foreignStreams = [
			...this.foreignFileStreams,
			...this.foreignChannelStreams,
			...this.foreignDirectStreams
		].map(stream => stream._id);
		const hasForeignStream = streams.find(stream => {
			return foreignStreams.includes(stream._id);
		});
		Assert(!hasForeignStream, 'foreign stream found in response');
	}
}

module.exports = MultipleCommonInit;
