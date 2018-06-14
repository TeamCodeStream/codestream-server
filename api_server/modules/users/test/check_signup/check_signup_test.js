'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UUID = require('uuid/v4');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class CheckSignupTest extends CodeStreamAPITest {

	get description () {
		return 'should return login data and an access token when a user has been issued a signup token and signed up with it';
	}

	get method () {
		return 'put';
	}

    get path () {
        return '/no-auth/check-signup';
    }

	getExpectedFields () {
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
	}

	dontWantToken () {
		return true;	// don't need an access token for this request
	}

	// before the test runs...
	before (callback) {
        BoundAsync.series(this, [
            this.registerUser,  // create an unregistered user with a random signup token
            this.confirmUser,   // confirm the user
            this.createRepo,     // create a repo (and a team) for the user to be on, this is required before the signup token can be used
            this.wait
        ], callback);
    }

    // register (but don't confirm) a user, 
    registerUser (callback) {
        const userData = this.userFactory.getRandomUserData();
        userData.wantLink = true;   // we'll get back a confirmation link 
        userData._confirmationCheat = SecretsConfig.confirmationCheat;  // cheat code to get back the confirmation link 
        this.userFactory.registerUser(
            userData,
            (error, response) => {
                if (error) { return callback(error); }
                this.userData = response;
                callback();
            }
        );
	}
    
    // confirm the user we registered, using a random signup token, this simulates what happens
    // when the IDE generates a signup token and passes it on to the web client for signup and the
    // user goes through the signup process
    confirmUser (callback) {
        this.signupToken = UUID();
        this.data = { token: this.signupToken };
        const data = {
            token: this.userData.user.confirmationToken,
            signupToken: this.signupToken,
            expiresIn: this.expiresIn
        };
        this.doApiRequest(
            {
                method: 'post',
                path: '/no-auth/confirm',
                data
            },
            (error, response) => {
                if (error) { return callback(error); }
                this.accessToken = response.accessToken;
                callback();
            }
        );
    }

    // create a random repo and team for the user to be on, this is required for proper use of the signup token
    createRepo (callback) {
        if (this.dontCreateRepo) { return callback(); }
		this.repoFactory.createRandomRepo(
            (error, response) => {
                if (error) { return callback(error); }
                this.repo = response.repo;
                this.team = response.team;
                callback();
            },
			{ token: this.accessToken }
		);
    }

    // wait a few seconds to make sure the signup token is saved
    wait (callback) {
        setTimeout(callback, 2000);
    }

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.email === this.userData.user.email, 'email doesn\'t match');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo._id, data.repos[0], 'repo');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = CheckSignupTest;
