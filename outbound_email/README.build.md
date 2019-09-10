# Outbound Email Build & Deployment Information

TeamCity Project: [Outbound Email Gateway](http://tc.codestream.us/project/OutboundEmailGateway)

The Outbound Email Gateway can run either as a service on a host OS or as an AWS
Lambda function.  The _integration_ TC builds (one for development, one for
production) generates the code asset (zip file) as well as the lambda files for
all environments.

## GitFlow and Brief Overview
Read the [Build Overview](https://teamcodestream.atlassian.net/wiki/x/04BID) page on the Ops Wiki site.


## Assets

| Type | Desc |
| --- | --- |
| info | asset info file |
| zip | zip file of installed src/ tree |
| lambda.json | run-time environment specific lambda configuration files |

| Asset Env | Asset | Location |
| --- | --- | --- |
| dev | zip | [TeamCity CI build artifact](http://tc.codestream.us/buildConfiguration/OutboundEmailGateway_Ci) |
| prod | zip | [TeamCity Production Integration build artifact](http://tc.codestream.us/buildConfiguration/OutboundEmailGateway_ProdIntegration) |
| pd | lambda.json, dev zip | [Asset server (pd/outbound-email)](http://assets.codestream.us/artifacts/pd/outbound-email/) |
| qa | lambda.json, prod zip | [Asset server (qa/outbound-email)](http://assets.codestream.us/artifacts/qa/outbound-email/) |
| prod | lambda.json, prod zip | [Asset server (prod/outbound-email)](http://assets.codestream.us/artifacts/prod/outbound-email/) |
| onprem | docker image | Published to docker hub as [teamcodestream/mailout-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/mailout-onprem) |


## Builds

[see standard builds for descriptions](https://github.com/TeamCodeStream/teamcity_tools/blob/master/README.project-build-types.md#standard-project-builds)
