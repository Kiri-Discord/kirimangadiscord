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
							if (currentPage === 0) {
								row.components[0].setDisabled(true);
							} else {
								row.components[0].setDisabled(false);
							};
							if (currentPage === array.length - 1) row.components[2].setDisabled(true);
							else row.components[2].setDisabled(false);
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							});
						} else {
							res.reply({
								content: `You are already at the first page!`,
								ephemeral: true
							})
						}
						break;
					case 'nextbtn':
						if (currentPage < array.length - 1) {
							currentPage++;
							if (currentPage === array.length - 1) {
								row.components[2].setDisabled(true);
							} else {
								row.components[2].setDisabled(false);
							};
							if (currentPage === 0) row.components[0].setDisabled(true);
							else row.components[0].setDisabled(false);
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							})
						} else {
							res.reply({
								content: `You are already at the last page!`,
								ephemeral: true
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
						const modalRow = new ActionRowBuilder().addComponents(input);
						modal.addComponents(modalRow);
						await res.showModal(modal);
	
						const result = await res.awaitModalSubmit({
							filter: (i) => {
								if (i.customId !== 'jumping' || i.user.id !== authorId) return false;
								else if (isNaN(i.fields.getTextInputValue('numberJumping'))  || Number(i.fields.getTextInputValue('numberJumping')) > array.length || Number(i.fields.getTextInputValue('numberJumping')) < 1) {
									i.reply({
										content: `You should enter a vaild number \`1 - ${array.length}\` <:hutaoWHEEZE:1085918596955394180>`,
										ephemeral: true
									})
									return false
								} else return true;
							},
							time: 15000
						}).catch(() => null);;
						if (result) {
							const number = result.fields.getTextInputValue('numberJumping');
							const pageNumber = Number(number);
							currentPage = pageNumber - 1;
							if (pageNumber === 1) row.components[0].setDisabled(true);
							else row.components[0].setDisabled(false);
							if (pageNumber === array.length) row.components[2].setDisabled(true);
							else row.components[2].setDisabled(false);
							result.update({
								content: `Page ${number} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
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
						const modalRow1 = new ActionRowBuilder().addComponents(input1);
						modal1.addComponents(modalRow1);
						await res.showModal(modal1);
	
						const mangaModalResult = await res.awaitModalSubmit({
							filter: (i) => {
								if (i.customId !== 'info' || i.user.id !== authorId) return false;
								else if (isNaN(i.fields.getTextInputValue('mangaNumber')) || Number(i.fields.getTextInputValue('mangaNumber')) > resLength || Number(i.fields.getTextInputValue('mangaNumber')) < 1) {
									i.reply({
										content: `You should enter a vaild number \`1 - ${resLength}\` <:hutaoWHEEZE:1085918596955394180>`,
										ephemeral: true
									})
									return false
								} else return true;
							},
							time: 15000
						}).catch(() => null);
						if (mangaModalResult) {
							await mangaModalResult.deferUpdate();
							const number = mangaModalResult.fields.getTextInputValue('mangaNumber');
							endValue = Number(number);
							collector.stop();
						}
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
	static async paginatedMangaSessionList(interaction, array, msg, [row, row1], filter, authorId, resLength, { time = 60000 } = {}) {
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
					case 'previoussessionlistpagebtn':
						if (currentPage !== 0) {
							--currentPage;
							if (currentPage === 0) {
								row.components[0].setDisabled(true);
							} else {
								row.components[0].setDisabled(false);
							};
							if (currentPage === array.length - 1) row.components[2].setDisabled(true);
							else row.components[2].setDisabled(false);
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							});
						} else {
							res.reply({
								content: `You are already at the first page!`,
								ephemeral: true
							})
						}
						break;
					case 'nextsessionlistpagebtn':
						if (currentPage < array.length - 1) {
							currentPage++;
							if (currentPage === array.length - 1) {
								row.components[2].setDisabled(true);
							} else {
								row.components[2].setDisabled(false);
							};
							if (currentPage === 0) row.components[0].setDisabled(true);
							else row.components[0].setDisabled(false);
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							})
						} else {
							res.reply({
								content: `You are already at the last page!`,
								ephemeral: true
							})
						}
						break;
					case 'jumpsessionlistpagebtn':
						const modal = new ModalBuilder()
						.setCustomId('jumpingSessionList')
						.setTitle('Navigating results');
						const input = new TextInputBuilder()
						.setMinLength(1)
						.setRequired(true)
						.setCustomId('numberJumpingSessionList')
						.setLabel(`To what page would you like to jump?`)
						.setPlaceholder(`1 - ${array.length}`)
						.setStyle(TextInputStyle.Short);
						const modalRow = new ActionRowBuilder().addComponents(input);
						modal.addComponents(modalRow);
						await res.showModal(modal);
	
						const result = await res.awaitModalSubmit({
							filter: (i) => {
								if (i.customId !== 'jumpingSessionList' || i.user.id !== authorId) return false;
								else if (isNaN(i.fields.getTextInputValue('numberJumpingSessionList'))  || Number(i.fields.getTextInputValue('numberJumpingSessionList')) > array.length || Number(i.fields.getTextInputValue('numberJumpingSessionList')) < 1) {
									i.reply({
										content: `You should enter a vaild number \`1 - ${array.length}\` <:hutaoWHEEZE:1085918596955394180>`,
										ephemeral: true
									})
									return false
								} else return true;
							},
							time: 15000
						}).catch(() => null);;
						if (result) {
							const number = result.fields.getTextInputValue('numberJumpingSessionList');
							const pageNumber = Number(number);
							currentPage = pageNumber - 1;
							if (pageNumber === 1) row.components[0].setDisabled(true);
							else row.components[0].setDisabled(false);
							if (pageNumber === array.length) row.components[2].setDisabled(true);
							else row.components[2].setDisabled(false);
							result.update({
								content: `Page ${number} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							})
						};
						break;
					case 'startreadingsessionlistbtn':
						const modal1 = new ModalBuilder()
						.setCustomId('infosessionlist')
						.setTitle('Resuming a session');
						const input1 = new TextInputBuilder()
						.setMinLength(1)
						.setRequired(true)
						.setCustomId('mangaNumberSessionList')
						.setLabel(`Which session would you like to resume?`)
						.setPlaceholder(`1 - ${resLength}`)
						.setStyle(TextInputStyle.Short);
						const modalRow1 = new ActionRowBuilder().addComponents(input1);
						modal1.addComponents(modalRow1);
						await res.showModal(modal1);
	
						const mangaModalResult = await res.awaitModalSubmit({
							filter: (i) => {
								if (i.customId !== 'infosessionlist' || i.user.id !== authorId) return false;
								else if (isNaN(i.fields.getTextInputValue('mangaNumberSessionList')) || Number(i.fields.getTextInputValue('mangaNumberSessionList')) > resLength || Number(i.fields.getTextInputValue('mangaNumberSessionList')) < 1) {
									i.reply({
										content: `You should enter a vaild number \`1 - ${resLength}\` <:hutaoWHEEZE:1085918596955394180>`,
										ephemeral: true
									})
									return false
								} else return true;
							},
							time: 15000
						}).catch(() => null);
						if (mangaModalResult) {
							await mangaModalResult.deferUpdate();
							const number = mangaModalResult.fields.getTextInputValue('mangaNumberSessionList');
							endValue = Number(number);
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
	static async paginatedMangaReadingList(interaction, array, msg, [row, row1], filter, authorId, resLength, { time = 60000 } = {}) {
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
					case 'previousreadinglistpagebtn':
						if (currentPage !== 0) {
							--currentPage;
							if (currentPage === 0) {
								row.components[0].setDisabled(true);
							} else {
								row.components[0].setDisabled(false);
							};
							if (currentPage === array.length - 1) row.components[2].setDisabled(true);
							else row.components[2].setDisabled(false);
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							});
						} else {
							res.reply({
								content: `You are already at the first page!`,
								ephemeral: true
							})
						}
						break;
					case 'nextreadinglistpagebtn':
						if (currentPage < array.length - 1) {
							currentPage++;
							if (currentPage === array.length - 1) {
								row.components[2].setDisabled(true);
							} else {
								row.components[2].setDisabled(false);
							};
							if (currentPage === 0) row.components[0].setDisabled(true);
							else row.components[0].setDisabled(false);
							res.update({
								content: `Page ${currentPage + 1} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							})
						} else {
							res.reply({
								content: `You are already at the last page!`,
								ephemeral: true
							})
						}
						break;
					case 'jumpreadinglistpagebtn':
						const modal = new ModalBuilder()
						.setCustomId('jumpingReadingList')
						.setTitle('Navigating results');
						const input = new TextInputBuilder()
						.setMinLength(1)
						.setRequired(true)
						.setCustomId('numberJumpingReadingList')
						.setLabel(`To what page would you like to jump?`)
						.setPlaceholder(`1 - ${array.length}`)
						.setStyle(TextInputStyle.Short);
						const modalRow = new ActionRowBuilder().addComponents(input);
						modal.addComponents(modalRow);
						await res.showModal(modal);
	
						const result = await res.awaitModalSubmit({
							filter: (i) => {
								if (i.customId !== 'jumpingReadingList' || i.user.id !== authorId) return false;
								else if (isNaN(i.fields.getTextInputValue('numberJumpingReadingList'))  || Number(i.fields.getTextInputValue('numberJumpingReadingList')) > array.length || Number(i.fields.getTextInputValue('numberJumpingReadingList')) < 1) {
									i.reply({
										content: `You should enter a vaild number \`1 - ${array.length}\` <:hutaoWHEEZE:1085918596955394180>`,
										ephemeral: true
									})
									return false
								} else return true;
							},
							time: 15000
						}).catch(() => null);;
						if (result) {
							const number = result.fields.getTextInputValue('numberJumpingReadingList');
							const pageNumber = Number(number);
							currentPage = pageNumber - 1;
							if (pageNumber === 1) row.components[0].setDisabled(true);
							else row.components[0].setDisabled(false);
							if (pageNumber === array.length) row.components[2].setDisabled(true);
							else row.components[2].setDisabled(false);
							result.update({
								content: `Page ${number} of ${array.length}`,
								embeds: [array[currentPage]],
								components: [row, row1]
							})
						};
						break;
					case 'startreadingreadinglistbtn':
						const modal1 = new ModalBuilder()
						.setCustomId('inforeadinglist')
						.setTitle('Display manga info');
						const input1 = new TextInputBuilder()
						.setMinLength(1)
						.setRequired(true)
						.setCustomId('mangaNumberReadingList')
						.setLabel(`Which manga would you like to show more info?`)
						.setPlaceholder(`1 - ${resLength}`)
						.setStyle(TextInputStyle.Short);
						const modalRow1 = new ActionRowBuilder().addComponents(input1);
						modal1.addComponents(modalRow1);
						await res.showModal(modal1);
	
						const mangaModalResult = await res.awaitModalSubmit({
							filter: (i) => {
								if (i.customId !== 'inforeadinglist' || i.user.id !== authorId) return false;
								else if (isNaN(i.fields.getTextInputValue('mangaNumberReadingList')) || Number(i.fields.getTextInputValue('mangaNumberReadingList')) > resLength || Number(i.fields.getTextInputValue('mangaNumberReadingList')) < 1) {
									i.reply({
										content: `You should enter a vaild number \`1 - ${resLength}\` <:hutaoWHEEZE:1085918596955394180>`,
										ephemeral: true
									})
									return false
								} else return true;
							},
							time: 15000
						}).catch(() => null);
						if (mangaModalResult) {
							await mangaModalResult.deferUpdate();
							const number = mangaModalResult.fields.getTextInputValue('mangaNumberReadingList');
							endValue = Number(number);
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