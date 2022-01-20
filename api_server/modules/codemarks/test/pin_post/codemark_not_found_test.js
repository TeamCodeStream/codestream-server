'use strict';

const PinPostTest = require('./pin_post_test');
const ObjectId = require('mongodb').ObjectId;

class CodemarkNotFoundTest extends PinPostTest {

	get description () {
		return 'should return an error when trying to pin a post to a codemark that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'codemark'
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(() => {
			this.data.codemarkId = ObjectId();
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
