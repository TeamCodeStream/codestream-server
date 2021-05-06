# Outbound Email Build & Deployment Information

TeamCity Project: [Outbound Email Gateway](http://redirector.codestream.us/builds/outbound_email)

The Outbound Email Gateway can run either as a service on a host OS or as an AWS
Lambda function.  The _integration_ TC builds (one for development, one for
production) generates the code asset (zip file) as well as the lambda files for
all environments.

## GitFlow and Brief Overview
Read the [Build Overview](https://redirector.codestream.us/ops/workflows) page on the Ops Wiki site.

## Assets

**_NOTE: the zip/lambda assets are environment-specific._**

| Type | Desc |
| --- | --- |
| info | asset info file |
| zip | zip file of installed src/ tree used in lambda deployment |
| lambda.json | run-time environment specific lambda configuration files |
| tgz | tarball of repo following an **npm install** for x86_64 |
| docker image | docker images are only stored in dockerhub repos |

| Asset Env | Asset | Branch | Location |
| --- | --- | --- | --- |
| dev | tgz | develop | [Asset server (dev/outbound-email)](http://assets.codestream.us/artifacts/dev/outbound-email/) |
| prod | tgz| master | [Asset server (prod/outbound-email)](http://assets.codestream.us/artifacts/prod/outbound-email/) |
| dev | docker image | develop | Published to dockerhub as [teamcodestream/mailout-onprem-dev](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/mailout-onprem-dev) |
| prod | docker image | master | Published to dockerhub as [teamcodestream/mailout-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/mailout-onprem) |
| pd | zip,tgz,lambda.json | develop | [Asset server (pd/outbound-email)](http://assets.codestream.us/artifacts/pd/outbound-email/) |
| qa | zip,tgz,lambda.json | master | [Asset server (qa/outbound-email)](http://assets.codestream.us/artifacts/qa/outbound-email/) |
| prod | zip,tgz,lambda.json | master | [Asset server (prod/outbound-email)](http://assets.codestream.us/artifacts/prod/outbound-email/) |

## Build Documentation

[TeamCity build documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)
