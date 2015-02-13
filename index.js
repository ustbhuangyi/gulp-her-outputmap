/**
 * output json map for the runtime
 * eg:
 * {
 *    "tpl": {
 *      "demo:page/index.tpl": {
 *           "src": "/template/demo/page/index.tpl",
 *           "type": "tpl"
 *       },
 *       ...
 *    },
 *    "res": {
 *      "d41d8cd": {
 *           "src": "/static/demo/page/index.css",
 *           "type": "css",
 *           "defines": [
 *               "demo:page/index.css"
 *           ]
 *       },
 *       ...
 *    },
 *    "pkg": {
 *       "6a5a5bb": {
 *           "src": "/static/demo/pkg/aio.css",
 *           "type": "css",
 *           "defines": [
 *               "demo:widget/hehe/hehe.css",
 *               "demo:resource/css/common.css"
 *           ],
 *           "requires": [],
 *           "requireAsyncs": []
 *       },
 *       ...
 *    }
 * }
 */
'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var vfs = require('vinyl-fs');
var File = require('vinyl');

var pluginName = 'gulp-her-outputmap';

function writeFile(file, dest) {
  var stream = through.obj();
  stream.write(file);
  stream.pipe(vfs.dest(dest));
}

module.exports = function (ret, opt) {

  opt = opt || {};

  her.util.map(ret.ids, function (id, file) {
    //if file already packed, do nothing
    if (file.packed)
      return;
    if (file.release && file.useMap) {
      if (file.isJsLike || file.isCssLike) {
        var content = String(file.contents);
        var hashId = her.util.md5(content);
        if (file.isCssLike) {
          content += "\n" + ".css_" + hashId + "{height:88px}";
          file.contents = new Buffer(content);
          var cssDest = her.config.get('roadmap.css.release');
          writeFile(file, cssDest);
        }
        var res = ret.map.res[hashId] = {
          src: file.getUrl(),
          type: file.ext.replace(/^\./, '')
        };

        res.defines = [file.id];
        if (file.requires && file.requires.length) {
          res.requires = file.requires;
        }
        if (file.extras && file.extras.async) {
          res.requireAsyncs = file.extras.async;
        }
      } else if (file.isHtmlLike) {
        ret.map.tpl[file.id] = {
          src: file.getUrl(),
          type: file.ext.replace(/^\./, '')
        };
      }
    }
  });

  var cwd = process.cwd() || opt.cwd;
  var ns = her.config.get('namespace');
  var name = (ns ? ns + '-' : '') + 'map.json';
  var mapFile = new File({
    cwd: cwd,
    path: cwd + '/config/' + name,
    contents: new Buffer(JSON.stringify(ret.map, null, opt.optimize ? null : 4))
  });
  var dest = her.config.get('dest');
  writeFile(mapFile, dest);
};