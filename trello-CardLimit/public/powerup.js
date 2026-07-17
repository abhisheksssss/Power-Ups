var BASE_URL = 'https://power-ups-dvon.vercel.app';

window.TrelloPowerUp.initialize({

  'list-actions': function (t) {
    // t.get('list', ...) is the correct scope — NOT t.get(list.id, ...)
    return t.get('list', 'shared', 'limit').then(function(limit) {
      return t.list('id', 'cards').then(function(list) {
        var cardCount = list.cards.length;
        var actions = [{
          text: 'Set List Limit',
          callback: function (t) {
            return t.popup({
              title: 'Set List Limit',
              url: BASE_URL + '/index.html?page=list-settings',
              height: 280
            });
          }
        }];

        if (limit && cardCount > limit) {
          actions.unshift({
            text: '⚠️ Capacity Exceeded',
            callback: function (t) {
              return t.popup({
                title: 'Warning',
                url: BASE_URL + '/index.html?page=warning-popup',
                height: 380
              });
            }
          });
        }
        return actions;
      });
    });
  },

  'card-badges': function (t) {
    return t.get('list', 'shared', 'limit').then(function(limit) {
      if (!limit) return [];
      return t.list('id', 'cards').then(function(list) {
        var cardCount = list.cards.length;
        var percentage = limit > 0 ? (cardCount / limit) * 100 : 0;

        if (percentage >= 100) {
          return [{ text: cardCount + '/' + limit + ' Limit Exceeded', color: 'red' }];
        } else if (percentage >= 70) {
          return [{ text: cardCount + '/' + limit + ' Nearing Limit', color: 'yellow' }];
        } else {
          return [{ text: cardCount + '/' + limit + ' Cards', color: 'green' }];
        }
      });
    });
  },

  'card-detail-badges': function (t) {
    return t.get('list', 'shared', 'limit').then(function(limit) {
      if (!limit) return [];
      return t.list('id', 'cards').then(function(list) {
        if (list.cards.length > limit) {
          return [{
            title: 'List Capacity',
            text: 'Exceeded!',
            color: 'red',
            callback: function(t) {
              return t.popup({
                title: 'Warning',
                url: BASE_URL + '/index.html?page=warning-popup',
                height: 380
              });
            }
          }];
        }
        return [];
      });
    });
  }
});
