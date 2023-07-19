import { Command } from "../util/Command";
import { SlashCommandBuilder, CommandInteraction, GuildMemberRoleManager, Guild, APIInteractionGuildMember, GuildMember, Role } from "discord.js";
import { gameGuilds, getUserFaction } from "../util/factionUtil";
import { Faction } from "../util/FactionOOP";

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
    let success: boolean = false;
    if (leaderRole != undefined && 
    user.roles instanceof GuildMemberRoleManager ) 
      user.roles.cache.map((element: Role) => {
        if (element.equals(leaderRole)) {
          const FAC: Faction | undefined = getUserFaction(user, guild);
          if (FAC != undefined) {
            FAC.Disband();
            interaction.reply(`**${FAC.name} has been disbanded.**`);
            success = true;
          }
        }
      });
      if (!success) interaction.reply("Disbanding failed.");
  }
}
