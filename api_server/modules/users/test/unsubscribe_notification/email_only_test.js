'use strict';

const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const FetchTest = require('./fetch_test');

class EmailOnlyTest extends FetchTest {

	get description () {
		return 'should set preference value to "off" when previously set to "emailOnly"';
	}

	getPreferenceValue () {
		return 'off';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			const token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate(
				{
					uid: this.currentUser.user.id
				},
			);
			this.doApiRequest(
				{
					method: 'put',
					path: '/preferences',
					data: {
						notificationDelivery: 'emailOnly'
					},
					token
				},
				callback
			);
		});
	}
}

module.exports = EmailOnlyTest;
