const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('node:fs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('changeicon')
        .setDescription('Change the server icon')
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
        let serverConfig = JSON.parse(fs.readFileSync('./serverConfig.json'));
        let serverid = interaction.guildId;
        
        if (!serverConfig[serverid]) {
            serverConfig[serverid] = {};
            fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
        }

        if(serverConfig[serverid]['changeicon'] == false) {
            await interaction.reply({ content: 'This command is not enabled for this server.', ephemeral: true });
            return;
        }

        // check if there is a role restriction on the server and only allow users if they have the role
        if (serverConfig[serverid]['commandRestrict'] || serverConfig[serverid]['commandRestrict'] != undefined) {
            if (!interaction.member.roles.cache.has(serverConfig[serverid]['commandRestrict'])) {
                await interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
                return;
            }
        }

        if(serverConfig[serverid]['cooldown'] == undefined) {
            cooldown = 3600000;
        } else {
            cooldown = serverConfig[serverid]['cooldown'];
        }
    
        // check if user has used the command in the last hour on the specific server using the server id and user id from interactionCooldown.json file, then change the guild name if they have not used it in the last hour and update the json file with the last time they used the command
        if (Date.now() - interactionCooldown[interaction.guildId + "icon"] < cooldown) {
            let timeinanhour = interactionCooldown[interaction.guildId + "icon"] + cooldown;
            await interaction.reply({ content: 'You can only use this command once an hour!\nYou can use this command again <t:' + Math.round(timeinanhour/1000) + ':R>', ephemeral: true });
            return;
        } else {
            try {
                let newtime = interactionCooldown[interaction.guildId + "icon"] = Date.now();
                let timeinanhourset = newtime + cooldown;
                fs.writeFileSync('./interactionCooldown.json', JSON.stringify(interactionCooldown));
                await interaction.guild.setIcon(icon.url);
                await interaction.reply({ content: interaction.user.username + ' The server icon can be changed again <t:' + Math.round(timeinanhourset/1000) + ':R>', ephemeral: false, files: [icon] });
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Failed to change the server icon. Please ensure I have the correct permissions.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Failed to change the server icon. Please ensure I have the correct permissions.', ephemeral: true });
                }
            }
        }
    }
}