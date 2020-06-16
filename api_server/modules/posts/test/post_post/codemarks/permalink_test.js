'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const Assert = require('assert');

class PermalinkTest extends CodemarkMarkerTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'link';
	}

	get description () {
		return `should return a valid codemark when creating a post with a ${this.permalinkType} permalink codemark, along with the url of the actual permalink`;
	}

	addCodemarkData (callback) {
		super.addCodemarkData(() => {
			this.data.codemark.createPermalink = this.permalinkType;
			callback();
		});
	}

	validateResponse (data) {
		const { permalink } = data;
		const type = this.permalinkType === 'public' ? 'p' : 'c';
		const origin = this.apiConfig.api.publicApiUrl.replace(/\//g, '\\/');
		const regex = `^${origin}\\/${type}\\/([A-Za-z0-9_-]+)\\/([A-Za-z0-9_-]+)$`;
		const match = permalink.match(new RegExp(regex));
		Assert(match, `returned permalink "${permalink}" does not match /${regex}/`);

		const teamId = this.decodeLinkId(match[1]);
		Assert.equal(teamId, this.team.id, 'permalink does not contain proper team ID');

		super.validateResponse(data);
	}

	decodeLinkId (linkId) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		return Buffer.from(linkId, 'base64').toString('hex');
	}
}

module.exports = PermalinkTest;
