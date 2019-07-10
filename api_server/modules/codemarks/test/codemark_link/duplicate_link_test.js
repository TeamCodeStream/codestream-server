'use strict';

const CodemarkLinkTest = require('./codemark_link_test');
const Assert = require('assert');

class DuplicateLinkTest extends CodemarkLinkTest {

	get description () {
		const withMarker = this.wantMarkers ? 'with marker' : '';
		return `when creating a codemark link for a ${this.permalinkType} codemark${withMarker} with attributes matching an existing link, should find the created link instead of creating a new one`;
	}

	run (callback) {
		// we'll run the test twice, but on the second run, we expect the permalink returned to match the first
		super.run(error => {
			if (error) { return callback(error); }
			super.run(callback);
		});
	}

	validateResponse (data) {
		if (!this.secondRun) {
			this.secondRun = true;
			this.firstRunPermalink = data.permalink;
			return super.validateResponse(data);
		}
		Assert.equal(data.permalink, this.firstRunPermalink, 'permalink on second run expected to be duplicate');
	}
}

module.exports = DuplicateLinkTest;
