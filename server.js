const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {

    if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }
 
    let filePath = '.' + req.url;

    // Only redirect root path, not all requests
    if (req.url === '/' || req.url === '') {
        filePath = './userpage.html';
    }
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpeg'; break;
        case '.ico': contentType = 'image/x-icon'; break;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.log(`404: ${filePath}`); // Debug logging
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const gameStates = new Map();

function generateGameID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    const gameId = generateGameID();
    gameStates.set(gameId, {
        clickCount: 0,
        usedCategories: new Set(),
        heldDice : new Set(),
        scores: {},
        currentDice: [],
        totalScore: 0,
        numRolls: 3
    });

    ws.gameId = gameId;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            const gameState = gameStates.get(ws.gameId);

            switch (message.type) {
                case 'rollDice':
                    if (gameState.numRolls > 0) {
                        gameState.numRolls--;
                        console.log('Rolls remaining:', gameState.numRolls);
                        
                        // Initialize dice array if empty (first roll of the game or after scoring)
                        if (gameState.currentDice.length === 0) {
                            gameState.currentDice = [0, 0, 0, 0, 0];
                            gameState.heldDice.clear(); // Clear held dice on new turn
                        }
                        
                        // Roll only the dice that aren't held
                        for (let i = 0; i < 5; i++) {
                            if (!gameState.heldDice.has(i)) {
                                gameState.currentDice[i] = Math.floor(Math.random() * 6) + 1;
                            }
                        }
                        
                        gameState.clickCount++;

                        ws.send(JSON.stringify({
                            type: 'diceRolled',
                            dice: gameState.currentDice,
                            heldDice: Array.from(gameState.heldDice),
                            clickCount: gameState.clickCount,
                            rollsRemaining: gameState.numRolls
                        }));
                        
                        console.log('Rolled dice:', gameState.currentDice);
                        console.log('Held dice positions:', Array.from(gameState.heldDice));
                        
                    } else {
                        ws.send(JSON.stringify({
                            type: 'noDice',
                            rollsRemaining: 0
                        }));
                    }
                    break;

                case 'holdDice':
                    // Store held dice for this player
                    gameState.heldDice.clear();
                    message.heldDice.forEach(diceId => {
                        if (typeof diceId === 'string' && diceId.startsWith('d')) {
                            const index = parseInt(diceId.substring(1)) - 1; // Convert d1->0, d2->1, etc.
                            if (index >= 0 && index < 5) {
                                gameState.heldDice.add(index);
                            }
                        }
                    });
                    
                    console.log('Updated held dice:', Array.from(gameState.heldDice));
                    
                    ws.send(JSON.stringify({
                        type: 'diceHeld',
                        heldDice: Array.from(gameState.heldDice)
                    }));
                    break;
                

                case 'selectScore':
                    if (!gameState.usedCategories.has(message.category)) {
                        gameState.usedCategories.add(message.category);
                        gameState.scores[message.category] = message.score;
                        gameState.totalScore += message.score;
                        
                        // Reset for next turn
                        gameState.numRolls = 3;
                        gameState.currentDice = []; // Clear dice for next turn
                        gameState.heldDice.clear(); // Clear held dice for next turn
                        
                        const gameOver = gameState.usedCategories.size >= 13;
                        
                        ws.send(JSON.stringify({
                            type: 'scoreSelected',
                            category: message.category,
                            score: message.score,
                            totalScore: gameState.totalScore,
                            gameOver: gameOver
                        }));
                        
                        if (gameOver) {
                            console.log(`Game over! Final score: ${gameState.totalScore}`);
                        }
                    }
                    break;

                case 'playerScoreUpdate':
                        
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        gameStates.delete(ws.gameId);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});