var Gcontacts = (function () {
  'use strict';

  var timeoutSession, onlogin, response = [];

  var internalRandomCode = function () {
    return 'z' + Math.random().toString(36).substring(10).substring(0, 6);

  };
  var getOrigin = function() {
      if (window.location.origin) {
          return window.location.origin;
      } else {
          return window.location.protocol + '//' +
              window.location.hostname +
             (window.location.port ?
              ':' + window.location.port :
              '');
      }
  };
  var config = {
    url: 'https://accounts.google.com/o/oauth2/auth'
    , origin: getOrigin()
    , redirect_uri: window.location.href
    , pagination: {
        default: {limit: 25}
        , offset: 'start-index'
        , limit: 'max-results'
    }
    , group: {
        from: 'https://www.google.com/m8/feeds/groups/default/'
        , projection: 'thin'
        , alt: 'json-in-script'
    }
    , contacts: {
        from: 'https://www.google.com/m8/feeds/contacts/default/full'
        , version: 3
        , alt: 'json-in-script'
    }
  };
  var parameters = {
    params: {
      client_id: ''
      , response_type: 'token'
      , scope: ''
      , inmediate: 'true'
    },
    isBlank: function () {
      for (var property in this.params)
        if (this.params[property] === '') return true;

      return false;
    },
    checkConfig: function() {
      if (this.isBlank())
        throw 'parameters are different than we expect!';

      return true;
    },
    show: function () {
      return this.params;
    },
    encoded: function () {
      var url = [];

      for (var property in this.params)
        url.push([encodeURIComponent(property), encodeURIComponent(this.params[property])].join('='));

      return url;
    },
    token: function () {
      if (token_data.valid)
        return token_data.access_token;
    }
  };
  var token_data = {
    valid: false,
    expire_date: '',
    isSet: function () {
      return this.access_token && this.expires_in;
    },
    status: function () {
      return (this.valid && (this.expire_date > new Date()));
    },
    state: function (val) {
      this.valid = val;
      if (val) {
        var msec = Number(token_data.expires_in) * Number(1000);
        timeoutSession = setTimeout(logout, msec);
        this.expire_date = new Date();
        this.expire_date.setHours(this.expire_date.getHours() + 1);
        onlogin();
        events.trigger(['login', 'success']);
      } else {
        events.trigger(['logout', 'success']);
        throw (['token expired on', Date()].join(' '));
      }
    }
  };
  var events = {
    events: {},
    create: function (evts) {
      var dom    = window.document
        , family = 'gc';
      if ('CustomEvent' in window) {
        for (var i = 0, event; (event = evts[i]); i++)
        events[event] = {
          success: new CustomEvent(['success', event, family].join('.')),
          fail: new CustomEvent(['fail', event, family].join('.'))
        };
      } else {
          for (var i = 0, event; (event = evts[i]); i++)
            events[event] = {
              success: dom.createElement('Event')
                .initEvent(['success', event, family].join('.'), false, false),
              fail: dom.createElement('Event')
                .initEvent(['fail', event, family].join('.'), false, false)
            };
      }
    },
    trigger: function (evt) {
      var dom   = window.document
        , event = events[evt[0]][evt[1]];

      if ( 'dispatchEvent' in dom )
        dom.dispatchEvent(event);
     else
       dom.fireEvent('on' + event.eventType, event);
    }
  };

  var auth = function (href) {
    var url = [];
    for (var property in config){
      var value = config[property];
      if (property !== 'url' && typeof(value) == 'string')
        url.push([encodeURIComponent(property), encodeURIComponent(config[property])].join('='));
    }
    url = url.concat(parameters.encoded());

    return [(href || config.url), url.join('&')].join('?');
  };
  var login = function (cb, href) {
    if (!token_data.status()) {
      onlogin = cb;
      if (parameters.checkConfig())
        window.open(auth(href),
        '_blank',
        ['toolbar=no',
         'location= ' + (window.opera ? 'no' : 'yes'),
         'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no',
         'width=' + window.screen.width / 2,
         'height=' + window.screen.height / 2
        ].join());
    } else
      cb();
  };
  var logout = function () {
      token_data.state(false);
  };
  var init = function (options) {
    if (window.location.hash !== '') {
      var origin_url = window.location.origin || window.location.protocol + window.location.host;
      if (window.opener) {
          window.opener.postMessage(window.location.hash, origin_url);
          window.close();
      }
    }
    if (options) {
      if (timeoutSession)
        clearTimeout(timeoutSession);
      for(var attr in parameters.params)
        parameters.params[attr] = options[attr];
      parameters.checkConfig();
      if ('redirect_uri' in options)
        config.redirect_uri = options.redirect_uri;
      events.create(['login', 'logout']);
      window.addEventListener('message', message, false);
    } else throw 'wrong initialization';
  };
  var message = function (event) {
    var data = event.data.split('&');
    for (var i = 0, param; (param = data[i++]);) {
      var content = param.match('(.*)=(.*)').splice(1, 3);
      token_data[content[0].replace(/^#/, '')] = content[1];
    }
    if (token_data.isSet())
      token_data.state(true);
    else
      events.trigger(['login', 'fail']);
  };
  var cleanup = function () {
    this.parentNode.removeChild(this);
  };
  var injectScriptInDom = function (base, params, callback) {
    var script    = document.createElement('script')
      , url       = ['?access_token', token_data.access_token].join('=');

    url          += ['&callback', callback].join('=');
    url          += '&' + params.join('&');
    script.src    = base + url;
    script.async  = true;
    script.onload = cleanup;

    document.body.appendChild(script);
  };

  var returnCallback = function (cb, raw, extras) {
    if (typeof(cb) == 'function') {
      var index = internalRandomCode();

      response[index] = raw ? cb : handleResponse(cb, index, extras);

      return 'Gcontacts._answer.' + index;
    }
  };
  var getGroups = function (cb, pagination, raw) {
    if (token_data.status()) {
      var opts = pagination || {};

      var group    = config.group
        , base     = [group.from, group.projection].join('')
        , limit    = Number(opts.limit || 25)
        , offset   = Number(opts.offset || 1)
        , callback = returnCallback(cb, raw)
        , params   = [
                      ['alt', group.alt].join('='),
                      [config.pagination.offset, offset].join('='),
                      [config.pagination.limit, limit].join('=')
                     ];

      injectScriptInDom(base, params, callback);
    } else
        throw 'invalid token';
  };
  var allContacts = function (cb, pagination, raw) {
    if (token_data.status()) {
      var opts = pagination || {};

      var contact  = config.contacts
        , base     = contact.from
        , callback = returnCallback(cb, raw)
        , limit    = Number(opts.limit || 25)
        , offset   = Number(opts.offset || 1)
        , params   = [
                      ['alt', contact.alt].join('='),
                      ['v', contact.version].join('='),
                      [config.pagination.offset, offset].join('='),
                      [config.pagination.limit, limit].join('=')
                     ];

      injectScriptInDom(base, params, callback);
    } else
        throw 'invalid token';
  };
  var contactsFromGroup = function (groupLink, cb, pagination, raw) {
    if (token_data.status()) {
      var opts = pagination || {};

      if (!(/^http(s?):\/\//).test(groupLink))
        throw 'malformed Group Link';

      var callback = returnCallback(cb, raw, {groupLink: groupLink})
        , limit    = Number(opts.limit || 25)
        , offset   = Number(opts.offset || 1)
        , params   = [
                      ['group', groupLink].join('='),
                      ['alt', config.contacts.alt].join('='),
                      ['v', config.contact.version].join('='),
                      [config.pagination.offset, offset].join('='),
                      [config.pagination.limit, limit].join('=')
                     ];

      injectScriptInDom(config.contacts.from, params, callback);
    } else
      throw 'invalid token';
  };
  var paginate = function (direction, pagination) {

    pagination = pagination || {limit: config.pagination.default.limit, offset: 1 };

    var isPlus    = direction == 'next'
      , offset    = pagination.offset;

    if (isPlus)
      offset += pagination.limit;
    else
      offset -= pagination.limit;

    return function (cb, raw) {
      return allContacts(cb, {offset: offset, limit: pagination.limit}, raw);
    };

  };
  var handleResponse = function (callback, index, extras) {
    return function (e) {
      var result = {status: 'fail'};

      if (e.feed) {
        result = {
            status : 'success'
          , author : {   name: e.feed.author[0].name.$t
                       , email: e.feed.author[0].email.$t
                     }
          , title  : e.feed.title.$t
        };

        var pagination = {
              limit  : Number(e.feed.openSearch$itemsPerPage.$t)
            , offset : Number(e.feed.openSearch$startIndex.$t)
            , total  : Number(e.feed.openSearch$totalResults.$t)
        };

        if ((pagination.offset + pagination.limit) < pagination.total)
          pagination.next = paginate('next', pagination);

        if (pagination.offset > 1)
          pagination.previous = paginate('previous', pagination);

        result.pagination = pagination;

        if (extras)
          result.extras = extras;

        if (e.feed.entry) {
          var entries = e.feed.entry;

          if (entries.length) {
            var elements = []

            for (var i = 0, entry, emails, names, element; (entry = entries[i++]);) {

              element = {
                  name   : entry.title.$t || ''
                , id     : entry.id.$t || ''
              };

              if (entry.gd$name) {
                names = entry.gd$name;

                if (names.gd$fullName)
                    element.full_name = names.gd$fullName.$t;

                if (names.gd$givenName)
                    element.first_name = names.gd$givenName.$t;

                if (names.gd$familyName)
                    element.last_name = names.gd$familyName.$t;
              }

              emails = entry.gd$email || [];

              if (emails.length) {
                element.emails = [];
                for (var j = 0, email; (email = emails[j++]);)
                 element.emails.push(email);
              }

              elements.push(element);
            }

            result.data = elements;
          }
        }
      }

      delete response[index];
      return callback(result);
    };
  };
  var ready = function () {
    events.create(['ready']);
    events.trigger(['ready', 'success']);
  };

  return {
    init: init,
    login: login,
    logout: logout,
    contacts: allContacts,
    groups: getGroups,
    contactsFromGroup: contactsFromGroup,
    _answer: response,
    _ready: ready
  };
}());
