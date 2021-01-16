
// import { Logger, MongoClient, AdminConfig } from '../config/globalData';
import bcrypt from 'bcrypt';

// manage admin access accounts
class adminAccess {
	constructor(mongoClient, options = {}) {
		this.mongoClient = mongoClient;
		this.db = mongoClient.db();
		this.collection = 'adminAccess';
		this.logger = options.logger || console;
	}

	// user = {
	// 	id: 'root',
	// 	email: 'user@example.com',
	// 	hashedPassword: 'asdfasdfasdfasdf',
	// };
	async retrieve(searchBy) {
		// searchBy is {id: 'val'} || {email: 'val'}
		const users = await this.db.collection(this.collection).find(searchBy).toArray();
		return users.length ? users[0] : null;
	}

	async hash(password, saltRounds = 10) {
		try {
			return await bcrypt.hash(password, saltRounds);
		} catch (error) {
			this.logger.log(error);
		}
		return null; // Return null if error
	}

	async store(userData, password = null) {
		const hashedPassword = await this.hash(password || userData.password);
		if (!hashedPassword) {
			this.logger.log(`attempt to hash password for ${userData.id} failed`);
			return false;
		}
		const user = {
			id: userData.id,
			email: userData.email,
			hashedPassword,
		};
		// store password here
		// result = await this.db.collection(this.configCollection).insertOne(configDoc);
		try {
			const result = await this.db.collection(this.collection).insertOne(user);
			this.logger.log(`insert user returned`, result);
		} catch (error) {
			this.logger.log(error);
			return false;
		}
		// FIXME: this should probably be moved to ensure-indexes.js
		await this.db.collection(this.collection).createIndex({ id: 1 }, { name: 'byId', unique: true });
		// await this.db.collection(this.collection).createIndex({ email: 1 }, { name: 'byEmail', unique: true });
		return true;
	}

	validate(user, plainTextPassword = null) {
		return bcrypt.compareSync(plainTextPassword || user.password, user.hashedPassword);
	}
}

export default adminAccess;
