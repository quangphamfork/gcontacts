var Gcontacts = (function(){
  var raw = { val: !1, get on(){this.val = !0}, get off(){this.val = !1}, get state(){return this.val}};
  var config = {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,''),
    redirect_uri: window.location.href,
    group:{ callback: 'Gcontacts._answer', from: 'https://www.google.com/m8/feeds/groups/default/', alt: 'json-in-script', projection: 'thin'},
    contacts: { callback: 'Gcontacts._answer', from: 'https://www.google.com/m8/feeds/contacts/default/thin', alt: 'json-in-script'}
  };
  var parameters = {
    params: {
      client_id: '',
      response_type: 'token',
      scope: '',
      inmediate: 'true'
    },
    get check_config(){
      if(this.isBlank)
        throw 'parameters are different than we spect!';
      return !0;
    },
    get isBlank(){
      for(property in this.params)
        if(this.params[property] == '') return !0;
      return !1;
    },
    get show(){
      return this.params;
    },
    get encoded(){
      url = [];
      for(property in this.params)
        url.push([encodeURIComponent(property), encodeURIComponent(this.params[property])].join('='));
      return url;
    },
    get token(){ if(token_data.valid) return token_data.access_token }
  };
  var token_data = {
    valid: !1,
    expire_date: '',
    get isSet(){return this.access_token != undefined && this.expires_in != undefined},
    get state(){ return ( this.valid && (this.expire_date > new Date()) ) },
    set state(val){
    this.valid = val;
    if(val){
        var msec = Number(token_data.expires_in) * Number(1000);
        window._GcontactsTokenTimeout = setTimeout(function(){ token_data.state = !1}, msec);
        this.expire_date = new Date();
        this.expire_date.setHours( this.expire_date.getHours() + 1);
        events.trigger = ['login','success'];
        console.log(['token valid for:', this.expires_in, 'seconds', 'on:', Date()].join(' '));
      }else
        throw(['token expired on', Date()].join(' '));
    }
  };
  var events = {
    events: {},
    set create(evts){
      var dom = window.document;
      var family = 'gc';
      if( window.CustomEvent ){
        for(var i = 0, event; event = evts[i]; i++)
          events[event] = {
                            success: new CustomEvent(['success',event,family].join('.')),
                            fail: new CustomEvent(['fail',event,family].join('.'))
                          }
      }
      else{
        for(var i = 0, event; event = evts[i]; i++)
          events[event] = {
                            success: dom.createElement('Event').initEvent(['success',event,family].join('.'), false, false),
                            fail: dom.createElement('Event').initEvent(['fail',event,family].join('.'), false, false)
                          }
      }
      },
    set trigger(evt){
      var dom = window.document;
      var event = events[evt[0]][evt[1]];
      dom.dispatchEvent ?
        dom.dispatchEvent(event) :
        dom.fireEvent('on' + event.eventType, event);
    }
  };
  var contacts = {};
  var groups = {};
  var auth = function(href){
    var url = [];
    for(var property in config)
      if(property !== 'url')
        url.push([encodeURIComponent(property), encodeURIComponent(config[property])].join('='));
    url = url.concat(parameters.encoded);
    return [(href ? href : config.url), url.join('&')].join('?');
  };
  var login = function( event, href ){
    if (!token_data.state){
      if(parameters.check_config)
        window.open(auth(href), '_blank', ['toolbar=no', 'location= '+ (window.opera ? 'no' : 'yes'), 'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no', 'width=' + window.screen.width / 2, 'height='+ window.screen.height / 2 ].join())

    }else
      throw 'you are good to go!'
  };
  var init = function(config){
    if (window.location.hash !== '') {
      var origin_url = window.location.origin || window.location.protocol + window.location.host;
      window.opener.postMessage(window.location.hash, origin_url);
      window.close();
    }
    if(typeof(config) != undefined){
      if(window._GcontactsTokenTimeout != undefined)
        clearTimeout(window._GcontactsTokenTimeout);
      for(attr in config)
        parameters.params[attr] = config[attr];
      parameters.check_config;
      events.create = ['login','contacts','groups'];
      window.addEventListener('message', message,  !1);
    }else throw 'wrong initialization';
  };
  var message = function(event){
    var data = event.data.split('&');
    for (i in data){
      var content = data[i].match('(.*)=(.*)').splice(1,3);
      token_data[content[0].replace(/^#/,'')] = content[1];
    }
    if(token_data.isSet){
      token_data.state = !0;
    }else
      events.trigger = ['login','fail'];
  };
  var cleanup = function(){ this.parentNode.removeChild(this) };
  var script_in_dom = function(url, callback){
    url +=  ['&access_token',token_data.access_token].join('=');
    url +=  ['&callback',callback].join('=');
    var groups_element = document.createElement("script");
    groups_element.src = url;
    groups_element.async = !0;
    groups_element.onload = cleanup;
    document.body.appendChild(groups_element);
  };
  var get_groups = function(){
    if(token_data.state){
      group = config.group;
      url = group.from + group.projection + '?alt=' + group.alt;
      script_in_dom(url, group.callback);
    }else throw 'invalid token';
  };
  var get_all_contacts = function(){
    if(token_data.state){
      var contact = config.contacts;
      var url = [contact.from, '?group=', group_link, '&alt=', contact.alt].join('');
      script_in_dom(url, contact.callback);
    }else throw 'invalid token';
  };
  var get_group = function(group_link){
    if(token_data.state){
      var contact = config.contacts;
      var url = [contact.from, '?group=', group_link, '&alt=', contact.alt].join('');
      contacts._lastRef = group_link;
      script_in_dom(url, contact.callback);
    }else throw 'invalid token';
  };
  var get_groups_response =  function(){
   if(groups.feed && groups.feed.entry)
    if(!raw.state){
      var _groups = [];
      for(var i = 0, group; group = groups.feed.entry[i]; i++)
        _groups.push(Object.create({},{ name: {value: group.title.$t || ''}, id: {value: group.id.$t ||''}}));
    }

    result =  groups.feed && groups.feed.entry  ? 'success' : 'fail';
    if( groups.feed ){
        events.groups[result].author = groups.feed.author[0];
        events.groups[result].title  = groups.feed.title.$t;
    }
    events.groups[result].data = _groups ? _groups : groups;
    events.trigger = ['groups',result];
  };
  var get_contacts_response = function(){
    if(!raw.state){
      var _contacts = [];
      if( contacts.feed.entry && contacts.feed.entry.length != 0 ){
        for(var i = 0,contact; contact = contacts.feed.entry[i]; i++)
          _contacts.push(Object.create({},{ name: {value: contact.title.$t|| ''}, email: {value: contact.gd$email || ''}}));
      }
    }
    result = contacts.feed && contacts.feed.entry ? 'success' : 'fail';
    if( contacts.feed ){
     events.contacts[result].author = contacts.feed.author[0];
     events.contacts[result].title  = contacts.feed.title.$t;
    }
    events.contacts[result].reference = contacts._lastRef;
    events.contacts[result].data = _contacts ? _contacts : contacts;
    events.trigger = ['contacts',result];
  };
  var get_id_group = function(group_name){
   if(groups.feed && groups.feed.entry)
    for(var i = 0,group;group = groups.feed.entry[i];i++)
      if(group.title.$t == group_name) return group.id.$t
  };
  var get_contacts_by_group = function(group_name){
    if((/^http(s?):\/\//).test(group_name))
        get_group(group_name);
      else{
        if(groups.feed != undefined){
          group = get_id_group(group_name);
          if(group)
            get_group(group);
          else throw ['group',group_name,'not found'].join(' ');
        }else throw 'need get the contacts groups first with groups();';
      }
  };
  var get_response = function(res){
    if ((/group$/).test(res.feed.category[0].term)){
      groups = res;
      get_groups_response();
    }
    else{
      res._lastRef = contacts._lastRef;
      contacts = res;
      get_contacts_response();
    }
  };
  var ready = function(){
      events.create = ['ready'];
      events.trigger = ['ready','success'];
  };
  return{
    _event: events,
    raw: raw,
    init: init,
    login: login,
    groups: get_groups,
    contacts_by_group: get_contacts_by_group,
    _answer: get_response,
    _ready: ready
  };
}());
