# ansi-tokenizer

An cusomizable ANSI tokenizer stream for node.js

## Installation

Locally in your project or globally:
```
npm install ansi-tokenizer
npm install -g ansi-tokenizer
```

## Usage example

```js
const AnsiTokenizer = require('ansi-tokenizer');
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
```

Parsed result:
```
{ code: 'DAT', raw: <Buffer 46 69 72 73 74 2c 20 61 20> }
{ code: 'SGR',
  raw: <Buffer 1b 5b 33 33 3b 31 6d>,
  color: '33;1' }
{ code: 'DAT',
  raw: <Buffer 63 6f 6c 6f 72 65 64 20 73 74 72 69 6e 67> }
{ code: 'SGR', raw: <Buffer 1b 5b 6d>, color: '' }
{ code: 'DAT',
  raw: <Buffer 20 77 6f 75 6c 64 20 62 65 20 63 61 74 63 68 65 64 20 61 73 20 53 47 52 2e 20 54 68 65 6e 2c 20 6d 6f 76 65 20 74 68 65 20 63 75 72 73 6f 72 20 74 6f ... > }
{ code: 'CUP',
  raw: <Buffer 1b 5b 31 32 3b 33 34 48>,
  row: '12',
  column: '34' }
{ code: 'DAT',
  raw: <Buffer 2c 20 77 68 69 63 68 20 69 73 20 43 55 50 2e 54 6f 20 65 72 61 73 65 20 74 68 65 20 77 68 6f 6c 65 20 6c 69 6e 65 2c 20 74 68 65 20 63 6f 64 65 20 77 ... > }
{ code: 'EL', raw: <Buffer 1b 5b 32 4b>, operation: '2' }
{ code: 'DAT',
  raw: <Buffer 2c 20 61 6e 64 20 74 68 65 20 63 6f 64 65> }
{ code: 'ED', raw: <Buffer 1b 5b 32 4a>, operation: '2' }
{ code: 'DAT',
  raw: <Buffer 20 77 69 6c 6c 20 65 72 61 73 65 20 74 68 65 20 77 68 6f 6c 65 20 73 63 72 65 65 6e 2e 20 4f 68 20 79 65 61 68 2c 20 62 79 20 74 68 65 20 77 61 79 2c ... > }
{ code: 'CR', raw: <Buffer 0d> }
{ code: 'DAT',
  raw: <Buffer 20 61 6e 64 20 4c 45 46 54 20 46 45 45 44 20 28 4c 46 29 20> }
{ code: 'LF', raw: <Buffer 0a> }
{ code: 'DAT',
  raw: <Buffer 20 77 69 6c 6c 20 62 65 20 63 61 74 63 68 65 64 20 61 73 20 77 65 6c 6c 2e> }
```

