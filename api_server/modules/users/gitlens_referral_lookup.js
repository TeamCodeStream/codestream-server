"use strict";

const GitLensUserIndexes = require('./gitlens_user_indexes');
const Crypto = require('crypto');

const Hash = s => {
	return Crypto.createHash('sha1').update(`gitlens:${s.toLowerCase().trim()}`).digest('hex').toLowerCase();
};

// match this signup against any GitLens referral, as needed
module.exports = async function(data, email, machineId) {
	// first match by email hash
	const emailHash = Hash(email);
	let gitLensUser = await data.gitLensUsers.getOneByQuery(
		{ emailHash },
		{ hint: GitLensUserIndexes.byEmailHash }
	);

	// if no match, match by machine ID
	if (!gitLensUser && machineId) {
		const machineIdHash = Hash(machineId);
		gitLensUser = await data.gitLensUsers.getOneByQuery(
			{ machineIdHash },
			{ hint: GitLensUserIndexes.byMachineIdHash }
		);
	}

	return !!gitLensUser;
};




