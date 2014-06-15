'use strict';

/**
 * # Dispatching
 *
 * @param {Object} config The configuration for the dispatcher.
 */
function Dispatching (config) {
  if (!(this instanceof Dispatching)) {
    return new Dispatching(config);
  }
  this.__state__ = {
    routes: []
  };
  if (config) {
    this.configure(config);
  }
}

module.exports = Dispatching;

Object.defineProperties(Dispatching.prototype, {
  /**
   * Configure the router.
   * @param {Object|Array} config The configuration for the router, or an array of routes.
   * @type {Object}
   */
  configure: {
    writable: true,
    value: function (config) {
      if (Array.isArray(config)) {
        this.routes = config;
      }
      else if (config.routes) {
        this.routes = config.routes;
      }
    }
  },
  /**
   * Dispatch the given URL.
   *
   * @param {String} url The URL to match.
   * @param {Object} thisContext The context for the dispatch function.
   * @return {Mixed} The result of the function, of false if no routes match.
   */
  dispatch: {
    writable: true,
    value: function (url, thisContext) {
      thisContext = thisContext || this;
      var matches = this.match(url);
      if (matches) {
        return matches[1].call(thisContext, matches[0]);
      }
      else {
        return false;
      }
    }
  },
  /**
   * Match a URL against the registered routes and return the first match.
   *
   * @param {String} url The URL to match.
   * @return {Array|false} The extracted URL parameters and routing function, or false if no routes match.
   */
  match: {
    writable: true,
    value: function (url) {
      var routes = this.routes,
          total = routes.length,
          matches, i, route;
      for (i = 0; i < total; i++) {
        route = routes[i];
        if ((matches = route[0](url))) {
          return [matches, route[1]];
        }
      }
      return false;
    }
  },
  /**
   * Add a route.
   *
   * @param  {String|Object} pattern The pattern to match against, or the route object.
   * @param  {Function}      fn      The function to add.
   * @return {Dispatcher}            The dispatcher instance.
   */
  add: {
    writable: true,
    value: function (pattern, fn) {
      var route = pattern;
      if (typeof pattern === 'string') {
        route = {
          pattern: pattern,
          fn: fn
        };
      }
      else if (fn) {
        route.fn = fn;
      }
      this.routes.push(this.normalizeRoute(route));
      return this;
    }
  },
  /**
   * The registered routes.
   * @type {Array}
   */
  routes: {
    enumerable: true,
    get: function () {
      return this.__state__.routes;
    },
    set: function (value) {
      this.__state__.routes = value.map(this.normalizeRoute, this);
    }
  },
  /**
   * Normalize a route.
   *
   * @param  {Object|Array} route The route to normalize.
   * @return {Array}             The normalized route.
   */
  normalizeRoute: {
    writable: true,
    value: function (route) {
      if (Array.isArray(route)) {
        route = {
          pattern: route[0],
          fn: route[1]
        };
      }
      return [this.processPattern(route.pattern, route.urlSuffix), route.fn];
    }
  },
  /**
   * Process the routing pattern and return a function which can match and process URLs.
   *
   * @return {Function} The URL matcher.
   */
  processPattern: {
    writable: true,
    value: function (pattern, urlSuffix) {
      var parts = pattern.split('#');

      return this.createUrlParser({
        pathname: parts[0] ? this.extractPatternReferences(parts[0], '/') : false,
        hash: parts[1] ? this.extractPatternReferences(parts[1], '#') : false,
        urlSuffix: urlSuffix || false
      });
    }
  },
  /**
   * Creates a function which can match URLs according to the given routing options.
   *
   * @param  {Object}   options The routing options.
   * @return {Function}         The URL parser.
   */
  createUrlParser: {
    writable: true,
    value: function (options) {
      return function (url) {
          var parsed = normalizeUrl(url),
              params = {},
              hash = parsed.hash,
              pathname = parsed.pathname,
              urlSuffix, matches, total, name, i;

          // extract the url suffix
          if ((matches = /\.(\w+|-)$/.exec(pathname))) {
            urlSuffix = pathname.slice(matches.index);
            pathname = pathname.slice(0, matches.index);
          }

          if (options.urlSuffix && urlSuffix !== options.urlSuffix) {
            return false;
          }

          if (options.pathname) {
            matches = pathname.match(options.pathname.regexp);
            if (!matches) {
              return false;
            }
            total = matches.length - 1;
            if (total > 0) {
              for (i = 0; i < total; i++) {
                name = options.pathname.names[i];
                params[name] = matches[i + 1];
              }
            }
          }

          if (options.hash) {
            matches = hash.match(options.hash.regexp);
            if (!matches) {
              return false;
            }
            total = matches.length - 1;
            if (total > 0) {
              for (i = 0; i < total; i++) {
                name = options.hash.names[i];
                params[name] = matches[i + 1];
              }
            }
          }

          return params;
        };
    }
  },
  /**
   * Extract the references from the given routing pattern.
   *
   * @param  {String} pattern   The routing pattern.
   * @param  {String} character The first character to match against, `/` or `#`.
   * @return {Object}           An object containing a regular expression and an array of parameter names.
   */
  extractPatternReferences: {
    writable: true,
    value: function (pattern, character) {
      var referencePattern = /([^<]+)?<(\w+)(:([^>]+))?>([^<]+)?/g,
          escaper = /[-[\]{}()*+?.,\\^$|#\s]/g,
          parts = [],
          names = [],
          matches, prefix, suffix, name, regexPart;

      pattern = trim(pattern, character);

      while ((matches = referencePattern.exec(pattern))) {
        if (matches[1] != null) {
          prefix = matches[1].replace(escaper, '\\$&');
        }
        else {
          prefix = '';
        }

        name = matches[2];

        if (matches[4] != null) {
          if (/^\((.*)\)$/.test(matches[4])) {
            regexPart = matches[4];
          }
          else {
            regexPart = '(' + matches[4] + ')';
          }
        }
        else {
          regexPart = '([^\\/]+)';
        }

        if (matches[5] != null) {
          suffix = matches[5].replace(escaper, '\\$&');
        }
        else {
          suffix = '';
        }
        names.push(name);
        parts.push(prefix, regexPart, suffix);
      }

      if (names.length === 0) {
        parts.push(pattern.replace(escaper, '\\$&'));
      }
      return {
        regexp: new RegExp("^" + character + parts.join('') + "[/]?$"),
        names: names
      };
    }
  },
  __state__: {
    writable: true,
    value: {}
  },
  toJSON: {
    value: function () {
      return this.__state__;
    }
  }
});


function normalizeUrl (url) {
  if (typeof url === 'string') {
    var matches = /^(https?:\/\/([^/]+))?(\/[^\?|#]*)(\?[^#]*)?(#.*)?/.exec(url);
    if (!matches) {
      throw new Error('Cannot normalize invalid URL: ' + url);
    }
    return {
      pathname: matches[3],
      search: matches[4] || '',
      hash: matches[5] || ''
    };
  }
  else {
    return url;
  }
}


/**
 * Trim leading and trailing characters from a string.
 *
 * @param  {String} input The input to trim.
 * @param  {String} chars The characters to remove from the head and tail of the string.
 * @return {String}       The trimmed string.
 */
function trim (input, chars) {
  var c;
  chars = chars || ' ';
  while (input.length && ~chars.indexOf(input.charAt(0))) {
    input = input.slice(1);
  }
  while (input.length && ~chars.indexOf(input.charAt(input.length - 1))) {
    input = input.slice(0, -1);
  }
  return input;
}