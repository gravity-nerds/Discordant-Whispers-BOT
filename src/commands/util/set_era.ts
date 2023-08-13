import { Command } from "../../util/Command";
import { CommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { gameGuilds, getUserFaction } from "../../util/factionUtil";
import { Faction } from "../../util/FactionOOP"

export const cmd: Command = {
  name: "set-era",
  description: "Set the era to be displayed in the daily message (Leader only)",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description)
    .addStringOption((option: SlashCommandStringOption) =>
      option.setName("new-era").setDescription("The name of the new era.").setRequired(true)
    ),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.guild == null || interaction.member == null) return;

    if (!gameGuilds.has(interaction.guild)) { interaction.reply(`*${interaction.guild.name} has not been initialised.*`); return; }

    const F: Faction | undefined = getUserFaction(interaction.member, interaction.guild);
    if (F == undefined ||
      !F.leader.equals(interaction.user)) { interaction.reply("*Only faction leaders can set the era.*"); return; }

    const newname = interaction.options.get("new-era")?.value;
    if (newname == undefined ||
      newname.toString().trim().length === 0) { interaction.reply("No new era name given..."); return; }

    gameGuilds.get(interaction.guild)!.dateData.Era = newname.toString();

    interaction.reply(`Era updated to: ${newname.toString()}`);
  }
}
