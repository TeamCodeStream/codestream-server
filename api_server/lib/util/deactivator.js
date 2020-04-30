const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const ObjectID = require('mongodb').ObjectID;
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');

const COLLECTIONS = ['companies', 'teams', 'repos', 'users', 'streams', 'posts', 'codemarks', 'reviews', 'markers', 'markerLocations'];
const COLLECTIONS_FOR_TEAM = ['streams', 'posts', 'codemarks', 'reviews', 'markers', 'markerLocations'];

class Deleter {

	async go (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
		await this.openMongoClient();
		await this.getTargetObject();
		await this.getUsers();
		await this.deleteRepos();
		await this.deleteTeam();
		await this.deleteCompany();
		await this.deleteUsers();
		if (this.teamId) {
			await Promise.all(
				COLLECTIONS_FOR_TEAM.map(async collection => {
					await this.deleteCollection(collection);
				})
			);
		}
	}

	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, ApiConfig.getPreferredConfig().mongo, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async getTargetObject () {
		if (this.teamIdOrName) {
			await this.getTeam();
		}
		else if (this.repoId) {
			await this.getRepo();
		}
		else if (this.userIdOrEmail) {
			await this.getUser();
		}
		else {
			throw 'must provide team, repo, or user';
		}
	}

	async getTeam () {
		if (!this.teamIdOrName) {
			return;
		}
		try {
			this.teamId = ObjectID(this.teamIdOrName).toString();
			await this.getTeamById();
		}
		catch (error) {
			await this.getTeamByName();
		}
	}

	async getTeamById () {
		try {
			this.team = await this.mongoClient.mongoCollections.teams.getById(
				this.teamId,
				{ fields: ['id', 'companyId', 'name'] }
			);
		}
		catch (error) {
			throw `unable to fetch team: ${JSON.stringify(error)}`;
		}
	}

	async getTeamByName () {
		let teams;
		try {
			teams = await this.mongoClient.mongoCollections.teams.getByQuery(
				{
					name: this.teamIdOrName
				},
				{
					fields: ['id', 'companyId'],
					overrideHintRequired: true
				}
			);
		}
		catch (error) {
			throw `unable to fetch team: ${JSON.stringify(error)}`;
		}
		if (teams.length === 0) {
			throw `team not found: ${this.teamIdOrName}`;
		}
		this.team = teams[0];
		this.teamId = this.team.id;
	}

	async getRepo () {
		try {
			this.repo = this.mongoClient.mongoCollections.repos.getById(this.repoId);
		}
		catch (error) {
			throw `unable to fetch repo: ${JSON.stringify(error)}`;
		}
		if (!this.repo) {
			throw `repo not found: ${this.repoId}`;
		}
	}

	async getUser () {
		try {
			this.userId = ObjectID(this.userIdOrEmail).toString();
			await this.getUserById();
		}
		catch (error) {
			await this.getUserByEmail();
		}
	}

	async getUserByEmail () {
		let users;
		try {
			users = await this.mongoClient.mongoCollections.users.getByQuery(
				{
					searchableEmail: this.userIdOrEmail.toLowerCase()
				},
				{
					fields: ['id'],
					hint: UserIndexes.bySearchableEmail
				}
			);
		}
		catch (error) {
			throw `unable to fetch user by email: ${JSON.stringify(error)}`;
		}
		if (users.length === 0) {
			throw `user not found: ${this.userIdOrEmail}`;
		}
		this.user = users[0];
	}

	async getUserById () {
		try {
			this.user = await this.mongoClient.mongoCollections.users.getById(this.userIdOrEmail);
		}
		catch (error) {
			throw `unable to fetch user: ${JSON.stringify(error)}`;
		}
		if (!this.user) {
			throw `user not found: ${this.userIdOrEmail}`;
		}
	}

	async getUsers () {
		if (!this.teamId) {
			return;
		}
		try {
			this.users = await this.mongoClient.mongoCollections.users.getByQuery(
				{
					teamIds: this.teamId
				},
				{
					fields: ['id', 'teamIds', 'email'],
					hint: UserIndexes.byTeamIds
				}
			);
		}
		catch (error) {
			throw `unable to fetch users by team: ${JSON.stringify(error)}`;
		}
	}

	async getRepos () {
		if (!this.teamId) {
			return;
		}
		let repos;
		try {
			repos = await this.mongoClient.mongoCollections.repos.getByQuery(
				{
					teamId: this.teamId
				},
				{
					fields: ['id'],
					hint: RepoIndexes.byTeamId
				}
			);
		}
		catch (error) {
			throw `unable to fetch repos by team: ${JSON.stringify(error)}`;
		}
		this.repoIds = repos.map(repo => repo.id);
	}

	async getStreams () {
		let query, hint;
		if (this.teamId) {
			query = { teamId: this.teamId };
			hint = StreamIndexes.byName;
		}
		else {
			if (!this.repoIds && !this.repoId) {
				return;
			}
			this.repoIds = this.repoIds || [this.repoId];
			query = { repoId: { $in: this.repoIds } };
			hint = StreamIndexes.byFile;
		}
		let streams;
		try {
			streams = await this.mongoClient.mongoCollections.streams.getByQuery(
				query,
				{
					fields: ['id'],
					hint: hint
				}
			);
		}
		catch (error) {
			throw `unable to fetch streams by repo: ${JSON.stringify(error)}`;
		}
		this.streamIds = streams.map(stream => stream.id);
	}

