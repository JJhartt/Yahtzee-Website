# Yahtzee Web Game

A browser-based Yahtzee game with WebSocket communication for real-time gameplay. Built to practice client-server architecture and game state management.

## Features

- WebSocket-based dice rolling and score updates
- Session-persistent username system
- Interactive dice holding between rolls
- All 13 standard Yahtzee scoring categories
- Server-side game state validation

## Technologies

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js with WebSocket (ws library)
- **Session Management**: SessionStorage API
- **Server**: HTTP server for static file serving, WebSocket server for real-time communication

## Project Structure

```
├── index.html          # Main game interface
├── index.js            # Client-side game logic
├── userpage.html       # Username entry page
├── username.js         # Username form handler
├── server.js           # WebSocket server and state management
└── sounds/             # Audio files
```

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/JJhartt/Yahtzee-Website.git
   cd Yahtzee-Website
   ```

2. Install dependencies
   ```bash
   npm install ws
   ```

3. Start the server
   ```bash
   node server.js
   ```

4. Open http://localhost:8080 in your browser

## Deployment

To deploy this application to a production environment:

**Using a VPS (DigitalOcean, AWS, Linode, etc.)**

1. Clone the repository on your server
2. Install Node.js if not already installed
3. Install dependencies: `npm install ws`
4. Set the PORT environment variable: `export PORT=8080`
5. Run with a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 save
   ```
6. Configure your firewall to allow traffic on port 8080
7. Point your domain to your server's IP address

**Using Heroku**

1. Create a `Procfile` in the project root:
   ```
   web: node server.js
   ```
2. Ensure your server uses `process.env.PORT`
3. Deploy:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

**Using Render or Railway**

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. The platform will automatically detect the PORT

## Implementation Notes

**Pattern Detection**
- Straights use sorted unique values to check for consecutive sequences
- N-of-a-kind uses hash maps to count die frequencies
- Full house validates for exactly one pair and one triple

**State Management**
Each client gets an isolated game state on the server including current dice, held positions, used categories, and remaining rolls. The client optimistically updates the UI while waiting for server confirmation.

**Dice Holding**
Held dice are tracked by index position. When rolling, the server only generates new values for unheld positions and preserves held dice values.
