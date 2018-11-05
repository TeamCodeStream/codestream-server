'use strict';

const GetCodeMarksTest = require('./get_codemarks_test');
const Assert = require('assert');

class GetCodeMarksByTypeTest extends GetCodeMarksTest {

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team and by type';
	}

	setPath (callback) {
		this.type = this.postOptions.codemarkTypes[1];
		this.expectedCodeMarks = this.codemarks.filter(codemark => codemark.type === this.type);
		this.path = `/codemarks?teamId=${this.team._id}&type=${this.type}`;
		callback();
	}

	// validate correct response
	validateResponse (data) {
		data.codemarks.forEach(codemark => {
			Assert.equal(codemark.type, this.type, 'got an codemark with non-matching type');
		});
		super.validateResponse(data);
	}
}

module.exports = GetCodeMarksByTypeTest;
