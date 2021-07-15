// base class for many tests of the "PUT /code-errors/reopen/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.expectedVersion = 3;
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 3;
		/*
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;
		*/
		this.repoOptions.creatorIndex = 1;

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.getPostData,		// get random post data for creating the code error
			this.createCodeError,		// create the test code error
			this.resolveCodeError,		// resolve the code error 
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// get the random post data for creating the code error
	getPostData (callback) {
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.postData = data;
				callback();
			},
			{
				wantCodeError: true,
				wantMarkers: 2,
				streamId: this.teamStream.id
			}
		);

	}

	// create the test code error
	createCodeError (callback) {
		this.postData.codeError.assignees = [ this.users[0].user.id, this.users[2].user.id ]
			.filter(id => this.team.memberIds.includes(id));
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.postData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codeError = response.codeError;
				callback();
			}
		);
	}

	// resolve the code error
	resolveCodeError (callback) {
		const currentUserHasAcl = this.team.memberIds.includes(this.currentUser.user.id) &&
			(!this.teamStream || !this.teamStream.memberIds || this.teamStream.memberIds.includes(this.currentUser.user.id));
		this.closingUser = currentUserHasAcl ? this.currentUser : this.users[1];
		this.doApiRequest(
			{
				method: 'put',
				path: `/code-errors/resolve/${this.codeError.id}`,
				token: this.closingUser.accessToken
			},
			callback
		);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.expectedResponse = {
			codeError: {
				_id: this.codeError.id,	// DEPRECATE ME
				id: this.codeError.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now(), // placeholder
					status: 'open'
				},
				$unset: {
					[`resolvedBy.${this.currentUser.user.id}`]: true,
					resolvedAt: true
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};

		this.modifiedAfter = Date.now();
		this.path = `/code-errors/reopen/${this.codeError.id}`;
		this.expectedCodeError = DeepClone(this.codeError);
		this.expectedCodeError.status = 'open';
		this.expectedCodeError.resolvedBy = {};
		delete this.expectedCodeError.resolvedAt;
		this.expectedCodeError.version = this.expectedVersion;
		callback();
	}

	// perform the actual reopen
	reopenCodeError (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/code-errors/reopen/${this.codeError.id}`,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
