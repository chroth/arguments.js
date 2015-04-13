# ARGUMENTS.JS

CLI arguments parser for node


## Usage

    var Arguments = require("../lib/index");

    f = Arguments();
    //Required arguments, first argument will be stored as "candy"
    f.required("candy", { help: "Candy name" });
    //optional value, set a default, can be changed by adding: --num=30, or -n=30
    f.option("num", "25", { help: "How many pieces?", abbr: "n" });
    //add a switch, a flag with no argument
    f.switch("reverse",  { help: "Reverse ordering", abbr: "r" });
    f.switch("unwrap", { help: "unwrapcandy", abbr: "u" });

    //Process data before saving it
    f.process("candy", function(x) { return x.toUpperCase() });
    //Parse num as integer
    f.process("num", function(x) { return parseInt(x, 10); });
    f.validate("num", function(x) { return x > 10; });

    console.log(f.parse(process.argv));


## Example

*node test/demo.js bubblegum*

    { results: { candy: 'bubblegum', num: '25', reverse: false, unwrap: false },
  errors: [] }

*node test/demo.js bubblegum -r -n=123*

{ results: { candy: 'bubblegum', num: '123', reverse: true, unwrap: false },
  errors: [] }