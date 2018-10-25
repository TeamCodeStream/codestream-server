'use strict';

const PutMarkerTest = require('./put_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class SetPostIdTest extends PutMarkerTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			delete this.postOptions.creatorIndex;
			callback();
		});
	}

	// form the data for the marker update
	makeMarkerData (callback) {
		BoundAsync.series(this, [
			this.makePostlessMarker,
			super.makeMarkerData,
			this.adjustMarkerData
		], callback);
	}

	makePostlessMarker (callback) {
		const markerData = this.makePostlessMarkerData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/markers',
				data: markerData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.marker;
				callback();
			}
		);
	}

	makePostlessMarkerData () {
		return {
			teamId: this.team._id,
			remotes: [ this.repoFactory.randomUrl() ],
			file: this.streamFactory.randomFile(),
			commitHash: this.repoFactory.randomCommitHash(),
			code: RandomString.generate(100)
		};
	}

	adjustMarkerData (callback) {
		const postData = {
			providerType: 'slack',
			postId: RandomString.generate(10),
			postStreamId: RandomString.generate(10)
		};
		Object.assign(this.data, postData);
		Object.assign(this.expectedData.marker.$set, postData);
		Object.assign(this.expectedMarker, postData);
		callback();
	}
}

module.exports = SetPostIdTest;
