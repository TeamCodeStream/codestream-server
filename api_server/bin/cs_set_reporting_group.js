#!/usr/bin/env node

'use strict';

// set, update or delete the reportingGroup attribute of
// a company

/* eslint no-console: 0 */
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Mongodb = require('mongodb');
const MongoClient = Mongodb.MongoClient;
const Commander = require('commander');
Commander
	.option('-n, --dryrun', 'dry run only')
	.option('-c, --company <companyName>', 'Company Name')
	.option('-i, --company-id <companyId>', 'Company ID')
	.option('-r, --report', 'Report company, don\'t change DB')
	.option('-g, --group <reportingGroup>', 'string used to group companies for reporting or "null" to remove the attribute')
	.parse(process.argv);

if ((!Commander.company && !Commander.companyId) ||
    (Commander.company && Commander.companyId)) {
	console.log('Only one value, Company or Company ID is required');
	Commander.outputHelp();
	process.exit(1);
}

if ((!Commander.group && !Commander.report) ||
    (Commander.group && Commander.report)) {
	console.log('Only one value, Group or Report is required');
	Commander.outputHelp();
	process.exit(1);
}

if (Commander.dryrun) {
	console.log('dry run mode - I won\'t actually do anything to the db');
}

const queryCollection = async function(csDb, collection, query) {
	// console.log('finding', collection, query);
	try {
		return await csDb.collection(collection).find(query).toArray();
	}
	catch(error) {
		console.log('error', error);
		process.exit(1);
	}
};

(async function() {
	let db;
	// connect to mongo
	// console.log('connecting...');
	try {
		await ApiConfig.loadPreferredConfig();
		db = await MongoClient.connect(ApiConfig.getPreferredConfig().storage.mongo.url, ApiConfig.getPreferredConfig().storage.mongo.tlsOptions);
	}
	catch (error) {
		console.log('mongo connect error', error);
		process.exit(1);
	}
	let csDb = db.db(ApiConfig.getPreferredConfig().storage.mongo.database);

	// find matching companies
	let query = Commander.companyId ?
		{ _id : new Mongodb.ObjectId(Commander.companyId) } :
		{ name : Commander.company };
	let companies = await queryCollection(csDb, 'companies', query);

	// no companies found
	if(companies.length === 0) {
		console.log('no matching companies found');
		process.exit(1);
	}

	// multiple companies found - give useful feedback
	if(companies.length > 1 || Commander.report) {
		if(companies.length > 1)
			console.log('multiple companies found');
		for (let companyIdx in companies) {
			let thisCompany = companies[companyIdx];

			let memberOIDs = thisCompany.memberIds.map(function(id) { return Mongodb.ObjectId(id);});
			let members = await queryCollection(csDb, 'users', {_id: {$in: memberOIDs}});

			let membersToDisplay = [];
			for (let membersIdx in members) {
				let thisMember = members[membersIdx];
				let displayString = thisMember.fullName + ' (' + thisMember.searchableEmail + ')';
				membersToDisplay.push(displayString);
			}
			let companyDisplayObject = {
				Name: thisCompany.name,
				CompanyId: thisCompany._id,
				reportingGroup: thisCompany.reportingGroup,
				Members: membersToDisplay
			};
			console.log('Company', companyIdx, ':', companyDisplayObject, '\n');
		}
		console.log('select a unique CompanyId and rerun the script with -i');
		process.exit(1);
	}

	// one company found
	let operation = Commander.group === 'null' ?
		{ $unset: { reportingGroup: '' } }:
		{ $set: { reportingGroup: Commander.group.toLowerCase() } };
	console.log('updating company', companies[0].name, 'with ID', companies[0]._id, 'using', operation);
	if (Commander.dryrun) {
		process.exit(0);
	}
	try {
		await csDb.collection('companies').updateOne(
			{_id: Mongodb.ObjectId(companies[0]._id)},
			operation);
	}
	catch(error) {
		console.log('update error', error);
		process.exit(1);
	}
	process.exit(0);
})();
