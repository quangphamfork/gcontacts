var trade_of = function(select) {
  $('.cd-dropdown').replaceWith(select);
  $('#dropdown').dropdown(random_dropdownEffect());
  setTimeout(function() {
    $('.cd-dropdown span:first').trigger('mousedown.dropdown');
  }, 250);
  $('ul').off('opened.click.dropdown');
  spinner.stop();

};
var go_back_from_groups = function(e) {
  spinner.spin($('.cd-dropdown span:first')[0]);
  (e.value == 'from_contacts') ? Gcontacts.groups() : Gcontacts.contacts_by_group(e.value);
};
var retrive_groups = function(e) {
  delete window._reference
  $('.cd-dropdown span:first').off('click');
  spinner.spin($('.cd-dropdown span:first')[0]);
  Gcontacts.groups();
};
var go_back_from_contacts = function(e) {
  $('.cd-dropdown span:first').text(window._reference.title);
  spinner.spin($('.cd-dropdown span:first')[0]);
  Gcontacts.contacts_by_group(window._reference.id);
}
var retrive_contact_info = function(e) {
  switch (e.value) {
  case (/^http:/).test(e.value):
    spinner.spin($('.cd-dropdown span:first')[0]);
    $('.cd-dropdown span:first').text(window._reference.title);
    Gcontacts.contact_by_group(e.value);
    break;
  case 'from_contacts':
    spinner.spin($('.cd-dropdown span:first')[0]);
    Gcontacts.groups();
    break;
  default:
    var addresses = e.value.split(' ');
    var select = create_element();
    var title = $(e.target).find('span:first').text();
    select.options.add(new Option(title, - 1));
    if (addresses.length < 2 && addresses[0] == 'empty') select.options.add(new Option('no info about him/her yet', - 2));
    else for (var i = 0, content; content = addresses[i]; i++)
    select.options.add(new Option(content, i))

    select.options.add(new Option('go back!', window._reference.id));
    trade_of(select);
    $('ul').on('opened.click.dropdown', go_back_from_contacts);
    break;
  }
};
var replace_contacts = function(e) {
  var title = window._reference && window._reference.title || $('.cd-dropdown span:first').text();
  var data = e.data;
  var select = create_element();
  select.options.add(new Option(title, - 1));
  window._reference = {
      id: e.reference,
      title: title
  }
  for (var i = 0, label; label = data[i]; i++) {
      var emails = [];
      if (typeof(label.email) !== 'string') for (var j = 0, email, name; email = label.email[j]; j++)
      emails.push(email.address);
      name = label.name.length < 20 ? label.name : [label.name.slice(0, 20), '...'].join('');
      select.options.add(new Option(name, (emails.length > 0) ? emails.join(' ') : 'empty'));
  }
   select.options.add(new Option('back', 'from_contacts'))
   trade_of(select);
   $('ul').on('opened.click.dropdown', retrive_contact_info);
};
var replace_groups = function(e) {
  delete window._reference
  var data = e.data;
  var select = create_element();
  var title = (e.title.length < 20) ? e.title : [e.title.slice(0, 20), '...'].join('');
  select.options.add(new Option(title, - 1));
  for (var i = 0, label, name; label = data[i]; i++) {
      name = (label.name.length < 20) ? label.name : [label.name.slice(0, 20), '...'].join('');
      select.options.add(new Option(label.name, label.id));
  }

  trade_of(select);
  $('ul').on('opened.click.dropdown', go_back_from_groups);
};
var create_element = function() {
  var select = document.createElement('select');
  select.id = 'dropdown';
  return select;
};
var no_groups_found = function(e) {
  var select = create_element();
  select.options.add(new Option(e.title, - 1));
  select.options.add(new Option('no groups, try again later!', '2'));
  trade_of(select);
  $('ul').on('opened.click.dropdown', retrive_groups);
    };
var no_contacts_found = function(e) {
  var select = create_element();
  var title = $('.cd-dropdown span:first').text();
  select.options.add(new Option(title, - 1));
  select.options.add(new Option('no contacts here!', '1'));
  select.options.add(new Option('go back!', '2'));
  trade_of(select);
  $('ul').on('opened.click.dropdown', retrive_groups);
    };
var random_dropdownEffect = function() {
  var index = Math.floor( Math.random() * dropEffects.length );
  var picked = dropEffects[index];
  return picked
}

var get_gcontacts = function () {
  var gc = document.createElement('script');
  var s     = document.getElementsByTagName('script')[0];
  gc.type   = 'text/javascript';
  gc.async  = true;
  gc.src    = (/^gcontacts.info/).test( window.location.host || window.location.hostname ) ?
    '../src/gcontacts.js'
    : '//github.com/eventioz/gcontacts/raw/master/src/gcontacts.js'
  gc.onload = function(){Gcontacts._ready()};
  s.parentNode.insertBefore(gc, s);
};

var gcontacts_events = function() {
  window.document.addEventListener('success.ready.gc', function()
                                   {
                                     Gcontacts.init(parameters);
                                     window.document.addEventListener('success.login.gc',retrive_groups);
                                     window.document.addEventListener('success.groups.gc',replace_groups);
                                     window.document.addEventListener('success.contacts.gc',replace_contacts);
                                     window.document.addEventListener('fail.contacts.gc',no_contacts_found);
                                     window.document.addEventListener('fail.groups.gc',no_groups_found);
                                     $('.cd-dropdown span:first').on('click', Gcontacts.login);
                                   })
};

