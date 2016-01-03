const xmlbuilder = require('xmlbuilder');

export default class Nuspec {
  get metadata() {
    return this._metadata;
  }
  set metadata(metadata) {
    this._metadata = metadata;
  }

  get files() {
    return this._files;
  }
  set files(files) {
    this._files = files;
  }

  constructor() {
    this._metadata = {};
    this._files = [];
  }

  toXML() {
    const xml = xmlbuilder.create('package', {
      'encoding': 'utf-8',
    });

    // Add metadata
    const metadata = xml.element('metadata');
    for (const index in this.metadata) {
      if (!this.metadata.hasOwnProperty(index)) {
        continue;
      }

      if (this.metadata[index] === undefined) {
        continue;
      }

      metadata.element(index, this.metadata[index]);
    }

    // Add files
    const files = xml.element('files');
    for (const file of this.files) {
      const fileElement = files.element('file');

      for (const index in file) {
        if (!file.hasOwnProperty(index)) {
          continue;
        }

        fileElement.attribute(index, file[index]);
      }
    }

    return xml.end({
      'pretty': true,
    });
  }
}
