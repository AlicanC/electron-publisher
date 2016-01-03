export default class NuspecMetadata {
  /*
  static properties = [
    'id',
    'version',
    'title',
    'authors',
    'owners',
    'description',
    'releaseNotes',
    'summary',
    'language',
    'projectUrl',
    'iconUrl',
    'licenseUrl',
    'copyright',
    'requireLicenseAcceptance',
    'dependencies',
    'references',
    'frameworkAssemblies',
    'tags',
    'developmentDependency',
    'contentFiles',
  ];
  */

  static fromNpmPackageData(npmPackageData) {
    const mappedProperties = {
      'id': npmPackageData.name,
      'version': npmPackageData.version,
      'description': npmPackageData.description,
      'projectUrl': npmPackageData.homepage,
      'authors': npmPackageData.author,
      'tags': npmPackageData.keywords,
    };

    return new NuspecMetadata(mappedProperties);
  }

  constructor(obj) {
    Object.assign(this, obj);
  }
}
