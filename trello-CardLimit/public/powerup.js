var BASE_URL = 'https://power-ups-dvon.vercel.app';

console.log("Set List Limit setUp");

window.TrelloPowerUp.initialize({

  // ─── LIST ACTIONS: "Set Card Limit" in the … menu ──────────────────────────
  "list-actions": function (t) {
    console.log("LIST ACTIONS CALLED");

    // Use promise to check limit, but always return at least the Set Card Limit action
    return t.list('id', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        var cardCount = list.cards ? list.cards.length : 0;

        var actions = [
          {
            text: "Set Card Limit",
            callback: function (t) {
              return t.popup({
                title: "Set List Limit",
                url: BASE_URL + "/list-settings.html",
                height: 380
              });
            }
          }
        ];

        return actions;
      });
    }).catch(function (err) {
      console.error("list-actions error:", err);
      // Fallback: always show the basic button
      return [
        {
          text: "Set Card Limit",
          callback: function (t) {
            return t.popup({
              title: "Set List Limit",
              url: BASE_URL + "/list-settings.html",
              height: 280
            });
          }
        }
      ];
    });
  },

  // ─── CARD BADGES: shows limit status on each card ──────────────────────────
  "card-badges": function (t) {
    return t.list('id', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        if (!limit) return [];
        var cardCount = list.cards ? list.cards.length : 0;
        var lim = parseInt(limit, 10);
        var pct = (cardCount / lim) * 100;
        if (pct >= 100) {
          return [{ text: cardCount + "/" + lim + " Exceeded", color: "red" }];
        } else if (pct >= 70) {
          return [{ text: cardCount + "/" + lim + " Nearing", color: "yellow" }];
        }
        return [{ text: cardCount + "/" + lim, color: "green" }];
      });
    }).catch(function () { return []; });
  },

  // ─── CARD DETAIL BADGES: badge on open card when limit exceeded ─────────────
  "card-detail-badges": function (t) {
    return t.list('id', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        if (!limit) return [];
        var cardCount = list.cards ? list.cards.length : 0;
        var lim = parseInt(limit, 10);
        if (cardCount >= lim) {
          return [{
            title: "List Capacity",
            text: "Exceeded! (" + cardCount + "/" + lim + ")",
            color: "red",
            callback: function (t) {
              return t.popup({
                title: "Capacity Exceeded",
                url: BASE_URL + "/warning-popup.html",
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
