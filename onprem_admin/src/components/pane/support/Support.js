'use strict';

import { SupportInfo } from '../../../config';
import React, { Component } from 'react';
import { connect } from 'react-redux';

class Support extends Component {
	emailHref() {
		return `mailto:${SupportInfo.email}?body=CodeStream Installation ID: ${this.props.installationId}, Product: ${this.props.productType}`;
	}

	render() { 
		const assetTableData = [];
		const combinedAssetData = Object.assign({}, this.props.assetInfo, this.props.dockerInfo);
		Object.keys(combinedAssetData)
			.sort()
			.forEach((p) => assetTableData.push([p + ':', combinedAssetData[p]]));

		return (
			<section className="Support layout-pane-support container-fluid">
				<div className="row justify-content-center mt-3">
					<div className="col-10">
						We keep a very watchful eye on{' '}
						<a href="https://github.com/teamcodestream/codestream/issues" target="_blank">
							Github Issues
						</a>{' '}
						associated with the{' '}
						<a href="https://github.com/teamcodestream/codestream" target="_blank">
							CodeStream
						</a>{' '}
						repository and you can always reach us via email at{' '}
						<a href={this.emailHref()}>{SupportInfo.email}</a>.
					</div>
				</div>
				<div className="row justify-content-center mt-3">
					<div className="col-10">
						<center>
							<h5>Asset Data</h5>
							<table className="table table-dark table-striped">
								<tbody>
									{assetTableData.map((row) => (
										<tr key={row[0]}>
											<td className="text-right px-2 py-1">{row[0]}</td>
											<td className="px-2 py-1">{row[1]}</td>
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
	assetInfo: state.installation.assetInfo,
	dockerInfo: state.installation.dockerInfo,
	installationId: state.config.sharedGeneral.installationId || '00000000-0000-0000-0000-000000000000',
	productType: state.installation.productType
});

// returns behavior for the component
// const mapDispatchToProps = function() {
// 	return {};
// }

export default connect(mapState)(Support);
