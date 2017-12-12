'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class MessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.numPosts = 5;
	}

	get description () {
		return 'members of the team should receive a message with the marker location update when a marker location update is made';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createStreamCreator,
			this.createRepo,
			this.createStream,
			this.createPosts,
			this.adjustMarkers,
			this.setData
		], callback);
	}

	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	createStreamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.streamCreatorData = response;
				callback();
			}
		);
	}

	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

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
					this.currentUser.email,
					this.streamCreatorData.user.email
				],
				withRandomEmails: 1,
				token: this.teamCreatorData.accessToken
			}
		);
	}

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
				token: this.streamCreatorData.accessToken
			}
		);
	}

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

	createPost (n, callback) {
		let token = n % 2 === 1 ? this.token : this.teamCreatorData.accessToken;
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
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

	adjustMarkers (callback) {
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

	adjustMarker (marker) {
		let adjustedLocation = [];
		let location = this.locations[marker._id];
		location.slice(0, 4).forEach(coordinate => {
			let adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker._id] = adjustedLocation;
	}

	setData (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();
		this.data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
		};
		callback();
	}


	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/marker-locations',
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
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
