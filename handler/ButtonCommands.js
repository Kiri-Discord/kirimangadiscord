const fs = require('fs');
const path = require('path');

module.exports = async(client, sync) => {
    client.logger.info(`Initilizing button commands files and folders....`);

    const files = await fs.promises.readdir('./buttons/');
    const individualCmd = files.filter(file => path.extname(file) === '.js');

    if (individualCmd.length) {
        client.logger.info(`Found ${individualCmd.length} individual button command(s).`);
        for (const cmd of individualCmd) {
            const command = sync.require(`../buttons/${cmd}`);
            client.buttonCommands.set(command.info.name, command);
        };
    };
}