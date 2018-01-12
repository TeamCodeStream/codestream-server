'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');
const PostTestConstants = require(process.env.CS_API_TOP + '/modules/posts/test/post_test_constants');

class InboundEmailTest extends CodeStreamAPITest {

	get description () {
		return 'should create and return a post when an inbound email call is made';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/inbound-email';
	}

	getExpectedFields () {
		return { post: PostTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createPostOriginator,	// create a user who will simulate being the sender of the email
			this.createRepo,	// create the repo (and team) to be used in the test
			this.createStream,	// create the stream in the repo
			this.makePostData	// make the data to use in the request that triggers the message
		], callback);
	}

	// create a user who will simulate being the originator of the email
	createPostOriginator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postOriginatorData = response;
				callback();
			}
		);
	}

	// create the repo to use in the test
	createRepo (callback) {
		let emails = this.dontIncludeOtherUser ? [] : [this.postOriginatorData.user.email];
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: emails,
				withRandomEmails: 1,	// include another random user for good measure
				token: this.token	// "i" will create the repo
			}
		);
	}

	// create a file-type stream in the repo
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.token // "i" will create the stream
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		let toEmail = `${this.stream._id}.${this.team._id}@${EmailConfig.replyToDomain}`;
		this.data = {
			to: [{ address: toEmail }],
			from: { address: this.postOriginatorData.user.email },
			text: this.postFactory.randomText(),
			mailFile: 'somefile',	// doesn't really matter
			secret: Secrets.mail,
			attachments: []
		};
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a post with the attributes we specified
		let post = data.post;
		let errors = [];
		let result = (
			((post.text === this.data.text) || errors.push('text does not match')) &&
			((post.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((post.streamId === this.stream._id) || errors.push('streamId does not match')) &&
			((post.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof post.createdAt === 'number') || errors.push('createdAt not number')) &&
			((post.modifiedAt >= post.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((post.creatorId === this.postOriginatorData.user._id) || errors.push('creatorId not equal to the post originator ID'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = InboundEmailTest;
