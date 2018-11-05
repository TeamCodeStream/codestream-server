'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodemarkTestConstants = require('../codemark_test_constants');
const RandomString = require('randomstring');
const Assert = require('assert');

class GetPostlessCodemarkTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the codemark when requesting a postless codemark created for a third-party provider';
	}

	getExpectedFields () {
		return { codemark: CodemarkTestConstants.EXPECTED_CODEMARK_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodemark
		], callback);
	}

	// create the codemark to fetch
	createCodemark (callback) {
		const data = this.makeCodemarkData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				this.path = '/codemarks/' + this.codemark._id;
				callback();
			}
		);
	}

	// make the data for the codemark to be created for the test
	makeCodemarkData () {
		const data = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(data, {
			teamId: this.team._id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		return data;
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct codemark, and that we only got sanitized attributes
		this.validateMatchingObject(this.codemark._id, data.codemark, 'codemark');
		Assert.equal(data.post, undefined, 'post is not undefined');
		this.validateSanitized(data.codemark, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostlessCodemarkTest;
