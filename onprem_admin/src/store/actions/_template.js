
// Application logic goes here

// replace '__TEMPLATE' with your module name

// Each store 'module' defines a *_CANCEL_ACTION action which the
// reducer will ignore.
const Actions = {
	__TEMPLATE_CANCEL_ACTION: '__TEMPLATE_CANCEL_ACTION',
	// __TEMPLATE_ANY_ACTION: '__TEMPLATE_ANY_ACTION',
};

// Action Creators
// export function doAnyThing(args) {
// 	console.debug(`action(__TEMPLATE): ${action.type}`);
// 	const payload = args.whatever * 5;
// 	return { type: Actions.__TEMPLATE_ANY_ACTION, payload };
// };

// Action Dispatchers (Thunk)
// export function doAnyThingThunk(args) {
// 	return (dispatch, getState) => {
// 		console.debug(`action(__TEMPLATE): ${action.type}`);
// 		const payload = getState().someProp + args.someVal * 10;
// 		dispatch ({ type: Actions.__TEMPLATE_ANY_ACTION, payload });
// 	};
// }

// default export is the Actions object
export default Actions;
