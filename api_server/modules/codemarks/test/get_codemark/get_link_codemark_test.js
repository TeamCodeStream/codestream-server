'use strict';

const GetCodemarkWithMarkerTest = require('./get_codemark_with_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetLinkCodemarkTest extends GetCodemarkWithMarkerTest {

	constructor (options) {
		super(options);
		delete this.postOptions.creatorIndex;
	}

	get description () {
		return 'should be ok to fetch a link-type codemark that is not associated with a stream';
	}

	getExpectedFields () {
		const expectedFields = [...super.getExpectedFields().codemark];
		let index = expectedFields.indexOf('title');
		expectedFields.splice(index, 1);
		index = expectedFields.indexOf('text');
		expectedFields.splice(index, 1);
		return { codemark: expectedFields };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodemark,
			this.setPath
		], callback);
	}

	createCodemark (callback) {
		const data = this.codemarkFactory.getRandomCodemarkData({
			codemarkType: 'link',
			wantMarkers: 1 
		});
		data.teamId = this.team.id;
		delete data.markers[0].commitHash;
		delete data.markers[0].file;
		delete data.title;
		delete data.text;
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				callback();
			}
		);
	}

	setPath (callback) {
		if (!this.codemark) { return callback(); }
		this.path = '/codemarks/' + this.codemark.id;
		callback();
	}
}

module.exports = GetLinkCodemarkTest;
