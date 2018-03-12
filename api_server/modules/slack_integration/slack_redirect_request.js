// fulfill an slack redirect request, acting as a proxy for requests that go to slack
// on behalf of the slack bot

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class SlackRedirectRequest extends RestfulRequest {

	authorize (callback) {
		// no authorization needed
		return callback();
	}

	process (callback) {
		if (!this.api.config.slack) { return callback(); }
		const slackBotOrigin = this.api.config.slack.slackBotOrigin;
		if (!slackBotOrigin) { return callback(); }
		let redirectUrl;
		if (['slack/addtoslack', 'slack/oauth', 'slack/receive'].find(str => {
			if (this.request.path.match(str)) {
				redirectUrl = `${slackBotOrigin}/${str}`;
				return true;
			}
		})) {
			this.response.redirect(redirectUrl);
		}
		callback();
	}
}

module.exports = SlackRedirectRequest;
