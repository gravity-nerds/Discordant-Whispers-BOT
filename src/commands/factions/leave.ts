import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../util/Command";
import { Faction } from "../../util/FactionOOP";
import { getUserFaction } from "../../util/factionUtil";

export const cmd: Command = {
  name: "leave",
  description: "Leave your current faction.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.member == null || interaction.guild == null) return;

    const userFaction: Faction | undefined = getUserFaction(interaction.member, interaction.guild);
    if (userFaction == undefined) { interaction.reply("*You are currently not a memeber of a faction.*"); return; }

    userFaction.Leave(interaction.user);
    console.log(" - - - About to send leave reply..."); //LOG
    interaction.reply({
      content: `*You have successfully left ${userFaction.name}!*`,
      ephemeral: true
    });
  }
}
