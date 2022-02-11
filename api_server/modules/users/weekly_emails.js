'use strict';

const Scheduler = require('node-schedule');
const TeamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/indexes');

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;

// only do these teams, for testing in PD
const PD_TEAM_WHITELIST = [
	'6171ef9c9cd225333411e835'
];

// governs how often we do weekly email runs, for testing, can be: local, pd, pdnight 
// (which is used with whitelisted teams) or prod
// see schedule() method below for details
const TEST_MODE = 'pd';

// teams that have had a weekly email run within this interval, wait till next week
const LAST_RUN_CUTOFF = 
	TEST_MODE === 'pdnight' ? 1 * ONE_HOUR :
		TEST_MODE === 'pd' ? 20 * ONE_MINUTE : 
			ONE_DAY;

// users who have been sent a weekly email within this interval, don't get another
const USER_CUTOFF_TIME =
	TEST_MODE === 'pdnight' ? 4 * ONE_HOUR :
		TEST_MODE === 'pd' ? 20 * ONE_MINUTE :
			5 * ONE_DAY;

// teams who have had no activity in this interval, get no emails at all
const ACTIVITY_CUTOFF = 3 * ONE_MONTH;	

// process teams in batches of this number
const TEAM_BATCH_SIZE = 100;

// throttle for each user, to avoid overwhelming the system
const THROTTLE_TIME_PER_USER = 3000;

class WeeklyEmails {

	constructor (options) {
		Object.assign(this, options);
	}

	// schedule jobs to look for teams that need weekly emails
	schedule () {
		// stagger each worker's schedule to occur at a random time every hour
		const randomMinutes = Math.floor(Math.random() * 60);
		const randomSeconds = Math.floor(Math.random() * 60);
		if (TEST_MODE === 'local') {
			// in this test mode, emails are triggered once a minute (per worker)
			// developer is expected to manually reset the team's lastWeeklyEmailRunAt timestamp, 
			// and the user's lastWeeklyEmailSentAt timestamp
			this.api.log(`Triggering test run of weekly emails for execution at :${randomSeconds}s`);
			this.job = Scheduler.scheduleJob(`${randomSeconds} * * * * *`, this.sendWeeklyEmails.bind(this));
		} else if (TEST_MODE === 'pd') {
			// in this test mode, weekly emails are sent every 30 minutes (for testing in PD)
			// cutoff times for team checks and user checks are reduced
			this.api.log(`Triggering test run of weekly emails for execution every half hour at :${randomSeconds}s`);
			this.job = Scheduler.scheduleJob(`${randomSeconds} 0,30 * * * *`, this.sendWeeklyEmails.bind(this));
		} else if (TEST_MODE === 'pdnight') {
			// in this test mode, weekly emails are sent every night at midnight
			// cutoff times for team checks and user checks are reduced to accommodate
			this.api.log(`Triggering test run of weekly emails for execution at :${randomMinutes}:${randomSeconds}s for every night at 12AM`);
			this.job = Scheduler.scheduleJob(`${randomSeconds} ${randomMinutes} 0 * * *`, this.sendWeeklyEmails.bind(this));
		} else {
			// in production, kick off at 2 AM (server time, which is ET) every Monday
			this.api.log(`Triggering weekly emails for execution at :${randomMinutes}m:${randomSeconds}s for every Monday at 2AM`);
			this.job = Scheduler.scheduleJob(`${randomSeconds} ${randomMinutes} 2 * * 1`, this.sendWeeklyEmails.bind(this));
		}
	}

