const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('node:fs');

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure the bot for your server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('layout')
                .setDescription('edit the layout of the changename command')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setDescription('Acceptable values are {newname} and {username}')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cooldown')
                .setDescription('change the cooldown of all change commands globally')
                .addIntegerOption(option =>
                    option
                        .setName('value')
                        .setDescription('Default cooldown is 1 hour')
                        .setRequired(true)
                        .addChoices(
                            // choice values all in Milliseconds
                            { name: 'none', value: 0 },
                            { name: '1 hour | Default', value: 3600000 },
                            { name: '2 hours', value: 7200000 },
                            { name: '4 hours', value: 14400000 },
                            { name: '6 hours', value: 21600000 },
                            { name: '10 hours', value: 36000000 },
                            { name: '12 hours', value: 43200000 },
                            { name: '24 hours', value: 86400000 }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('commandrestrict')
                .setDescription('change the restriction of all change commands globally')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Default restriction is everyone')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('commandtoggle')
                .setDescription('enable/disable a command')
                .addStringOption(option =>
                    option
                        .setName('command')
                        .setDescription('command to enable/disable')
                        .setRequired(true)
                        .addChoices(
                            { name: 'changename', value: 'changename' },
                            { name: 'changeicon', value: 'changeicon' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('view the current config')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const serverid = interaction.guildId;
        const serverConfig = JSON.parse(fs.readFileSync('./serverConfig.json'));

        // check if user has permission to use the command manage server permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        // check if server is in serverConfig.json
        if (!serverConfig[serverid]) {
            // serverConfig[serverid] = {"commandRestrict":null,"cooldown":"3600000","layout":"{newname} | {username}","changename":false,"changeicon":false};
            serverConfig[serverid] = {};
            fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
        }
        // make sure the subcommand is valid then input the data into the json file without overwriting old data
        if (subcommand === 'layout') {
            let layout = serverConfig[serverid]['layout'] = interaction.options.getString('value');
            fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
            // update to nice embed and use data to show how it should look after changing the layout
            let layoutFinal = replaceAll(layout, '{newname}', interaction.guild.name)
            layoutFinal = replaceAll(layoutFinal, '{username}', interaction.user.username)
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription(`Layout changed to \`${layout}\`\n\nExample: \`${layoutFinal}\``)
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'cooldown') {
            let cooldown = serverConfig[serverid]['cooldown'] = interaction.options.getInteger('value');
            fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
            //convert value to human readable
            if (cooldown === 0) { cooldown = 'none' }
            if (cooldown === 3600000) { cooldown = '1 hour' }
            if (cooldown === 7200000) { cooldown = '2 hours' }
            if (cooldown === 14400000) { cooldown = '4 hours' }
            if (cooldown === 21600000) { cooldown = '6 hours' }
            if (cooldown === 36000000) { cooldown = '10 hours' }
            if (cooldown === 43200000) { cooldown = '12 hours' }
            if (cooldown === 86400000) { cooldown = '24 hours' }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription(`Cooldown set to \`${cooldown}\``)
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'commandrestrict') {
            let commandRestrict = serverConfig[serverid]['commandRestrict'] = interaction.options.getRole('role').id;
            fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription('All commands will be restricted to <@&' + commandRestrict + '>')
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'commandtoggle') {
            // check if the command is already enabled or disabled
            // check to see if the command is enabled or not and toggle it
            if (serverConfig[serverid][interaction.options.getString('command')] == true || serverConfig[serverid][interaction.options.getString('command')] == undefined) {
                serverConfig[serverid][interaction.options.getString('command')] = false;
                fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setDescription(`Command ${interaction.options.getString('command')} has been disabled`)
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                serverConfig[serverid][interaction.options.getString('command')] = false;
                fs.writeFileSync('./serverConfig.json', JSON.stringify(serverConfig));
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setDescription(`Command ${interaction.options.getString('command')} has been enabled`)
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (subcommand === 'view') {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Current config is:')
                .setDescription('```json\n' + JSON.stringify(serverConfig[serverid], null, 2)+'```');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}