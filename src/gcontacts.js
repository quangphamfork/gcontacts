var Gcontacts = (function(){
  var xhr = new XMLHttpRequest();
  var config = {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,''),
    redirect_uri: window.location.href,
    header: {token: 'Authorization'},
    group:{ callback: 'Gcontacts.get_resp', from: 'https://www.google.com/m8/feeds/groups/default/', alt: 'json-in-script', projection: 'thin'},
    contacts: { callback: 'Gcontacts.get_resp', by_group: 'https://www.google.com/m8/feeds/contacts/default/thin?', alt: 'json-in-script'}
  };
  var parameters = { response_type: 'token', client_id: '', scope: '', inmediate: 'true'};
  var token_data = {valid: false};
  var events = {};
  var contacts = {};
  var groups = {};
  var check_config = function(){
    for(var property in parameters)
      if(typeof(parameters[property]) !== 'string' || parameters[property] === '')
        throw [property,'Its different than we spect!'].join(' ');
    return true;
  };
  var auth = function(href){
    var url = [];
    for(var property in config)
      if(property !== 'url')
        url.push([encodeURIComponent(property), encodeURIComponent(config[property])].join('='));
    for(var property in parameters)
      url.push([encodeURIComponent(property), encodeURIComponent(parameters[property])].join('='));
    return [(href ? href : config.url), url.join('&')].join('?');
  };
  var login = function(href){
    if (!token_data.valid){
      if(check_config())
        window.open(auth(href), "_blank", ['toolbar=no', 'location= '+ (window.opera ? 'no' : 'yes'), 'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no', 'width=' + window.screen.width / 2, 'height='+ window.screen.height / 2 ].join())

      }else throw 'you are good to go!'
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
        parameters[attr] = config[attr];
      check_config();
      create_custom_events();
      window.addEventListener('message', message,  false);
    }else throw 'wrong initialization';
  };
  var create_custom_events =  function(){
      events.contacts = new CustomEvent('gc.contacts');
      events.groups = new CustomEvent('gc.groups');
      events.ready = new CustomEvent('gc.ready');
    };
   var message = function(event){
        var data = event.data.split('&');
        for (i in data){
          var content = data[i].match('(.*)=(.*)').splice(1,3);
          token_data[content[0].replace(/^#/,'')] = content[1];
        }
        if (token_data.token != 'undefined' && token_data.expire_in != 'undefined') set_token_state(true);
    };
   var set_token_state = function(state){
        if (state){
          var msec = Number(token_data.expires_in) * Number(1000);
          window._GcontactsTokenTimeout = setTimeout(set_token_state, msec);
          token_data.valid = true;
          console.log(['token valid for:', token_data.expires_in, 'seconds', 'on:', Date()].join(' '));
        }
        else{
          token_data.valid = false;
          throw(['token expired on', Date()].join(' '));
        }
    };
    var script_in_dom = function(url, callback){
      url +=  ['&access_token',token_data.access_token].join('=');
      url +=  ['&callback',callback].join('=');
      var groups_element = document.createElement("script");
      groups_element.src = url;
      groups_element.async = true;
      groups_element.onload = cleanup;
      document.body.appendChild(groups_element);
    };
    var cleanup = function(){ this.parentNode.removeChild(this) };
    var get_groups = function(callback){
       if(token_data.valid){
         group = config.group;
         url = group.from + group.projection + '?alt=' + group.alt;
         script_in_dom(url, group.callback);
       }else throw 'invalid token';
    };
    var get_group = function(group_link){
       if(token_data.valid){
         contact = config.contacts;
         url = [contact.by_group, 'group=', group_link, '&alt=', contact.alt].join('');
         script_in_dom(url, contact.callback);
       }else throw 'invalid token';
    };
    var get_groups_response =  function(){
      var _groups = [];
        for(var i = 0, group; group = groups.feed.entry[i]; i++)
          _groups.push(Object.create({},{ name: {value: group.title.$t}, id: {value: group.id.$t}}));
      events.groups.data = _groups;
      window.document.dispatchEvent(events.groups);
    };
    var get_contacts_response = function(){
      var _contacts = [];
        for(var i = 0,contact; contact = contacts.feed.entry[i]; i++)
          _contacts.push(Object.create({},{ name: {value: contact.title.$t}, email: {value: contact.gd$email}}));
      events.contacts.data = _contacts;
      window.document.dispatchEvent(events.contacts);
    };
    var show_groups = function(){
      if(token_data.valid){
        if(groups.feed == undefined){
          window.addEventListener('gc.groups',Gcontacts.show_groups);
          get_groups(get_groups_response)
        }
        else{
          collection = [];
          for(var i=0,group; group = groups.feed.entry[i]; i++)collection.push([group.title.$t,group.id.$t]);
          return collection;
        }
      }else throw 'get a valid token!';
    };
    var get_id_group = function(group_name){
      for(var i=0,group;group = groups.feed.entry[i];i++)
        if(group.title.$t == group_name) return group.id.$t
    };
    var get_contacts_by_group = function(group_name){
      if((/^http(s?):\/\//).test(group_name))
          get_group(group_name);
      else{
        if(groups.feed != undefined){
          group = get_id_group(group_name);
          if(group != '')
            get_group(group);
          else throw ['group',group_name,'not found'].join(' ');
        }else throw 'need get the contacts groups first with get_groups();';
      }
    };
    var get_response = function(res){
      if ((/group$/).test(res.feed.category[0].term)){
        groups = res;
        get_groups_response();
      }
      else{
        contacts = res;
        get_contacts_response();
      }
    };
    var ready= function(){
      var loaded = new CustomEvent('gc.ready');
      window.document.dispatchEvent(loaded);
    };
    return{
      _parameters: parameters,
      _ready: ready,
      init: init,
      login: login,
      groups: show_groups,
      contacts_by_group: get_contacts_by_group,
      getToken: function(){ if(token_data.valid)
                              return token_data.access_token
                            else
                              throw 'not valid token! do Gcontacts.login() first'},
      get_resp: get_response,
      show_groups: show_groups,
    };
}());
