var BASE_URL = 'https://power-ups-dvon.vercel.app';

const API_KEY = "1bde546d7e6e1918bea4131b50dd462d";

console.log("Set List Limit setUp");



async function getOAuthToken(t) {

    let token = await t.get("member", "private", "oauthToken");

    if (token) {
        return token;
    }

    await t.authorize(
        "https://trello.com/1/authorize?" +
        new URLSearchParams({

            expiration: "never",

            name: "List Capacity Power-Up",

            scope: "read,write",

            response_type: "token",

            key: API_KEY,

            callback_method: "fragment",

            return_url: BASE_URL + "/auth-success.html"

        }).toString()
    );

    token = await t.get("member", "private", "oauthToken");

    return token;
}


async function renameList(listId, listName, count, limit, token) {

    const baseName = listName.replace(
        /\s*[🟢🟡🔴]\s*\(\d+\/\d+\)$/,
        ""
    );

    let dot = "🟢";

    if(count == limit)
        dot = "🟡";

    if(count > limit)
        dot = "🔴";

    const newName = `${baseName} ${dot} (${count}/${limit})`;

    const params = new URLSearchParams({

        key: API_KEY,

        token,

        name: newName

    });

    const response = await fetch(

        `https://api.trello.com/1/lists/${listId}?${params}`,

        {
            method: "PUT"
        }

    );

    return response.json();
}


window.TrelloPowerUp.initialize({



  callback: async function(t){

    const token = await getOAuthToken(t);

    console.log(token);

  },

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
    return t.list('id', 'name', 'cards').then(function (list) {
      return t.get('board', 'shared', 'limit_' + list.id).then(function (limit) {
        if (!limit) return [];
        var cardCount = list.cards ? list.cards.length : 0;
        var lim = parseInt(limit, 10);
        var pct = (cardCount / lim) * 100;
        var text = cardCount + "/" + lim;
        var color = "green";
        if (pct >= 100) {
          color = "red";
          text += " Exceeded";
        } else if (pct >= 70) {
          color = "yellow";
          text += " Nearing";
        }
        
        // --- INSTANT GLOBAL REFRESH TRICK ---
        // When card count changes, trigger a global board update to refresh all cards instantly
        t.get('board', 'private', 'count_' + list.id).then(async function(prevCount) {

  if (prevCount !== cardCount) {

    try {

      // Save new count
      await t.set('board', 'private', 'count_' + list.id, cardCount);

      // Force refresh
      await t.set('board', 'private', 'force_refresh', Date.now());

      // Get OAuth token
      const token = await getOAuthToken(t);

      // Rename list
      await renameList(
        list.id,
        list.name,      // <-- make sure you requested "name" from t.list()
        cardCount,
        lim,
        token
      );

    } catch (err) {
      console.error("Rename list failed:", err);
    }

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
