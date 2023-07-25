import { Command } from "../util/Command";
import { SlashCommandBuilder, CommandInteraction, GuildMemberRoleManager, Guild, APIInteractionGuildMember, GuildMember, Role, User, Message, MessageReaction, Collection } from "discord.js";
import { gameGuilds, getUserFaction, sealEmoji } from "../util/factionUtil";
import { Faction } from "../util/FactionOOP";

// Command to disband a faction:
export const cmd: Command = {
  name: "disband-faction",
  description: "Disband a faction you are the leader of. Also requires permission from your deputy",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    const FAC: Faction | undefined = await disbandValidation(interaction);
    if (FAC == undefined) return; // Informin the user of the "error" is done in disbandValidation

    console.log(`Attempting to disband faction: ${FAC.name}, it's deputy is: ${FAC.deputy}`); //LOG
    //Facion is valid to attempt to disband!  
    if (FAC.deputy != null) await disbandDeputyApproval(interaction, FAC);
    else {
      console.log(`${FAC.name} has no deputy :)`); //LOG
      FAC.Disband();
      interaction.reply(`**${FAC.name} has been disbanded.**`);
    }
  }
}

const disbandValidation = async (interaction: CommandInteraction): Promise<Faction | undefined> => {
  console.log(`Interaction member: ${interaction.member?.user.username}, guild: ${interaction.guild?.name}`); //LOG
  if (interaction.member == null || interaction.guild == null) return;
  const user: GuildMember | APIInteractionGuildMember = interaction.member;
  const guild: Guild = interaction.guild;
  const leaderRole: Role | undefined = gameGuilds.get(guild)?.leaderRole;
  console.log(`Leader role: ${leaderRole}, is user.roles a GuildMemberRoleManager? ${user.roles instanceof GuildMemberRoleManager}\n\t${user.roles.valueOf().toString()}`); //LOG
  if (leaderRole == undefined ||
    !(user.roles instanceof GuildMemberRoleManager)) return;
  // By this point the interaction is ok

  //So go through the roles and see if they are a leader
  console.log("Interating through the user's role's cache:"); //LOG
  let isLeader: boolean = false;
  user.roles.cache.map((element: Role) => {
    console.log(`\t${element.name}, ${element.id}, isleader: ${element.equals(leaderRole)}`); //LOG
    isLeader = isLeader ? true : element.equals(leaderRole);
  });
  if (!isLeader) { interaction.reply("You do not have the permissions for this."); return; }

  const FAC: Faction | undefined = getUserFaction(user, guild);
  console.log(`Leader found! Their faction is: ${FAC?.name}`); //LOG
  if (FAC == undefined) { interaction.reply("You must be a member of a faction to disband it."); return; }

  return FAC;
}

const disbandDeputyApproval = async (interaction: CommandInteraction, fac: Faction) => {
  console.log(`Deputy found: ${fac.deputy!.username}`); //LOG
  console.log(`Interaction ID in fun: ${interaction.id}`); //LOG
  const filter = (reaction: MessageReaction, user: User) => {
    console.log(`User ID: ${user.id}, Members: ${fac.members}, EmojiID: ${reaction.emoji.id}, ApprovalID: ${sealEmoji.id}`); //LOG
    return fac.members.includes(user) && reaction.emoji.id === sealEmoji.id;
  }

  const msg: Message = await interaction.reply({
    content: `**<@${fac.leader.id}> is attempting to disband ${fac.name}!**\n\t*<@${fac.deputy!.id}>: to confirm this please react with: <:${sealEmoji.name}:${sealEmoji.id}> within* **24hrs.**`,
    fetchReply: true
  });

  const hours24: number = 86400000;
  const mins2: number = 120000; //TEMP for testing
  msg.awaitReactions({ filter: filter, time: mins2 })
    .then((col: Collection<string, MessageReaction>) => {
      console.log(`Collection complete!\n\t${col.toJSON()}`); //LOG
      col.forEach(async (reaction: MessageReaction) => {
        console.log(`\tR: ${reaction.emoji.name} x${reaction.count}`); //LOG
        const users: Collection<string, User> = await reaction.users.fetch();
        console.log(`\tPeople who sent: ${users.toJSON()}`); //LOG
        console.log(`Is one the deputy? ${users.has(fac.deputy!.id)}`); //LOG
        if (!users.has(fac.deputy!.id)) return;

        // Only now do we disband the faction!
        fac.Disband();
        interaction.editReply(`**${fac.name.toUpperCase()} HAS BEEN DISBANDED!**`);
      });
    });
}
