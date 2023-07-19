import { Command } from "../util/Command";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { saveData } from "../util/factionUtil";

export const cmd: Command = {
  name: "stop",
  description: "Stop the bot.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
     
    const whitelist: string[] = ['410455293265444873', '612325551079686273']; // balaro4242 and droshux
    if (!whitelist.includes(interaction.user.id)) {
      interaction.reply("**You don't have the permissions for that**");
      return;
    }

    saveData();
    await interaction.reply("**Bot stopping!**");
    process.exit(0);
  }
}
