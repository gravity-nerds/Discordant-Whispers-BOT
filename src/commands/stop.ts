import { Command } from "../util/Command";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { saveData } from "../util/factionUtil";

export const cmd: Command = {
  name: "stop",
  description: "Stop the bot.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    saveData();
    await interaction.reply("**Bot stopping!**");
    process.exit(0);
  }
}
