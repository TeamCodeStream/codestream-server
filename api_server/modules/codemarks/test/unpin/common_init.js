// base class for many tests of the "PUT /unpin/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostlessCodemark,	// make a postless codemark, as needed
			this.makeCodemarkUpdateData
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		/*
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
		*/
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
			this.codemark = this.postData[0].codemark;
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
				callback();
			}
		);
	}

	// get data to use for the postless codemark, as needed
	getPostlessCodemarkData () {
		const data = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType || 'comment' });
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8)
		});
		return data;
	}

	// make the data to use when issuing the test request
	makeCodemarkUpdateData (callback) {
		this.data = {};
		this.expectedData = {
			codemark: {
				_id: this.codemark.id,	// DEPRECATE ME
				id: this.codemark.id,
				$set: {
					pinned: false,
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedCodemark = DeepClone(this.codemark);
		Object.assign(this.expectedCodemark, this.expectedData.codemark.$set);
		this.modifiedAfter = Date.now();
		this.path = '/unpin/' + this.codemark.id;
		callback();
	}

	// perform the actual update 
	unpinCodemark (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/unpin/' + this.codemark.id,
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
