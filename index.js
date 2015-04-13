var _ = require("lodash");

Object.prototype.keysLength = function() {
    return Object.keys(this).length;
};

String.prototype.join = function(arr) {
    return arr.join(this);
};

String.prototype.repeat = function(len) {
    return Array(len).join(this);
};
String.prototype.ljust = function(len) {
    var padding = len - this.length;
    return padding > 0 ? " ".repeat(padding) + this: this;
};
String.prototype.rjust = function(len) {
    var padding = len - this.length;
    return padding > 0 ? this + " ".repeat(padding): this;
};

var Arguments = function Arguments() {
    var self = this;

    self.order = [];
    self.data = {};
    self.text = {
        "switch": {},
        "option": {},
        "required": {},
    };
    self.names = {
        "switches": [],
        "options": [],
    };
    self.abbr = {};
    self.processors = {};
    self.validators = {};

    function _get_parameter_args(args) {
        return args.slice(2);
    }

    function _get_script_args(args) {
        return args.slice(0, 2);
    }

    function _parse_args(args) {
        var requested = {};
        var ordinal = [];
        _.each(_get_parameter_args(args), function(a) {
            // required arguments
            if (a[0] != "-") {
                ordinal.push(a);
                return;
            }
            //there is assigment, options
            if (a.indexOf("=") >= 0) {
                var argumentSplit = a.split("=");
                var raw = argumentSplit[0], value = argumentSplit[1];
                if (raw.length > 3 && raw.substr(0, 2) == "--") {
                    name = raw.replace("--", "");
                    requested[name] = value;
                }
                else {
                    requested[raw.replace(/^-+/, "")] = value;
                }
                return;
            }
            // swtiches
            if (a.length > 2 && a.substr(0, 2) == "--") {
                name = a.substr(2);
                requested[name] = true;
                return;
            }

            if (a[0] == "-")
                _.each(a.slice(1), function(x) {
                    requested[x] = true;
                });
        });

        return { requested: requested, ordinal: ordinal };
    }

    function __str__() {
        return help_usage().rtrim();
    }

    function _set_default_value(name, value) {
        if (self.data.hasOwnProperty(name))
            throw new Error(name + " is already used");
        self.data[name] = value;
    }

    function _set_abbr(name, abbr) {
        if (self.abbr.hasOwnProperty(abbr))
            throw new Error(abbr + " is already used");
        self.abbr[abbr] = name;
    }

    function _switch(name, opts) {
        var help = opts.help, abbr = opts.abbr;
        _set_default_value(name, false);

        self.names["switches"].push(name);
        self.text["switch"][name] = help || "N/A";
        if (abbr)
            _set_abbr(name, abbr);
    }

    function option(name, value, opts) {
        var help = opts.help, abbr = opts.abbr;
        _set_default_value(name, value);

        self.text["option"][name] = help || "N/A";
        if (abbr)
            self.abbr[abbr] = name;
    }

    function required(name, opts) {
        var help = opts.help;
        self.order.push(name);
        _set_default_value(name, undefined);
        self.text["required"][name] = help;
    }

    function process(name, fun) {
        if (!self.processors.hasOwnProperty(name))
            self.processors[name] = [];
        self.processors[name].push(fun);
    }

    function validate(name, fun, exp) {
        if (!self.validators.hasOwnProperty(name))
            self.validators[name] = [];
        self.validators[name].push([fun, exp || "Validation failed"]);
    }

    function _elongate(abbr) {
        return self.abbr[abbr];
    }

    function _is_value(name) {
        return self.data.hasOwnProperty(name);
    }

    function _is_switch(name) {
        return _.indexOf(self.names["switches"], name) >= 0;
    }

    function _is_abbr(name) {
        return self.abbr.hasOwnProperty(name);
    }

    function parse(args) {
        if (!args) {
            args = [];
        }

        var pa = _parse_args(args);

        // set defaults
        var results = _.clone(self.data);
        var errors = [];

        // set ordinal
        _.each(pa.ordinal, function(value, e) {
            if (e >= self.order.length) {
                errors.push(new RangeError("Unnamed arguments found: [" + value + "]"));
                return;
            }

            name = self.order[e];
            results[name] = value;
        });

        // set optional
        _.each(pa.requested, function(value, name) {
            if (_is_abbr(name))
                name = _elongate(name);

            if (_is_switch(name))
                results[name] = true;
            else if (_is_value(name)) {
                if (value === true)
                    return errors.push(new Error("Value argument used without value: [" + name + "]"));
                results[name] = value;
            }
            else
                errors.push(new Error("Unkown argument: [" + name + "]"));
        });

        // processor
        _.each(self.processors, function(name) {
            _.each(self.processors[name], function(p) {
                if (results[name]) {
                    try {
                        results[name] = p(results[name]);
                    } catch(e) {
                        errors.push(e);
                    }
                }
            });
        });

        // validators
        _.each(self.validators, function(funs, name) {
            _.each(funs, function(fun) {
                var f = fun[0], exp = fun[1];
                if (!f(results[name]))
                    errors.push(new Error("[" + name + "] " + exp));
            });
        });

        // check mandatory
        if (self.order.length != pa.ordinal.length) {
            var missing = self.order.slice(pa.ordinal.length);
            errors.push(new Error(
                "Number of required arguments mismatch, missing: " +
                ",".join(missing))
                );
        }

        return { results: results, errors: errors };
    }

    function help_usage(args) {
        if (!args) {
            throw new TypeError("'args' needs to be an array");
        }
        var usage_options = "";
        var options_count = self.names.length
        if (options_count > 0) {
            usage_options = " [OPTIONS] ";
        }

        var mandatory = " ".join(self.order).toUpperCase();

        var length_name = _.max(_.keys(self.names), function(k) { return k.length; });
        var length_values = _.max(_.map(_.values(self.data), function(v) { return v ? v.length : 0; }));
        var len_just = length_name + length_values + 5;

        var abbr_reverse = _.invert(self.abbr);
        var r = "";
        r += "Usage: " + _get_script_args(args).join(" ") + " " + usage_options + mandatory;
        r += "\n\n";
        if (self.text["required"].keysLength() > 0) {
            r += "Required arguments:\n";
            _.each(self.text["required"], function(v, k) {
                r += " " + k.ljust(len_just).toUpperCase() + " ".repeat(6) + v;
                r += "\n";
            });
            r += "\n";
        }

        if (self.text["option"].keysLength() > 0) {
            r += "Optional arguments:\n"
            _.each(self.text["option"], function(v, k) {
                var a = "";
                if (abbr_reverse.hasOwnProperty(k))
                    a = "-" + abbr_reverse[k];
                a = " " + a.rjust(2);
                nv = "--" + k + "=" + self.data[k];
                r += a + "  " + nv.ljust(len_just) + " ".repeat(2) + v;
                r += "\n";
            });
        }

        if (self.text["switch"].keysLength() > 0) {
            r += "\nSwitches:\n";
            _.each(self.text["switch"], function(v, k) {
                a = "";
                if (abbr_reverse.hasOwnProperty(k))
                    a = "-" + abbr_reverse[k];
                a = " " + a.rjust(2);
                nv = "--" + k;
                r += a + "  " + nv.ljust(len_just) + " ".repeat(2) + v;
                r += "\n";
            });
        }

        return r;
    }

    return {
        help_usage: help_usage,
        required: required,
        option: option,
        "switch": _switch,
        process: process,
        validate: validate,
        parse: parse,
        toString: __str__
    };
};

module.exports = Arguments;