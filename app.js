var
  util = require('util'),
  Browser = require('zombie'),
  express = require('express'),
  googleapis = require('googleapis'),
  settings = {
    server: {
      hostname: 'mktgdept.com',
      port: '5555'
    },
    google: {
      client_id: '000000000000.apps.googleusercontent.com',
      client_secret: 'bbbbbbbbbbbbbbbbbbbbbbbb'
    },
    intrust: {
      username: 'username',
      password: 'password'
    }
  },
  template = function(accounts) {
    var rows = [];
    accounts.forEach(function(account) {
      rows.push('<tr><td>' + account[0] + '</td><td class="align-right">$' + account[1] + '</td></tr>');
    });
    return '<article><section><table class="text-auto-size"><tbody>' + rows.join('') + '</tbody></table></section><footer><p class="yellow">INTRUST Bank</p></footer></article>';
  },
  OAuth2Client = googleapis.OAuth2Client,
  oauth2Client,
  app = express(),
  loginThen = function(callback) {
    Browser.visit('https://cibng.ibanking-services.com/EamWeb/Account/Login.aspx?brand=784_101100029&orgId=784_101100029&FIFID=101100029&appId=CeB&FIORG=784', { debug: false }, function(e, browser) {
      browser
        .fill('#_textBoxUserId', settings.intrust.username)
        .pressButton('#_buttonContinue', function() {
          browser.pressButton('#_buttonLogin', function() {
            browser
              .fill('#_textBoxPassword', settings.intrust.password)
              .pressButton('#_buttonSignIn', function() {
                browser.fire('form', 'submit', function() {
                  browser.fire('form', 'submit', function() {
                    callback(browser);
                  });
                });
              });
          });
        });
    });
  },
  updateAccounts = function(callback) {
    loginThen(function(browser) {
      var accounts = [];
      browser.queryAll('#DP_Expanded tr').forEach(function(row) {
        var cols = browser.queryAll('td', row);
        accounts.push([browser.text(browser.query('a', cols[1])), browser.text(cols[3])]);
      });
      callback(accounts);
    });
  };

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) {
  if(!oauth2Client || !oauth2Client.credentials) {
    oauth2Client = new OAuth2Client(settings.google.client_id, settings.google.client_secret, 'http://' + settings.server.hostname + ':' + settings.server.port + '/oauth2callback');
    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'offline',
      approval_prompt: 'force',
      scope: [
        'https://www.googleapis.com/auth/glass.timeline',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
    }));
  }
  else {
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.subscriptions.insert({
        callbackUrl: 'https://mirrornotifications.appspot.com/forward?url=http://' + settings.server.hostname + ':' + settings.server.port + '/subcallback',
        collection: 'timeline'
      }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.subscriptions.insert', util.inspect(result));
      });
      updateAccounts(function(accounts) {
        client.mirror.timeline.insert({
          html: template(accounts),
          menuItems: [
            {
              id: 'refresh',
              action: 'CUSTOM',
              values: [
                {
                  displayName: 'Refresh',
                  iconUrl: 'http://' + settings.server.hostname + ':' + settings.server.port + '/refresh.png'
                }
              ]
            },
            {
              action: 'TOGGLE_PINNED'
            },
            {
              action: 'DELETE'
            }
          ]
        }).withAuthClient(oauth2Client).execute(function(err, result) {
          console.log('mirror.timeline.insert', util.inspect(result));
        });
      });
    });
    res.send(200);
  }
});

app.get('/oauth2callback', function(req, res) {
  if(!oauth2Client) {
    res.redirect('/');
  }
  else {
    oauth2Client.getToken(req.query.code, function(err, tokens) {
      oauth2Client.credentials = tokens;
      res.redirect('/');
    });
  }
});

app.post('/subcallback', function(req, res) {
  res.send(200);
  console.log('/subcallback', util.inspect(req.body));
  if(req.body.operation == 'UPDATE' && req.body.userActions[0].type == 'CUSTOM')
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      updateAccounts(function(accounts) {
        client.mirror.timeline.patch({
          id: req.body.itemId
        }, {
          html: template(accounts)
        }).withAuthClient(oauth2Client).execute(function(err, result) {
          console.log('mirror.timeline.patch', util.inspect(result));
        });
      });
    });
});

app.listen(settings.server.port);
