const fs = require("fs");
const nodePath = require("path");
const readline = require("readline");

const DEFAULT_MAPPINGS = `
の:の
1:一
2:二
3:三
4:四
5:五
6:六
7:七
8:八
9:九
0:十
i,me:私
my,mine:私の
i'm,im:私は
not,don't,dont,no: ない
you: あなた
have,has:持つ
had:持った
this: この
that: その
that's: それは
what:何
what's:何は
how: どう
which: どの
who:誰
there: あれ
it: あの
it's: あれは
in,on,at,of: で
to,into: に
with,and: と
do: する
done,did: した
does: か
can:　できる
can't: できない
use:使う
am,is,are,be: ある
was,were: あった
but: でも
because: から
would,could: できる
down,below:下
up,above:上
before:前に
after:後で
friend:友達
someone,somebody:誰か
`;

const REMOVE_ARTICLES = moonlightNode.getConfigOption("levantine", "removeArticles");
const REPLACE_SEPARATORS = moonlightNode.getConfigOption("levantine", "replaceSeparators");
const REPLACE_NUMBERS = moonlightNode.getConfigOption("levantine", "replaceNumbers");

let mappingsFile = moonlightNode.getConfigOption("levantine", "mappingsPath");
let mappingsLines;

if (mappingsFile === undefined) {
  mappingsLines = DEFAULT_MAPPINGS.split(/\n/);
} else {
  let file = fs.readFileSync(mappingsFile, "utf-8");
  if (file !== undefined && file !== null) {
    mappingsLines = file.split(/\n/);
    // add default mappings
    mappingsLines = mappingsLines.concat(mappingsLines);
  } else {
    mappingsLines = DEFAULT_MAPPINGS.split(/\n/);
    console.log(`LEVANTINE ERROR: GIVEN MAPPINGS NOT ACCESSIBLE, USING DEFAULT`);
  }
}

let mappings = [];

let i = 0;

mappingsLines.forEach((line) => {
  // format: from1,from2:to
  // into
  // { from: ["from1","from2"], to: "to" }
  const sides = line.split(":");
  const from = sides[0].split(",");
  const to = sides[1];
  if (from === undefined || to === undefined) {
    console.log(`LEVANTINE ERROR: MAPPING ON LINE ${i} NOT VALID`);
  } else {
    mappings.push({ from: from, to: to });
  }
  i += 1;
});

console.log(`LEVANTINE MAPPINGS: ${JSON.stringify(mappings)}`);

function findmap(from) {
  let output = "";
  let found = false;
  mappings.forEach((mapping) => {
    if (!found) {
      if (mapping.from.includes(from)) {
        output = mapping.to;
        found = true;
      }
    }
  });
  return output;
}

function numberConv(input) {
  if (!REPLACE_NUMBERS) {
    return input;
  }
  // for each digit
  let out = "";
  for (let i = 0; i < input.length; i++) {
    out += findmap(input[i]);
  }
  return out;
}

const obfs = (input) => {
  // split whitespace
  let words = input.split(/\s+/);
  let output = "";
  let lastHadNoMapping = false;
  words.forEach((word) => {
    let lowercase = word.toLowerCase();
    if (!(lowercase === "the" || lowercase === "a" || lowercase === "an") || !REMOVE_ARTICLES) {

      let found = false;
      // if only digits

      if (/^\d+$/.test(lowercase)) {
        output += numberConv(lowercase);
        lastHadNoMapping = false;
        found = true;
      } else {
        mappings.forEach((mapping) => {
          if (!found) {
            if (mapping.from.includes(lowercase)) {
              output += mapping.to;
              if (mapping.to.startsWith(" ")) {
                output += " ";
              }
              lastHadNoMapping = false;
              found = true;
            }
          }
        });
      }
      if (!found) {
        if (lastHadNoMapping) {
          if (REPLACE_SEPARATORS) {
            output += " ";
          } else {
            output += findmap("の");
          }
        }
        lastHadNoMapping = true;
        output += word.toUpperCase();
      }
    }
  });
  return output;
};

module.exports = {
  obfs
};