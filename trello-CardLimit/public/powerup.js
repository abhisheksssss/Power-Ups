var BASE_URL = 'https://power-ups-dvon.vercel.app';

const API_KEY = "1bde546d7e6e1918bea4131b50dd462d";

console.log("Set List Limit setUp");

// ─── Per-list in-flight lock to prevent concurrent renames ──────────────────
// Keyed by listId → true/false
const _renameInFlight = {};

window.addEventListener("message", async (event) => {
    if (event.data.type !== "trello-oauth") return;
    const t = window.TrelloPowerUp.iframe();
    await t.set("member", "private", "oauthToken", event.data.token);
});

async function getOAuthToken(t) {
    let token = await t.get("member", "private", "oauthToken");
    if (token) return token;
    return t.authorize(
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
}

/**
 * Renames a Trello list to show the current count and limit.
 * Strips any previously appended emoji + count suffix first so the
 * base name is never duplicated.
 *
 * Examples:
 *   "To Do"            → "To Do 🟢 (2/4)"
 *   "To Do 🟢 (2/4)"  → "To Do 🟡 (4/4)"  (idempotent strip + re-apply)
 */
async function renameList(listId, listName, count, limit, token) {
    // Strip any previously appended suffix: optional space, emoji, space, (N/N)
    const baseName = listName.replace(
        /\s*[🟢🟡🔴]\s*\(\d+\/\d+\)$/u,
        ""
    ).trimEnd();

    let dot = "🟢";
    if (count >= limit) dot = "🟡";  // at capacity — yellow
    if (count > limit)  dot = "🔴";  // over capacity — red

    const newName = `${baseName} ${dot} (${count}/${limit})`;

    // Skip the API call if nothing would actually change
    if (newName === listName) return;

    const params = new URLSearchParams({ key: API_KEY, token, name: newName });
    const response = await fetch(
        `https://api.trello.com/1/lists/${listId}?${params}`,
        { method: "PUT" }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

/**
 * Central function called from card-badges.
 * Checks whether the count has changed since the last rename, and if so,
 * fires renameList — but only once at a time per list (in-flight lock).
 */
async function maybeRenameList(t, list, cardCount, lim) {
    const listId = list.id;

    // Bail out early if a rename for this list is already in progress
    if (_renameInFlight[listId]) return;

    try {
        const prevCountRaw = await t.get("board", "private", "count_" + listId);

        // Coerce both sides to string for a safe, type-agnostic comparison
        if (String(prevCountRaw) === String(cardCount)) return;

        // Acquire lock
        _renameInFlight[listId] = true;

        // Persist the new count first so concurrent badge renders bail immediately
        await t.set("board", "private", "count_" + listId, String(cardCount));

        const token = await t.get("member", "private", "oauthToken");
        if (!token) return; // user hasn't authorised yet — silent bail

        await renameList(listId, list.name, cardCount, lim, token);

    } catch (err) {
        console.error("renameList failed:", err);
    } finally {
        // Always release the lock
        _renameInFlight[listId] = false;
    }
}


window.TrelloPowerUp.initialize({

    // ─── LIST ACTIONS: "Set Card Limit" in the … menu ─────────────────────
    "list-actions": function (t) {
        // We only need the list id here — card count and limit are re-fetched
        // fresh inside the callback so they're never stale when the user clicks.
        return t.list("id").then(function (list) {
            return [{
                text: "Set Card Limit",
                callback: async function (t) {

                    // 1. Ensure the user has authorised.
                    // We CANNOT await t.authorize() because Trello capability 
                    // callbacks have a strict 5-second timeout. Waiting for user 
                    // interaction will cause it to crash with "IFrameIO request timed out".
                    let token = await t.get("member", "private", "oauthToken");
                    if (!token) {
                        getOAuthToken(t); // Fire auth flow in background
                        return; // Resolve immediately to avoid timeout
                    }

                    // 2. Re-fetch live data at click time (not stale render data).
                    const [freshList, freshLimit] = await Promise.all([
                        t.list("id", "cards"),
                        t.get("board", "shared", "limit_" + list.id)
                    ]);

                    const cardCount = freshList.cards ? freshList.cards.length : 0;

                    // 3. No limit set yet → open settings unconditionally.
                    if (!freshLimit) {
                        return t.popup({
                            title: "Set Card Limit",
                            url: BASE_URL + "/list-settings.html",
                            height: 380
                        });
                    }

                    const lim = parseInt(freshLimit, 10);

                    // 4. Limit exceeded → show warning first.
                    if (cardCount >= lim) {
                        return t.popup({
                            title: "⚠ Capacity Exceeded",
                            url: BASE_URL +
                                "/warning-popup.html?listId=" +
                                encodeURIComponent(list.id),
                            height: 380
                        });
                    }

                    // 5. Under limit → open settings normally.
                    return t.popup({
                        title: "Set Card Limit",
                        url: BASE_URL + "/list-settings.html",
                        height: 380
                    });
                }
            }];
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

    // ─── CARD BADGES: shows limit status on each card ─────────────────────
    // NOTE: card-badges fires once per card. The rename logic is guarded by
    // an in-flight lock (see maybeRenameList) so only one rename runs at a
    // time no matter how many cards are in the list.
    "card-badges": function (t) {
        return t.list("id", "name", "cards").then(function (list) {
            return t.get("board", "shared", "limit_" + list.id).then(function (limit) {

                if (!limit) return [];

                var cardCount = list.cards ? list.cards.length : 0;
                var lim       = parseInt(limit, 10);
                var pct       = (cardCount / lim) * 100;

                // Build the badge shown on every card in this list
                var text  = cardCount + "/" + lim;
                var color = "green";

                if (pct >= 100) {
                    color  = "red";
                    text  += " Exceeded";
                } else if (pct >= 70) {
                    color  = "yellow";
                    text  += " Nearing";
                }

                // Trigger list rename in the background — fire-and-forget.
                // The in-flight lock inside maybeRenameList ensures only one
                // concurrent rename runs per list, regardless of how many
                // card-badges calls happen simultaneously.
                maybeRenameList(t, list, cardCount, lim);

                return [{ text: text, color: color }];

            });
        }).catch(function () { return []; });
    },

    // ─── CARD DETAIL BADGES: badge on open card when limit exceeded ────────
    "card-detail-badges": function (t) {
        return t.list("id", "cards").then(function (list) {
            return t.get("board", "shared", "limit_" + list.id).then(function (limit) {

                if (!limit) return [];

                var cardCount = list.cards ? list.cards.length : 0;
                var lim       = parseInt(limit, 10);

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