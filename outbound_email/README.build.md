# Outbound Email Build & Deployment Information

The outbound email project is a node service that runs as an AWS Lambda function.  

TeamCity Project: [outbound_email](http://tc.codestream.us/project.html?projectId=OutboundEmail&tab=projectOverview)

## Assets
There are 3 assets.
* The javascript code which packaged as a zip file.
* The lambda function definition; A json file created from a template and the sandbox environment.
* The info json file describing the assets and build information.

Assets: **outbound-email-$VERSION+$BUILD.{zip,info,lambda.json}**  
Internal Asset Location: **http:<i></i>//assets.codestream.us/artifacts/$ASSET_ENV/outbound-email/**  
Public Asset Location: **N/A**

## Branches

| Branch | Description |
| --- | --- |
| develop | All work lands here. Used for CI & PD builds |
| master | QA (pre-release) work lands here. Used for QA & Prod builds |
| hotfix_* | branch name prefix for branches made off the **master** branch for hotfixing |

## Builds

There are 4 builds; one for each asset environment (necessary as environment-specific variables
comprise one of the assets).  The PD build promotes the code asset created in the CI build. The
Prod build promotes the code asset created in the QA build.

| Build | Execution |
| --- | --- |
| [CI](http://tc.codestream.us/viewType.html?buildTypeId=OutboundEmail_Ci) | Triggered by updates to the **develop** branch and PR's<br>Builds the zip file and CI lambda function json file on TC agent.<br>Assets are [here](http://assets.codestream.us/artifacts/ci/outbound-email/) |
| [PD](http://tc.codestream.us/viewType.html?buildTypeId=OutboundEmail_Pd) | Triggered by successful CI build<br>Copies the code asset from CI, modifies the info file and lambda function json file to represent PD's operating environment and republishes all assets under PD.<br>Deploys the build by updating the PD lambda functions code and environment.<br>Assets are [here](http://assets.codestream.us/artifacts/pd/outbound-email/) |
| [QA](http://tc.codestream.us/viewType.html?buildTypeId=OutboundEmail_Qa) | Triggered by updates to the **master** branch<br>Builds the zip file and QA lambda function json definition on TC agent.<br>Updates the lambda function code and environment variables on AWS<br>Assets are [here](http://assets.codestream.us/artifacts/qa/outbound-email/) |
| [Prod](http://tc.codestream.us/viewType.html?buildTypeId=OutboundEmail_Prod) | Must be invoked manually<br>Promotes the latest QA build's assets by copying them and modifying the info and lambda function definition and republishing them under Prod.<br>Updates the Prod lambda function's code and environment on AWS.<br>Tags repo with latest version.<br>Use `dt-aws-lambda -a list-funcs` to verify installation.<br>Assets are [here](http://assets.codestream.us/artifacts/prod/outbound-email/) |


## Hotfixing (untested)
1. If production is running an X.Y.0 version (non-hotfixed), checkout the tag of what's in production and create a new branch called `hotfix_vX.Y` (this new branch will be off of the **master** branch).
1. If production is running an X.Y.Z version (previously hotfixed), checkout the pre-existing `hotfix_vX.Y` branch.
1. Make your fix and increase the **patch** component in the package.json version (X.Y.Z+1). Commit and push.
1. Go to the [QA build](http://tc.codestream.us/viewType.html?buildTypeId=OutboundEmail_Qa), select the `...` dropdown next to `Run`, select the `Changes` tab and finally the `hotfix_vX.Y` branch to generate and deploy the hotfixed assets for QA.
1. Assuming they look good in QA, repeat the previous step for the [Prod build](http://tc.codestream.us/viewType.html?buildTypeId=OutboundEmail_Prod)