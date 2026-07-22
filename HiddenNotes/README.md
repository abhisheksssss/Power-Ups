# 🗒️ Hidden Notes — Trello Power-Up

A Trello Power-Up that adds a **Hidden Notes** section to every card with a rich text editor and member-based permissions.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `index.html` | Power-Up connector — registers the card-back-section capability |
| `card-back.html` | The Hidden Notes editor shown inside every card |
| `permission.html` | Popup to select which board members can see the notes |
| `no-access.html` | Shown to members who don't have permission |
| `icon.svg` | Power-Up icon shown in Trello UI |

---

## 🚀 How to Deploy & Register

### Step 1 — Host the Files (Free Options)

**Option A: GitHub Pages**
1. Create a new GitHub repository
2. Upload all 5 files to the root
3. Go to Settings → Pages → Source: main branch
4. Your URL: `https://YOUR_USERNAME.github.io/REPO_NAME/`

**Option B: Netlify (Drag & Drop)**
1. Go to [netlify.com](https://netlify.com) → Log in
2. Drag the entire `trello-powerup` folder onto the Netlify dashboard
3. Get your live URL instantly (e.g. `https://abc123.netlify.app/`)

> ⚠️ Must be **HTTPS** — Trello requires it.

---

### Step 2 — Register on Trello

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Click **"Create New Power-Up"**
3. Fill in:
   - **Name:** Hidden Notes
   - **Workspace:** Your workspace
   - **iframe connector URL:** `https://YOUR_URL/index.html`
4. Under **Capabilities**, enable: `card-back-section`
5. Click **Save**

---

### Step 3 — Add to a Board

1. Open any Trello board
2. Click **Power-Ups** (top menu)
3. Search for **"Hidden Notes"** (under your workspace)
4. Click **Add**
5. Open any card → you'll see the **Hidden Notes** section at the bottom!

---

## 🔒 How Permissions Work

- By default (no members selected) → **everyone** on the board can see the notes
- Click **"Change Permission"** → select specific members → **Save**
- Only selected members will see the note content
- Others see a 🔒 "No access" message

---

## ✏️ Rich Text Editor Features

The editor (TinyMCE) supports:
- **Bold**, *Italic*, Underline
- Text color & highlight
- Bullet & numbered lists
- Links & Images
- Tables
- Emoji
- Undo/Redo

---

## 🛠️ Customization Tips

**Change editor height** → In `card-back.html`, edit:
```js
height: 220  // in tinymce.init()
```
And in `index.html`:
```js
height: 320  // in card-back-section return object
```

**Change permission button color** → In `card-back.html`, edit:
```css
background: #f6c042;  /* yellow */
```

**Add more TinyMCE plugins** → In `card-back.html`, add to the `plugins` array.
