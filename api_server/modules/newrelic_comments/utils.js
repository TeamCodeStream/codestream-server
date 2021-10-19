'use strict'

// which code error object types are accepted
const CodeErrorObjectTypes = [
	'errorGroup'
];

const UserToNewRelic = function (user) {
	const newRelicUser = {
		email: user.get('email'),
		fullName: user.get('fullName') || '',
		username: user.get('username') || ''
	};
	const idString = 'newrelic::';
	const identity = (user.get('providerIdentities') || []).find(id => id.startsWith(idString));
	if (identity) {
		newRelicUser.newRelicUserId = identity.substring(idString.length);
	}
	return newRelicUser;
}

const MarkerToCodeBlock = function(codemark, marker) {
	return {
		repo: marker.get('repo') || '',
		file: marker.get('file') || '',
		sha: marker.get('commitHashWhenCreated') || '',
		code: marker.get('code') || '',
		permalink: `${codemark.get('permalink')}?markerId=${marker.id}`
	};
}

// return a function which customized code error data for return to New Relic
const ToNewRelic = function(codeError, post, codemark, markers, users, options={}) {
	const creator = users.find(u => u.id === post.get('creatorId'));
	if (!creator) {
		throw new Error(`creator ${post.get('creatorId')} not found in users array`);
	}

	const userMaps = {
		[creator.id]: UserToNewRelic(creator)
	};
	
	const mentionedUserIds = [];
	const mentionedUsers = (post.get('mentionedUserIds') || []).map(uid => {
		const user = users.find(u => u.id === uid);
		if (!user) {
			throw new Error(`mentioned user ${uid} not found in users array`);
		}
		const newRelicUser = UserToNewRelic(user);
		userMaps[user.id] = newRelicUser;
		mentionedUserIds.push(user.id);
		return newRelicUser;
	});

	const reactions = post.get('reactions') || {};
	Object.keys(reactions).forEach(reaction => {
		reactions[reaction].forEach(uid => {
			const user = users.find(u => u.id === uid);
			if (!user) {
				throw new Error(`reacting user ${uid} not found in users array`);
			}
			const newRelicUser = UserToNewRelic(user);
			userMaps[user.id] = newRelicUser;
		});
	});

	const codeBlocks = (markers || []).map(marker => {
		return MarkerToCodeBlock(codemark, marker);
	});

	const response = {
		id: post.id,
		version: post.get('version'),
		creator: UserToNewRelic(creator),
		creatorId: creator.id,
		createdAt: post.get('createdAt'),
		modifiedAt: post.get('modifiedAt'),
		deactivated: post.get('deactivated'),
		accountId: codeError.get('accountId'),
		objectId: codeError.get('objectId'),
		objectType: codeError.get('objectType'),
		mentionedUsers,
		mentionedUserIds,
		parentPostId: post.get('parentPostId'),
		text: post.get('text'),
		seqNum: post.get('seqNum'),
		reactions: post.get('reactions') || {},
		files: post.get('files') || [],
		codeBlocks,
		userMaps
	};
	return response;
}	

module.exports = {
	CodeErrorObjectTypes,
	ToNewRelic
};