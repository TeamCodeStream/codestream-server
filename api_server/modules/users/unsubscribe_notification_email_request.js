// handle the GET /no-auth/unsubscribe-notification request to unsubscribe from notification emails 

'use strict';

const UnsubscribeEmailRequest = require('./unsubscribe_email_request');

class UnsubscribeWeeklyEmailRequest extends UnsubscribeEmailRequest {

	getPreferenceKey () {
		return 'preferences.notificationDelivery';
	}

	getPreferenceValue () {
		const preferences = this.user.get('preferences');
		if (preferences.notificationDelivery === 'off' || preferences.notificationDelivery === 'emailOnly') {
			return 'off';
		}
		return 'toastOnly';
	}

	getErrorCallbackUrl () {
		return '/web/unsubscribe-notification-error';
	}

	getSuccessCallbackUrl () {
		return '/web/unsubscribe-notification-complete';
	}

	getEmailType () {
		return 'Notification';
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unsubscribe-notification-link',
			summary: 'Respond to email link to unsubscribe from notification emails',
			access: 'User is authenticated through the token provided.',
			description: 'Response to email link to unsubscribe from notification emails.',
			input: 'A "t" parameter must be present in the query parameters, interpreted as a JSONWebToken which identifies the user',
			returns: 'Redirects to /web/unsubscribe-notification-complete',
			publishes: 'The response data will be published on the user channel'
		};
	}
}

module.exports = UnsubscribeWeeklyEmailRequest;
