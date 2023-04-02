const { EmbedBuilder } = require('discord.js')

exports.run = async(client, interaction) => {
    const embed = new EmbedBuilder()
    .setTitle('Frequently asked questions')
    .setColor('#BA8474')
    .setDescription(`
    **Q: What are reading sessions?**

    A: Reading sessions are a way to keep track of your reading progress and will be automatically created when you start reading a manga. Sessions are bound to a specific manga. You can have multiple sessions but only with different manga at the same time (you can't have multiple reading session for a manga).

    **Q: Can this message be safely deleted? Will my progress be gone?**

    A: Yes, this message can be safely deleted (both intentionally and unintentionally). If you want to recover a reading session, you can use the \`/session resume\` command to create a new message with your reading session.

    **Q: Can I allow another user to use my reading session as well?**

    A: Yes, you can allow another user to use your reading session. You can do this by using the \`/session share\` command. You can also revoke access to your reading session with the same command.

    **Q: What if I want to delete this session?**

    A: You can delete your reading session by using the \`/session delete\` command. (remember to show the session's ID using below button)

    **Q: What is the difference between reading sessions and reading list?**

    A: Reading sessions are used to keep track of your reading progress. Reading list is used to keep track of the manga you want to read. You can add manga to your reading list on the information page of a manga.

    **Q: How does notification works?**

    A: Notification is a feature that will notify you when a new chapter of a manga is released through DMs and can be changed by clicking the button below. You can only receive notifications for the translation group that you are currently reading. Changing notification settings also add the manga to your reading list.
    `);
    
    return interaction.reply({ embeds: [embed], ephemeral: true })
}


exports.info = {
    name: "frequentquestionreadbtn"
};