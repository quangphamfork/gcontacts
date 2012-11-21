var Gcontacts = (function(){
  var xhr = new XMLHttpRequest();
  config = {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,''),
    redirect_uri: window.location.href,
    header: {token: 'Authorization'},
    group:{ from: 'https://www.google.com/m8/feeds/groups/default/', alt: 'json', projection: 'thin' },
    contacts: { by_group: 'https://www.google.com/m8/feeds/contacts/default/thin/?', alt: 'json' }
  };
  events = {};
  contacts = {};
  groups = {};
  token_data = {valid: false};
  parameters = {
    response_type: 'token',
    client_id: '896644733940.apps.googleusercontent.com',
    scope: 'https://www.google.com/m8/feeds',
    inmediate: 'true',
  };
  check_config = function(){
    for(var property in parameters){
      if(typeof(parameters[property]) !== 'string' || parameters[property] === '')
        throw [property,'Its different than we spect!'].join(' ');
    }
    return true;
  };
  auth = function(href){
    var url = [];
    for(var property in config)
      if(property !== 'url')
        url.push([encodeURIComponent(property), encodeURIComponent(config[property])].join('='));
    for(var property in parameters)
      url.push([encodeURIComponent(property), encodeURIComponent(parameters[property])].join('='));
    return [(href ? href : config.url), url.join('&')].join('?');
  };
  login = function(href){
    if(check_config()){
      url = auth(href);
      window.open(url, "_blank", ['toolbar=no', 'location= '+ (window.opera ? 'no' : 'yes'), 'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no', 'width=' + window.screen.width / 2, 'height='+ window.screen.height / 2 ].join())
    }
  };
  init = function(config){
    if (window.location.hash !== '') {
      window.opener.postMessage(window.location.hash, window.location.origin);
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
   create_custom_events =  function(){
      events.contacts = new CustomEvent('gc.contacts');
      events.groups = new CustomEvent('gc.groups');
    };
   message = function(event){
        var data = event.data.split('&');
        for (i in data){
          var content = data[i].match('(.*)=(.*)').splice(1,3);
          token_data[content[0].replace(/^#/,'')] = content[1];
        }
        if (token_data.token != 'undefined' && token_data.expire_in != 'undefined') set_token_state(true);
    };
    set_token_state = function(state){
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
    get_groups = function(callback){
       if(token_data.valid){
         group = config.group;
         url = group.from + group.projection + '?alt=' + group.alt;
         header = [token_data.token_type,token_data.access_token].join(' ');
         //get_xhr();
         xhr.open('GET', url, true);
         xhr.setRequestHeader('Authorization', header);
         xhr.withCredentials = true;
         xhr.onload = (callback != undefined) ? callback : get_groups_response;
         xhr.send();
       }else throw 'invalid token';
    };
    get_group = function(group_link,callback){
       if(token_data.valid){
         contacts = config.contacts;
         url = [contacts.by_group, 'group=', group_link, '&alt=',contacts.alt].join('');
         header = [token_data.token_type,token_data.access_token].join(' ');
         //get_xhr();
         xhr.open('GET', url, true);
         xhr.setRequestHeader('Authorization', header);
         xhr.withCredentials = true;
         xhr.onload = (callback != undefined) ? callback : get_contacts_response;
         xhr.send();
       }else throw 'invalid token';
    };
    get_groups_response =  function(){
      groups = JSON.parse(xhr.response);
      var _groups = [];
        for(var i = 0, group; group = groups.feed.entry[i]; i++)
          _groups.push(Object.create({},{ name: {value: group.title.$t}, id: {value: group.id.$t}}));
      events.groups.data = _groups;
      document.dispatchEvent(events.groups);
    };
    get_contacts_response = function(){
      contacts = JSON.parse(xhr.response);
      _contacts = [];
        for(var i = 0,contact; contact = contacts.feed.entry[i]; i++)
          _contacts.push(Object.create({},{ name: {value: contact.title.$t}, email: {value: contact.gd$email}}));
      events.contacts.data = _contacts;
      document.dispatchEvent(events.contacts);
    };
    show_groups = function(){
     if(token_data.valid){
      if(groups.feed == undefined) get_groups(get_groups_response)
      else for(var i=0,group; group = groups.feed.entry[i]; i++) console.log([group.title.$t,group.id.$t]);
      }else throw 'get a valid token!';
    };
    get_id_group = function(group_name){
      for(var i=0,group;group = groups.feed.entry[i];i++)
        if(group.title.$t == group_name) return group.id.$t
    };
    get_contacts_by_group = function(group_name){
      if((/^http(s?):\/\//).test(group_name))
          get_group(group_name,get_contacts_response);
      else{
        if(groups.feed != undefined){
          group = get_id_group(group_name);
          if(group != '')
            get_group(group,get_contacts_response)
          else throw ['group',group_name,'not found'].join(' ');
        }else throw 'need get the contacts groups first with get_groups();';
      }
    };
    return{
      parameters: parameters,
      init: init,
      login: login,
      groups: show_groups,
      contacts_by_group: get_contacts_by_group
    };
}());
