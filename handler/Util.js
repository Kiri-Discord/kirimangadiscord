const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require('discord.js');

module.exports = class Util {
    static fetchSubCommand(interaction) {
        try {
            const subCommandGroupName = interaction.options.getSubcommandGroup();
            const subCommandName = interaction.options.getSubcommand();
            return { subCommandGroupName, subCommandName }
        } catch {
            return null;
        };
    };
    static async paginatedMangaSearch(interaction, array, msg, [row, row1], filter, authorId, resLength, { time = 60000 } = {}) {
		return new Promise(async (resolve, reject) => {
			let currentPage = 0;
			let endValue;
			const collector = msg.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter,
				time
			});
	
			collector.on('collect', async(res) => {
				switch (res.customId) {
					case 'previousbtn':
						if (currentPage !== 0) {
							--currentPage;
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]]
							});
						} else {
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]]
							})
						}
						break;
					case 'nextbtn':
						if (currentPage < array.length - 1) {
							currentPage++;
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]]
							})
						} else {
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]]
							})
						}
						break;
					case 'jumpbtn':
						const modal = new ModalBuilder()
						.setCustomId('jumping')
						.setTitle('Navigating results');
						const input = new TextInputBuilder()
						.setMinLength(1)
						.setRequired(true)
						.setCustomId('numberJumping')
						.setLabel(`To what page would you like to jump?`)
						.setPlaceholder(`1 - ${array.length}`)
						.setStyle(TextInputStyle.Short);
						const row = new ActionRowBuilder().addComponents(input);
						modal.addComponents(row);
						await res.showModal(modal);
	
						const result = await res.awaitModalSubmit({
							filter: (i) => {
								return i.customId === 'jumping' && i.user.id === authorId
							},
							time: 15000
						}).catch(() => null);;
						if (!result) return;
						else {
							const number = result.fields.getTextInputValue('numberJumping');
							currentPage = parseInt(number) - 1;
							result.update({
								content: `Page ${number} of ${array.length}`,
								embeds: [array[currentPage]]
							})
						};
						break;
					case 'showinfobtn':
						const modal1 = new ModalBuilder()
						.setCustomId('info')
						.setTitle('Display manga info');
						const input1 = new TextInputBuilder()
						.setMinLength(1)
						.setRequired(true)
						.setCustomId('mangaNumber')
						.setLabel(`Which manga would you like to show more info?`)
						.setPlaceholder(`1 - ${resLength}`)
						.setStyle(TextInputStyle.Short);
						const row1 = new ActionRowBuilder().addComponents(input1);
						modal1.addComponents(row1);
						await res.showModal(modal1);
	
						const mangaModalResult = await res.awaitModalSubmit({
							filter: (i) => {
								return i.customId === 'info' && i.user.id === authorId
							},
							time: 15000
						});
						if (!mangaModalResult) return;
						else {
							await mangaModalResult.deferUpdate();
							const number = mangaModalResult.fields.getTextInputValue('mangaNumber');
							endValue = number;
							collector.stop();
						};
						break;
				};
			});
			collector.on('end', async() => {
				if (endValue) {
					resolve({
						value: endValue,
						reason: 'info'
					})
				} else {
					row.components.forEach(button => button.setDisabled(true));
					row1.components.forEach(button => button.setDisabled(true));
					interaction.editReply({
						content: `Page ${currentPage + 1} of ${array.length}`,
						components: [row, row1],
						embeds: [array[currentPage]]
					});
					resolve({
						reason: 'time'
					})
				}

			})
		})
	};
}