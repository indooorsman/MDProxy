const fs = require('fs');
const path = require('path');
const urlParser = require('url');
const EventEmitter = require('events');
const logListener = new EventEmitter();
const fm = require('./freemarker.js');

module.exports.logListener = logListener;

module.exports.getRules = config => {
  // let locals = getLocals(config);
  const testReversed = req => {
    let option = urlParser.parse(req.url);
    req.reversed = false;
    if (config.reverses && Object.keys(config.reverses).length > 0) {
      let path = option.path;
      let port = ':' + option.port;
      if (port == ':80') {
        port = '';
      }
      let host = option.hostname;
      let fullPath = 'http://' + host + port + path;
      let pathes = Object.keys(config.reverses);
      let matched = null;
      pathes.some(item => {
        if (fullPath.startsWith(item)) {
          matched = config.reverses[item];
          return true;
        }
        return false;
      });
      if (!matched || matched.startsWith('!')) {
        return false;
      }
      req.reversed = true;
      req.replaceLocalFile = false;
      return true;
    }
    return false;
  };
  return {
    summary: '代理规则',

    replaceRequestOption: function (req, option) {
      // 反向代理
      //console.log('options:', option);
      req.reversed = false;
      if (config.reverses && Object.keys(config.reverses).length > 0) {
        let path = option.path;
        let port = ':' + option.port;
        if (port == ':80') {
          port = '';
        }
        let host = option.hostname;
        let fullPath = 'http://' + host + port + path;
        let pathes = Object.keys(config.reverses);
        let matched = null;
        pathes.some(item => {
          if (fullPath.startsWith(item)) {
            matched = config.reverses[item];
            return true;
          }
          return false;
        });
        if (!matched || matched.startsWith('!')) {
          return option;
        }
        let newOption = option;
        //options : http://nodejs.org/api/http.html#http_http_request_options_callback
        let hostAndPort = matched.split(':');
        newOption.hostname = hostAndPort[0];
        newOption.port = hostAndPort.length > 1 ? hostAndPort[1] : 80;
        newOption.headers['Host'] = newOption.headers['host'] = newOption.hostname + ':' + newOption.port;
        // console.log('reverse proxy to: ', newOption);
        logListener.emit('log', {
          remote: req.url,
          local: `${newOption.protocol ? newOption.protocol : 'http'}://${newOption.hostname}:${newOption.port}${newOption.path}`
        });
        req.reversed = true;
        req.replaceLocalFile = false;
        return newOption;
      }
      return option;
    },

    shouldUseLocalResponse: function (req, reqBody) {
      req.replaceLocalFile = false;

      if (testReversed(req)) {
        return false;
      }

      // 首先检查文件全路径匹配
      for (let k in config.fileMatches) {
        if (!config.fileMatches.hasOwnProperty(k)) {
          continue;
        }
        let reqUrl = req.url.replace(/\?.*$/, '');
        let local = config.fileMatches[k];
        if (local.startsWith('!')) {
          continue;
        }
        if (reqUrl === k) {
          req.replaceLocalFile = true;
          let hash = '';
          if (local.indexOf('#') != -1) {
            hash = '#' + local.split('#')[1];
            local = local.split('#')[0];
          }
          req.fileMatched = path.resolve(local) + hash;
          break;
        }
      }
      if (req.replaceLocalFile) {
        return req.replaceLocalFile;
      }

      // 然后检查目录匹配, 只代理静态文件，接口模拟请用文件匹配
      for (let k in config.dirMatches) {
        if (!config.dirMatches.hasOwnProperty(k)) {
          continue;
        }
        let local = config.dirMatches[k];
        if (local.startsWith('!')) {
          continue;
        }
        let fixed = k.replace(/\/$/, '');
        if (req.url.startsWith(fixed)
          && /\.(js|css|ttf|eot|woff|woff2|bmp|jpg|png|gif|htm|html|json|map)(\?.*)?$/i.test(req.url)) {
          req.replaceLocalFile = true;
          let urlPath = req.url.replace(fixed + '/', '').replace(/\?.*$/, '');
          // console.log(config.dirMatches[k], urlPath);
          req.dirMatched = path.resolve(local, urlPath);
          break;
        }
      }
      if (req.replaceLocalFile) {
        return req.replaceLocalFile;
      }

      // 最后检查特殊规则
      // done 用目录匹配代替这里
      /*locals.some(rule => {
       if (rule.match.test(req.url)) {
       req.replaceLocalFile = true;
       }
       return req.replaceLocalFile;
       });*/
      if (!req.replaceLocalFile) {
        logListener.emit('log', {
          remote: req.url,
          local: false
        });
      }
      return req.replaceLocalFile;
    },

    dealLocalResponse: function (req, reqBody, callback) {
      if (req.replaceLocalFile) {
        let header = {
          'Cache-Control': 'no-cache',
          'Powered-By': 'mdproxy'
        };
        if (/\.gz.js/i.test(req.url)) {
          header['Content-Type'] = 'text/javascript';
          header['Content-Encoding'] = 'gzip';
        } else if (/\.css$/i.test(req.url)) {
          header['Content-Type'] = 'text/css';
        } else if (/\.js$/i.test(req.url)) {
          header['Content-Type'] = 'text/javascript';
        }

        let localfilePath = null;
        let ftlInfo = null;
        if (req.fileMatched) {
          localfilePath = req.fileMatched;
          if (/.+\.ftl$/i.test(localfilePath) || /.+\.ftl#{.*}$/i.test(localfilePath)) {
            let ftlData = localfilePath.split('#');
            let data = eval(`(${ftlData[1]})`) || {};
            let ftlPath = path.resolve(ftlData[0]);
            ftlInfo = {ftl: ftlPath, data: data};
          }
        } else if (req.dirMatched) {
          localfilePath = req.dirMatched;
        }

        // console.log(req.url);
        // console.log('==>' + localfilePath);
        // console.log('');

        logListener.emit('log', {
          remote: req.url,
          local: localfilePath
        });
        if (fs.existsSync(localfilePath.split('#')[0])) {
          if (!!ftlInfo) {
            header['Content-Type'] = 'text/html';
            fm.render(ftlInfo.ftl, ftlInfo.data, content => {
              callback(200, header, content);
            });
          } else {
            if (/\.json$/.test(localfilePath)) {
              header['Content-Type'] = 'application/json';
            }
            callback(200, header, fs.readFileSync(localfilePath));
          }
        } else {
          callback(404, header, '文件不存在');
        }

      }
    }
  }
};
