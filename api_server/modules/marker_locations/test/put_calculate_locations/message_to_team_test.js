'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class MessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.numPosts = 10;
		this.numEdits = 20;
	}

	get description () {
		return 'members of the team should receive a message with the marker location update when a marker location calculation is made';
	}

	// make the data used to initiate the message test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,		// create a user who will create a team
			this.createStreamCreator,	// create a user who will create a stream
			this.createRepo,			// create a repo (creating a team)
			this.createStream,			// create a file stream in that repo
			this.createPosts,			// create some posts in that stream (with markers)
			this.createRandomEdits,		// create some random edits and throw them at the random markers
			this.setData				// set the data to be used in the request that will result in a message sent
		], callback);
	}

	// create a user who will create a team
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will create a file stream in the team
	createStreamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.streamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will create some posts in the stream
	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

	// create a repo as the team creator
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [
					this.currentUser.email,	// add me to the team
					this.streamCreatorData.user.email	// add the stream creator to the team
				],
				withRandomEmails: 1,	// add some other random fellow
				token: this.teamCreatorData.accessToken	// the team creator's token
			}
		);
	}

	// create a file stream as the stream creator
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.streamCreatorData.accessToken	// the stream creator's token
			}
		);
	}

	// create some posts in the stream, all with the same commit hash
	createPosts (callback) {
		this.posts = [];
		this.markers = [];
		this.locations = {};
		this.commitHash = this.postFactory.randomCommitHash();
		BoundAsync.timesSeries(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream
	createPost (n, callback) {
		let token = n % 2 === 1 ? this.token : this.teamCreatorData.accessToken;	// alternate between me and the team creator
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// record the post, the marker, and the marker's location
				this.posts.push(response.post);
				let marker = response.markers[0];
				this.markers.push(marker);
				this.locations[marker._id] = response.markerLocations.locations[marker._id];
				callback();
			},
			{
				teamId: this.team._id,
				streamId: this.stream._id,
				wantCodeBlocks: 1,
				token: token,
				commitHash: this.commitHash
			}
		);
	}

	// create some random edits to throw at the random markers, this should be fun
	createRandomEdits (callback) {
		this.edits = this.markerFactory.randomEdits(this.numEdits);
		// wait a couple seconds for all the post messages to go through,
		// we don't to confuse the resulting messages with the message we want
		// to receive after the marker calculation
		setTimeout(callback, 2000);
	}

	// set data to be used in the request
	setData (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();	// give the calculated marker locations a new commit
		this.data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			originalCommitHash: this.commitHash,
			newCommitHash: this.newCommitHash,
			edits: this.edits
		};
		callback();
	}

	// set the pubnub channel name we expect a message on
	setChannelName (callback) {
		// marker location messages come to us on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by triggering a request to the api server
	generateMessage (callback) {
		// PUT the marker locations to the server, this should trigger an update message to the team
		this.doApiRequest(
			{
				method: 'put',
				path: '/calculate-locations',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// we expect the same message through the channel that we get through the response
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = MessageToTeamTest;
