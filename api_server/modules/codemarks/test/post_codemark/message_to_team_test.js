'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the codemark when a codemark is posted';
	}	

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.expectMarker = true;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData (() => {
			// add marker data to the codemark
			this.data.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
			this.createRelatedCodemarks(callback);
		});
	}

	// create several codemarks to be related to the codemark created during the test
	createRelatedCodemarks (callback) {
		this.data.relatedCodemarkIds = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createRelatedCodemark,
			callback
		);
	}

	// create a single codemark to be related to the codemark created during the test
	createRelatedCodemark (n, callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.team.id,
			providerType: this.data.providerType,
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		codemarkData.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0].id });
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.relatedCodemarkIds.push(response.codemark.id);
				callback();
			}
		);
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = MessageToTeamTest;
