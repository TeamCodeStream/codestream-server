# Inbound Email Build Information

TeamCity Project: [inbound_email](http://redirector.codestream.us/builds/inbound_email)  

## Assets
The assets are a tarball containing the inbound_email repository (without .git) and a json file containing information about the build.

Assets: **codestream-$VERSION+$BUILD.{tgz,info}**  
Internal Asset Location:  
* **http://assets.codestream.us/artifacts/dev/inbound-email/**  
* **http://assets.codestream.us/artifacts/prod/inbound-email/**  


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
| [CI](http://redirector.codestream.us/builds/api/ci) | dev | Triggered by updates to the **develop** branch and PR's.<br>Runs unit tests.<br>Create the dev asset and deploy it to PD. |
| [Prod Integration](http://redirector.codestream.us/builds/api/pi) | prod | Triggered by updates to the **master** branch.<br>Runs unit tests.<br>Create the prod asset and deploy it to QA. |
| [Prod Release](http://redirector.codestream.us/builds/api/release) | | Triggered manually.<br>Tags the repo and sets the asset _current_ reference for the latest asset.<br>Deploys the asset to production. |

You can see more about builds in the [TeamCity build
documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)

## Hotfixing (untested / unconfirmed, more thought needed)

1. we need a reliable way to do this with TC
