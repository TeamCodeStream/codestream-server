'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');

class PermalinkTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'any user should be able to open a web page for a public permalink';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createPermalink	// create the permalink codemark to display
		], callback);
	}

	// create the permalink codemark to display
	createPermalink (callback) {
		this.data = this.codemarkFactory.getRandomCodemarkData({
			codemarkType: 'link',
			wantMarkers: true
		});
		delete this.data.text;
		delete this.data.title;
		Object.assign(this.data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10),
			createPermalink: 'public'
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = response.permalink.split(ApiConfig.publicApiUrl)[1];
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (/*data*/) {
	}
}

module.exports = PermalinkTest;
