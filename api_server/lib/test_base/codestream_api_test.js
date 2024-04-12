// Base class for unit tests conforming to an API request/response cycle, with
// CodeStream-specific considerations

'use strict';

const APIRequestTest = require('./api_request_test');
const RandomUserFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/random_user_factory');
const RandomTeamFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/test/random_team_factory');
const RandomCompanyFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/test/random_company_factory');
const RandomRepoFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/test/random_repo_factory');
const RandomStreamFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/test/random_stream_factory');
const RandomPostFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/test/random_post_factory');
const RandomMarkerFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/test/random_marker_factory');
const RandomCodemarkFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/test/random_codemark_factory');
const RandomReviewFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/test/random_review_factory');
const RandomCodeErrorFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/test/random_code_error_factory');
const RandomNRCommentFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_comments/test/random_nr_comment_factory');
const RandomEntityFactory = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/entities/test/random_entity_factory');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require('./test_team_creator');
const TestStreamCreator = require('./test_stream_creator');

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
		this.companyFactory = new RandomCompanyFactory({
			apiRequester: this
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
			apiRequester: this,
			repoFactory: this.repoFactory,
			streamFactory: this.streamFactory
		});
		this.codemarkFactory = new RandomCodemarkFactory({
			apiRequester: this,
			markerFactory: this.markerFactory
		});
		this.reviewFactory = new RandomReviewFactory({
			apiRequester: this,
			markerFactory: this.markerFactory,
			repoFactory: this.repoFactory,
		});
		this.codeErrorFactory = new RandomCodeErrorFactory({
			apiRequester: this,
			markerFactory: this.markerFactory,
			repoFactory: this.repoFactory,
		});
		this.postFactory = new RandomPostFactory({
			apiRequester: this,
			streamFactory: this.streamFactory,
			repoFactory: this.repoFactory,
			codemarkFactory: this.codemarkFactory,
			reviewFactory: this.reviewFactory,
			codeErrorFactory: this.codeErrorFactory
		});
		this.nrCommentFactory = new RandomNRCommentFactory({
			apiRequester: this,
			userFactory: this.userFactory,
			codeErrorFactory: this.codeErrorFactory
		});
		this.entityFactory = new RandomEntityFactory({
			apiRequester: this
		});
		
		this.userOptions = {
			numRegistered: 2,
			numUnregistered: 0,
			currentUserIndex: 0,
			userData: []
		};
		this.teamOptions = {
			creatorIndex: 0,
			members: 'all',
			numAdditionalInvites: 1
		};
		this.repoOptions = {
			creatorIndex: undefined
		};
		this.streamOptions = {
			creatorIndex: undefined,
			type: 'channel',
			members: 'all'
		};
		this.postOptions = {
			creatorIndex: undefined,
			numPosts: 1,
			wantMarker: false,
			postData: []
		};
		this.users = [];
	}

	// validate that the object passed is sanitized of server-only attributes,
	// according to the list of attributes that should be sanitized away
	validateSanitized (object, unsanitizedAttributes) {
		let present = [];
		let objectAttributes = Object.keys(object);
		unsanitizedAttributes.forEach(attribute => {
			if (objectAttributes.includes(attribute)) {
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

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createUsersAndTeam,
			this.createStreamAndPosts
		], callback);
	}

	after (callback) {
		if (!this.testDidNotRun) {
			if (this.mockMode) {
				this.clearMockCache(() => { 
					super.after(callback);
				});
			} else if (process.env.CS_API_DELETE_TEST_DATA) {
				this.deleteTestData(() => {
					super.after(callback);
				});
			} else {
				super.after(callback);
			}
		} else {
			super.after(callback);
		}
	}

	clearMockCache (callback) {
		if (!this.connectedToIpc()) { 
			return callback();
		}
		this.doApiRequest(
			{
				method: 'delete',
				path: '/no-auth/--clear-mock-cache'
			},
			callback
		);
	}

	deleteTestData (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/no-auth/--delete-test-data',
				requestOptions: {
					headers: {
						['X-CS-Delete-Cheat']: this.apiConfig.sharedSecrets.subscriptionCheat
					}
				}
			},
			callback
		);
	}

	createUsersAndTeam (callback) {
		new TestTeamCreator({
			test: this,
			userOptions: this.userOptions,
			teamOptions: this.teamOptions,
			repoOptions: this.repoOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			Object.assign(this, data);
			callback();
		});
	}

	createStreamAndPosts (callback) {
		new TestStreamCreator({
			test: this,
			streamOptions: this.streamOptions,
			postOptions: this.postOptions,
			team: this.team,
			teamStream: this.teamStream,
			repo: this.repo,
			repos: this.repos,
			repoStreams: this.repoStreams,
			users: this.users
		}).create((error, data) => {
			if (error) { return callback(error); }
			Object.assign(this, data);
			callback();
		});
	}

	isOnPrem () {
		return this.apiConfig.sharedGeneral.isOnPrem;
	}
}

module.exports = CodeStreamAPITest;
