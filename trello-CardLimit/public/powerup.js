var BASE_URL = 'https://power-ups-dvon.vercel.app';
var TRELLO_API_KEY = '1bde546d7e6e1918bea4131b50dd462d';
var APP_NAME = 'List Limit Power-Up';
var renameInFlightByListId = {};

function getLimitStatus(cardCount, limit) {
  if (!limit || limit <= 0) return null;
  if (cardCount > limit) return { emoji: '\uD83D\uDD34', color: 'red', label: 'Exceeded' };
  if (cardCount === limit) return { emoji: '\uD83D\uDFE1', color: 'yellow', label: 'At limit' };
  return { emoji: '\uD83D\uDFE2', color: 'green', label: 'Within limit' };
}

function stripLimitSuffix(name) {
  return String(name || '').replace(/\s*(?:\uD83D\uDFE2|\uD83D\uDFE1|\uD83D\uDD34)\s*\(\d+\s*\/\s*\d+\)\s*$/u, '').trim();
}

function buildLimitedListName(name, cardCount, limit) {
  var status = getLimitStatus(cardCount, limit);
  var baseName = stripLimitSuffix(name);
  if (!status) return baseName;
  return baseName + ' ' + status.emoji + ' (' + cardCount + '/' + limit + ')';
}

function renameListWithToken(listId, name, token) {
  var url = 'https://api.trello.com/1/lists/' + encodeURIComponent(listId) +
    '?name=' + encodeURIComponent(name) +
    '&key=' + encodeURIComponent(TRELLO_API_KEY) +
    '&token=' + encodeURIComponent(token);

  console.log('Renaming Trello list:', listId, name);

  return fetch(url, {
    method: 'PUT',
    headers: { 'Accept': 'application/json' }
  }).then(function (response) {
    if (!response.ok) {
      return response.text().then(function (body) {
        throw new Error('Trello rename failed: ' + response.status + ' ' + body);
      });
    }
    return response.json();
  }).then(function (renamedList) {
    console.log('Trello list renamed:', renamedList && renamedList.name);
    return renamedList;
  });
}

function getListLimit(t, listId) {
  return t.get('board', 'shared', 'limit_' + listId)
    .then(function (boardLimit) {
      if (boardLimit) return boardLimit;
      return t.get('list', 'shared', 'limit');
    });
}
function getRestToken(t, shouldAuthorize) {
  return Promise.resolve(t.getRestApi())
    .then(function (client) {
      return Promise.resolve(client.getToken())
        .then(function (token) {
          if (token || !shouldAuthorize) return token;
          return Promise.resolve(client.authorize({ scope: 'read,write', expiration: 'never' }))
            .then(function (authorizedToken) {
              if (authorizedToken) return authorizedToken;
              return Promise.resolve(client.getToken());
            });
        });
    });
}

function syncListTitle(t, list, limit, options) {
  options = options || {};

  // Parse limit — treat 0 / null / undefined as "no limit"
  var lim = (limit != null && limit !== '') ? parseInt(limit, 10) : 0;
  var cardCount = list.cards ? list.cards.length : 0;
  var nextName = buildLimitedListName(list.name, cardCount, lim);

  // Skip if nothing meaningful to rename
  if (!list.id || !nextName) {
    return Promise.resolve();
  }

  // Skip if the resulting name is identical to the current name
  if (nextName === list.name) {
    console.log('Skipping Trello list rename (no change):', list.name);
    return Promise.resolve();
  }

  // Skip if a rename to this exact name is already in-flight
  if (renameInFlightByListId[list.id] === nextName) return Promise.resolve();
  renameInFlightByListId[list.id] = nextName;

  return getRestToken(t, !!options.authorize)
    .then(function (token) {
      if (!token) {
        console.log('Skipping Trello list rename: missing REST token. Authorize the Power-Up first.');
        delete renameInFlightByListId[list.id];
        return null;
      }
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
    return Promise.resolve(t.getRestApi())
      .then(function (client) {
        return Promise.resolve(client.isAuthorized());
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
      url: BASE_URL + '/authorize.html',
      height: 180
    });
  },

  'list-actions': function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return getListLimit(t, list.id)
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
      return getListLimit(t, list.id).then(function (limit) {
        var cardCount = list.cards ? list.cards.length : 0;

        if (!limit || parseInt(limit, 10) <= 0) {
          // No limit set — strip any leftover suffix from the list name
          syncListTitle(t, list, null);
          return [];
        }

        var lim = parseInt(limit, 10);
        var status = getLimitStatus(cardCount, lim);
        var text = cardCount + '/' + lim;

        if (cardCount > lim) {
          text += ' Exceeded';
        } else if (cardCount === lim) {
          text += ' At limit';
        }

        // Sync the list title suffix — do NOT call t.set/t.get here
        // as that would cause an infinite badge refresh loop.
        syncListTitle(t, list, lim);

        return [{ text: text, color: status.color }];
      });
    }).catch(function () {
      return [];
    });
  },

  'card-detail-badges': function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return getListLimit(t, list.id).then(function (limit) {
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
