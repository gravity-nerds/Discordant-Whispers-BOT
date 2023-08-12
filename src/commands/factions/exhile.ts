import { gameGuilds, getUserFaction } from "../../util/factionUtil";
import { Command } from "../../util/Command";
import { CommandInteraction, SlashCommandBuilder, SlashCommandUserOption, Emoji, User, Message, CollectorFilter, MessageReaction, ReactionCollector, Collection, DMChannel } from "discord.js";
import { Faction } from "../../util/FactionOOP";

export const cmd: Command = {
  name: "exhile",
  description: "Initiate a vote to exhile a player from your faction.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description)
    .addUserOption((option: SlashCommandUserOption) => option
      .setName("target")
      .setDescription("The faction member you would like to attempt to exhile")
      .setRequired(true)
    ),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.member == null || interaction.guild == null) return;

    const faction: Faction | undefined = getUserFaction(interaction.member, interaction.guild);

    // Validate everything
    if (faction == undefined) { interaction.reply("You are not a member of a faction. Use `/list-factions` to find a faction to `/join`"); return; }
    const targetUser: User | null = interaction.options.getUser("target");
    if (targetUser == null) { interaction.reply("No target has been provided."); return; }
    if (!faction.members.includes(targetUser)) { interaction.reply(`*${targetUser.username} is not a member of ${faction.name}...*`); return; }

    // Prepare to collect reactions
    const sealEmoji: Emoji | undefined = gameGuilds.get(interaction.guild)?.sealEmoji;
    if (sealEmoji == undefined || sealEmoji.id == null) { interaction.editReply(`*The server ${interaction.guild?.name} has not ben initialised...*`); return; }
    const msg: Message = await interaction.reply({
      content: `**<@&${faction.factionRole?.id}>: <@${interaction.user.id}> is attempting to exhile <@${targetUser.id}>!**\n*React with <:${sealEmoji.name}:${sealEmoji.id}> within* **24hrs** *if you believe they should be permanently exhiled.*`,
      fetchReply: true
    });
    await msg.react(sealEmoji.identifier);
    const reactFilter: CollectorFilter<[MessageReaction, User]> = (r: MessageReaction, u: User) =>
      r.emoji.id === sealEmoji.id &&
      faction.members.includes(u) &&
      u.id != interaction.user.id
    const threshold: number = Math.ceil(faction.members.length / 2) - 1 // Min number of reactions needed to exhile.
    const hours24: number = 86400000;
    const mins2: number = 120000; //TEMP for testing

    // Collect reactions and process them after collection is complete
    msg.createReactionCollector({ time: mins2, filter: reactFilter })
      .on('end', async (r: Collection<string, MessageReaction>) => {
        // if reactFilter isn't buggy then only good reactions come through
        if (r.size == 0) interaction.editReply("**No votes**\n*(The vote of the person who called the vote does not count.)*");
        else if (r.size < threshold) interaction.editReply(`**Nay!**\n<@${targetUser.id}> has not been exhiled!`);
        else {
          // The person has been exhiled.
          interaction.editReply(`*Vote result:* **Aye!**\n<:${sealEmoji.name}:${sealEmoji.id}>`);
          faction.Leave(targetUser, true);
          targetUser.createDM().then((chn: DMChannel) => chn.send(`*You have been permanently exhiled from ${faction.name}...*`));
        }
      });
  }
}
