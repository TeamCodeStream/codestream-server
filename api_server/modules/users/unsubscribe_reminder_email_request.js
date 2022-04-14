// handle the GET /no-auth/unsubscribe-notification request to unsubscribe from notification emails 

'use strict';

const UnsubscribeEmailRequest = require('./unsubscribe_email_request');

class UnsubscribeWeeklyEmailRequest extends UnsubscribeEmailRequest {

	getPreferenceKey () {
		return 'preferences.reviewReminderDelivery';
	}

	getErrorCallbackUrl () {
		return '/web/unsubscribe-reminder-error';
	}

	getSuccessCallbackUrl () {
		return '/web/unsubscribe-reminder-complete';
	}

	getEmailType () {
		return 'Reminder';
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unsubscribe-reminder-link',
			summary: 'Respond to email link to unsubscribe from reminder emails',
			access: 'User is authenticated through the token provided.',
			description: 'Response to email link to unsubscribe from reminder emails.',
			input: 'A "t" parameter must be present in the query parameters, interpreted as a JSONWebToken which identifies the user',
			returns: 'Redirects to /web/unsubscribe-reminder-complete',
			publishes: 'The response data will be published on the user channel'
		};
	}
}

module.exports = UnsubscribeWeeklyEmailRequest;
