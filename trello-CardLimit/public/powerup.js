var BASE_URL = 'https://power-ups-dvon.vercel.app';

window.TrelloPowerUp.initialize({

  // ─── 1. LIST HEADER BADGE: shows "2/4" with colored dot ────────────────────
  'list-badges': function (t) {
    return t.get('list', 'shared', 'limit').then(function (limit) {
      if (!limit) {
        return [{
          text: 'No limit',
          color: null,
          refresh: 60
        }];
      }
      return t.list('id', 'cards').then(function (list) {
        var cardCount = list.cards ? list.cards.length : 0;
        var percentage = (cardCount / limit) * 100;
        var color = 'green';
        if (percentage >= 100) color = 'red';
        else if (percentage >= 70) color = 'yellow';

        return [{
          text: cardCount + ' / ' + limit,
          color: color,
          refresh: 10
        }];
      });
    }).catch(function () { return []; });
  },

  // ─── 2. LIST ACTIONS: "Set Card Limit" in the … menu ──────────────────────
  'list-actions': function (t) {
    return t.list('id', 'cards').then(function (list) {
      return t.get('list', 'shared', 'limit').then(function (limit) {
        var cardCount = list.cards ? list.cards.length : 0;
        var actions = [{
          text: 'Set Card Limit',
          callback: function (t) {
            return t.popup({
              title: 'Set List Limit',
              url: BASE_URL + '/index.html?page=list-settings',
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
                url: BASE_URL + '/index.html?page=warning-popup',
                height: 380
              });
            }
          });
        }
        return actions;
      }).catch(function () {
        return [{
          text: 'Set Card Limit',
          callback: function (t) {
            return t.popup({
              title: 'Set List Limit',
              url: BASE_URL + '/index.html?page=list-settings',
              height: 280
            });
          }
        }];
      });
    }).catch(function () { return []; });
  },

  // ─── 3. CARD BADGES: show limit status on each card ───────────────────────
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
        return [];
      });
    }).catch(function () { return []; });
  },

  // ─── 4. CARD DETAIL BADGES: badge on card back when exceeded ──────────────
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
                url: BASE_URL + '/index.html?page=warning-popup',
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
