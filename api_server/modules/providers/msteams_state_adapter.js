const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const MSTeamsStatesIndexes = require(process.env.CS_API_TOP + '/modules/msteams_states/indexes');

class MSTeamsStateAdapter {
	constructor (options) {
		Object.assign(this, options);
	}
	/**
	 * Reads all the keys
	 * 
	 * @param  {string[]} keys
	 */
	async read (keys) {
		if (!keys || !keys.length) return {};
		
		// while this is an array, it does seem to be only 1 item.
		const data = await this.data.msteams_states.getByQuery(
			{
				key: { $in: keys }
			},
			{
				hint: MSTeamsStatesIndexes.byKey
			}
		);
		if (data && data.length) {
			const result = data.reduce(function (map, obj) {
				map[obj.get('key')] = obj.get('value');
				return map;
			}, {});
			return result;
		}
		return {};
	}
	/**
	 * Saves changes to the store
	 * 
	 * @param  {object[]} changes
	 */
	async write (changes) {
		for (const key of Object.keys(changes)) {
			const newData = changes[key];
			const existingData = await this.data.msteams_states.getOneByQuery(
				{ key: key },
				{
					hint: MSTeamsStatesIndexes.byKey
				}
			);
			if (existingData && existingData.get('value')) {
				const data = { ...existingData.get('value'), ...newData };
				const op = {
					$set: {
						value: data
					}
				};
				op.$set.modifiedAt = Date.now();
				await new ModelSaver({
					request: this.request,
					collection: this.data.msteams_states,
					id: existingData.id
				}).save(op);
			}
			else {
				await this.data.msteams_states.create({
					key: key,
					value: newData
				});
			}
		}
	}

	/**
	 * Deletes all the keys for a user
	 * 
	 * @param  {string[]} keys
	 */
	async delete (keys) {
		if (!keys || !keys.length) return undefined;

		// while this is an array, it does seem to be only 1 item.
		const data = await this.data.msteams_states.getByQuery(
			{
				key: { $in: keys }
			},
			{
				hint: MSTeamsStatesIndexes.byKey
			}
		);

		if (data && data.length) {
			for await (const d of data) {
				await this.data.msteams_states.deleteById(d.id);
			}
		}
		
		return true;
	}
}

module.exports = MSTeamsStateAdapter;
