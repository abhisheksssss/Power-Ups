window.TrelloPowerUp.initialize({
  'list-badges': function (t, opts) {
    return t.list('id', 'name', 'cards')
      .then(function (list) {
        return t.get(list.id, 'shared', 'limit')
          .then(function (limit) {
            if (!limit) return [];
            
            const cardCount = list.cards.length;
            const percentage = limit > 0 ? (cardCount / limit) * 100 : 0;
            let color = 'green';
            if (percentage >= 100) {
              color = 'red';
            } else if (percentage >= 70) {
              color = 'yellow';
            } else {
              color = 'green';
            }

            return [{
              text: `${cardCount} / ${limit}`,
              color: color
            }];
          });
      });
  },
  'list-actions': function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return t.get(list.id, 'shared', 'limit').then(function(limit) {
        var actions = [{
          text: 'Set List Limit',
          callback: function (t) {
            return t.popup({
              title: 'Set List Limit',
              url: '/index.html?page=list-settings',
              height: 280
            });
          }
        }];
        
        if (limit && list.cards.length > limit) {
          actions.unshift({
            text: '⚠️ Capacity Exceeded',
            callback: function (t) {
              return t.popup({
                title: 'Warning',
                url: '/index.html?page=warning-popup',
                height: 380
              });
            }
          });
        }
        return actions;
      });
    });
  },
  'card-badges': function (t, opts) {
    return t.list('id', 'cards').then(function(list) {
      return t.get(list.id, 'shared', 'limit').then(function(limit) {
        if (limit && list.cards.length > limit) {
          return [{
            text: 'Limit Exceeded',
            color: 'red'
          }];
        }
        return [];
      });
    });
  },
  'card-detail-badges': function (t, opts) {
    return t.list('id', 'cards').then(function(list) {
      return t.get(list.id, 'shared', 'limit').then(function(limit) {
        if (limit && list.cards.length > limit) {
          return [{
            title: 'List Capacity',
            text: 'Exceeded!',
            color: 'red',
            callback: function(t) {
              return t.popup({
                title: 'Warning',
                url: '/index.html?page=warning-popup',
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
