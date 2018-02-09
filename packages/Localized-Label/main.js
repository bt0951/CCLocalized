'use strict';

module.exports = {
  load() {
    // execute when package loaded
  },

  unload() {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open' () {
      // open entry panel registered in package.json
      Editor.Panel.open('Localized-Label');
    },
    'say-hello' () {
      Editor.log('Hello World!');
      // send ipc message to panel
      Editor.Ipc.sendToPanel('Localized-Label', 'Localized-Label:hello');
    },
    'clicked' () {
      Editor.log('Button clicked!');
    },
    'import-asset' (event, path) {
      Editor.assetdb.refresh(path, (err, results) => {
        if (err) {
          Editor.assetdb.error('Failed to reimport asset %s, %s', path, err.stack);
          return;
        }
        Editor.assetdb._handleRefreshResults(results);

        let metaPath = path + '.meta';
        if (Fs.existsSync(Editor.url(metaPath))) {
          let meta = Fs.readJsonSync(Editor.url(metaPath));
          meta.isPlugin = true;
          Fs.outputJsonSync(Editor.url(metaPath), meta);
        } else {
          Editor.log('Failed to set language data file to plugin script');
          return;
        }
      });
    }
  },
};