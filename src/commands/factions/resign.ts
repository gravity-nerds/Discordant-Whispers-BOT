import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import { Command } from "../../util/Command"
import { Faction } from "../../util/FactionOOP";
import { getUserFaction } from "../../util/factionUtil";

export const cmd: Command = {
  name: "resign",
  description: "Resign from any position you hold in a faction",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.user == null || interaction.member == null || interaction.guild == null) return;

    const userFaction: Faction | undefined = getUserFaction(interaction.member, interaction.guild);
    if (userFaction == undefined) { interaction.reply("You are currently not a member of a faction."); return; }

    let leaderRes, deputyRes: boolean = false;

    if (userFaction.leader.equals(interaction.user)) {
      userFaction.LeaderResign();
      leaderRes = true;
    }

    if (userFaction.deputy?.equals(interaction.user)) {
      userFaction.DeputyResign()
      deputyRes = true;
    }
    const newDeputyTXT: string = (leaderRes && userFaction.deputy != null) ? `\n*<@${userFaction.deputy.id}> is the new leader!*` : "";

    if (!leaderRes && !deputyRes) { interaction.reply("You are neither the leader nor the deputy of your faction."); return; }

    interaction.reply(`<@${interaction.user.id}> is no longer the 
${leaderRes ? "leader" : ""}${(leaderRes && deputyRes) ? " and " : ""}${deputyRes ? "deputy" : ""}
of ${userFaction.name}.${newDeputyTXT}`);
  }
}
