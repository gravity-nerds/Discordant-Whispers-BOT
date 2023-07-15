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
    console.log("Attempting to disband a faction"); //LOG
    if (interaction.member == null || interaction.guild == null) return;
    const user: GuildMember | APIInteractionGuildMember = interaction.member;
    const guild: Guild = interaction.guild;
    const leaderRole: Role | undefined = gameGuilds.get(guild)?.leaderRole;
    console.log(`User: ${user.user.username}, Guild: ${guild.name}`); //LOG
    let success: boolean = false;
    if (leaderRole != undefined && 
    user.roles instanceof GuildMemberRoleManager ) { 
      user.roles.cache.map((element: Role) => {
        if (element.equals(leaderRole)) {
          console.log("User has the role!");
          const FAC: Faction | undefined = getUserFaction(user, guild);
          console.log(FAC?.name);
          if (FAC != undefined) {
            FAC.Disband();
            console.log("Faction disbanded!");
            interaction.reply(`**${FAC.name} has been disbanded.**`);
            success = true;
          }
        }
      });
      if (!success) interaction.reply("Disbanding failed.");
    }
  }
}
