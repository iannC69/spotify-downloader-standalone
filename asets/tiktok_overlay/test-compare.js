const { GameDig } = require('gamedig');
const http = require('http');

async function check() {
    const state = await GameDig.query({
        type: 'csgo',
        host: '5.135.142.4',
        port: 27015
    });
    
    http.get('http://localhost:3000/api/status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const apiData = JSON.parse(data);
            console.log("GameDig players:", state.players.length);
            console.log("Local API players:", apiData.players);
            console.log("Difference (API - GameDig):", apiData.players - state.players.length);
        });
    });
}
check();
