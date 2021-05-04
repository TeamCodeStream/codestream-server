# On-Prem Build Information

TeamCity Project: [On-Prem Admin](https://redirector.codestream.us/builds/opadm)

## GitFlow and Brief Overview
Read the [Build Overview](https://redirector.codestream.us/ops/workflows) page on the Ops Wiki site.

## Assets

| Type | Desc |
| --- | --- |
| info | asset info file |
| tgz | tarball of repo following an **npm install** for x86_64 |
| docker image | docker images are only stored in dockerhub repos |

| Asset Env | Asset | Branch | Location |
| --- | --- | --- | --- |
| dev | tgz | develop | [Asset server (dev/onprem-admin)](http://assets.codestream.us/artifacts/dev/onprem-admin/) |
| prod | tgz | master | [Asset server (prod/onprem-admin)](http://assets.codestream.us/artifacts/prod/onprem-admin/) |
| dev | docker image | develop | Published to dockerhub as [teamcodestream/opadm-onprem-dev](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/opadm-onprem-dev) |
| prod | docker image | master | Published to dockerhub as [teamcodestream/opadm-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/opadm-onprem) |

## Build Documentation

[TeamCity build documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)
