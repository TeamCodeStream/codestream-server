'use strict';

module.exports = {
	user: {
		id: '{{{ newId }}}',
		_id: '{{{ sameAs(id) }}}',
		creatorId: '{{{ sameAs(creatorId) }}}',
		version: 1,
		deactivated: false,
		providerIdentities: [],
		createdAt: '{{{ currentTimestamp }}}',
		modifiedAt: '{{{ closeTo(createdAt,100) }}}',
		email: '{{{ requestData(email) }}}',
		username: '{{{ requestData(username) }}}'
	}
};