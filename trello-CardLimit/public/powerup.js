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

  // ─── LIST BADGES: shows counter in list header (if supported) & handles auto-alerts ─
  "list-badges": function (t) {
    return t.list('id', 'name', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        if (!limit) {
          return [{ text: 'No limit', color: null, refresh: 60 }];
        }
        var cardCount = list.cards ? list.cards.length : 0;
        var lim = parseInt(limit, 10);
        var pct = (cardCount / lim) * 100;
        var color = "green";
        if (pct >= 100) color = "red";
        else if (pct >= 70) color = "yellow";
        
        // --- AUTO-POPUP TRACKING LOGIC ---
        // We use 'private' scope so this tracking is local to the current user
        t.get('board', 'private', 'violation_' + list.id).then(function(hasWarned) {
          if (cardCount > lim) {
            if (!hasWarned) {
              // Trigger modal automatically and set flag to prevent loop
              t.modal({
                title: "Capacity Exceeded!",
                url: BASE_URL + "/warning-popup.html",
                height: 380,
                fullscreen: false
              });
              t.set('board', 'private', 'violation_' + list.id, true);
            }
          } else {
            // Back under limit, reset the flag so they get warned next time it violates
            if (hasWarned) {
              t.remove('board', 'private', 'violation_' + list.id);
            }
          }
        }).catch(function(err) {
          console.error("Violation tracking error:", err);
        });

        return [{
          text: cardCount + " / " + lim,
          color: color,
          refresh: 10
        }];
      });
    }).catch(function () { return []; });
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
