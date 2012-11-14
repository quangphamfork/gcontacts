var Gcontacts = {
  config: {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,''),
    redirect_uri: window.location.href,
  },
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
        clearTimeout(this.config.timeout);
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
        data = event.data.split('&');
        for (i in data){
          content = data[i].match('(.*)=(.*)').splice(1,3);
          token_data[content[0].replace(/^#/,'')] = content[1];
        }
        if (token_data.token != 'undefined' && token_data.expire_in != 'undefined') Gcontacts.set_token_state(true);
      }
    },
    set_token_state: function(state){
      with(Gcontacts){
        if (state){
          config.timeout = setTimeout(set_token_state(false), Number(token_data.expires_in))
          token_data.valid = true;
          console.log(['token valid for:', token_data.expires_in].join(' '));
        }
        else{
          token_data.valid = false;
          console.log('token expired');
        }
      }
    }
}
