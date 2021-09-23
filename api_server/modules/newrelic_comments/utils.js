'use strict'

// which code error object types are accepted
const CodeErrorObjectTypes = [
	'errorGroup'
];

// return a function which customized code error data for return to New Relic
const ToNewRelic = function(codeError, post, users) {
	const creator = users.find(u => u.id === post.get('creatorId'));
	if (!creator) {
		throw new Error(`creator ${post.get('creatorId')} not found in users array`);
	}
	const mentionedUsers = (post.get('mentionedUserIds') || []).map(uid => {
		const user = users.find(u => u.id === uid);
		if (!user) {
			throw new Error(`mentioned user ${uid} not found in users array`);
		}
		return {
			email: user.get('email'),
			fullName: user.get('fullName') || '',
			username: user.get('username') || ''
		};
	});

	return {
		id: post.id,
		version: post.get('version'),
		creator: {
			email: creator.get('email'),
			username: creator.get('username'),
			fullName: creator.get('fullName') || ''
		},
		createdAt: post.get('createdAt'),
		modifiedAt: post.get('modifiedAt'),
		deactivated: post.get('deactivated'),
		accountId: codeError.get('accountId'),
		objectId: codeError.get('objectId'),
		objectType: codeError.get('objectType'),
		mentionedUsers,
		parentPostId: post.get('parentPostId'),
		text: post.get('text'),
		seqNum: post.get('seqNum'),
		reactions: post.get('reactions') || {},
		files: post.get('files') || []
	};
}	

module.exports = {
	CodeErrorObjectTypes,
	ToNewRelic
};