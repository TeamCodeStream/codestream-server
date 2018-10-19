# API Server Build Information

TeamCity Project: [api_server](http://tc.codestream.us/project.html?projectId=ApiServer&tab=projectOverview)  

## Assets
The assets are a tarball containing the api_server repository (without .git) and a json file containing information about the build.

Assets: **codestream-$VERSION+$BUILD.{tgz,info}**  
Internal Asset Location:  
* **http://assets.codestream.us/artifacts/dev/api-server/**  
* **http://assets.codestream.us/artifacts/prod/api-server/**  


## Branches

| Branch | Description |
| --- | --- |
| develop | All work lands here. Used for CI build |
| master | Pre-relase work lands here. Used for Prod build |
| hotfix_* | branch name prefix for branches made off the **master** branch for hotfixing |

## Builds

There are 2 builds; one for the develop branch (Continuous Integration) and one for the master branch (Production).

| Build | Asset Env | Execution |
| --- | --- | --- |
| [CI](http://tc.codestream.us/viewType.html?buildTypeId=ApiServer_Ci) | dev | Triggered by updates to the **develop** branch and PR's.<br>Runs unit tests.<br>Create the dev asset and deploy it to PD. |
| [Prod](http://tc.codestream.us/viewType.html?buildTypeId=ApiServer_Prod) | prod | Triggered by updates to the **master** branch.<br>Runs unit tests.<br>Create the prod asset and deploy it to QA. |

## Production Release
1. Tag the repo with the lightweight tag **vX.Y.Z**.
1. Set the _current_ label on the asset with `dt-set-asset-version -D prod/api-server --tag current --build api-server-1.3.0+4`
1. Deploy to prod with `dt-deploy2 -p api -e prod`
1. Bump to the next minor (or major) version number in package.json in the **develop** branch


## Hotfixing (untested / unconfirmed, more thought needed)

1. we need a reliable way to do this with TC
