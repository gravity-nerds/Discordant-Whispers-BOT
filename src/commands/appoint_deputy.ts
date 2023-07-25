import { CommandInteraction, SlashCommandBuilder, SlashCommandUserOption, Role, Guild, GuildMemberRoleManager, GuildMember, APIInteractionGuildMember, User } from "discord.js"
import { Command } from "../util/Command"
import { gameGuilds, getUserFaction } from "../util/factionUtil";
import { Faction } from "../util/FactionOOP";

export const cmd: Command = {
  name: "appoint-deputy",
  description: "Assign a deputy to a faction you lead.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description)
    .addUserOption((option: SlashCommandUserOption) =>
      option.setName("deputy").setDescription("The faction member you would like to appoint.").setRequired(true)),
  execute: async (interaction: CommandInteraction) => {
    // Get guild, user and leader role and return if invalid
    if (interaction.member == null || interaction.guild == null) return;
    const guild: Guild = interaction.guild;
    const user: GuildMember | APIInteractionGuildMember = interaction.member;
    const leaderRole: Role | undefined = gameGuilds.get(guild)?.leaderRole;
    if (leaderRole == undefined || !(user.roles instanceof GuildMemberRoleManager)) return;

    // Check if the user is a guild leader
    let isLeader: boolean = false;
    user.roles.cache.forEach((val: Role) => {
      isLeader = isLeader ? true : val.id === leaderRole.id;
    });
    if (!isLeader) { interaction.reply("You do not have the permissions to perform this."); return; }

    // Get the faction the user is the leader of
    const fac: Faction | undefined = getUserFaction(user, guild);
    if (fac == undefined) { interaction.reply("You are not a member of a faction."); return; }

    const targetUser: User | null = interaction.options.getUser("deputy");
    if (targetUser == null) { interaction.reply("No deputy has been provided."); return; }
    if (!fac.members.includes(targetUser)) { interaction.reply(`${targetUser.username} is not a member of ${fac.name}.`); return; }
    fac.AssignDeputy(targetUser);
    interaction.reply(`${targetUser.username} is now the deputy of ${fac.name}.`);
  }
}
