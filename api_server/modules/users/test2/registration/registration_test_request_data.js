'use strict';

const UserRequests = require('../user_requests');

module.exports = {
	request: {
		...UserRequests.register,
		data: {
			email: '{{{ randomEmail }}}',
			username: '{{{ randomUsername }}}',
			password: '{{{ randomPassword }}}'
		}
	}
};
