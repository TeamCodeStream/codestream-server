// base class for many tests of the "POST /nr-comments" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeNRCommentData		// make the data to be used during the request
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the generating the NewRelic comment
	makeNRCommentData (callback) {
		this.data = this.nrCommentFactory.getRandomNRCommentData();
		this.apiRequestOptions = {
			headers: {
				'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
				'X-CS-NewRelic-AccountId': this.data.accountId
			}
		};
		const now = Date.now();
		this.expectedResponse = {
			post: Object.assign(DeepClone(this.data), {
				version: 1,
				createdAt: now, // placeholder
				modifiedAt: now, // placeholder
				deactivated: false,
				seqNum: this.expectedSeqNum || 2,
				mentionedUsers: [],
				reactions: {},
				files: []
			})
		};
		this.expectedResponse.post.creator.username = EmailUtilities.parseEmail(this.data.creator.email).name;
		this.createdAfter = Date.now();
		callback();
	}

	// create the comment for real
	createNRComment (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data: this.data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.nrCommentResponse = response;
				//this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
