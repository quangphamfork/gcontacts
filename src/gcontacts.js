var Gcontacts = {
  config: {
    url: 'https://accounts.google.com/o/oauth2/auth',
    origin: window.location.href.replace(window.location.pathname,'')
  },
  parameters: {
    response_type: 'token',
    client_id: '896644733940.apps.googleusercontent.com',
    scope: 'https://www.google.com/m8/feeds',
    inmediate: 'true',
    redirect_uri: window.location.href
  },
  auth: function(href){
    var url = [];
    url.push([encodeURIComponent('origin'), encodeURIComponent(this.config.origin)].join('='));
    for(var property in Gcontacts.parameters){
      url.push([encodeURIComponent(property), encodeURIComponent(Gcontacts.parameters[property])].join('='));
    }
    return [href ? href : this.config.url, url.join('&')].join('?');
  },
  login: function(href){
    if(this.check_config()){
      url = Gcontacts.auth(href);
      window.open(url, "_blank", ['toolbar=no', 'location= '+ (window.opera ? 'no' : 'yes'), 'directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no', 'width=' + window.screen.width / 2, 'height='+ window.screen.height / 2 ].join())
    }},
    init: function(config){
      if (typeof(config) !== 'undefined') {
        for(attr in config) this.parameters[attr] = config[attr];
        this.check_config();

      }else throw 'worng  initialization';

    },
    check_config: function(){
      for(var property in Gcontacts.parameters){
        if(typeof(this.parameters[property]) !== 'string' || this.parameters[property] === '') throw [property,'Its different than we spect!'].join(' ');
      }
      return true;
    }
}

