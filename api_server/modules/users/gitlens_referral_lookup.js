"use strict";

const GitLensUserIndexes = require('./gitlens_user_indexes');
const Crypto = require('crypto');

const Hash = s => {
	return Crypto.createHash('sha1').update(`gitlens:${s.trim()}`).digest('hex');
};

// match this signup against any GitLens referral, as needed
module.exports = async function(data, email, machineId) {
	// first match by email hash
	const emailHash = Hash(email);
	let gitLensUsers = await data.gitLensUsers.getByQuery(
		{ emailHash },
		{ hint: GitLensUserIndexes.byEmailHash }
	);

	// if no match, match by machine ID
	if (machineId && gitLensUsers.length === 0) {
		const machineIdHash = Hash(machineId);
		gitLensUsers = await data.gitLensUsers.getByQuery(
			{ machineIdHash },
			{ hint: GitLensUserIndexes.byMachineIdHash }
		);
	}

	return gitLensUsers.length > 0;
};




