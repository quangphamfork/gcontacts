var Gcontacts = {
  config: {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,''),
    redirect_uri: window.location.href,
    header: {token: 'Authorization'},
    group:{ from: 'https://www.google.com/m8/feeds/groups/default/', alt: 'json', projection: 'thin' }
  },
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
        window.addEventListener('message', Gcontacts.message,  false);
      }else throw 'worng  initialization';
    },
    check_config: function(){
      for(var property in this.parameters){
        if(typeof(this.parameters[property]) !== 'string' || this.parameters[property] === '') throw [property,'Its different than we spect!'].join(' ');
      }
      return true;
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
    get_groups: function(callback){
       if(Gcontacts.token_data.valid){
         var group = Gcontacts.config.group;
         var url = group.from + group.projection + '?alt=' + group.alt;
         var header = [Gcontacts.token_data.token_type,Gcontacts.token_data.access_token].join(' ');
         console.log(group);
         console.log(url);
         console.log(Gcontacts.config.header.token);
         console.log(header);
         Gcontacts.xhr = new XMLHttpRequest();
         Gcontacts.xhr.open('GET', url, true);
         Gcontacts.xhr.setRequestHeader('Authorization', header);
         Gcontacts.xhr.withCredentials = true;
         Gcontacts.xhr.onload = callback;
         Gcontacts.xhr.send();
       }
    },
    conso: function(){
      for(i in Gcontacts.groups.feed.entry) console.log(Gcontacts.groups.feed.entry[i].content.$t)
    },
    get_groups_response: function(){
      Gcontacts.groups = JSON.parse(Gcontacts.xhr.response);
      Gcontacts.conso();
    },
    show_groups: function(){
      if(Gcontacts.groups != 'undefined') Gcontacts.get_groups(Gcontacts.get_groups_response);
    }
}
