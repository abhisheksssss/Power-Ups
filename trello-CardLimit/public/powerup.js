var BASE_URL = 'https://power-ups-dvon.vercel.app';

window.TrelloPowerUp.initialize({

  // ─── LIST ACTIONS: "Set Card Limit" in the … menu ─────────────────────────
  'list-actions': function (t) {
    return t.list('id', 'cards').then(function (list) {
      return t.get('list', 'shared', 'limit').then(function (limit) {
        var cardCount = list.cards ? list.cards.length : 0;
        var actions = [{
          text: 'Set Card Limit',
          callback: function (t) {
            return t.popup({
              title: 'Set List Limit',
              url: BASE_URL + '/list-settings.html',
              height: 280
            });
          }
        }];

        if (limit && cardCount >= limit) {
          actions.unshift({
            text: '⚠️ List Capacity Exceeded!',
            callback: function (t) {
              return t.popup({
                title: 'Capacity Exceeded',
                url: BASE_URL + '/warning-popup.html',
                height: 380
              });
            }
          });
        }
        return actions;
      }).catch(function () {
        // Always show the Set Card Limit button even if get fails
        return [{
          text: 'Set Card Limit',
          callback: function (t) {
            return t.popup({
              title: 'Set List Limit',
              url: BASE_URL + '/list-settings.html',
              height: 280
            });
          }
        }];
      });
    }).catch(function () { return []; });
  },

  // ─── CARD BADGES: limit status on each card ───────────────────────────────
  'card-badges': function (t) {
    return t.get('list', 'shared', 'limit').then(function (limit) {
      if (!limit) return [];
      return t.list('id', 'cards').then(function (list) {
        var cardCount = list.cards ? list.cards.length : 0;
        var percentage = (cardCount / limit) * 100;
        if (percentage >= 100) {
          return [{ text: cardCount + '/' + limit + ' Exceeded', color: 'red' }];
        } else if (percentage >= 70) {
          return [{ text: cardCount + '/' + limit + ' Nearing', color: 'yellow' }];
        }
        return [{ text: cardCount + '/' + limit, color: 'green' }];
      });
    }).catch(function () { return []; });
  },

  // ─── CARD DETAIL BADGES: badge on card back when limit exceeded ───────────
  'card-detail-badges': function (t) {
    return t.get('list', 'shared', 'limit').then(function (limit) {
      if (!limit) return [];
      return t.list('id', 'cards').then(function (list) {
        var cardCount = list.cards ? list.cards.length : 0;
        if (cardCount >= limit) {
          return [{
            title: 'List Capacity',
            text: 'Exceeded! (' + cardCount + '/' + limit + ')',
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
    }).catch(function () { return []; });
  }

});
