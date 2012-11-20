var Gcontacts = {
  config: {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,''),
    redirect_uri: window.location.href,
    header: {token: 'Authorization'},
    group:{ from: 'https://www.google.com/m8/feeds/groups/default/', alt: 'json', projection: 'thin' },
    contacts: { by_group: 'https://www.google.com/m8/feeds/contacts/default/full/?', alt: 'json' }
  },
  events: {
  },
  contacts: {},
  groups: {},
  token_data: {valid: false},
  parameters: {
    response_type: 'token',
    client_id: '896644733940.apps.googleusercontent.com',
    scope: 'https://www.google.com/m8/feeds',
    inmediate: 'true',
  },
  auth: function(href){
    var url = [];
    for(var property in this.config) if (property !==  'url') url.push([encodeURIComponent(property), encodeURIComponent(this.config[property])].join('='));
    for(var property in this.parameters) url.push([encodeURIComponent(property), encodeURIComponent(this.parameters[property])].join('='));
    return [(href ? href : this.config.url), url.join('&')].join('?');
  },
  login: function(href){
    if(this.check_config()){
      url = Gcontacts.auth(href);
      window.open(url, "_blank", ['toolbar=no', 'location= '+ (window.opera ? 'no' : 'yes'), 'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no', 'width=' + window.screen.width / 2, 'height='+ window.screen.height / 2 ].join())
    }},
    init: function(config){
      if (window.location.hash !== '') {
        window.opener.postMessage(window.location.hash, window.location.origin);
        window.close();
      }
      if(typeof(config) !== 'undefined'){
        if(window._GcontactsTokenTimeout != 'undefined') clearTimeout(window._GcontactsTokenTimeout);
        for(attr in config) this.parameters[attr] = config[attr];
        this.check_config();
        this.create_custom_events();
        window.addEventListener('message', Gcontacts.message,  false);
      }else throw 'wrong initialization';
    },
    check_config: function(){
      for(var property in this.parameters){
        if(typeof(this.parameters[property]) !== 'string' || this.parameters[property] === '') throw [property,'Its different than we spect!'].join(' ');
      }
      return true;
    },
    create_custom_events: function(){
      this.events.contacts = new CustomEvent('gc.contacts');
      this.events.groups = new CustomEvent('gc.groups');
    },
    message: function(event){
      with(Gcontacts){
        var data = event.data.split('&');
        for (i in data){
          var content = data[i].match('(.*)=(.*)').splice(1,3);
          token_data[content[0].replace(/^#/,'')] = content[1];
        }
        if (token_data.token != 'undefined' && token_data.expire_in != 'undefined') Gcontacts.set_token_state(true);
      }
    },
    set_token_state: function(state){
      with(Gcontacts){
        if (state){
          var msec = Number(token_data.expires_in) * Number(1000);
          window._GcontactsTokenTimeout = setTimeout(set_token_state, msec);
          token_data.valid = true;
          console.log(['token valid for:', token_data.expires_in, 'seconds', 'on:', Date()].join(' '));
        }
        else{
          token_data.valid = false;
          throw(['token expired on', Date()]);
        }
      }
    },
    get_xhr: function(){
      if(Gcontacts.xhr == undefined) Gcontacts.xhr = new XMLHttpRequest();
    },
    get_groups: function(callback){
       if(Gcontacts.token_data.valid){
         var group = Gcontacts.config.group;
         var url = group.from + group.projection + '?alt=' + group.alt;
         var header = [Gcontacts.token_data.token_type,Gcontacts.token_data.access_token].join(' ');
         this.get_xhr();
         Gcontacts.xhr.open('GET', url, true);
         Gcontacts.xhr.setRequestHeader('Authorization', header);
         Gcontacts.xhr.withCredentials = true;
         Gcontacts.xhr.onload = callback;
         Gcontacts.xhr.send();
       }
    },
    get_group: function(group_link,callback){
       if(Gcontacts.token_data.valid){
         var contacts = Gcontacts.config.contacts;
         var url = [contacts.by_group, 'group=', group_link, '&alt=',contacts.alt].join('');
         var header = [Gcontacts.token_data.token_type,Gcontacts.token_data.access_token].join(' ');
         this.get_xhr();
         Gcontacts.xhr.open('GET', url, true);
         Gcontacts.xhr.setRequestHeader('Authorization', header);
         Gcontacts.xhr.withCredentials = true;
         Gcontacts.xhr.onload = callback;
         Gcontacts.xhr.send();
       }
    },
    get_groups_response: function(){
      Gcontacts.groups = JSON.parse(Gcontacts.xhr.response);
      var groups = [];
      with(Gcontacts.groups.feed){
        for(i in entry){
          groups.push(Object.create({},{ name: {value: entry[i].title.$t}, id: {value: entry[i].id.$t}}));
        }
      }
      Gcontacts.events.groups.data = groups;
      document.dispatchEvent(Gcontacts.events.groups);
    },
    get_contacts_response: function(){
      console.log('heui');
      Gcontacts.contacts = JSON.parse(Gcontacts.xhr.response);
      var contacts = [];
      with(Gcontacts.contacts.feed){
        for(i in entry){
          contacts.push(Object.create({},{ name: {value: entry[i].title.$t}, email: {value: entry[i].gd$email}}));
        }
      }
      Gcontacts.events.contacts.data = contacts;
      document.dispatchEvent(Gcontacts.events.contacts);
    },
    show_groups: function(){
      if(Gcontacts.groups != 'undefined') Gcontacts.get_groups(Gcontacts.get_groups_response);
    },
    get_contacts_by_group: function(group){
      if(Gcontacts.contacts.group != group) Gcontacts.get_group(group,Gcontacts.get_contacts_response);
    }
}
