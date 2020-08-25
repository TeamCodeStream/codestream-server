const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

const COLLECTIONS = ['companies', 'teams', 'repos', 'users', 'streams', 'posts', 'markers', 'markerLocations'];

class TeamMerger {

	async go (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
		await ApiConfig.loadPreferredConfig();
		await this.openMongoClient();
		await this.getToTeam();
		await this.getToUsers();
		await this.getFromTeams();
		await this.getFromUsers();
		await this.ensureUniqueUsernames();
		await this.removeUsers();
		await this.addUsers();
		await this.moveByTeamId('repos');
		await this.moveByTeamId('streams');
		await this.moveByTeamId('posts');
		await this.moveByTeamId('markers');
		await this.moveByTeamId('markerLocations');
		await this.updateMembers();
		await this.deactivateFromTeams();
	}

	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async getToTeam () {
		this.toTeam = await this.mongoClient.mongoCollections.teams.getById(this.toTeamId);
		if (!this.toTeam) {
			throw `Team not found: ${this.toTeamId}`;
		}
	}

	async getToUsers () {
		const query = {
			teamIds: this.toTeamId
		};
		this.toUsers = await this.mongoClient.mongoCollections.users.getByQuery(
			query,
			{
				fields: ['id', 'username', 'email'],
				hint: UserIndexes.byTeamIds
			}
		);
	}

	async getFromTeams () {
		this.fromTeams = await this.mongoClient.mongoCollections.teams.getByIds(
			this.fromTeamIds
		);
		if (this.fromTeams.length === 0) {
			throw `No teams matching these IDs found: ${this.fromTeamIds}`;
		}
	}

	async getFromUsers () {
		const query = {
			teamIds: this.mongoClient.mongoCollections.users.inQuery(this.fromTeamIds)
		};
		this.fromUsers = await this.mongoClient.mongoCollections.users.getByQuery(
			query,
			{
				fields: ['id', 'username', 'email'],
				hint: UserIndexes.byTeamIds
			}
		);
	}

	async ensureUniqueUsernames () {
		const allUsers = [...this.toUsers, ...this.fromUsers];
		const conflicts = [];
		allUsers.forEach(user1 => {
			allUsers.forEach(user2 => {
				if (
					user1.id !== user2.id &&
                    user1.username &&
                    user2.username &&
                    user1.username.toLowerCase() === user2.username.toLowerCase()
				) {
					conflicts.push(`${user1.username} - ${user1.email},${user2.email}`);
				}
			});
		});
		if (conflicts.length > 0) {
			throw `These usernames will conflict:\n${conflicts.join('\n')}`;
		}
	}

	async removeUsers () {
		const userIds = this.fromUsers.map(user => user.id);
		const fromCompanyIds = this.fromTeams.map(team => team.companyId);
		this.logger.log(`Removing ${userIds.length} users from teams...`);
		await this.mongoClient.mongoCollections.users.updateDirect(
			{ id: this.mongoClient.mongoCollections.users.inQuerySafe(userIds) },
			{
				$pullAll: {
					teamIds: this.fromTeamIds,
					companyIds: fromCompanyIds
				}
			}
		);
	}

	async addUsers () {
		const userIds = this.fromUsers.map(user => user.id);
		this.logger.log(`Moving ${userIds.length} users to team...`);
		await this.mongoClient.mongoCollections.users.updateDirect(
			{ id: this.mongoClient.mongoCollections.users.inQuerySafe(userIds) },
			{
				$push: {
					teamIds: this.toTeamId,
					companyIds: this.toTeam.companyId
				}
			}
		);
	}

	async moveByTeamId (collection) {
		this.logger.log(`Moving ${collection}...`);
		await this.mongoClient.mongoCollections[collection].updateDirect(
			{ teamId: this.mongoClient.mongoCollections.posts.inQuery(this.fromTeamIds) },
			{ $set: { teamId: this.toTeamId } }
		);
	}

	async updateMembers () {
		this.logger.log('Updating team membership...');
		let memberIds = [...this.toTeam.memberIds];
		this.fromTeams.forEach(team => {
			memberIds = [...memberIds, ...team.memberIds];
		});
		memberIds.sort();
		await this.mongoClient.mongoCollections.teams.updateDirect(
			{ id: this.mongoClient.mongoCollections.teams.objectIdSafe(this.toTeamId) },
			{ $set: { memberIds: memberIds } }
		);
	}

	async deactivateFromTeams () {
		this.logger.log('Deactivating teams...');
		const now = Date.now();
		await Promise.all(this.fromTeams.map(async fromTeam => {
			await this.mongoClient.mongoCollections.teams.updateDirect(
				{ id: this.mongoClient.mongoCollections.teams.objectIdSafe(fromTeam.id) },
				{
					$set: {
						name: `${fromTeam.name}-deactivated${now}`,
						deactivated: true
					}
				}
			);
		}));
	}
}

module.exports = TeamMerger;
