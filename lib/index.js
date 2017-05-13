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

  // Compile code patterns and automatically append 'RAW data' pattern.
  // tokenObjList defines the corresponding tokenObjs for regular expression
  // matched patterns.
  _compile(codes) {
    codes['[^\\x1b]+'] = ['DAT'];
    this.parser = new RegExp('(' + Object.keys(codes).join(')|(') + ')', 'g');

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

    while(true) {
      let lastIndex = this.parser.lastIndex;
      let matched = this.parser.exec(buff.toString('binary'));

      if (matched === null) break;
      // the matched patterns are expected to be from the begining
      if (matched.index !== lastIndex)
        if (lastIndex === 0)
          callback(new Error('"codes" matches nothing at begining, please check the code patterns!!'));
        else {
          this.parser.lastIndex = 0;
          this.remains = buff.slice(lastIndex);
          break;
        }

      // create tokenized object
      for(var i = 1; matched[i] === undefined; i++);
      var tokenObj = this.tokenObjList[i++];
      var token = {code: tokenObj[0], raw: buff.slice(matched.index, this.parser.lastIndex)};
      for(let j = 1; j < tokenObj.length; j++)
        token[tokenObj[j]] = matched[i++];
      tokens.push(token);

    }

    this.push(tokens);
    callback();
  }
}

module.exports = AnsiTokenizer;

if (!module.parent) {
  const codes = {
    '\\x1b\\[(\\d+);(\\d+)H': ['CUP', 'row', 'column'],
    '\\x1b\\[OA': ['CUU'],
    '\\x1b\\[OB': ['CUD'],
    '\\x1b\\[OC': ['CUF'],
    '\\x1b\\[OD': ['CUB'],
    '\\x1b\\[K' : ['EL' ]
  }

  var ansiTokenizer = new AnsiTokenizer(codes);
  ansiTokenizer.write('First, relocate the cursor to (12, 34) with code '
    + '\x1b[12;34H. Then, move the cursor up by 1 line with code \x1b[');
  ansiTokenizer.write('OA. As you can see, the stream is too long to be'
    + 'encapsulated in a single packet. Now, I wanna erase the line where'
    + 'the cursor locates with code \x1b[K. That\' it!!');
  console.log(ansiTokenizer.read());
  console.log(ansiTokenizer.read());
}
