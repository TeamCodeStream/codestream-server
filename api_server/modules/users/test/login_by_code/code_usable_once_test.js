'use strict';

const LoginByCodeTest = require('./login_by_code_test');

class CodeUsableOnceTest extends LoginByCodeTest {

	get description () {
		return 'should return an error when reusing a code';
	}

	getExpectedError () {
		return {
			code: 'USRC-1030'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { callback(error); }
			this.doApiRequest(
				{
					method: this.method,
					path: this.path,
					data: this.data,
					requestOptions: this.apiRequestOptions || {}
				},
				callback
			);
		});
	}


}

module.exports = CodeUsableOnceTest;
