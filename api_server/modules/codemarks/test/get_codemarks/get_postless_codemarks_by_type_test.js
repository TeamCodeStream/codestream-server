'use strict';

const GetPostlessCodeMarksTest = require('./get_postless_codemarks_test');
const Assert = require('assert');

class GetPostlessCodeMarksByTypeTest extends GetPostlessCodeMarksTest {

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team and by type and the codemarks are for third-party provider';
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

module.exports = GetPostlessCodeMarksByTypeTest;
