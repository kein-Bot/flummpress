import fs from "fs";
import path from "path";

export default class {
  constructor() {
    this.views = path.resolve() + "/views";
  };
  getTemplate(tpl) {
    return fs.readFileSync(`${this.views}/${tpl}.html`, "utf-8");
  }
  render(tpl, data = {}) {
    try {
      const code = 'with(_data){const __html = [];' +
        '__html.push(\`' +
        tpl.replace(/[\t]/g, ' ')
          .replace(/'(?=[^\{]*}})/, '\t')
          .split('\`').join('\\\`')
          .split('\t').join('\`')
          .replace(/{{=(.+?)}}/g, '\`,$1,\`')
          .replace(/{{-(.+?)}}/g, '\`,this.escape($1),\`')
          .replace(/{{include (.*?)}}/g, (_, inc) => this.render(this.getTemplate(inc), data))
          .replace(/{{each (?<key>.*) as (?<val>.*)}}/g, (_, key, val) => `\`);this.forEach(${key},(${val},key)=>{__html.push(\``)
          .replace(/{{\/each}}/g, "\`);});__html.push(`")
          .split('{{').join('\`);')
          .split('}}').join('__html.push(\`')
        + '\`);return __html.join(\'\').replace(/\\n\\s*\\n/g, "\\n");}';

      return (new Function("_data", code)).bind({
        escape: this.escape,
        forEach: this.forEach
      })(data);
    } catch(err) {
      console.log(err);
      return err.message;
    }
  };
  escape(str) {
    return (str + '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/{/g, '&#123;')
      .replace(/}/g, '&#125;')
    ;
  };
  forEach(o, f) {
    if(Array.isArray(o))
      o.forEach(f);
    else if(typeof o === "object")
      Object.keys(o).forEach(k => f.call(null, o[k], k));
    else
      throw new Error(`${o} is not a iterable object`);
  };
};
