import { Command } from "src/util/Command"
import { APIInteractionGuildMember, ColorResolvable, Role, CommandInteraction, Guild, GuildMember, GuildMemberRoleManager, SlashCommandBuilder, SlashCommandStringOption } from "discord.js"
import { Faction } from "src/util/FactionOOP"
import { gameGuilds, Factions, setupGuild, getUserFaction } from "src/util/factionUtil"

export const cmd: Command = {
    name: "ping",
    description: "ping-pong",
    command: () => {
        return new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description)
    },
    execute: async (interaction) => {
        interaction.reply("Pong")
    }
}

// Initialise a server:
export const init: Command = {
  name: "init",
  description: "Set up a server for the game",
  command: () => new SlashCommandBuilder()
    .setName(init.name).setDescription(init.description),
  execute: async (interaction: CommandInteraction) => {
    const guild: Guild | null = interaction.guild;
    if (guild == null) {interaction.reply("Game failed to create because the guild is null"); return;}
    else if (gameGuilds.has(guild)) {interaction.reply(`${guild.name} is already a game server`); return;}
    else setupGuild(guild);
  }
}

// Command to create a faction:
export const makefaction: Command = {
  name: "create-faction",
  description: "Found a new faction",
  command: () => new SlashCommandBuilder()
    .setName(makefaction.name)
    .setDescription(makefaction.description)
    .addStringOption((option: SlashCommandStringOption) => 
      option.setName("faction-name").setDescription("The name of the faction").setRequired(true))
    .addStringOption((option: SlashCommandStringOption) =>
      option.setName("faction-colour").setDescription("The colour the faction will use (good hex please)").setRequired(true)),
  execute: async (interaction: CommandInteraction) => {
    // Faction name and colour are required so these hopefully should never be undefined
    const faction_name: string | undefined = interaction.options.get("faction-name")?.value?.toString();
    const faction_colour_txt: `#${string}` | undefined = `#${interaction.options.get("faction-colour")?.value?.toString()}`;
    let faction_colour: ColorResolvable = [0, 0, 0];
    const validationRegex: RegExp = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    if (faction_colour_txt != undefined && validationRegex.test(faction_colour_txt)) faction_colour = faction_colour_txt;
    if (faction_name != undefined && faction_colour_txt != undefined && interaction.guild != null) // This might not be needed
      Factions.push(new Faction(faction_name, faction_colour, interaction.user, interaction.guild));
    interaction.reply(`Faction: "${faction_name}" successfully created!`);
  }
}

// Command to disband a faction:
export const rmfaction: Command = {
  name: "disband-faction",
  description: "Disband a faction you are the leader of. Also requires permission from your deputy",
  command: () => new SlashCommandBuilder()
    .setName(rmfaction.name).setDescription(rmfaction.description),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.member == null || interaction.guild == null) return;
    const user: GuildMember | APIInteractionGuildMember = interaction.member;
    const guild: Guild = interaction.guild;
    const leaderRole: Role | undefined = gameGuilds.get(guild)?.leaderRole;
    if (user.roles instanceof GuildMemberRoleManager && leaderRole != undefined &&
      user.roles.cache.has(leaderRole.name))
      getUserFaction(user)?.Disband();
  }
}
