'use strict';

const GetCodemarksTest = require('./get_codemarks_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class GetPostlessCodemarksTest extends GetCodemarksTest {

	constructor (options) {
		super(options);
		delete this.streamOptions.creatorIndex;
		delete this.postOptions.creatorIndex;
	}

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team and the codemarks are for third-party provider';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodemarks,
			this.setCodemarks,
			this.setPath
		], callback);
	}

	createCodemarks (callback) {
		this.postData = [];
		BoundAsync.timesSeries(
			this,
			10,
			this.createCodemark,
			callback
		);
	}

	createCodemark (n, callback) {
		const type = this.postOptions.codemarkTypes[this.postOptions.assignedTypes[n]];
		const codemarkData = this.codemarkFactory.getRandomCodemarkData({ codemarkType: type });
		Object.assign(codemarkData, {
			teamId: this.team._id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		if (this.postOptions.wantMarker) {
			codemarkData.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
		}
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.postData.push({ codemark: response.codemark });
				callback();
			}
		);
	}
}

module.exports = GetPostlessCodemarksTest;
