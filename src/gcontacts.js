var Gcontacts = (function () {
  'use strict';
  var response = []
  var raw_value = false

  var raw = {
    get on() {
      raw_value = true
      return true
    },
    get off() {
      raw_value = false
      return true
    },
    get state() {
      return raw_value
    }
  }

  var internalRandomCode = function() {
    return Math.floor(Math.random() * 1000)
  }
  var config = {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname, ''),
    redirect_uri: window.location.href,
    group: {
      callback: 'Gcontacts._response',
      from: 'https://www.google.com/m8/feeds/groups/default/',
      alt: 'json-in-script',
      projection: 'thin'
    },
    contacts: {
      callback: 'Gcontacts._response',
      from: 'https://www.google.com/m8/feeds/contacts/default/thin',
      alt: 'json-in-script'
    }
  };
  var parameters = {
    params: {
      client_id: '',
      response_type: 'token',
      scope: '',
      inmediate: 'true'
    },
    get check_config() {
      if (this.isBlank) throw 'parameters are different than we spect!';
      return true;
    },
    get isBlank() {
      for (var property in this.params)
      if (this.params[property] == '') return true;
      return false;
    },
    get show() {
      return this.params;
    },
    get encoded() {
      var url = [];
      for (var property in this.params)
      url.push([encodeURIComponent(property), encodeURIComponent(this.params[property])].join('='));
      return url;
    },
    get token() {
      if (token_data.valid) return token_data.access_token
    }
  };
  var token_data = {
    valid: false,
    expire_date: '',
    get isSet() {
      return this.access_token != undefined && this.expires_in != undefined
    },
    get state() {
      return (this.valid && (this.expire_date > new Date()))
    },
    set state(val) {
      this.valid = val;
      if (val) {
        var msec = Number(token_data.expires_in) * Number(1000);
        window._GcontactsTokenTimeout = setTimeout( "Gcontacts.logout();", msec);
        this.expire_date = new Date();
        this.expire_date.setHours(this.expire_date.getHours() + 1);
        events.trigger = ['login', 'success'];
        console.log(['token valid for:', this.expires_in, 'seconds', 'on:', Date()].join(' '));
      } else {
        events.trigger = ['logout', 'success'];
        throw (['token expired on', Date()].join(' '));
      }
    }
  };
  var events = {
    events: {},
    set create(evts) {
      var dom = window.document;
      var family = 'gc';
      if (window.CustomEvent) {
        for (var i = 0, event; event = evts[i]; i++)
        events[event] = {
          success: new CustomEvent(['success', event, family].join('.')),
          fail: new CustomEvent(['fail', event, family].join('.'))
        }
      } else {
        for (var i = 0, event; event = evts[i]; i++)
        events[event] = {
          success: dom.createElement('Event')
            .initEvent(['success', event, family].join('.'), false, false),
          fail: dom.createElement('Event')
            .initEvent(['fail', event, family].join('.'), false, false)
        }
      }
    },
    set trigger(evt) {
      var dom = window.document;
      var event = events[evt[0]][evt[1]];
      dom.dispatchEvent ? dom.dispatchEvent(event) : dom.fireEvent('on' + event.eventType, event);
    }
  };
  var contacts = {};
  var groups = {};
  var auth = function (href) {
    var url = [];
    for (var property in config)
    if (property !== 'url') url.push([encodeURIComponent(property), encodeURIComponent(config[property])].join('='));
    url = url.concat(parameters.encoded);
    return [(href ? href : config.url), url.join('&')].join('?');
  };
  var login = function (event, href) {
    if (!token_data.state) {
      if (parameters.check_config)
        window.open(auth(href),
        '_blank',
        ['toolbar=no',
         'location= ' + (window.opera ? 'no' : 'yes'),
         'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no',
         'width=' + window.screen.width / 2,
         'height=' + window.screen.height / 2
        ].join())

    } else
      throw 'you are good to go!'
  };
  var logout = function () {
      token_data.state = false;
  };
  var init = function (config) {
    if (window.location.hash !== '') {
      var origin_url = window.location.origin || window.location.protocol + window.location.host;
      window.opener.postMessage(window.location.hash, origin_url);
      window.close();
    }
    if (typeof (config) != undefined) {
      if (window._GcontactsTokenTimeout != undefined)
        clearTimeout(window._GcontactsTokenTimeout);
      for(var attr in config)
        parameters.params[attr] = config[attr];
      parameters.check_config;
      events.create = ['login', 'logout', 'contacts', 'groups'];
      window.addEventListener('message', message, false);
    } else throw 'wrong initialization';
  };
  var message = function (event) {
    var data = event.data.split('&');
    for (var i in data) {
      var content = data[i].match('(.*)=(.*)')
        .splice(1, 3);
      token_data[content[0].replace(/^#/, '')] = content[1];
    }
    if (token_data.isSet) {
      token_data.state = true;
    } else events.trigger = ['login', 'fail'];
  };
  var cleanup = function () {
    this.parentNode.removeChild(this)
  }
  var injectScriptInDom = function (base, params, callback) {
    var script    = document.createElement('script')
      , url       = ['?access_token', token_data.access_token].join('=')

    url          += ['&callback', callback].join('=')
    url          += '&' + params.join('&')
    script.src    = base + url
    script.async  = true
    script.onload = cleanup

    document.body.appendChild(script)
  }
  var getGroups = function (cb, raw) {
    if (token_data.state) {
      var group    = config.group
        , base     = [group.from, group.projection].join('')
        , params   = ['alt=' + group.alt]
        , callback = returnCallback(cb, raw)

      injectScriptInDom(base, params, callback);
    } else
      throw 'invalid token'
  }
  var returnCallback = function (cb, raw, extras) {
    if (typeof(cb) == 'function') {
      var index = internalRandomCode()

      response[index] = raw ? cb : handleResponse(cb, index, extras)

      return 'Gcontacts._answer[' + index + ']'
    }
  }
  var getAllContacts = function (cb, raw) {
    if (token_data.state) {
      var contact   = config.contacts
        , base      = contact.from
        , params    = [['alt', contact.alt].join('=')]
        , callback  = returnCallback(cb, raw)

      injectScriptInDom(base, params, callback);
    } else
      throw 'invalid token'
  };
  var getContactsFromGroup = function (groupLink, cb, raw) {
    if (token_data.state) {
      if (!(/^http(s?):\/\//).test(groupLink))
          throw 'malformed Group Link'

      var contact  = config.contacts
        , callback = returnCallback(cb, raw, {groupLink: groupLink})
        , params   = [
                       ['group', groupLink].join('='),
                       ['alt', contact.alt].join('=')
                     ]

      injectScriptInDom(contact.from, params, callback);
    } else
      throw 'invalid token'
  }
  var handleResponse = function (callback, index, extras) {
    return function (e) {
      var result = {status: 'fail'}

      if (e.feed) {
        result = {
          status : 'success',
          author : e.feed.author[0],
          title  : e.feed.title['$t']
        }

        if (e.feed.entry) {
          var entries = e.feed.entry

          if (entries.length) {
            var elements = [];

            for (var i = 0, entry, emails, element; entry = entries[i++];) {

              element = {
                name     : entry.title['$t'] || 'none given'
                , id     : entry.id['$t'] || 'no id'
              }

              emails = entry['gd$email'] || []

              if (emails.length) {
                element['emails'] = []
                for (var j = 0, email; email = emails[j++];)
                 element['emails'].push(email)
              }

              elements.push(element)
            }

            result['data']   = elements
            result['extras'] = extras
          }
        }
      }
      return callback(result)
    }
  }
  var get_contacts_response = function () {
    if (!raw.state) {
      var contacts = [];
      if (contacts.feed.entry && contacts.feed.entry.length != 0) {
        for (var i = 0, contact; contact = contacts.feed.entry[i]; i++)
        _contacts.push(Object.create({}, {
          name: {
            value: contact.title.$t || ''
          },
          email: {
            value: contact.gd$email || ''
          }
        }));
      }
    }
    var result = contacts.feed && contacts.feed.entry ? 'success' : 'fail';
    if (contacts.feed) {
      events.contacts[result].author = contacts.feed.author[0];
      events.contacts[result].title = contacts.feed.title.$t;
    }
    events.contacts[result].reference = contacts._lastRef;
    events.contacts[result].data = _contacts ? _contacts : contacts;
    events.trigger = ['contacts', result];
  };
  var get_id_group = function (group_name) {
    if (groups.feed && groups.feed.entry)
      for (var i = 0, group; group = groups.feed.entry[i++];)
        if (group.title['$t'] == group_name) return group.id['$t']
  }
  var get_contacts_by_group = function (group_name) {
    if ((/^http(s?):\/\//).test(group_name))
        getContactsFromGroup(group_name)
    else {
      if (groups.feed) {
        var group = get_id_group(group_name);
        if (group) getGroup(group);
        else
          throw ['group', group_name, 'not found'].join(' ');
      } else
        throw 'we need the contacts groups first';
    }
  };

  var ready = function () {
    events.create = ['ready'];
    events.trigger = ['ready', 'success'];
  };
  var respond = []
  return {
    raw: raw,
    init: init,
    login: login,
    logout: logout,
    getAllContacts: getAllContacts,
    groups: getGroups,
    contactsFromGroup: getContactsFromGroup,
    _answer: response,
    _ready: ready
  };
}());
