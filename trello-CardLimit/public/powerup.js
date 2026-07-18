var BASE_URL = 'https://power-ups-dvon.vercel.app';

console.log("Set List Limit setUp");

window.TrelloPowerUp.initialize({

  // ─── LIST ACTIONS: "Set Card Limit" in the … menu ──────────────────────────
  "list-actions": function (t) {

  return t.list("id", "cards").then(function (list) {

    return t.get("board", "shared", "limit_" + list.id)
      .then(function (limit) {

        var cardCount = list.cards ? list.cards.length : 0;

        return [{
          text: "Set Card Limit",
          callback: function (t) {

            // No limit set → Open settings
            if (!limit) {
              return t.popup({
                title: "Set Card Limit",
                url: BASE_URL + "/list-settings.html",
                height: 380
              });
            }

            var lim = parseInt(limit, 10);

            // Limit exceeded → Show warning first
            if (cardCount >= lim) {
              return t.popup({
                title: "⚠ Capacity Exceeded",
                url: BASE_URL +
                  "/warning-popup.html?listId=" +
                  encodeURIComponent(list.id),
                height: 380
              });
            }

            // Otherwise open settings
            return t.popup({
              title: "Set Card Limit",
              url: BASE_URL + "/list-settings.html",
              height: 380
            });

          }
        }];

      });

  }).catch(function (err) {

    console.error(err);

    return [{
      text: "Set Card Limit",
      callback: function (t) {
        return t.popup({
          title: "Set Card Limit",
          url: BASE_URL + "/list-settings.html",
          height: 380
        });
      }
    }];

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
        var text = cardCount + "/" + lim;
        if (pct >= 100) {
          color = "red";
          text += " Exceeded";
        } else if (pct >= 70) {
          color = "yellow";
          text += " Nearing";
        } else if(pct<70){
          color = "green";
        }
        
        // --- INSTANT GLOBAL REFRESH TRICK ---
        // When card count changes, trigger a global board update to refresh all cards instantly
        t.get('board', 'private', 'count_' + list.id).then(function(prevCount) {
          if (prevCount !== cardCount) {
            t.set('board', 'private', 'count_' + list.id, cardCount).then(function() {
              t.set('board', 'private', 'force_refresh', Date.now());
            });
          }
        });
        
        return [{ text: text, color: color }];
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
