var tradeOf = function(select) {
  $('.cd-dropdown').replaceWith(select);
  $('#dropdown').dropdown(random_dropdownEffect());
  setTimeout(function() {
    $('.cd-dropdown span:first').trigger('mousedown.dropdown');
  }, 250);
  $('ul').off('opened.click.dropdown');
  spinner.stop();

};

var goBackFromGroups = function(e) {
  spinner.spin($('.cd-dropdown span:first')[0]);
  (e.value == 'from_contacts')
    ? Gcontacts.groups(replaceGroups)
    : Gcontacts.contactsFromGroup(e.value, replaceContacts());
};

var retriveGroups = function (e) {
  var $dropdown = $('.cd-dropdown span:first')

  $dropdown.off('click')
  spinner.spin($dropdown[0])
  Gcontacts.groups(replaceGroups)
};

var goBackFromContacts = function (title) {

  return function (e) {
    var $dropdown = $('.cd-dropdown span:first')

      $dropdown.text(title);
      spinner.spin($dropdown[0]);

      Gcontacts.contactsFromGroup(e.value, replaceContacts(title));

  }

}

var retriveContactInfo = function (backTitle, backLink) {
  return function (e) {
    var $dropdown = $('.cd-dropdown span:first')
    switch (e.value) {
      case (/^http:/).test(e.value):
        spinner.spin($dropdown[0]);
      Gcontacts.contact_byGroup(e.value);
      break;
      case 'groups':
        spinner.spin($dropdown);
      Gcontacts.groups(replaceGroups);
      break;
      default:
        var addresses = (typeof (e.value) == 'string') ? e.value.split(' ') : []
          , select    = createElement()
          , title     = $(e.target).find('span:first').text()

        select.options.add(new Option(title, - 1));

        if (addresses.length < 2 && ! addresses[0])
          select.options.add(new Option('no info about him/her yet', - 2));
        else
          for (var i = 0, content; content = addresses[i++];)
            select.options.add(new Option(content, i))

        select.options.add(new Option('go back!', backLink));
        tradeOf(select);
        $('ul').on('opened.click.dropdown', goBackFromContacts(backTitle));
        break;
    }
  }
}

var scrapContactContent = function (data, onBlank) {
  var contacts = []
  for (var i = 0, label; label = data[i++];) {
    var emails = [];
    if ( label.emails  && label.emails.length)
      for (var j = 0, email, name; email = label.emails[j++];) {
        emails.push(email.address)

        name = label.name.length < 20 ? label.name : [label.name.slice(0, 20), '...'].join('');
      }
      contacts.push({name: name, email: emails})
  }
  return contacts
}
var replaceContacts = function (backTitle) {
  return function (e) {
    var $dropdown = $('.cd-dropdown span:first')
      , title     = backTitle || $dropdown.text()
      , data      = e.data
      , select    = createElement()

    select.options.add(new Option(title, - 1));

    if (!data)
      return noContactsFound()

    var contacts = scrapContactContent(data)

    for (var i = 0, contact; contact = contacts[i++];)
      select.options.add(new Option(contact.name, contact.email.join(' ')));

    select.options.add(new Option('back', 'groups'))
    tradeOf(select);
    $('ul').on('opened.click.dropdown', retriveContactInfo(title, e.extras.groupLink));
  }
}

var replaceGroups = function (e) {
  var data   = e.data
    , select = createElement()
    , title  = (e.title.length < 20)
               ? e.title
               : [e.title.slice(0, 20), '...'].join('')

  select.options.add(new Option(title, - 1))

  for (var i = 0, label, name; label = data[i]; i++) {
    name = (label.name.length < 20)
           ? label.name
           : [label.name.slice(0, 20), '...'].join('')

    select.options.add(new Option(label.name, label.id));
  }

  tradeOf(select);

  $('ul').on('opened.click.dropdown', goBackFromGroups);
};

var createElement = function () {
  var select = document.createElement('select');
  select.id = 'dropdown';
  return select;
};

var noGroupsFound = function (e) {
  var select = createElement();
  select.options.add(new Option(e.title, - 1));
  select.options.add(new Option('no groups, try again later!', '2'));
  tradeOf(select);
  $('ul').on('opened.click.dropdown', retriveGroups);
}

var noContactsFound = function (e) {
  var select = createElement()
    , title  = $('.cd-dropdown span:first').text()

  select.options.add(new Option(title, - 1));
  select.options.add(new Option('no contacts here!', '1'));
  select.options.add(new Option('go back!', 'groups'));

  tradeOf(select);

  $('ul').on('opened.click.dropdown', retriveGroups);
  }

var random_dropdownEffect = function () {
  var index = Math.floor( Math.random() * dropEffects.length );
  return dropEffects[index];
}

var loadGcontacts = function () {
  var gc   = document.createElement('script')
  var s    = document.getElementsByTagName('script')[0]
  gc.type  = 'text/javascript'
  gc.async = true
  gc.src   = (/^gcontacts.info/).test( window.location.host || window.location.hostname )
             ? '../src/gcontacts.js'
             : '//rawgit.com/eventioz/gcontacts/master/src/gcontacts.js'

  gc.onload = function () { Gcontacts._ready() };
  s.parentNode.insertBefore(gc, s);
};

var retriveAllContacts = function () {
  var pagination = {}
    , limit      = 15
    , $ul        = $('.list ul')
    , process    = function (e) {
        var contacts    = scrapContactContent(e.data)
          , rawTemplate = document.getElementById('contact').innerHTML
          , template    = Handlebars.compile(rawTemplate)

        if ('pagination' in e)
          pagination = e.pagination

        $ul.nearBottom({ callback: pagination.next(process), pixelsFromBottom: 3})

        $ul.append(template(contacts))
    }

  if ('total' in pagination) return

  Gcontacts.contacts(process, {limit: limit})

  Handlebars.registerHelper('ifBlank', function(email) {
    return this.email.length ? this.email.join() :  'no emails found'
  });
}

var login = function (callback) {
  return function () {
    Gcontacts.login(callback)
  }
}

var bindGcontactsEvents = function () {
  window.document.addEventListener('success.ready.gc', function () {
                                     Gcontacts.init(parameters);
                                     $('.cd-dropdown span:first').on('click', login(retriveGroups));
                                     $('.list h3:first').on('click', login(retriveAllContacts));

                                   })
};
