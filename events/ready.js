const WebSocketHandler = require('../handler/WebSocket');
const commandLineArgs = require('command-line-args');


module.exports = (client) => {
    const optionDefinitions = [
        { name: 'nowebsocket', alias: 'w', type: Boolean },
    ]
    const options = commandLineArgs(optionDefinitions);
    
    if (!options.nowebsocket) WebSocketHandler.init(client);
    return client.logger.info(`[DISCORD] ${client.user.tag} has logged in!`);
}