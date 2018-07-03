#!/usr/bin/env node

'use strict';

// set, update or delete the reportingGroup attribute of
// a team

/* eslint no-console: 0 */
const ConfigDirectory = process.env.CS_API_TOP + '/config';
const MongoConfig = require(ConfigDirectory + '/mongo.js');
const Mongodb = require('mongodb');
const MongoClient = Mongodb.MongoClient;
const Commander = require('commander');
Commander
	.option('-n, --dryrun', 'dry run only')
	.option('-t, --team <teamName>', 'Team Name')
	.option('-i, --team-id <teamId>', 'Team ID')
	.option('-r, --report', 'Report team, don\'t change DB')
	.option('-g, --group <reportingGroup>', 'string used to group teams for reporting or "null" to remove the attribute')
	.parse(process.argv);

if ((!Commander.team && !Commander.teamId) ||
    (Commander.team && Commander.teamId)) {
	console.log('Only one value, Team or Team ID is required');
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
		db = await MongoClient.connect(MongoConfig.url);
	}
	catch (error) {
		console.log('mongo connect error', error);
		process.exit(1);
	}
	let csDb = db.db(MongoConfig.database);

	// find matching teams
	let query = Commander.teamId ?
		{ _id : new Mongodb.ObjectID(Commander.teamId) } :
		{ name : Commander.team };
	let teams = await queryCollection(csDb, 'teams', query);

	// no teams found
	if(teams.length === 0) {
		console.log('no matching teams found');
		process.exit(1);
	}

	// multiple teams found - give useful feedback
	if(teams.length > 1 || Commander.report) {
		if(teams.length > 1)
			console.log('multiple teams found');
		for (let teamIdx in teams) {
			let thisTeam = teams[teamIdx];

			let memberOIDs = thisTeam.memberIds.map(function(id) { return Mongodb.ObjectID(id);});
			let members = await queryCollection(csDb, 'users', {_id: {$in: memberOIDs}});

			let membersToDisplay = [];
			for (let membersIdx in members) {
				let thisMember = members[membersIdx];
				let displayString = thisMember.fullName + ' (' + thisMember.searchableEmail + ')';
				membersToDisplay.push(displayString);
			}
			let teamDisplayObject = {
				Name: thisTeam.name,
				TeamId: thisTeam._id,
				reportingGroup: thisTeam.reportingGroup,
				Members: membersToDisplay
			};
			console.log('Team', teamIdx, ':', teamDisplayObject, '\n');
		}
		console.log('select a unique TeamId and rerun the script with -i');
		process.exit(1);
	}

	// one team found
	let operation = Commander.group === 'null' ?
		{ $unset: { reportingGroup: '' } }:
		{ $set: { reportingGroup: Commander.group.toLowerCase() } };
	console.log('updating team', teams[0].name, 'with ID', teams[0]._id, 'using', operation);
	if (Commander.dryrun) {
		process.exit(0);
	}
	try {
		await csDb.collection('teams').updateOne(
			{_id: Mongodb.ObjectID(teams[0]._id)},
			operation);
	}
	catch(error) {
		console.log('update error', error);
		process.exit(1);
	}
	process.exit(0);
})();
