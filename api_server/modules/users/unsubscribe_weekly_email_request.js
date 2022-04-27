// handle the GET /no-auth/unsubscribe-weekly request to unsubscribe from weekly emails 

'use strict';

const UnsubscribeEmailRequest = require('./unsubscribe_email_request');

class UnsubscribeWeeklyEmailRequest extends UnsubscribeEmailRequest {

	getPreferenceKey () {
		return 'preferences.weeklyEmailDelivery';
	}

	getErrorCallbackUrl () {
		return '/web/unsubscribe-weekly-error';
	}

	getSuccessCallbackUrl () {
		return '/web/unsubscribe-weekly-complete';
	}

	getEmailType () {
		return 'Weekly Activity';
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unsubscribe-weekly-link',
			summary: 'Respond to email link to unsubscribe from weekly emails',
			access: 'User is authenticated through the token provided.',
			description: 'Response to email link to unsubscribe from weekly emails.',
			input: 'A "t" parameter must be present in the query parameters, interpreted as a JSONWebToken which identifies the user',
			returns: 'Redirects to /web/unsubscribe-weekly-complete',
			publishes: 'The response data will be published on the user channel'
		};
	}
}

module.exports = UnsubscribeWeeklyEmailRequest;
