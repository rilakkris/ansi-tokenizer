'use strict';

const Transform = require('stream').Transform;

// A Writable stream, extracting ANSI code patterns.
// Users can define code patterns they want to match.
class AnsiTokenizer extends Transform {
  constructor(codes) {
    super({objectMode: true});

    if (typeof codes === 'undefined')
      throw new Error('"codes" parameter is required');

    this.remains = Buffer.from([]);
    this._compile(codes);
  }

  // Compile code patterns and automatically insert caret ^ to the bebegining
  // tokenObjList defines the corresponding tokenObjs for regular expression
  // matched patterns.
  _compile(codes) {
    this.parser = new RegExp('(' + Object.keys(codes).map(p => {return '^' + p;}).join(')|(') + ')', 'g');

    this.tokenObjList = [undefined];
    Object.keys(codes).forEach( k => {
      let tokenObj = codes[k];
      this.tokenObjList.push(tokenObj);
      this.tokenObjList.length += tokenObj.length - 1;
    });
  }

  _transform(chunk, encoding, callback) {
    var buff = Buffer.concat([this.remains, Buffer.from(chunk)]);
    var tokens = [];

    for(let t = 0; ; t++) {
      this.parser.lastIndex = 0;
      let matched = this.parser.exec(buff.toString('binary'));

      if (matched == null) {
        if (t === 0)
          callback(new Error('"codes" matches nothing at begining, please check the code patterns!!'));
        else 
          this.remains = buff;
        break;
      }

      // create tokenized object
      for(var i = 1; matched[i] === undefined; i++);
      var tokenObj = this.tokenObjList[i++];
      var token = {code: tokenObj[0], raw: buff.slice(0, this.parser.lastIndex)};
      for(let j = 1; j < tokenObj.length; j++)
        token[tokenObj[j]] = matched[i++];

      this.push(token);
      buff = buff.slice(this.parser.lastIndex);
    }

    //this.push(tokens);
    callback();
  }
}

module.exports = AnsiTokenizer;

if (!module.parent) {
  const codes = {
    '\\x1b\\[(\\d+);(\\d+)H': ['CUP', 'row', 'column'],
    '\\x1b\\[([\\d;]*)m'    : ['SGR', 'color'],
    '\\x1b\\[([012]?)J'     : ['ED', 'operation'],
    '\\x1b\\[([012]?)K'     : ['EL', 'operation'],
    '\\x0d'                 : ['CR'],
    '\\x0a'                 : ['LF'],
    '[^\\x1b\\x0d\\x0a]+'   : ['DAT']
  }

  var ansiTokenizer = new AnsiTokenizer(codes);
  const s = 'First, a \x1b[33;1mcolored string\x1b[m would be catched as SGR. '
          + 'Then, move the cursor to (12, 34) with code \x1b[12;34H, which is CUP.'
          + 'To erase the whole line, the code would be \x1b[2K, and the code'
          + '\x1b[2J will erase the whole screen. Oh yeah, by the way, CARRIAGE'
          + 'RETURN (CR) \x0d and LEFT FEED (LF) \x0a will be catched as well.';
  ansiTokenizer.write(s);
  var t;
  while (t = ansiTokenizer.read())
    console.log(t);
}
