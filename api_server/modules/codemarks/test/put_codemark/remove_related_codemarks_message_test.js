'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class RemoveRelatedCodemarksMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return `members of the team or stream should receive a message with the codemark and updates to related codemarks when a codemark is updated in a ${this.streamType} stream, and related codemarks are removed`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// override making the postless codemark, to create some codemarks first, and then relate those,
	// so they are "pre-related" to the codemark when we do the test
	makePostlessCodemark (callback) {
		this.data = { relatedCodemarkIds: [] };
		BoundAsync.series(this, [
			this.createPrerelatedCodemarks,
			super.makePostlessCodemark
		], callback);
	}

	// add the codemarks we have already created to the list of related codemarks for the test codemark to be created
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		data.relatedCodemarkIds = this.prerelatedCodemarkIds;
		return data;
	}
		
	// create several codemarks to be related to the codemark to be updated during the test
	createPrerelatedCodemarks (callback) {
		this.prerelatedCodemarkIds = [];
		BoundAsync.timesSeries(
			this,
			4,
			this.createPrerelatedCodemark,
			callback
		);
	}

	// create a single codemark to be related to the codemark created during the test
	createPrerelatedCodemark (n, callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.team.id,
			providerType: RandomString.generate(10),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		codemarkData.markers = [this.markerFactory.getRandomMarkerData()];
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.prerelatedCodemarkIds.push(response.codemark.id);
				callback();
			}
		);
	}

	makeCodemarkUpdateData (callback) {
		// after generate codemark data, create some codemarks that will be related
		BoundAsync.series(this, [
			super.makeCodemarkUpdateData,
			this.adjustUpdateData
		], callback);
	}

	// adjust the update data to be sent with the test
	adjustUpdateData (callback) {
		this.data.relatedCodemarkIds = [this.prerelatedCodemarkIds[1], this.prerelatedCodemarkIds[3]];
		callback();
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// for channels and directs the message comes on the stream channel
		if (this.goPostless || this.stream.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			this.channelName = `stream-${this.stream.id}`;
		}
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// stream channel with the updated post
		this.updateCodemark(callback);
	}
}

module.exports = RemoveRelatedCodemarksMessageTest;
