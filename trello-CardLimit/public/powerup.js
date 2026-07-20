var BASE_URL = 'https://power-ups-dvon.vercel.app';
var TRELLO_API_KEY = '1bde546d7e6e1918bea4131b50dd462d';
var APP_NAME = 'List Limit Power-Up';
var renameInFlightByListId = {};

function getLimitStatus(cardCount, limit) {
  if (!limit || limit <= 0) return null;
  if (cardCount > limit) return { emoji: '🔴', color: 'red', label: 'Exceeded' };
  if (cardCount === limit) return { emoji: '🟡', color: 'yellow', label: 'At limit' };
  return { emoji: '🟢', color: 'green', label: 'Within limit' };
}

function stripLimitSuffix(name) {
  return String(name || '').replace(/\s*[🟢🟡🔴]\s*\(\d+\s*\/\s*\d+\)\s*$/u, '').trim();
}

function buildLimitedListName(name, cardCount, limit) {
  var status = getLimitStatus(cardCount, limit);
  var baseName = stripLimitSuffix(name);
  if (!status) return baseName;
  return baseName + ' ' + status.emoji + ' (' + cardCount + '/' + limit + ')';
}

function renameListWithToken(listId, name, token) {
  var url = 'https://api.trello.com/1/lists/' + encodeURIComponent(listId) +
    '?key=' + encodeURIComponent(TRELLO_API_KEY) +
    '&token=' + encodeURIComponent(token);

  return fetch(url, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: name })
  }).then(function (response) {
    if (!response.ok) {
      return response.text().then(function (body) {
        throw new Error('Trello rename failed: ' + response.status + ' ' + body);
      });
    }
    return response.json();
  });
}

function syncListTitle(t, list, limit, options) {
  options = options || {};

  var lim = parseInt(limit, 10);
  var cardCount = list.cards ? list.cards.length : 0;
  var nextName = buildLimitedListName(list.name, cardCount, lim);

  if (!nextName || nextName === list.name) return Promise.resolve();
  if (renameInFlightByListId[list.id] === nextName) return Promise.resolve();
  renameInFlightByListId[list.id] = nextName;

  return t.getRestApi()
    .then(function (client) {
      if (options.authorize) {
        return client.getToken().then(function (token) {
          if (token) return token;
          return client.authorize({ scope: 'read,write', expiration: 'never' });
        });
      }
      return client.getToken();
    })
    .then(function (token) {
      if (!token) return null;
      return renameListWithToken(list.id, nextName, token);
    })
    .catch(function (err) {
      console.error('Unable to sync list title', err);
    })
    .then(function () {
      if (renameInFlightByListId[list.id] === nextName) {
        delete renameInFlightByListId[list.id];
      }
    });
}

console.log('Set List Limit setup');

window.TrelloPowerUp.initialize({
  'authorization-status': function (t) {
    return t.getRestApi()
      .then(function (client) {
        return client.isAuthorized();
      })
      .then(function (authorized) {
        return { authorized: authorized };
      })
      .catch(function () {
        return { authorized: false };
      });
  },

  'show-authorization': function (t) {
    return t.popup({
      title: 'Authorize List Rename',
      url: BASE_URL + '/list-settings.html',
      height: 380
    });
  },

  'list-actions': function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id)
        .then(function (limit) {
          var cardCount = list.cards ? list.cards.length : 0;
          var lim = parseInt(limit, 10);

          syncListTitle(t, list, limit);

          return [{
            text: 'Set Card Limit',
            callback: function (t) {
              if (!limit) {
                return t.popup({
                  title: 'Set Card Limit',
                  url: BASE_URL + '/list-settings.html',
                  height: 380
                });
              }
              if (cardCount > lim) {
                return t.popup({
                  title: 'Capacity Exceeded',
                  url: BASE_URL + '/warning-popup.html?listId=' + encodeURIComponent(list.id),
                  height: 380
                });
              }
              return t.popup({
                title: 'Set Card Limit',
                url: BASE_URL + '/list-settings.html',
                height: 380
              });
            }
          }];
        });
    }).catch(function (err) {
      console.error(err);
      return [{
        text: 'Set Card Limit',
        callback: function (t) {
          return t.popup({
            title: 'Set Card Limit',
            url: BASE_URL + '/list-settings.html',
            height: 380
          });
        }
      }];
    });
  },

  'card-badges': function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        if (!limit) {
          syncListTitle(t, list, 0);
          return [];
        }

        var cardCount = list.cards ? list.cards.length : 0;
        var lim = parseInt(limit, 10);
        var status = getLimitStatus(cardCount, lim);
        var text = cardCount + '/' + lim;

        if (cardCount > lim) {
          text += ' Exceeded';
        } else if (cardCount === lim) {
          text += ' At limit';
        }

        syncListTitle(t, list, lim);

        t.get('board', 'private', 'count_' + list.id).then(function (prevCount) {
          if (prevCount !== cardCount) {
            t.set('board', 'private', 'count_' + list.id, cardCount).then(function () {
              t.set('board', 'private', 'force_refresh', Date.now());
            });
          }
        });

        return [{ text: text, color: status.color }];
      });
    }).catch(function () {
      return [];
    });
  },

  'card-detail-badges': function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        if (!limit) return [];
        var cardCount = list.cards ? list.cards.length : 0;
        var lim = parseInt(limit, 10);

        syncListTitle(t, list, lim);

        if (cardCount > lim) {
          return [{
            title: 'List Capacity',
            text: 'Exceeded! (' + cardCount + '/' + lim + ')',
            color: 'red',
            callback: function (t) {
              return t.popup({
                title: 'Capacity Exceeded',
                url: BASE_URL + '/warning-popup.html',
                height: 380
              });
            }
          }];
        }
        return [];
      });
    }).catch(function () {
      return [];
    });
  }
}, {
  appKey: TRELLO_API_KEY,
  appName: APP_NAME
});
