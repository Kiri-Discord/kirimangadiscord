module.exports = async (client, guild) => {
    const text = `Guild left: ${guild.name} (id: ${
        guild.id
    })`;

    const logUser = await client.users
        .fetch(process.env.OWNERID)
        .catch(() => null);

    if (logUser) logUser.send({ content: text });

    return client.logger.info(text);
};