	// trigger the sending of weekly emails, in batches of 100, until we are done
	async sendWeeklyEmails () {
		this.api.log('Weekly email run triggered');

		if (this.api.config.email.suppressEmails) {
			this.api.log('Emails are disabled in configuration, not running weekly emails');
			return;
		}

		// grab teams in batches of 100, and execute
		// this way multiple workers can share the load and not trample on each other's work
		let teams;
		do {
			const now = Date.now();
			const query = {
				$and: [
					{
						$or: [
							{
								lastPostCreatedAt: { $exists: false }
							},
							{
								lastPostCreatedAt: { $gt: now - ACTIVITY_CUTOFF }
							}
						]
					},
					{
						$or: [
							{
								lastWeeklyEmailRunAt: { $exists: false }
							},
							{
								lastWeeklyEmailRunAt: { $lt: now - LAST_RUN_CUTOFF }
							}
						]
					}
				]
			};
			if (TEST_MODE.match(/^(pd|local)/) && PD_TEAM_WHITELIST.length > 0) {
				query.id = this.api.data.teams.inQuerySafe(PD_TEAM_WHITELIST);
			}

			teams = await this.api.data.teams.getByQuery(query, {
				hint: TeamIndexes.byLastPostCreatedAt,
				sort: { lastPostCreatedAt: 1 },
				limit: TEAM_BATCH_SIZE
			});

			if (teams.length > 0) {
				await this.sendWeeklyEmailsForBatch(teams);
			}
		} while (teams.length > 0);
		this.api.log('No more teams need weekly emails, weekly email run complete');
	}

	// send weekly emails for all the relevant users for a batch of teams
	async sendWeeklyEmailsForBatch (teams) {
		// here we are optimistic, we assume nothing will go wrong with sending out the emails
		// update each team saying a weekly email run was made, so that other workers won't pick these up
		// and try to also do a weekly run ... avoiding double emails
		const now = Date.now();
		const ids = teams.map(team => team.id);
		await this.api.data.teams.updateDirect(
			{
				id: this.api.data.teams.inQuerySafe(ids)
			},
			{
				$set: {
					lastWeeklyEmailRunAt: now
				}
			}
		);

		// check for weekly emails for each team
		this.api.log(`Triggering weekly emails for ${teams.length} teams...`);
		for (let i = 0; i < teams.length; i++) {
			await this.sendWeeklyEmailsToTeamMembers(teams[i]);
		}
	}

	// trigger weekly email to each user in a team, as needed
	async sendWeeklyEmailsToTeamMembers (team) {
		const threeWeeksAgo = Date.now() - 3 * ONE_WEEK;
		if (team.deactivated) {
			this.api.log(`Not triggering weekly emails for team ${team.id}, team has been deactivated`);
			return;
		} else if (team.lastPostCreatedAt < threeWeeksAgo && team.weeklyEmailRunCount === 0) {
			this.api.log(`Not triggering weekly emails to team ${team.id}, team has not had any activity in the last three weeks, and their email run count is at 0`);
			return;
		}

		// we are clear for launch!
		// we'll send a message for the whole team and the outbound email server sort out who
		// actually gets emails ... this is because there is much common data between the members of the
		// team and it makes more sense to do it as a whole unit then for each individual user
		const message = {
			type: 'weekly',
			teamId: team.id,
			userCutoffTime: USER_CUTOFF_TIME,
			userThrottleTime: THROTTLE_TIME_PER_USER
		};
		const teamSize = (team.memberIds || []).length;
		this.api.log(`Triggering weekly emails to ${teamSize} users on team ${team.id}...`);
		this.api.services.email.queueEmailSend(message);

		// update the team for future weekly email update scheduling
		await this.updateTeam(team);
		const waitTime = THROTTLE_TIME_PER_USER * teamSize;
		this.api.log(`Waiting ${waitTime} for next team...`);
		await this._wait(waitTime);	// don't want to overwhelm the api or the outbound email service
		return true;
	}

	// update the team for future weekly email scheduling
	async updateTeam (team) {
		const oneWeekAgo = Date.now() - ONE_WEEK;
		const set = { };
		if (
			typeof team.weeklyEmailRunCount === 'undefined' ||
			(
				team.lastPostCreatedAt > oneWeekAgo && 
				team.weeklyEmailRunCount < 3
			)
		) {
			// this team has activity within one week, or has not had a weekly email run yet...
			// this starts the team over for receiving weekly emails if no activity
			set.weeklyEmailRunCount = 3;
		} else if (team.weeklyEmailRunCount > 0) {
			// run down the team's weekly email run until they reach 0 with no activity, then given up
			set.weeklyEmailRunCount = team.weeklyEmailRunCount - 1;
		}

		if (set.weeklyEmailRunCount !== undefined) {
			await this.api.data.teams.updateDirect(
				{
					id: this.api.data.teams.objectIdSafe(team.id)
				},
				{
					$set: set
				}
			);
		}
	}

	// wait this number of milliseconds
	async _wait (time) {
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
	}
}

module.exports = WeeklyEmails;