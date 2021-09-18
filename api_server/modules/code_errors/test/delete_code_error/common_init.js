// base class for many tests of the "DELETE /code-errors/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.testPost = 0;
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData,
			this.setPath
		], callback);
	}

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
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantCodeError: true
		});
		callback();
	}

	setExpectedData (callback) {
		this.codeError = this.postData[this.testPost].codeError;
		this.expectedData = {
			codeErrors: [{
				id: this.codeError.id,
				_id: this.codeError.id,	// DEPRECATE ME
				$set: {
					version: this.expectedVersion,
					deactivated: true,
					modifiedAt: Date.now(), // placehodler
					numReplies: 0
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}]
		};

		this.expectedCodeError = DeepClone(this.codeError);
		Object.assign(this.expectedCodeError, this.expectedData.codeErrors[0].$set);

		const postData = this.postData[this.testPost];
		this.expectedData.posts = [{
			_id: postData.post.id,	// DEPRECATE ME
			id: postData.post.id,
			$set: {
				deactivated: true,
				text: 'this post has been deleted',
				modifiedAt: Date.now(),	// placeholder
				numReplies: 0,
				version: 2
			},
			$version: {
				before: 1,
				after: 2
			}
		}];
		this.expectedPost = DeepClone(postData.post);
		Object.assign(this.expectedPost, this.expectedData.posts[0].$set);

		this.modifiedAfter = Date.now();
		callback();
	}

	setPath (callback) {
		this.path = '/code-errors/' + this.codeError.id;
		callback();
	}

	deleteCodeError (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/code-errors/' + this.codeError.id,
				data: null,
				token: this.token
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
