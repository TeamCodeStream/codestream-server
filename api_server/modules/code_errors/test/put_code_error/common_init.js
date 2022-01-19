// base class for many tests of the "PUT /code-errors" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');
const UUID = require('uuid').v4;

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCodeErrorUpdateData, // make the data to use when issuing the test request
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 2;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodeError: true
		});
		callback();
	}

	// get the data to use when issuing the test request	
	getCodeErrorUpdateData () {
		const data = {
			title: RandomString.generate(100),
			text: RandomString.generate(1000),
			stackTraces: [
				this.codeErrorFactory.getRandomStackTraceInfo(),
				this.codeErrorFactory.getRandomStackTraceInfo()
			]
		};
		return data;
	}

	// make the data to use when issuing the test request
	makeCodeErrorUpdateData (callback) {
		this.codeError = this.codeError || this.postData[0].codeError;
		this.data = this.getCodeErrorUpdateData();
		this.expectedData = {
			codeError: {
				_id: this.codeError.id,	// DEPRECATE ME
				id: this.codeError.id,
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
		this.expectedCodeError = DeepClone(this.codeError);
		Object.assign(this.expectedCodeError, this.expectedData.codeError.$set);
		this.modifiedAfter = Date.now();
		this.path = '/code-errors/' + this.codeError.id;
		callback();
	}

	// perform the actual update 
	updateCodeError (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/code-errors/' + this.codeError.id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.requestData = this.data;
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