	async deleteRepos () {
		if (this.teamId) {
			await this.deleteCollection('repos');
		}
		else if (this.repoId) {
			await this.deleteRepoById();
		}
	}

	async deleteRepoById () {
		const repoId = this.repoId.toLowerCase();
		this.logger.log(`Deactivating repo ${repoId}...`);
		try {
			await this.mongoClient.mongoCollections.repos.updateDirect(
				{ id: this.mongoClient.mongoCollections.repos.objectIdSafe(repoId) },
				{ $set: { deactivated: true } }
			);
		}
		catch (error) {
			throw `unable to delete repo: ${JSON.stringify(error)}`;
		}
	}

	async deleteTeam () {
		if (!this.teamId) {
			return ;
		}
		const teamId = this.teamId.toLowerCase();
		this.logger.log(`Deactivating team ${teamId}...`);
		try {
			const now = Date.now();
			const newName = `${this.team.name}-deactivated${now}`;
			await this.mongoClient.mongoCollections.teams.updateDirect(
				{ id: this.mongoClient.mongoCollections.teams.objectIdSafe(teamId) },
				{ $set: { deactivated: true, name: newName } }
			);
		}
		catch (error) {
			throw `unable to delete team: ${JSON.stringify(error)}`;
		}
	}

	async deleteCompany () {
		if (!this.team) {
			return;
		}
		this.company = await this.mongoClient.mongoCollections.companies.getById(this.team.companyId);
		if (!this.company) { return; }

		if ((this.company.teamIds || []).length === 1 && this.company.teamIds[0] === this.team.id) {
			this.logger.log(`Deactivating company ${this.team.companyId}...`);
			try {
				await this.mongoClient.mongoCollections.companies.updateDirect(
					{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(this.team.companyId) },
					{ $set: { deactivated: true } }
				);
			}
			catch (error) {
				throw `unable to delete company: ${JSON.stringify(error)}`;
			}
		}
		else {
			try {
				this.logger.log(`Removing team from company ${this.team.companyId}...`);
				await this.mongoClient.mongoCollections.companies.updateDirect(
					{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(this.team.companyId) },
					{ $pull: { teamIds: this.team.id } }
				);
			}
			catch (error) {
				throw `unable to remove team from company: ${JSON.stringify(error)}`;
			}
		}
	}

	async deleteUsers () {
		if (this.teamId) {
			await this.removeUsersFromTeam();
			if (this.deactivateTeamlessUsers) {
				await this.deleteWouldBeTeamlessUsers();
			}
		}
		else if (this.userIdOrEmail) {
			await this.deleteSingleUser();
		}
	}

	async deleteWouldBeTeamlessUsers () {
		const usersToDelete = this.users
			.filter(user => {
				return (
					(user.teamIds || []).length === 1 &&
					user.teamIds[0] === this.teamId
				);
			});

		if (usersToDelete.length === 0) {
			return;
		}
		this.logger.log(`Deactivating ${usersToDelete.length} users...`);
		try {
			await Promise.all(usersToDelete.map(async user => {
				const emailParts = user.email.split('@');
				const now = Date.now();
				const newEmail = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;
				await this.mongoClient.mongoCollections.users.updateDirect(
					{ id: this.mongoClient.mongoCollections.users.objectIdSafe(user.id) },
					{ $set: { deactivated: true, email: newEmail, searchableEmail: newEmail.toLowerCase() } }
				);
			}));
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			console.trace();
			throw `unable to delete users: ${message}`;
		}
	}

	async removeUsersFromTeam () {
		this.logger.log('Removing users from team...');
		try {
			await this.mongoClient.mongoCollections.users.updateDirect(
				{ teamIds: this.teamId },
				{ $pull: { teamIds: this.teamId, companyIds: this.team.companyId } },
			);
		}
		catch (error) {
			throw `unable to remove users from team: ${JSON.stringify(error)}`;
		}
	}

	async deleteSingleUser () {
		this.logger.log(`Deactivating user ${this.userIdOrEmail}...`);
		try {
			const now = Date.now();
			const emailParts = this.user.email.split('@');
			const newEmail = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;
			await this.mongoClient.mongoCollections.users.updateDirect(
				{ id: this.mongoClient.mongoCollections.users.objectIdSafe(this.user.id) },
				{ $set: { deactivated: true, email: newEmail, searchableEmail: newEmail.toLowerCase() } }
			);
		}
		catch (error) {
			throw `unable to delete user: ${JSON.stringify(error)}`;
		}
	}

	async deleteCollection (collection) {
		this.logger.log(`Deactivating ${collection}...`);
		try {
			await this.mongoClient.mongoCollections[collection].updateDirect(
				{ teamId: this.teamId },
				{ $set: { deactivated: true } }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw `unable to delete ${collection}: ${message}`;
		}
	}
}

module.exports = Deleter;
