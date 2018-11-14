// base class for many tests of the "PUT /codemarks" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostlessCodemark,	// make a postless codemark, as needed
			this.makeCodemarkUpdateData	// make the data to use when issuing the test request
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		if (this.streamType === 'team stream') {
			Object.assign(this.streamOptions, {
				type: 'channel',
				isTeamStream: true
			});
		}
		else {
			this.streamOptions.type = this.streamType || 'channel';
		}
		if (!this.goPostless) {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodemark: true,
				codemarkType: this.codemarkType || 'comment'
			});
		}
		callback();
	}

	// make a postless codemark, as needed for the test
	makePostlessCodemark (callback) {
		if (!this.goPostless) {
			return callback();
		}
		const codemarkData = this.getPostlessCodemarkData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				this.markers = response.markers;
				callback();
			}
		);
	}

	// get data to use for the postless codemark, as needed
	getPostlessCodemarkData () {
		const data = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType || 'comment' });
		Object.assign(data, {
			teamId: this.team._id,
			providerType: RandomString.generate(8)
		});
		if (this.wantMarker) {
			data.markers = [this.markerFactory.getRandomMarkerData()];
		}
		return data;
	}

	// get the data to use when issuing the test request	
	getCodemarkUpdateData () {
		const data = {
			status: RandomString.generate(8),
			color: RandomString.generate(8),
			title: RandomString.generate(100),
			text: RandomString.generate(100)
		};
		if (this.updatePostId) {
			Object.assign(data, {
				postId: RandomString.generate(10),
				streamId: RandomString.generate(10)
			});
		}
		return data;
	}

	// make the data to use when issuing the test request
	makeCodemarkUpdateData (callback) {
		if (this.postData && this.postData[0]) {
			this.codemark = this.postData[0].codemark;
		}
		this.data = this.getCodemarkUpdateData();
		this.expectedData = {
			codemark: {
				_id: this.codemark._id,
				$set: Object.assign(DeepClone(this.data), {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				}),
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedCodemark = DeepClone(this.codemark);
		Object.assign(this.expectedCodemark, this.expectedData.codemark.$set);
		this.modifiedAfter = Date.now();
		this.path = '/codemarks/' + this.codemark._id;
		callback();
	}

	// perform the actual update 
	updateCodemark (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/codemarks/' + this.codemark._id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
