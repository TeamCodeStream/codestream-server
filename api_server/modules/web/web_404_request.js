'use strict';

const WebRequestBase = require('./web_request_base');

class Web404Request extends WebRequestBase {
	async authorize() {
	}
	async process() {
		return super.render('404', {
			hasAnotherTeamId: !!this.request.query.teamId,
		});
	}
}

module.exports = Web404Request;
