const YahtzeeGame = {
    clickCount: 0,
    elements: null,
    usedCategories: new Set(),
    heldDice: new Set(),  // Stores dice IDs (d1, d2, etc.)
    scores: {},
    websocket: null,
    currentDice: [],
    rollsRemaining: 3,
    username:"",

    sounds : {
        click : new Audio('sounds/clicksound.mp3'),
        menu : new Audio('sounds/menu.mp3')
    },
    
    init() {
        this.elements = {
            statusEl: document.getElementById('statusDemo'),
            onerow: document.getElementById('onerow'),
            tworow: document.getElementById('tworow'),
            threerow: document.getElementById('threerow'),
            fourrow: document.getElementById('fourrow'),
            fiverow: document.getElementById('fiverow'),
            sixrow: document.getElementById('sixrow'),
            chancerow: document.getElementById('chancerow'),
            scorerow: document.getElementById('total-score'),
            threekind : document.getElementById('threekind'),
            fourkind : document.getElementById('fourkind'),
            fullhouse : document.getElementById('fullhouse'),
            smstraight : document.getElementById('smstraight'),
            lgstraight : document.getElementById('lgstraight'),
            yahtzee : document.getElementById('yahtzee'),
            status1: document.getElementById('d1'),
            status2: document.getElementById('d2'),
            status3: document.getElementById('d3'), 
            status4: document.getElementById('d4'), 
            status5: document.getElementById('d5'),

        };
        
        // Initialize WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.username = sessionStorage.getItem('gameUsername');

        // Redirect if no username found
        if (!this.username) {
            window.location.href = 'username.html';
            return;
        }
        this.elements.scorerow.textContent = this.username + ": 0";

        this.websocket = new WebSocket(`${protocol}//${host}`);

        
        this.websocket.onopen = () => {
            console.log('Connected to server');
            this.elements.statusEl.innerHTML = 'Connected! Roll the dice!';
            this.elements.statusEl.className = 'status connected';
        };
        
        this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };
        
        this.websocket.onclose = () => {
            console.log('Disconnected from server');
            this.elements.statusEl.innerHTML = 'Disconnected from server';
            this.elements.statusEl.className = 'status disconnected';
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.elements.statusEl.innerHTML = 'Connection error';
            this.elements.statusEl.className = 'status disconnected';

        
        };
        
    },

    handleServerMessage(message) {
        switch(message.type) {
            case 'diceRolled':
                this.playQuickSound('click');
                this.currentDice = message.dice;
                this.rollsRemaining = message.rollsRemaining;
                this.updateDisplayFromServer(message.dice);
                // Only update held dice display if server sends held dice info
                if (message.heldDice !== undefined) {
                    this.updateHeldDiceDisplay(message.heldDice);
                }
                break;
            case 'diceHeld':
                this.updateHeldDiceDisplay(message.heldDice);
                break;
            case 'scoreSelected':
                this.updateScoreFromServer(message.category, message.score);
                this.rollsRemaining = 3; // Reset rolls for next turn
                this.heldDice.clear(); // Clear client held dice
                this.updateHeldDiceDisplay([]); // Clear visual held state
                
                if (message.gameOver) {
                    this.endGame();
                }
                break;
            case 'noDice':
                this.elements.statusEl.innerHTML = `No rolls left! Choose a score category.`;
                break;
        }
    },

    playQuickSound(type) {
        const sound = new Audio(this.sounds[type].src); // Clone audio
        sound.volume = this.sounds[type].volume;
        sound.play();
    },
    
    rollDice() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'rollDice',
                heldDice: Array.from(this.heldDice)
            }));
        } else {
            this.elements.statusEl.innerHTML = 'Not connected to server';
            this.elements.statusEl.className = 'status disconnected';
        }
    },
    
    updateDisplayFromServer(dice) {
        // Calculate nums array from dice
        let nums = new Array(6).fill(0);
        for (let die of dice) {
            nums[die - 1]++;
        }
        
        // Update status message
        const heldCount = this.heldDice.size;
        const rollsText = this.rollsRemaining === 1 ? 'roll' : 'rolls';
        let statusMessage = `Roll: ${dice.join(', ')} | ${this.rollsRemaining} ${rollsText} left`;
        if (heldCount > 0) {
            statusMessage += ` | ${heldCount} dice held`;
        }
        this.elements.statusEl.innerHTML = statusMessage;

        const counts = {};
        for (let die of dice) {
            counts[die] = (counts[die] || 0) + 1;
        }
        const countValues = Object.values(counts);
        
        const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);
        
        // Update dice display
        this.elements.status1.innerHTML = dice[0] || '';
        this.elements.status2.innerHTML = dice[1] || '';
        this.elements.status3.innerHTML = dice[2] || '';
        this.elements.status4.innerHTML = dice[3] || '';
        this.elements.status5.innerHTML = dice[4] || '';
        
        // Update score options for each category
        if (!this.usedCategories.has('ones')) {
            this.elements.onerow.querySelector('button').textContent = nums[0] * 1;
        }
        if (!this.usedCategories.has('twos')) {
            this.elements.tworow.querySelector('button').textContent = nums[1] * 2;
        }
        if (!this.usedCategories.has('threes')) {
            this.elements.threerow.querySelector('button').textContent = nums[2] * 3;
        }
        if (!this.usedCategories.has('fours')) {
            this.elements.fourrow.querySelector('button').textContent = nums[3] * 4;
        }
        if (!this.usedCategories.has('fives')) {
            this.elements.fiverow.querySelector('button').textContent = nums[4] * 5;
        }
        if (!this.usedCategories.has('sixes')) {
            this.elements.sixrow.querySelector('button').textContent = nums[5] * 6;
        }
        if (!this.usedCategories.has('yahtzee')) {
            let isyahtzee = true;
            const firstdie = dice[0];
            for(let i =0;i < dice.length; i++){
                if(dice[i] !== firstdie){
                    isyahtzee = false;
                    break;
                }
            } if(isyahtzee == true){
                this.elements.yahtzee.querySelector('button').textContent = 50;
            }
        }
        if (!this.usedCategories.has('threekind')) {
            if(Object.values(counts).some(count => count >= 3)){
                const chanceScore = dice.reduce((sum, die) => sum + die, 0);
                this.elements.threekind.querySelector('button').textContent = chanceScore;
            }    
        }
        if (!this.usedCategories.has('fourkind')) {
            if(Object.values(counts).some(count => count >= 4)){
                const chanceScore = dice.reduce((sum, die) => sum + die, 0);
                this.elements.fourkind.querySelector('button').textContent = chanceScore;
            }    
        }
        
        if (!this.usedCategories.has('fullhouse')) {
            if(countValues.includes(3) && countValues.includes(2)){
                this.elements.fullhouse.querySelector('button').textContent = 25;
            }
        }

        if (!this.usedCategories.has('smstraight')) {
            hasSmallStraight = false;
            for (let i = 0; i <= uniqueDice.length - 4; i++) {
                if (uniqueDice[i+1] === uniqueDice[i] + 1 &&
                    uniqueDice[i+2] === uniqueDice[i] + 2 &&
                    uniqueDice[i+3] === uniqueDice[i] + 3) {
                    hasSmallStraight = true;
                    break;
                }
            }
            if(hasSmallStraight){
               this.elements.smstraight.querySelector('button').textContent = '30';
            }
        }

        if (!this.usedCategories.has('lgstraight')) {
            hasLargeStraight = false;

            const hasLargeStraight = (uniqueDice.join('') === "12345") || (uniqueDice.join('') === "23456");

            if(hasLargeStraight){
                this.elements.lgstraight.querySelector('button').textContent = 40;
            }
        }

        if (!this.usedCategories.has('chance')) {
            const chanceScore = dice.reduce((sum, die) => sum + die, 0);
            this.elements.chancerow.querySelector('button').textContent = chanceScore;
        }
        

        // Add visual indication that buttons are ready to click
        this.highlightAvailableButtons();
    },
    
    highlightAvailableButtons() {
        const buttons = document.querySelectorAll('.score-btn:not([disabled])');
        buttons.forEach(btn => {
            btn.classList.add('rolling');
        });
    },

    holdButton(diceId) {
        // Only allow holding if dice have been rolled
        if (this.currentDice.length === 0) {
            this.elements.statusEl.innerHTML = 'Roll the dice first before holding!';
            return;
        }

        // Toggle the held state
        if (this.heldDice.has(diceId)) {
            this.heldDice.delete(diceId);
        } else {
            this.heldDice.add(diceId);
        }
        
        // Update visual state immediately for better UX (but don't clear the dice value)
        const diceElement = document.getElementById(diceId);
        if (this.heldDice.has(diceId)) {
            diceElement.classList.add('outline');
            diceElement.style.backgroundColor = '#4CAF50';
            diceElement.style.color = 'white';
        } else {
            diceElement.classList.remove('outline');
            diceElement.style.backgroundColor = '#f8f9fa';
            diceElement.style.color = '#171917';
        }
        
        // Send held dice state to server
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'holdDice',
                heldDice: Array.from(this.heldDice)
            }));
        } else {
            this.elements.statusEl.innerHTML = 'Not connected to server';
            this.elements.statusEl.className = 'status disconnected';
        }

        console.log('Currently held dice:', Array.from(this.heldDice));
    },

    updateDiceVisualState(diceId) {
        const diceElement = document.getElementById(diceId);
        if (this.heldDice.has(diceId)) {
            diceElement.classList.add('outline');
            diceElement.style.backgroundColor = '#4CAF50'; // Green for held
            diceElement.style.color = 'white';
        } else {
            diceElement.classList.remove('outline');
            diceElement.style.backgroundColor = '#f8f9fa'; // Original color
            diceElement.style.color = '#171917';
        }
    },

    updateHeldDiceDisplay(heldDiceIndices) {
        // Convert indices to dice IDs for comparison
        const serverHeldDice = new Set(heldDiceIndices.map(index => `d${index + 1}`));
        
        // Update visual state for all dice based on server state
        ['d1', 'd2', 'd3', 'd4', 'd5'].forEach(diceId => {
            const diceElement = document.getElementById(diceId);
            if (serverHeldDice.has(diceId)) {
                // This die should be held
                diceElement.classList.add('outline');
                diceElement.style.backgroundColor = '#4CAF50';
                diceElement.style.color = 'white';
            } else {
                // This die should not be held
                diceElement.classList.remove('outline');
                diceElement.style.backgroundColor = '#f8f9fa';
                diceElement.style.color = '#171917';
            }
        });

        // Update client held dice set to match server
        this.heldDice = serverHeldDice;
    },
    
    selectScore(category, button) {
        if (this.usedCategories.has(category)) {
            return;
        }
        
        if (this.currentDice.length === 0) {
            this.elements.statusEl.innerHTML = 'Roll the dice first!';
            return;
        }
        
        const score = parseInt(button.textContent);
        
        // Send score selection to server
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'selectScore',
                category: category,
                score: score
            }));
        }
    },
    
    updateScoreFromServer(category, score) {
        // Update local state based on server confirmation
        this.usedCategories.add(category);
        this.scores[category] = score;
        
        // Map category names to actual HTML IDs
        const categoryToId = {
            'ones': 'onerow',
            'twos': 'tworow',
            'threes': 'threerow',
            'fours': 'fourrow',
            'fives': 'fiverow',
            'sixes': 'sixrow',
            'chance': 'chancerow',
            'threekind': 'threekind',
            'fourkind': 'fourkind',
            'fullhouse': 'fullhouse',
            'smstraight': 'smstraight',
            'lgstraight': 'lgstraight',
            'yahtzee': 'yahtzee'
        };
        
        // Find and disable the button using correct ID
        const rowId = categoryToId[category];
        const button = document.querySelector(`#${rowId} button`);
        
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.classList.remove('rolling');
            button.textContent = score; // Keep the final score displayed
        }
        
        // Remove rolling class from all buttons and reset unused ones to 0
        const allButtons = document.querySelectorAll('.score-btn');
        allButtons.forEach(btn => {
            btn.classList.remove('rolling');
            if (!btn.disabled) {
                btn.textContent = '0'; // Reset unused buttons to 0
            }
        });
        
        // Clear dice display for next turn
        ['d1', 'd2', 'd3', 'd4', 'd5'].forEach(diceId => {
            document.getElementById(diceId).innerHTML = '';
        });
        
        // Update status
        this.elements.statusEl.innerHTML = `${this.username} Scored ${score} points for ${category}. Roll again!`;
        
        // Reset current dice
        this.currentDice = [];
        
        // Update total score display
        const totalScore = Object.values(this.scores).reduce((sum, score) => sum + score, 0);
        this.elements.scorerow.textContent = this.username + ': ' + totalScore;
    },
    
    endGame() {
        const totalScore = Object.values(this.scores).reduce((sum, score) => sum + score, 0);
        this.elements.statusEl.innerHTML = `Game Over! Final Score: ${totalScore}`;
        this.elements.statusEl.className = 'status disconnected';
        
        const rollButton = document.querySelector('.toggle-btn');
        rollButton.disabled = true;
        rollButton.textContent = 'Game Over';
        rollButton.style.opacity = '0.5';
        rollButton.style.cursor = 'not-allowed';
        
        // Disable all remaining buttons
        const allButtons = document.querySelectorAll('.score-btn:not([disabled])');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        // Disable dice holding
        ['d1', 'd2', 'd3', 'd4', 'd5'].forEach(diceId => {
            const diceElement = document.getElementById(diceId);
            diceElement.style.pointerEvents = 'none';
        });
    }
};

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = YahtzeeGame;
    YahtzeeGame.init();
});
