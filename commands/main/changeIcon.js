const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('changeicon')
        .setDescription('Change the server icon once an hour')
        .addAttachmentOption(option =>
            option
                .setName('icon')
                .setDescription('Servers new icon')
                .setRequired(true)
        ),
    async execute(interaction) {
        const icon = interaction.options.getAttachment('icon');
        //get the server id and user id from the interactionCooldown.json file
        let interactionCooldown = JSON.parse(fs.readFileSync('./interactionCooldown.json'));
        let timeinanhour = Math.round(interactionCooldown[interaction.guildId + "icon"] + 3600000 / 1000);
    
        // check if user has used the command in the last hour on the specific server using the server id and user id from interactionCooldown.json file, then change the guild name if they have not used it in the last hour and update the json file with the last time they used the command
        if (Date.now() - interactionCooldown[interaction.guildId + "icon"] < 3600000) {
    
            await interaction.reply({ content: 'You can only use this command once an hour!\nYou can use this command again <t:' + timeinanhour + ':R>', ephemeral: true });
            return;
        } else {
            try {
                let newtime = interactionCooldown[interaction.guildId + "icon"] = Date.now();
                let timeinanhourset = newtime + 3600000;
                fs.writeFileSync('./interactionCooldown.json', JSON.stringify(interactionCooldown));
                await interaction.guild.setIcon(icon.url);
                await interaction.reply({ content: interaction.user.username + 'has changed the server icon.\nThe server icon can be changed again <t:' + Math.round(timeinanhourset/1000) + ':R>', ephemeral: false, files: [icon] });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Failed to change the server icon. Please ensure I have the correct permissions.', ephemeral: true });
            }
        }
    }
}