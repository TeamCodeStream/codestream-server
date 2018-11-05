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
			this.makePostlessCodemark,
			this.makeCodemarkData
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	makePostlessCodemark (callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.team._id,
			providerType: RandomString.generate(8)
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				callback();
			}
		);
	}

	// form the data for the codemark update
	makeCodemarkData (callback) {
		this.data = {
			postId: RandomString.generate(10),
			streamId: RandomString.generate(10)
		};
		this.expectedData = {
			codemark: {
				_id: this.codemark._id,
				$set: Object.assign(DeepClone(this.data), { 
					version: this.expectedVersion,
					providerType: this.codemark.providerType,
					modifiedAt: Date.now()	// placeholder
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
}

module.exports = CommonInit;
