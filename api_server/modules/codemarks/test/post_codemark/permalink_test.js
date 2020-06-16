'use strict';

const MarkerTest = require('./marker_test');
const CodemarkValidator = require('../codemark_validator');

class PermalinkTest extends MarkerTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'link';
	}

	get description () {
		return `should return a valid codemark when creating a ${this.permalinkType} permalink codemark, along with the url of the actual permalink`;
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data.createPermalink = this.permalinkType;
			callback();
		});
	}

	validateResponse (data) {
		new CodemarkValidator({
			test: this
		}).validatePermalink(data.codemark.permalink);
		super.validateResponse(data);
	}
}

module.exports = PermalinkTest;
