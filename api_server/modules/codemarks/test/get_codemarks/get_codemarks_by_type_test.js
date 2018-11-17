'use strict';

const GetCodemarksTest = require('./get_codemarks_test');
const Assert = require('assert');

class GetCodemarksByTypeTest extends GetCodemarksTest {

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team and by type';
	}

	setPath (callback) {
		this.type = this.postOptions.codemarkTypes[1];
		this.expectedCodemarks = this.codemarks.filter(codemark => codemark.type === this.type);
		this.path = `/codemarks?teamId=${this.team.id}&type=${this.type}`;
		callback();
	}

	// validate correct response
	validateResponse (data) {
		data.codemarks.forEach(codemark => {
			Assert.equal(codemark.type, this.type, 'got a codemark with non-matching type');
		});
		super.validateResponse(data);
	}
}

module.exports = GetCodemarksByTypeTest;
