var should = require("should");
var Arguments = require("../index");

describe("Arguments", function() {
  var f;

  before(function() {
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
  });

  it("should accept all arguments", function(done) {
    resp = f.parse(["node", "/path/to/script", "bubblegum", "--num=20", "--reverse", "--unwrap"]);

    // Assertions
    resp.errors.length.should.be.exactly(0);
    resp.results.candy.should.eql("bubblegum").and.be.a.String;
    resp.results.num.should.eql("20").and.be.a.String;
    resp.results.reverse.should.be.true;
    resp.results.unwrap.should.be.true;

    done();
  });

  it("should accept abbreviations", function(done) {
    resp = f.parse(["node", "/path/to/script", "bubblegum", "-n=11", "-r", "-u"]);

    resp.errors.length.should.be.exactly(0);
    resp.results.candy.should.eql("bubblegum").and.be.a.String;
    resp.results.num.should.eql("11").and.be.a.String;
    resp.results.reverse.should.be.true;
    resp.results.unwrap.should.be.true;

    done();
  });

  it("should use defaults", function(done) {
    resp = f.parse(["node", "/path/to/script", "bubblegum"]);

    resp.errors.length.should.be.exactly(0);
    resp.results.candy.should.eql("bubblegum").and.be.a.String;
    resp.results.num.should.eql("25").and.be.a.String;
    resp.results.reverse.should.be.false;
    resp.results.unwrap.should.be.false;

    done();
  });

  it("should give validation errors", function(done) {
    resp = f.parse(["node", "/path/to/script", "-n=9"]);

    resp.errors.length.should.be.exactly(2);
    resp.errors[0].toString().should.be.eql("Error: [num] Validation failed");
    resp.errors[1].toString().should.be.eql("Error: Number of required arguments mismatch, missing: candy");
    (resp.results.candy === undefined).should.be.true;
    resp.results.num.should.eql("9").and.be.a.String;
    resp.results.reverse.should.be.false;
    resp.results.unwrap.should.be.false;

    done();
  });

  it("should show help", function(done) {
    var help = f.help_usage(["node", "/path/to/script", "-h"]);

    help.should.be.eql("Usage: node /path/to/script CANDY\n\nRequired arguments:\n CANDY     Candy name\n\nOptional arguments:\n -n  --num=25 How many pieces?\n\nSwitches:\n -r  --reverse Reverse ordering\n -u  --unwrap unwrapcandy\n")

    done();
  });

  it("should instantiate if has not been instantiated", function(done) {
    var ad = Arguments();

    resp = f.parse(["node", "/path/to/script", "bubblegum", "--num=20", "--reverse", "--unwrap"]);
    resp.errors.length.should.be.exactly(0);
    resp.results.candy.should.eql("bubblegum").and.be.a.String;

    done();
  });

  it("should run with only required", function(done) {
    var af = new Arguments();

    af.required("cookie", { help: "Candy name" });

    resp = af.parse(["node", "/path/to/script", "chocolate"]);
    resp.results.cookie.should.eql("chocolate").and.be.a.String;

    done();
  });

  it("should run with only option", function(done) {
    var af = new Arguments();

    af.option("num", "25", { help: "How many pieces?", abbr: "n" });

    resp = af.parse(["node", "/path/to/script", "--num=20"]);
    resp.results.num.should.eql("20").and.be.a.String;

    done();
  });

  it("should run with only switches", function(done) {
    var af = new Arguments();

    af.switch("reverse",  { help: "Reverse ordering", abbr: "r" });

    resp = af.parse(["node", "/path/to/script", "-r"]);
    resp.results.reverse.should.be.true;

    done();
  });

});
