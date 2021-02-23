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
		console.log(this.props.licenses);
		return (
			<section className="License layout-pane-license container-fluid py-3">
				<div className="row justify-content-center mt-3">
					<div className="col-10">
						<center>
							<h5>License(s)</h5>
							<table className="table table-dark table-striped">
								<tbody>
									{this.props.licenses.map((license) => (
										<tr key={license}>
											<td className="text-right px-2 py-1">{license + ':'}</td>
											<td className="px-2 py-1">{LicenseDescriptions[license] || 'no description'}</td>
										</tr>
									))}
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
	licenses: state.presentation.license.licenses || [],
	// isTrial: state.presentation.license.isTrial
});

const mapDispatch = (dispatch) => ({
	dispatch,
});

export default connect(mapState, mapDispatch)(License);
