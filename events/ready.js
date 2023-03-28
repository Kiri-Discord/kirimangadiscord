module.exports = (client) => {
    return client.logger.info(`[DISCORD] ${client.user.tag} has logged in!`);
}