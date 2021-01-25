'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import TelemetryActions, { telemetryDataIsMissing } from '../../../../store/actions/config/telemetry';
// import ApiServerActions from '../../../../store/actions/config/apiServer';
import ConfigActions, { telemetryDataIsMissing } from '../../../../store/actions/config';
import PresentationActions from '../../../../store/actions/presentation';

export class General extends React.Component {
	render() {
		return (
			<div className="General layout-general container py-5">
				{/* <div className="container justify-content-center"> */}
					<div className="row col-12 offset-2">
						<div className="form-check">
							{/* <input
								id="telemetryEnabled"
								className="form-check-input"
								type="checkbox"
								value=""
								checked={this.props.telemetryEnabled}
								onChange={(e) => this.props.toggleTelemetry(e.target.checked, this.props.telemetry)}
							/> */}
							<input
								id="telemetryEnabled"
								className="form-check-input"
								type="checkbox"
								value=""
								checked={this.props.telemetryEnabled}
								onChange={(e) => this.props.toggleTelemetry(e)}
								disabled={!this.props.telemetrySelectable}
							/>
							<label className="form-check-label" htmlFor="telemetryEnabled">
								Enable telemetry to help make CodeStream a better experience for everyone.
							</label>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								value=""
								id="phoneHomeEnabled"
								onChange={(e) => this.props.togglePhoneHome(e)}
								checked={this.props.phoneHomeEnabled}
								disabled={!this.props.phoneHomeSelectable}
							/>
							<label className="form-check-label text-light" htmlFor="phoneHomeEnabled">
								Enable <strong>Phone Home</strong> reporting (your license doesn't allow you to disable this).
							</label>
						</div>
					</div>
				{/* </div> */}
			</div>
		);
	}
}

General.propTypes = {
	// telemetry: PropTypes.object.isRequired,
	telemetryEnabled: PropTypes.bool.isRequired,
	telemetrySelectable: PropTypes.bool.isRequired,
	phoneHomeEnabled: PropTypes.bool.isRequired,
	phoneHomeSelectable: PropTypes.bool.isRequired, // license may not allow customer to disabled the phone home reporting
	toggleTelemetry: PropTypes.func.isRequired,
	togglePhoneHome: PropTypes.func.isRequired,
};

const mapState = state => {
	// console.debug('component(General/mapState): state =', state);	// entire state
	const telemetrySelectable = !telemetryDataIsMissing(state.config.telemetry);
	return {
		telemetrySelectable,
		telemetryEnabled: telemetrySelectable // TODO: shouldn't this always be set?
			// ? !(state.config.telemetry.disabled || false)
			? !(state.config.telemetry.disabled || false)
			: false,
		phoneHomeEnabled: !(state.config.apiServer.disablePhoneHome || false),
		phoneHomeSelectable: false,
	};
}

// Teaching moment: togglePhoneHome() dispatch handler uses the thunk middleware, toggleTelemetry() does not.
const mapDispatch = dispatch => {
	return {
		// without thunk, if we need access to the state we need to pass it in specifically
		// toggleTelemetry: (isChecked, telemetry) => dispatch(toggleTelemetry(isChecked, telemetry)),
		//
		// with thunk, all we need to pass to the action creator is value of the field itself
		// toggleTelemetry: (e) => {
		// 	dispatch(updateConfig(TelemetryActions.CONFIG_TELEMETRY_SET_DISABLED, { payload: e.target.checked }));
		// },
		toggleTelemetry: (e) =>
			dispatch({
				type: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
				payload: { property: 'telemetry.disabled' },
			}),
		// togglePhoneHome: (e) => {
		// 	dispatch(updateConfig(ApiServerActions.CONFIG_API_SERVER_SET_PHONEHOME_DISABLED, { payload: !e.target.checked }));
		// },
		togglePhoneHome: (e) =>
			dispatch({
				type: ConfigActions.CONFIG_API_SERVER_SET_PHONEHOME_DISABLED,
				payload: !e.target.checked,
			}),
	};
}

export default connect(mapState, mapDispatch)(General);
