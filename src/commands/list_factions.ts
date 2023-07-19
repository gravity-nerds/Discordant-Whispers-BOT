import { Command } from "../util/Command";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Faction } from "../util/FactionOOP";
import { Factions } from "../util/factionUtil";

export const cmd: Command = {
  name: "list-factions",
  description: "Create a list of all factions on the server.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    if (Factions.length <= 0) {
      interaction.reply("**There are no factions.**");
      return;
    }
    let factionLS: string = "**All factions:**\n";
    Factions.forEach(
      (fac: Faction) => {factionLS += `    *${fac.name}*\n`}
    );
    interaction.reply(factionLS);
  }
}
