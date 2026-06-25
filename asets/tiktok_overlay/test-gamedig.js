const { GameDig } = require('gamedig');

async function test() {
    try {
        const state = await GameDig.query({
            type: 'csgo',
            host: '5.135.142.4',
            port: 27015
        });
        console.log("Players array length:", state.players.length);
        console.log("Max players:", state.maxplayers);
        console.log("Raw numplayers:", state.raw.numplayers);
        console.log("Raw bots:", state.raw.bots);
    } catch (e) {
        console.error(e);
    }
}
test();
