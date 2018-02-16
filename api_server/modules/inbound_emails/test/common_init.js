// base class for inbound email tests, using "POST /no-auth/inbound-email" request

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');

class CommonInit {

	init (callback) {
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
}

module.exports = CommonInit;
