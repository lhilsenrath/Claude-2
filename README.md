# whatsup 💙

**Start online. Meet in person.**

WhatsUp is the bridge between your network and the real world — a mix of
Instagram/LinkedIn profiles, Hinge-style prompts, and a Snap-Maps-style live
map. See who's in your class, who's at the conference, who's 100 yards away…
then actually walk up and say *whats up*.

> Networking and dating have moved almost entirely online. The apps got great
> at connecting profiles and terrible at connecting people. WhatsUp flips it:
> the app is where you *find* someone — the real world is where you *meet* them.

---

## Run the prototype

No build step, no dependencies. Just open it:

```bash
# Option 1: open the file directly
open index.html

# Option 2: serve it (nicer on mobile)
npx serve .        # or: python3 -m http.server 8000
```

The welcome screen renders inside a phone mockup on desktop; once you
**create an account or sign in, the app goes full screen**. Accounts are
remembered in your browser (localStorage) — a real backend for multi-device,
multi-user accounts is the next milestone. All other profiles, chats, and
beacons are fictional demo data (`js/data.js`) while we test.

**Live location:** if you grant the browser location permission, the map
becomes a real OpenStreetMap view (Leaflet, vendored in `vendor/leaflet/`)
centered on where you actually are, with the demo people placed around you.
Decline it and you get the stylized Harvard Square demo map instead.

---

## The five tabs

| Tab | What it does |
|---|---|
| 🏠 **Home** | Feed of updates from people you've *connected* with — photo moments, new Hinge-style prompt answers, and LinkedIn-style work updates. Plus a story row that includes who's nearby right now. |
| 💬 **Chats** | Your conversation hub. Every chat has a 📍 button to suggest meeting IRL — chats here are meant to *end with a meetup*. |
| 🗺️ **Map** (center) | The heart of the app. A live map of Harvard Square with people as profile-picture pins — blue ring = friends, white ring = people you haven't connected with yet. Filter by *Friends*, *Within 100 yds*, *Open to network*, *Open to date*. Tap a pin → see their full profile. Drag to pan. |
| 🧭 **Explore** | Search people, classes, companies, places — **plus the differentiator (below)**. |
| 👤 **You** | Your own profile: photos, prompts, posts, stats, and the privacy controls that make the whole concept viable. |

## The v3 privacy model (the core of the product)

Nobody can browse where you are. There are exactly two ways a person
appears on your map:

1. **They're within 100 yards of you.** You become aware of who's in your
   classroom, your conference, your concert — close enough to walk up to.
   Strangers beyond 100 yds are never shown, so the app can't be used to
   track anyone down.
2. **Mutual friend sharing.** A friend appears beyond 100 yds only if
   *they* share their location with you AND *you* share yours with them —
   toggled per-friend in **You → Friends who can see you**.

Profiles stay searchable (like LinkedIn); locations don't. Plus Ghost
Mode, precise-vs-approximate location, and scan opt-outs.

## The differentiator: Beacons, Hotspots & IRL ✓

The Explore tab is built around three mechanics designed to push people
*off* the app and into the real world:

- **🔆 Beacons** — drop a short, expiring announcement pinned to a place:
  *"Sketching at Blue Bottle til 4 — come say whats up."* Others tap **I'm in**
  and you both know a real-world hello is welcome. Beacons kill the scariest
  part of approaching someone: not knowing if they want to be approached.
- **🔥 Hotspots** — see where people are gathering *right now* (the career
  mixer, the pickup game, the library grind floor) so you go where the
  energy already is.
- **IRL ✓** — connections you've actually met in person (verified by
  proximity) get a green **IRL ✓** badge, and your profile shows an
  **IRL meets** counter. The flex isn't followers — it's how many of your
  connections are real.

## Privacy is the product

Location sharing only works if people feel safe. Built into the prototype:

- **👻 Ghost Mode** — one tap on the map and you vanish instantly
- **🎯 Precise vs. approximate** — friends-only precision; everyone else sees neighborhood-level
- **🏫 Class & event scan opt-in** — you choose whether classmates/attendees can find you
- **🌙 Quiet hours** — auto-ghost overnight
- Visibility tiers (Everyone / Connections / Nobody), blocking, and hiding

The anti-addiction stance is deliberate, too: no infinite scroll, the feed
literally ends ("now go say whats up to one of them"), and the design is
clean white/grey/black with one accent color — **#00ADEF**.

## Project structure

```
index.html        app shell + tab bar
css/styles.css    all styling (palette, components, map, profiles)
js/data.js        fictional demo people, beacons, hotspots, chats
js/app.js         rendering + interactions (vanilla JS, no framework)
```

## Roadmap ideas (v0.2+)

- Beacon & post composers, profile editor
- Real map tiles (Mapbox/MapLibre) + real geolocation with the permission flow
- Proximity-verified IRL handshake (BLE / ultra-wideband)
- Class rosters via .edu verification; event mode via QR check-in
- Mutual-visibility rules (you only appear to people who appear to you)
- React Native / Expo port for app-store distribution
