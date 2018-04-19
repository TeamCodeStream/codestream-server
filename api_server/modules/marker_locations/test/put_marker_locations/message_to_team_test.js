'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.numPosts = 5;
	}

	get description () {
		return 'members of the team should receive a message with the marker location update when a marker location update is made';
	}

	// make the data used to initiate the message test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,		// create a user who will create a team
			this.createStreamCreator,	// create a user who will create a stream
			this.createRepo,			// create a repo (creating a team)
			this.createStream,			// create a file stream in that repo
			this.createPosts,			// create some posts in that stream (with markers)
			this.adjustMarkers,			// adjust those markers for a different commit
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
				this.locations[marker._id] = response.markerLocations[0].locations[marker._id];
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

	// adjust the markers for the posts as if they are adjusted for a different commit
	adjustMarkers (callback) {
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });	// should be in sorted order for comparison of the results
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

	// adjust a single marker's location as if it is adjusted for a different commit
	adjustMarker (marker) {
		let adjustedLocation = [];
		let location = this.locations[marker._id];
		// pure randomness here, not very realistic, but should't matter
		location.slice(0, 4).forEach(coordinate => {
			let adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker._id] = adjustedLocation;
	}

	// set the data to be used in the request that triggers the message
	setData (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();	// a new commit hash for the adjusted locations
		this.data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
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
				path: '/marker-locations',
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				// this is the message we expect to receive through the team channel
				this.message = {
					markerLocations: {
						teamId: this.team._id,
						streamId: this.stream._id,
						commitHash: this.newCommitHash.toLowerCase(),
						locations: this.adjustedMarkerLocations
					}
				};
				callback();
			}
		);
	}
}

module.exports = MessageToTeamTest;
