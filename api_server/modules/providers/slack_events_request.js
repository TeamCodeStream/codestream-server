'use strict';

const crypto = require('crypto');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class SlackEventsRequest extends RestfulRequest {

	async authorize () {
		if (!this.verifySlackRequest(this.request)) {
			this.warn('Slack verification failed');
			throw this.errorHandler.error('invalidParameter');
		}
	}

	async process () {
		if (this.request.body.type === 'url_verification') {
			this.responseData = {
				challenge: this.request.body.challenge
			};
		}
	}

	verifySlackRequest (request) {
		try {
			// see BodyParserModule.slackVerify() for where this comes from
			const rawBody = request.slackRawBody;
			if (!request.body || !rawBody) {
				this.api.warn('Missing body for Slack verification');
				return false;
			}

			const slackSigningSecret = this.api.config.integrations.slack.appSharingSigningSecret;
			if (!slackSigningSecret) {
				this.api.warn('Could not find signingSecret');
				return false;
			}

			const slackSignature = request.headers['x-slack-signature'];
			const timestamp = request.headers['x-slack-request-timestamp'];
			if (!slackSignature || !timestamp) {
				this.api.warn('Missing required headers for Slack verification');
				return false;
			}

			// protect against replay attacks
			const time = Math.floor(new Date().getTime() / 1000);
			if (Math.abs(time - timestamp) > 300) {
				this.api.warn('Request expired, cannot verify');
				return false;
			}

			const mySignature = 'v0=' +
				crypto.createHmac('sha256', slackSigningSecret)
					.update('v0:' + timestamp + ':' + rawBody, 'utf8')
					.digest('hex');

			const signaturesMatch = crypto.timingSafeEqual(
				Buffer.from(mySignature, 'utf8'),
				Buffer.from(slackSignature, 'utf8'));

			if (!signaturesMatch) {
				this.api.warn('Signature does not match for slack verification');
			}
			return signaturesMatch;
		} catch (ex) {
			this.api.warn(`verifySlackRequest error. ${ex}`);
		}
		return false;
	}

}

module.exports = SlackEventsRequest;
