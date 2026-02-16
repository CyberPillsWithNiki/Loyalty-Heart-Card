# Heart Card PWA

A loyalty card for love—add hearts when they do something sweet (pick you up on time, bring coffee, make you laugh). Works as a PWA on both iPhones with real-time sync.

## Setup (5 minutes)

### 1. Firebase (free, for sync between phones)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Enable **Realtime Database**
3. Add a Web app → Copy the config
4. In `src/firebase.js`, replace the placeholder config with yours
5. In Realtime Database → Rules, set:
   ```json
   {
     "rules": {
       "cards": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

### 2. Run locally

```bash
npm install
npm run dev
```

### 3. Deploy (free)

**Vercel** (recommended):

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import
3. Deploy (no config needed)

**Netlify** works too—deploy the `dist` folder after `npm run build`.

## Usage

1. **Create a card**: Open the app → "Create your card"
2. **Share the link** with your boyfriend (or save it yourself)
3. **Add to Home Screen** on both phones:
   - Safari: Share → Add to Home Screen
   - Chrome: Menu → Add to Home Screen
4. **Add hearts** when he does something nice—the card updates in real time on his phone too ♥
