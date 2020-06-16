'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const RandomString = require('randomstring');
const Assert = require('assert');

class ExternalIssueProviderTest extends PostCodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return a valid codemark when creating an issue codemark using a third-party provider';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			// for third-party provider issues, put in objects with a displayName, 
			// and any other arbitrary info
			this.data.externalAssignees = [
				{
					displayName: RandomString.generate(10),
					id: RandomString.generate(10)
				},
				{
					displayName: RandomString.generate(10),
					id: RandomString.generate(10)
				}
			];
			this.data.externalProvider = 'jira';	// for example
			this.data.externalProviderUrl = 'http://jira.com/blah';	 // nothin' fancy here
			callback();
		});
	}

	validateResponse (data) {
		const codemark = data.codemark;
		Assert.deepEqual(codemark.externalAssignees, this.data.externalAssignees, 'externalAssignees not correct');
		Assert.equal(codemark.externalProvider, this.data.externalProvider, 'externalProvider not correct');
		Assert.equal(codemark.externalProviderUrl, this.data.externalProviderUrl, 'externalProviderUrl not correct');
		return super.validateResponse(data);
	}
}

module.exports = ExternalIssueProviderTest;
