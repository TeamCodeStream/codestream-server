// Base class for unit tests conforming to an API request/response cycle, with
// CodeStream-specific considerations

'use strict';

var APIRequestTest = require('./api_request_test');
var RandomUserFactory = require(process.env.CS_API_TOP + '/modules/users/test/random_user_factory');
var RandomTeamFactory = require(process.env.CS_API_TOP + '/modules/teams/test/random_team_factory');
var RandomRepoFactory = require(process.env.CS_API_TOP + '/modules/repos/test/random_repo_factory');
var RandomStreamFactory = require(process.env.CS_API_TOP + '/modules/streams/test/random_stream_factory');
var RandomPostFactory = require(process.env.CS_API_TOP + '/modules/posts/test/random_post_factory');
var RandomMarkerFactory = require(process.env.CS_API_TOP + '/modules/markers/test/random_marker_factory');
var Assert = require('assert');

class CodeStreamAPITest extends APIRequestTest {

	constructor (options) {
		super(options);
		// set up factories to generate various test objects for us
		this.userFactory = new RandomUserFactory({
			apiRequester: this
		});
		this.teamFactory = new RandomTeamFactory({
			apiRequester: this,
			userFactory: this.userFactory
		});
		this.repoFactory = new RandomRepoFactory({
			apiRequester: this,
			teamFactory: this.teamFactory,
			userFactory: this.userFactory
		});
		this.streamFactory = new RandomStreamFactory({
			apiRequester: this
		});
		this.markerFactory = new RandomMarkerFactory({
			apiRequester: this
		});
		this.postFactory = new RandomPostFactory({
			apiRequester: this,
			markerFactory: this.markerFactory
		});
	}

	// for requests that require authentication, set up a user and use their
	// token for the request
	authenticate (callback) {
		if (this.dontWantToken()) {
			return callback();
		}
		this.userFactory.createRandomUser(
			(error, data) => {
				if (error) { return callback(error); }
				this.currentUser = data.user;
				this.token = data.accessToken;
				callback();
			},
			this.userOptions || {}
		);
	}

	// override for requests that don't require authentication
	dontWantToken () {
		return false;
	}

	// validate that the object passed is sanitized of server-only attributes,
	// according to the list of attributes that should be sanitized away
	validateSanitized (object, unsanitizedAttributes) {
		let present = [];
		let objectAttributes = Object.keys(object);
		unsanitizedAttributes.forEach(attribute => {
			if (objectAttributes.indexOf(attribute) !== -1) {
				present.push(attribute);
			}
		});
		Assert(present.length === 0, 'these attributes are present and shouldn\'t be: ' + present.join(','));
	}

	// validate that the passed objects are sanitized of server-only attributes,
	// according to the list of attributes that should be sanitized away
	validateSanitizedObjects (objects, unsanitizedAttributes) {
		objects.forEach(object => {
			this.validateSanitized(object, unsanitizedAttributes);
		});
	}
}

module.exports = CodeStreamAPITest;
