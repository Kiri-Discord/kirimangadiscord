module.exports = (client) => {
    client.user.setPresence({ activities: [{ name: 'keeping the hype' }], status: 'online' });
    return client.logger.info(`[DISCORD] ${client.user.tag} has logged in!`);
}