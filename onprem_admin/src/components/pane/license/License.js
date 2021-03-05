'use strict';

import React from 'react';
import { connect } from 'react-redux';

import { LicenseDescriptions } from '../../../config';
import { loadLicenses } from '../../../store/actions/presentation';

class License extends React.Component {
	async componentDidMount() {
		this.props.dispatch(loadLicenses());
	}

	render() {
		const licenseDisplayName = this.props.license.isTrial ? 'TRIAL' : this.props.license.plan;
		return (
			<section className="License layout-pane-license container-fluid py-3">
				<div className="row justify-content-center mt-3">
					<div className="col-10">
						<center>
							<h5>License</h5>
							<table className="table table-dark table-striped">
								<tbody>
									<tr>
										<td className="text-right px-2 py-1">{licenseDisplayName}</td>
										<td className="px-2 py-1">{LicenseDescriptions[licenseDisplayName] || LicenseDescriptions._default}</td>
									</tr>
								</tbody>
							</table>
						</center>
					</div>
				</div>
			</section>
		);
	}
}

const mapState = (state) => ({
	license: state.presentation.license || {},
});

const mapDispatch = (dispatch) => ({
	dispatch,
});

export default connect(mapState, mapDispatch)(License);
