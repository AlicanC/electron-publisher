import fs from 'fs-extra';
import path from 'path';
import asar from 'asar';
import temp from 'temp';
import utils from './utils';
import Nuspec from './Nuspec.js';
import NuspecMetadata from './NuspecMetadata.js';

export default class SquirrelPackager {
  constructor(options) {
    this.options = Object.assign({
      'packageJson': true,
    }, options);

    // Check options
    if (typeof this.options.src !== 'string') { // Exists?
      throw new Error('Property "src" of parameter "options" must be a string.');
    }

    if (typeof this.options.dest !== 'string') {
      throw new Error('Property "dest" of parameter "options" must be a string.');
    }

    if (this.options.loadingGif && typeof this.options.loadingGif !== 'string') { // Exists?
      throw new Error('Property "loadingGif" of parameter "options" must be a string or falsy.');
    }

    if (this.options.setupExe && typeof this.options.setupExe !== 'string') {
      throw new Error('Property "setupExe" of parameter "options" must be a string or falsy.');
    }

    if (typeof this.options.exe !== 'string') { // Exists?
      throw new Error('Property "exe" of parameter "options" must be a string.');
    }

    if (this.options.setupIcon && typeof this.options.setupIcon !== 'string') { // Exists?
      throw new Error('Property "setupIcon" of parameter "options" must be a string or falsy.');
    }

    /*
    this.remoteReleases = opts.remoteReleases && opts.remoteReleases.replace('.git', '');


    this.certificateFile = opts.certificateFile;
    this.certificatePassword = opts.certificatePassword;
    this.signWithParams = opts.signWithParams;*/
  }

  async createNuspec() {
    const nuspec = new Nuspec();

    // Get "package.json" data
    let npmPackageData;
    if (this.options.packageJson === true) {
      // Automatically find the "package.json"
      try {
        // Check for asar
        const asarPath = path.resolve(this.options.src, 'resources', 'app.asar');
        const packageJson = asar.extractFile(asarPath, 'package.json');
        npmPackageData = JSON.parse(packageJson);
      } catch (error) {
        // Ignore ASAR error and look for unpacked "package.json"
      }

      try {
        const packageJsonPath = path.resolve(this.options.src, 'resources', 'app', 'package.json');
        npmPackageData = require(packageJsonPath);
      } catch (error) {
        // Nothing found
      }
    } else if (typeof this.options.packageJson === 'string') {
      // Read "package.json" from given path
      npmPackageData = JSON.parse(fs.readFileSync(this.options.packageJson));
    } else if (typeof this.options.packageJson === 'object') {
      // Use the given object
      npmPackageData = this.options.packageJson;
    } else if (this.options.packageJson) {
      throw new Error('Property "packageJson" of parameter "options" must be true, a string, an object or falsy.');
    }

    // Do we have any "package.json" data?
    if (npmPackageData) {
      nuspec.metadata = NuspecMetadata.fromNpmPackageData(npmPackageData);
    }

    // Add metadata specified in the options
    if (typeof this.options.metadata === 'object') {
      Object.assign(nuspec.metadata, this.options.metadata);
    } else if (this.options.metadata) {
      throw new Error('Property "metadata" of parameter "options" must be an object or falsy.');
    }

    nuspec.files = [
      { 'src': '**\\*', 'target': 'lib\\net45' },
      /*
      { 'src': 'locales\\**', 'target': 'lib\\net45\\locales' },
      { 'src': 'resources\\**', 'target': 'lib\\net45\\resources' },
      { 'src': '*.bin', 'target': 'lib\\net45' },
      { 'src': '*.dll', 'target': 'lib\\net45' },
      { 'src': '*.pak', 'target': 'lib\\net45' },
      { 'src': 'icudtl.dat', 'target': 'lib\\net45\\icudtl.dat' },
      { 'src': 'LICENSE', 'target': 'lib\\net45\\LICENSE' },
      { 'src': '{{= it.exe }}', 'target': `lib\\net45\\${this.options.exe}` },
      */
    ];

    return nuspec;
  }

  async pack(nuspecPath) {
    const cmd = path.resolve(__dirname, '..', 'bin', 'nuget.exe');
    const args = [
      'pack', nuspecPath,
      '-BasePath', path.resolve(this.options.src),
      '-OutputDirectory', this.nugetOutput,
      '-NoDefaultExcludes',
    ];

    return utils.execFile(cmd, args);
  }

  async syncReleases() {
    if (!this.options.remoteReleases) {
      return Promise.resolve();
    }

    const command = path.resolve(__dirname, '..', 'bin', 'SyncReleases.exe');
    const args = [
      '-u', this.options.remoteReleases,
      '-r', this.options.dest,
    ];

    return utils.execFile(command, args);
  }

  async packRelease(nuspec) {
    const nupkgPath = path.join(this.nugetOutput, nuspec.metadata.id + '-' + nuspec.metadata.version + '.nupkg');
    const cmd = path.resolve(__dirname, '..', 'bin', 'Squirrel.exe');
    const args = [
      '--releasify', nupkgPath,
      '--releaseDir', this.options.dest,
    ];

    if (this.options.loadingGif) {
      args.push('--loadingGif', this.options.loadingGif);
    }

    if (this.options.signWithParams) {
      args.push('--signWithParams', `"${this.options.signWithParams}"`);
    } else if (this.options.certificateFile && this.options.certificatePassword) {
      args.push('--signWithParams', `/a\ /f\ ${this.options.certificateFile}\ /p\ ${this.options.certificatePassword}`);
    }

    if (this.options.setupIcon) {
      args.push('--setupIcon', this.options.setupIcon);
    }

    return utils.execFile(cmd, args);
  }

  async createInstaller() {
    temp.track();
    this.nugetOutput = temp.mkdirSync('squirrel-installer-');

    // Create the Nuspec
    const nuspec = await this.createNuspec();

    // Write Nuspec
    const nuspecPath = path.join(this.nugetOutput, nuspec.metadata.id + '.nuspec');
    fs.writeFileSync(nuspecPath, nuspec.toXML());

    // Create the Nuget Package
    await this.pack(nuspecPath);

    // Sync Squirrel releases
    await this.syncReleases();

    // Create installer
    await this.packRelease(nuspec);

    // Rename installer
    if (this.options.setupExe) {
      const oldSetupPath = path.join(this.options.dest, 'Setup.exe');
      const newSetupPath = path.join(this.options.dest, this.options.setupExe);
      fs.renameSync(oldSetupPath, newSetupPath);
    }
  }
}
