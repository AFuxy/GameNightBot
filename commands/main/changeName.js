const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('node:fs');

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changename')
        .setDescription('Change the server name')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Servers new name')
                .setRequired(true)
                .setMaxLength(100)
        ),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        //get the server id and user id from the interactionCooldown.json file
        let interactionCooldown = JSON.parse(fs.readFileSync('./interactionCooldown.json'));
        let serverConfig = JSON.parse(fs.readFileSync('./serverConfig.json'));
        let serverid = interaction.guildId;

        if (!serverConfig[serverid]) {
            serverConfig[serverid] = {};
            fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
        }
        // check if there is a role restriction on the server and only allow users if they have the role
        if (serverConfig[serverid]['commandRestrict'] || serverConfig[serverid]['commandRestrict'] != undefined) {
            if (!interaction.member.roles.cache.has(serverConfig[serverid]['commandRestrict'])) {
                await interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
                return;
            }
        }

        if(serverConfig[serverid]['changename'] == false) {
            await interaction.reply({ content: 'This command is not enabled for this server.', ephemeral: true });
            return;
        }

        if(serverConfig[serverid]['cooldown'] == undefined) {
            cooldown = 3600000;
        } else {
            cooldown = serverConfig[serverid]['cooldown'];
        }

        if(serverConfig[serverid]['layout'] == undefined) {
            layout = "{newname} | {username}";
        } else {
            layout = serverConfig[serverid]['layout'];
        }

        // check if user has used the command in the last hour on the specific server using the server id and user id from interactionCooldown.json file, then change the guild name if they have not used it in the last hour and update the json file with the last time they used the command
        if (Date.now() - interactionCooldown[interaction.guildId + "name"] < cooldown) {
            let timeinanhour = interactionCooldown[interaction.guildId + "name"] + cooldown;
            await interaction.reply({ content: 'You can use this command again <t:' + Math.round(timeinanhour/1000) + ':R>', ephemeral: true });
            return;
        } else {
            try {
                let newtime = interactionCooldown[interaction.guildId + "name"] = Date.now();
                let timeinanhourset = newtime + cooldown;
                fs.writeFileSync('./interactionCooldown.json', JSON.stringify(interactionCooldown));
                let layoutFinal = replaceAll(layout, '{newname}', name)
                // check length of layoutFinal and if it is greater than 100 characters, then give error message
                if (layoutFinal.length > 100) {
                    // give error message in embed
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setDescription('The server name is too long. Please use a shorter name.')
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
                layoutFinal = replaceAll(layoutFinal, '{username}', interaction.user.username)
                await interaction.guild.setName(layoutFinal);
                await interaction.reply({ content: interaction.user.username + ' has changed the server name to **' + name + '**\nThe server name can be changed again <t:' + Math.round(timeinanhourset/1000) + ':R>', ephemeral: false });
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Failed to change the server name. Please ensure I have the correct permissions.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Failed to change the server name. Please ensure I have the correct permissions.', ephemeral: true });
                }
            }
        }
    }
}