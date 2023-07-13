import { Command } from "../util/Command";
import { SlashCommandBuilder, CommandInteraction, Guild } from "discord.js";
import { setupGuild, gameGuilds } from "../util/factionUtil";

// Initialise a server:
export const cmd: Command = {
  name: "init",
  description: "Set up a server for the game",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    const guild: Guild | null = interaction.guild;
    if (guild == null) {interaction.reply("Game failed to create because the guild is null"); return;}
    else if (gameGuilds.has(guild)) {interaction.reply(`${guild.name} is already a game server`); return;}
    else setupGuild(guild);
  }
}


