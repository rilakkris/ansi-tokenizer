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
var ansiTokenizer = new AnsiTokenizer({
  '\\x1b\\[(\\d+);(\\d+)H': ['CUP', 'row', 'column'],
  '\\x1b\\[OA': ['CUU'],
  '\\x1b\\[OB': ['CUD'],
  '\\x1b\\[OC': ['CUF'],
  '\\x1b\\[OD': ['CUB'],
  '\\x1b\\[K' : ['EL' ]
});

ansiTokenizer.write(
  'First, relocate the cursor to (12, 34) ' +
  'with code \x1b[12;34H. Then, move the ' +
  'cursor up by 1 line with code \x1b['
);
ansiTokenizer.write(
  'OA. As you can see, the stream is too ' +
  'long to be encapsulated in a single packet.' +
  ' Now, I wanna erase the line where the cursor '+ 
  'locates with code \x1b[K. That\' it!!');
console.log(ansiTokenizer.read());
console.log(ansiTokenizer.read());
```

Tokens for first packet:
```
[ { code: 'DAT',
    raw: 'First, relocate the cursor to (12, 34) with code ' },
  { code: 'CUP', raw: '\u001b[12;34H', row: '12', column: '34' },
  { code: 'DAT',
    raw: '. Then, move the cursor up by 1 line with code ' } ]
```

Tokens for second packet:
```
[ { code: 'CUU', raw: '\u001b[OA' },
  { code: 'DAT',
    raw: '. As you can see, the stream is too long to be encapsulated in a single packet. Now, I wanna erase the line where the cursor locates with code ' },
  { code: 'EL', raw: '\u001b[K' },
  { code: 'DAT', raw: '. That\' it!!' } ]

```
