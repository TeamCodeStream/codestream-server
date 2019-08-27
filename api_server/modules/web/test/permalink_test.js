'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const Assert = require('assert');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');

class PermalinkTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		this.apiRequestOptions = {
			noJsonInRequest: true,
			noJsonInResponse: true
		};
		this.ignoreTokenOnRequest = true;
	}

	get description () {
		return 'any user should be able to open a web page for a public permalink';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createPermalink,	// create the permalink codemark to display
			this.doSignin			// do sign-in to get cookie, as needed
		], callback);
	}

	// create the permalink codemark to display
	createPermalink (callback) {
		this.makeCodemarkData();
		if (!this.dontWantPermalinkYet) {
			this.codemarkData.createPermalink = this.permalinkType || 'public';
		}
		this.createCodemarkForPermalink(callback);
	}

	// make the codemark data
	makeCodemarkData () {
		const codemarkType = this.codemarkType || 'link';
		this.codemarkData = this.codemarkFactory.getRandomCodemarkData({ codemarkType });
		if (codemarkType === 'link') {
			delete this.codemarkData.text;
			delete this.codemarkData.title;
		}
		Object.assign(this.codemarkData, {
			teamId: this.team.id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		this.codemarkData.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0].id });
	}

	// create the codemark that ends up generating the permalink
	createCodemarkForPermalink (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: this.codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemarkResponse = response;
				if (!this.dontWantPermalinkYet) {
					this.path = response.permalink.split(ApiConfig.publicApiUrl)[1];
				}
				callback();
			}
		);
	}

	// do a sign-in simulating the sign-in form to get a cookie
	doSignin (callback) {
		if (!this.wantSignin) { return callback(); }
		this.doApiRequest(
			{
				method: 'post',
				path: '/web/signin',
				data: {
					email: this.currentUser.user.email,
					password: this.currentUser.password
				},
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true,
					headers: {
						'x-csrf-bypass-secret': Secrets.confirmationCheat
					}
				}
			},
			(error, location, response) => {
				if (error) { return callback(error); }
				const setCookie = decodeURIComponent((response.headers['set-cookie'] || '').toString());
				this.setCookie(setCookie);
				callback();
			}
		);
	}

	// set the cookie to be sent with the request, in the request headers
	setCookie (cookie) {
		this.apiRequestOptions = Object.assign(this.apiRequestOptions || {}, {
			headers: { cookie }
		});
	}

	// encode a link ID using base64 encoding, to shorten it
	encodeLinkId (linkId) {
		return Buffer.from(linkId, 'hex')
			.toString('base64')
			.split('=')[0]
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	// validate the response to the test request
	validateResponse (data) {
		const marker = this.codemarkResponse.markers[0];
		const repoPath = this.repo.remotes[0].normalizedUrl.split('/').slice(1).join('/');
		const expectedFile = `${repoPath}${marker.file}`;
		const expectedCodeRegEx = new RegExp('<code.*?>(.*)<\\/code>');
		const match = data.match(expectedCodeRegEx);
		Assert(match, 'did not get expected code in the html response');
		Assert.equal(match[1], this.expectedCode || marker.code);
		Assert.notEqual(data.indexOf(expectedFile), -1, 'did not get expected file in the html response');
	}
}

module.exports = PermalinkTest;
