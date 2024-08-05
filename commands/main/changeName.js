const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('changename')
        .setDescription('Change the server name once an hour')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Servers new name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        //get the server id and user id from the interactionCooldown.json file
        let interactionCooldown = JSON.parse(fs.readFileSync('./interactionCooldown.json'));
        let timeinanhour = interactionCooldown[interaction.guildId + "name"] + 3600000;

        // check if user has used the command in the last hour on the specific server using the server id and user id from interactionCooldown.json file, then change the guild name if they have not used it in the last hour and update the json file with the last time they used the command
        if (Date.now() - interactionCooldown[interaction.guildId + "name"] < 3600000) {
            await interaction.reply({ content: 'You can only use this command once an hour!\nYou can use this command again <t:' + Math.round(timeinanhour/1000) + ':R>', ephemeral: true });
            return;
        } else {
            try {
                let newtime = interactionCooldown[interaction.guildId + "name"] = Date.now();
                let timeinanhourset = newtime + 3600000;
                fs.writeFileSync('./interactionCooldown.json', JSON.stringify(interactionCooldown));
                await interaction.guild.setName(name + " | " + interaction.user.username);
                await interaction.reply({ content: interaction.user.username + ' has changed the server name too **' + name + '**\nThe server name can be changed again <t:' + Math.round(timeinanhourset/1000) + ':R>', ephemeral: false });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Failed to change the server name. Please ensure I have the correct permissions.', ephemeral: true });
            }
        }
    }
}