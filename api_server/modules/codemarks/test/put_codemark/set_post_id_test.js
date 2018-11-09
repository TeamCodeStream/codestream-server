'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class SetPostIdTest extends PutCodemarkTest {

	get description () {
		return 'should return the updated codemark when updating a codemark with post ID and stream ID';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			delete this.postOptions.creatorIndex;
			callback();
		});
	}

	makeCodemarkUpdateData (callback) {
		BoundAsync.series(this, [
			this.makePostlessCodemark,
			super.makeCodemarkUpdateData
		], callback);
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
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				callback();
			}
		);
	}

	getCodemarkUpdateData () {
		return {
			postId: RandomString.generate(10),
			streamId: RandomString.generate(10)
		};
	}
}

module.exports = SetPostIdTest;