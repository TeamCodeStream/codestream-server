const {Octokit} = require("@octokit/rest");
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const ProviderIdentityConnector = require("./provider_identity_connector");
const LoginHelper = require("../users/login_helper");

class CodespacesAuth extends RestfulRequest {

    constructor (options) {
        super(options);
        this.errorHandler = this.module.errorHandler;
    }

    async authorize () {
        // no authorization necessary, authorization is handled by the processing logic
    }

    // process the request...
    async process () {
        try {
            this.provider = "github";
            this.authToken = this.request.body.authToken;
            this.octokit = new Octokit({ auth: this.authToken });
            const userData = await this.githubApiRequest('users', 'getAuthenticated');
            // const emailData = await this.getEmailData();
            this.log("*** codespaces userData: " + JSON.stringify(userData));
            // this.log("*** codespaces emailData: " + JSON.stringify(emailData));
            const email = userData.login + "-demouser" + "@demo.demo";
            const userIdentity = {
                userId: userData.id,
                accessToken: this.authToken,
                username: userData.login,
                fullName: userData.name,
                email,
                avatarUrl: userData.avatar_url
            }
            await this.matchUser(userIdentity);
            const loginHelper = new LoginHelper({request: this, user: this.user});
            await loginHelper.generateAccessToken();

            const accessToken = loginHelper.accessToken;
            this.log("**** got meself accessToken " + accessToken);
            this.responseData = {
                accessToken: accessToken,
                email: email,
            }
        } catch (e) {
            throw e;
        }
    }

    async handleResponse () {
        this.log("*** codespaces handleResponse: " + JSON.stringify(this.responseData));
        return super.handleResponse();
    }

    // match the identifying information with an existing CodeStream user
    async matchUser (userIdentity) {
        if (this.request.body.data) {
            this.tokenData = this.tokenData || {};
            this.tokenData.data = this.tokenData.data || {};
            Object.assign(this.tokenData.data, this.request.body.data);
        }
        this.connector = new ProviderIdentityConnector({
            request: this,
            provider: this.provider,
            okToCreateUser: true,
            tokenData: this.tokenData,
            hostUrl: this.hostUrl,
            machineId: this.machineId
        });
        await this.connector.connectIdentity(userIdentity);
        this.user = this.connector.user;
        this.team = this.connector.team;

        // set signup status
        if (this.connector.createdTeam) {
            this.signupStatus = 'teamCreated';
        }
        else if (this.connector.createdUser) {
            this.signupStatus = 'userCreated';
        }
        else {
            this.signupStatus = 'signedIn';
        }
    }

    // async getEmailData() {
    //     try {
    //         let emailData = await this.githubApiRequest('users', 'listEmailsForAuthenticatedUser');
    //         emailData = emailData instanceof Array ? emailData : null;
    //         return emailData;
    //     } catch (e) {
    //         this.warn(ErrorHandler.log(e));
    //         if (e.message === "invalidProviderCredentials") {
    //             return null;
    //         } else {
    //             throw e;
    //         }
    //     }
    // }

    // make a github api request
    async githubApiRequest(module, method) {
        if (this.accessToken === 'invalid-token') {	// for testing
            throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'invalid token' });
        }
        const mockCode = (
            this.providerInfo &&
            this.providerInfo.code &&
            this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)
        );
        if (mockCode && mockCode.length >= 3) {
            if (method === 'getAuthenticated') {
                return this._mockIdentity(mockCode[1]);
            }
            else if (method === 'listEmailsForAuthenticatedUser') {
                return this._mockEmails();
            }
        }
        try {
            return (await this.octokit[module][method]()).data;
        }
        catch (error) {
            throw new Error('invalidProviderCredentials');
        }
    }
}

module.exports = CodespacesAuth;