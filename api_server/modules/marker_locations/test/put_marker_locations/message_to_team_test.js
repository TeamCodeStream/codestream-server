'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = 'channel';
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 5,
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true,
			markerStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
	}

	get description () {
		return 'members of the team should receive a message with the marker location update when a marker location update is made';
	}

	// make the data used to initiate the message test
	makeData (callback) {
		BoundAsync.series(this, [
			this.adjustMarkers,			// adjust those markers for a different commit
			this.setData				// set the data to be used in the request that will result in a message sent
		], callback);
	}

	// adjust the markers for the posts as if they are adjusted for a different commit
	adjustMarkers (callback) {
		this.markers = this.postData.map(postData => postData.markers[0]);
		this.locations = this.postData.reduce((locations, postData) => {
			const markerId = postData.markers[0]._id;
			locations[markerId] = postData.markerLocations[0].locations[markerId];
			return locations;
		}, {});
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });	// should be in sorted order for comparison of the results
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

	// adjust a single marker's location as if it is adjusted for a different commit
	adjustMarker (marker) {
		const adjustedLocation = [];
		const location = this.locations[marker._id];
		// pure randomness here, not very realistic, but should't matter
		location.slice(0, 4).forEach(coordinate => {
			let adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker._id] = adjustedLocation;
	}

	// set the data to be used in the request that triggers the message
	setData (callback) {
		this.newCommitHash = this.repoFactory.randomCommitHash();	// a new commit hash for the adjusted locations
		this.data = {
			teamId: this.team._id,
			streamId: this.repoStreams[0]._id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
		};
		callback();
	}

	// set the pubnub channel name we expect a message on
	setChannelName (callback) {
		// marker location messages come to us on the team channel
		this.channelName = `team-${this.team._id}`;
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
						streamId: this.repoStreams[0]._id,
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
