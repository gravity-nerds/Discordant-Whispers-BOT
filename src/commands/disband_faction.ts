import { Command } from "../util/Command";
import { SlashCommandBuilder, CommandInteraction, GuildMemberRoleManager, Guild, APIInteractionGuildMember, GuildMember, Role } from "discord.js";
import { gameGuilds, getUserFaction } from "../util/factionUtil";

// Command to disband a faction:
export const cmd: Command = {
  name: "disband-faction",
  description: "Disband a faction you are the leader of. Also requires permission from your deputy",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
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
