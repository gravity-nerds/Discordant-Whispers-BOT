import { Command } from "@/src/util/Command";
import { SlashCommandBuilder, CommandInteraction, GuildMemberRoleManager, Guild, APIInteractionGuildMember, GuildMember, Role, User, Message, MessageReaction, Collection, ReactionCollector, Emoji } from "discord.js";
import { gameGuilds, getUserFaction } from "@/src/util/factionUtil";
import { Faction } from "@/src/util/FactionOOP";

// Command to disband a faction:
export const cmd: Command = {
  name: "disband-faction",
  description: "Disband a faction you are the leader of. Also requires permission from your deputy",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    const FAC: Faction | undefined = await disbandValidation(interaction);
    if (FAC == undefined) return; // Informing the user of the "error" is done in disbandValidation

    //Facion is valid to attempt to disband!  
    if (FAC.deputy != null) await disbandDeputyApproval(interaction, FAC);
    else {
      FAC.Disband();
      interaction.reply(`**${FAC.name} has been disbanded.**`);
    }
  }
}

const disbandValidation = async (interaction: CommandInteraction): Promise<Faction | undefined> => {
  if (interaction.member == null || interaction.guild == null) return;
  const user: GuildMember | APIInteractionGuildMember = interaction.member;
  const guild: Guild = interaction.guild;
  const leaderRole: Role | undefined = gameGuilds.get(guild)?.leaderRole;
  if (leaderRole == undefined ||
    !(user.roles instanceof GuildMemberRoleManager)) return;
  // By this point the interaction is ok

  //So go through the roles and see if they are a leader
  let isLeader: boolean = false;
  user.roles.cache.map((element: Role) => isLeader = isLeader ? true : element.equals(leaderRole));
  if (!isLeader) { interaction.reply("You do not have the permissions for this."); return; }

  const FAC: Faction | undefined = getUserFaction(user, guild);
  if (FAC == undefined) { interaction.reply("You must be a member of a faction to disband it."); return; }

  return FAC;
}

const disbandDeputyApproval = async (interaction: CommandInteraction, fac: Faction) => {
  const sealEmoji: Emoji | undefined = gameGuilds.get(interaction.guild!)?.sealEmoji;
  if (sealEmoji == undefined || sealEmoji.id == null) { interaction.editReply(`*The server ${interaction.guild?.name} has not ben initialised...*`); return; }

  const msg: Message = await interaction.reply({
    content: `**<@${fac.leader.id}> is attempting to disband ${fac.name}!**\n\t*<@${fac.deputy!.id}>: to confirm this please react with: <:${sealEmoji.name}:${sealEmoji.id}> within* **24hrs.**`,
    fetchReply: true
  });

  const hours24: number = 86400000;
  const mins2: number = 120000; //TEMP for testing
  const collector: ReactionCollector = msg.createReactionCollector({ time: mins2 });

  collector.on('end', async (r: Collection<string, MessageReaction>) => {
    // Check if the sealEmoji has been added
    if (!r.has(sealEmoji.id!)) { interaction.editReply("*Deputy failed to approve...*"); return; }
    const sealReaction: MessageReaction = r.get(sealEmoji.id!)!; // And if so get a reference

    // Check if the deputy was one of the users.
    const users: Collection<string, User> = await sealReaction.users.fetch();
    if (!users.has(fac.deputy!.id)) { interaction.editReply("*Deputy failed to approve...*"); return; }

    // Now we can disband!
    fac.Disband();
    interaction.editReply(`**${fac.name.toUpperCase()} HAS BEEN DISBANDED!**`);
  });
}
