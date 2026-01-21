# Fix: Backend Port Already in Use

## What Happened
You tried to start the backend, but got this error:
```
Error: listen EADDRINUSE: address already in use :::3001
```

This means there's already a Node.js server running on port 3001 (probably from a previous session).

## Quick Fix (Choose One Method)

### Method 1: Kill the Process Manually

In your terminal, run these commands:

```bash
# Find the process using port 3001
lsof -i :3001

# You'll see output like:
# COMMAND   PID              USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    12345 ulrikwithandersen   23u  IPv6 0x...      0t0  TCP *:3001 (LISTEN)

# Kill that process (replace 12345 with the actual PID number you see)
kill -9 12345
```

### Method 2: Use Activity Monitor (Mac GUI)

1. Open **Activity Monitor** (press Cmd+Space, type "Activity Monitor")
2. In the search box (top right), type "node"
3. Look for a process that's running from the PMT directory
4. Select it and click the ⓧ button (Force Quit)

### Method 3: Restart Terminal

Sometimes the simplest solution:
1. Close your terminal window completely
2. Open a new terminal
3. Try again:
   ```bash
   cd ~/PMT/backend
   npm run dev
   ```

### Method 4: Use a Different Port

Edit `/Users/ulrikwithandersen/PMT/backend/.env` and change:
```
PORT=3001
```
to:
```
PORT=3002
```

Then also update the frontend to point to the new port (see below).

## After Killing the Process

Once you've killed the old process, restart:

```bash
cd ~/PMT/backend
npm run dev
```

You should now see:
```
PMT Backend running on http://localhost:3001
Testing Blue.cc API connection...
```

## If You Changed the Port

If you decided to use port 3002 instead, you need to update the frontend.

Edit `/Users/ulrikwithandersen/PMT/frontend/src/App.jsx` (or wherever the API calls are made) and change:
```javascript
const API_URL = 'http://localhost:3001';
```
to:
```javascript
const API_URL = 'http://localhost:3002';
```

## Preventing This in the Future

This happens when you don't cleanly shut down the backend (pressing Ctrl+C in the terminal).

**To properly stop the backend:**
1. Go to the terminal where it's running
2. Press `Ctrl+C` once
3. Wait for it to say "Stopped" or return to the prompt
4. Don't force quit the terminal window while the server is running

**If you need to restart:**
- In the terminal where nodemon is running, just type `rs` and press Enter
- Nodemon will restart automatically without needing to kill/restart

## Still Having Issues?

If none of these work, try this nuclear option:

```bash
# Kill ALL node processes (careful - this kills everything Node.js related)
pkill -9 node

# Then restart
cd ~/PMT/backend
npm run dev
```

---

*The most common solution is Method 1 (kill -9) or Method 2 (Activity Monitor).*
