import { Command } from "../../util/Command";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Faction } from "../../util/FactionOOP";
import { Factions, gameGuilds } from "../../util/factionUtil";

export const cmd: Command = {
  name: "list-factions",
  description: "Create a list of all factions on the server.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.guild == null) return;

    console.log(`Listing factions in ${interaction.guild.name}, one of ${gameGuilds.size} over all discord.`); //LOG
    if (!gameGuilds.has(interaction.guild)) {
      interaction.reply(`*The server ${interaction.guild} has not been initialised.*\n
Please use \`/init\` to initialise the server.`); //LOG
      return;
    }


    let factionLS: string = "**All factions:**\n";
    let factionCount: number = 0;
    Factions.forEach((fac: Faction) => {
      if (interaction.guild != undefined &&
        fac.attachedGuild.equals(interaction.guild)) {
        factionLS += `    *${fac.name}*\n`
        factionCount++;
      }
    });
    if (factionCount == 0) {
      interaction.reply("**There are no factions.**");
      return;
    } else interaction.reply(factionLS);
  }
}
