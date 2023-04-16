module.exports = async (client, guild) => {
    const owner = await guild.fetchOwner().catch(() => null);
    const text = `New guild joined: ${guild.name} (id: ${
        guild.id
    }). This guild has ${guild.memberCount} members! Owner: ${
        owner ? owner.user.tag : "Unknown"
    }`;

    const logUser = await client.users
        .fetch(process.env.OWNERID)
        .catch(() => null);

    if (logUser) logUser.send({ content: text });

    return client.logger.info(text);
};
