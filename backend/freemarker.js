const path = require('path');
const fs = require('fs');

const ftl = '/Users/indooorsman/workspace/projects/web/yingke/server/ykly-tob-web/src/main/webapp/WEB-INF/views/index.ftl';

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

module.exports.render = parse;