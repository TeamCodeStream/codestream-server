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
			this.makeCodemarkUpdateData,
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantCodemark: true
		});
		callback();
	}

	getCodemarkUpdateData () {
		return {
			status: RandomString.generate(8),
			color: RandomString.generate(8),
			title: RandomString.generate(100),
			text: RandomString.generate(100)
		};
	}

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
		if (this.codemark.providerType) {
			this.expectedData.codemark.$set.providerType = this.codemark.providerType;
		}
		this.expectedCodemark = DeepClone(this.codemark);
		Object.assign(this.expectedCodemark, this.expectedData.codemark.$set);
		this.modifiedAfter = Date.now();
		this.path = '/codemarks/' + this.codemark._id;
		callback();
	}
}

module.exports = CommonInit;
