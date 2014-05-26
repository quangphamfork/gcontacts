Gcontacts
=========

Client-Side tool for handleing oauth2 and retrive contacts using API v3 from Gmail

Try the Demo!
=======
http://eventioz.github.io/gcontacts/

API
===

namespace
--

Right now the namespace is `Gcontacts` and should be
reachable from `window` given the nature of the requests.

Pagination
--

every function takes pagination as an argument.

you could set:
- `limit`: max results per request (default 25)
- `offset`: start request from a certain point (default 1)

every response would come back with `next` and/or `previous` actions to move
between results. Also we attach the total of elements available.

If no pagination is given the default values will be used.

raw
--

Sometimes, the vanilla result that this library produced it's not enough
, don't worry, just sending as last argument `true` will return a
response from the api untouched.

extras
--

For now the only use for this variable is return useful content like the link
of the group that you asked for.

Config
--

In order to get a valid token and consume this API, you would need an App registered on
Google.

Load
--
``` javascript
(function () {
  var gc   = document.createElement('script')
    , s      = document.getElementsByTagName('script')[0]
  gc.type  = 'text/javascript'
  gc.async = true
  gc.src   = '/js/gcontacts.js'
  gc.onload = function () { Gcontacts._ready() };

  s.parentNode.insertBefore(gc, s);

}())

```

Ready
--

when the library is loaded we emmit an event called `success.ready.gc`
avoid depending on third party libraries.

example:

``` javascript
window.document.addEventListener('success.ready.gc', function () {
    // do something with Gcontacts
})

```

Init
--

function: `init`

required arguments:
- config

This argument holds the particular information related with your app in google
user content (https://console.developers.google.com/)

note: an optional parameter could be appended to this object: `redirect_uri`
if this parameter is not provided, the current url will be used.

example:

``` javascript
var config = {
				response_type : 'token',
				client_id     : 'SOME_NUMERIC_ID.apps.googleusercontent.com',
				scope         : 'https://www.google.com/m8/feeds',
				inmediate     : 'true'
			}

Gcontacts.init(config)
```

Login
--

function: `login`

required arguments:
- callback

example:
`Gcontacts.login(callback, href)`

response:

It will trigger an event called `success.login.gc` that you can bind in
order to be notified that the login was a success

Logout
--

function: `logout`

example:
`Gcontacts.logout()`

response: `none`

Contacts
--

function: `contacts`

required arguments:
- callback

example:

`Gcontacts.Contacts(callback, pagination, raw)`

response:

``` javascript
      {
        status: 'success'
        author: {
                  name: 'John Doe',
                  email: 'email@example.com'
                },
        title: "John Doe's contacts",
        pagination: {
                      limit: 25,
                      offset: 26,
                      total: 100,
                      next,
                      previous,
                     },
        data: [
             [0]: {
                    id: "http://www.google.com/m8/feeds/contacts/email%40example.com/base/0",
                    email: [
                            [0]: [
                                  'someContact@example.com',
                                  'otherEmail@example.com'
                                 ]
                           ],
                    name: "Some Contact"
                  }

               ]
      }
```

Contacts from Group
--

function: `contactsFromGroup`

required arguments:
- groupLink
- callback

example:

`Gcontacts.contactsFromGroup(groupLink, callback, pagination, raw)`

response:

``` javascript
      {
        status: 'success'
        author: {
                  name: 'John Doe',
                  email: 'email@example.com'
                },
        title: "John Doe's contacts",
        pagination: {
                      limit: 25,
                      offset: 26,
                      total: 100,
                      next,
                      previous,
                     },
        data: [
             [0]: {
                    id: "http://www.google.com/m8/feeds/contacts/email%40example.com/base/0",
                    email: [
                            [0]: [
                                  'someContact@example.com',
                                  'otherEmail@example.com'
                                 ]
                           ],
                    name: "Some Contact"
                  }

               ]
      }
```

Groups
--

function: `groups`

required arguments:
- callback

example:

`Gcontacts.groups(callback, pagination, raw)`

response:

```javascript
      {
        status: 'success'
        author: {
                  name: 'John Doe',
                  email: email@example.com
                },
        title: 'John Doe's contacts',
        pagination: {
                      limit: 25,
                      offset: 1,
                      total: 30,
                      next
                      previous
                    },
        data: [
                [0]: {
                       id: "http://www.google.com/m8/feeds/groups/email%40example.com/base/162d77938sd212345",
                       name: "Some Group"
                     }
              ]
      }

```

Contrib!
========

first clone the repository
``` bash
# git clone git@github.com:eventioz/gcontacts.git
```

then if you whant to use the examples

``` bash
# git clone -b gh-pages git@github.com:eventioz/gcontacts.git examples/
```

and you are good to go!
