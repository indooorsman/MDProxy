const path = require('path');
const fs = require('fs');
const shell = require('shelljs');

const tempDir = path.resolve(__dirname, '../.temp');
const isWin = process.platform && process.platform.toLowerCase().indexOf('win') == 0;
const fmpp = isWin ? path.resolve(__dirname, '../libs/fmpp/bin/fmpp.bat') : path.resolve(__dirname, '../libs/fmpp/bin/fmpp');

if (!isWin) {
  shell.chmod(777, fmpp);
}

// 测试用的
const ftl = 'D:\\workspace\\yingke\\toc\\WEB-INF\\views\\packagetour\\customTour.ftl';
const ftl2 = '/Users/indooorsman/workspace/projects/web/yingke/server/ykly-toc-web/src/main/webapp/WEB-INF/views/packagetour/customTour.ftl';

const parseWithFMPP = (tpl, data, callback) => {
  //TODO 缓存编译结果，减少文件读写
  const parsed = path.parse(tpl);
  const root = path.resolve(parsed.root);
  let name = parsed.name;
  let tempFile = path.resolve(tempDir, `./${name}.html`);
  // console.log('temp file', tempFile);
  let dataStr = JSON.stringify(data).replace(/^\{/, '').replace(/}$/, '').replace(/"/g, "'");
  let cmd = `${fmpp} ${tpl} -S ${root} -o ${tempFile} -D "${dataStr}" -E host`;
  console.log('cmd:', cmd);
  // shell.cd(dir);
  shell.exec(cmd, function (code, stdout, stderr) {
    if (stderr) {
      return callback(stderr);
    }
    if (stdout && stdout.toLowerCase().indexOf('done') == -1) {
      return callback(stdout);
    }
    setTimeout(() => {
      const fileExist = fs.existsSync(tempFile);
      if (!fileExist) {
        return callback(`html file not generated yet...(${tempFile})`);
      }
      const content = fs.readFileSync(tempFile, {encoding: 'utf8'});
      // shell.rm('-f', tempFile);
      callback(content);
    }, 100);

  });

};

const parse = (tplFile, data) => {
  let tpl = fs.readFileSync(path.resolve(tplFile), {encoding: 'utf8'});
  let d = data || {};

  // 替换变量
  let var_reg = /\${([^${]+)}/g;
  let result = tpl.replace(var_reg, function (match, key) {
    return d[key] || key;
  });

  // 处理if判断
  let if_reg = /<#if([^<]+)>([\s\S]*?)<\/#if>/gi;
  result = result.replace(if_reg, (m, logic, content) => {
    let fixedLogic = logic.replace(/^\s*/g, '');
    let fn = new Function('data', `
      return data.${fixedLogic}
    `);
    let replaced = '';
    if (fn(d)) {
      replaced = content;
    }
    return replaced;
  });

  //处理include
  let include_reg = /<#include\s+"([^<]+?)"\s*>/g;
  result = result.replace(include_reg, (m, file) => {
    let includePath = path.resolve(tplFile, '../' + file);
    return parse(includePath, d);
  });

  return result;
};

// parseWithFMPP(ftl, {
//   cityId: 1,
//   staticVersion: 1,
//   ctx: '/ykly-toc-web/',
//   largeclass: 11,
//   pname: '哈哈哈'
// });

module.exports.render = parseWithFMPP;