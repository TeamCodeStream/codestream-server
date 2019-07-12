'use strict';

const PermalinkTest = require('./permalink_test');
const Assert = require('assert');
const ObjectID = require('mongodb').ObjectID;

class InvalidTeamTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions.expectRedirect = true;
	}

	get description () {
		return `when opening a ${this.permalinkType} permalink, and the team indicated in the permalink is not found, the user should be redirected to the 404 page`;
	}

	createPermalink (callback) {
		super.createPermalink(error => {
			if (error) { return callback(error); }
			const pathParts = this.path.split('/');
			pathParts[3] = this.encodeLinkId(ObjectID().toString());
			this.path = pathParts.join('/');
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/404', 'did not get redirected to expected page');
	}
}

module.exports = InvalidTeamTest;
