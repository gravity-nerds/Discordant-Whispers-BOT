import { CommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../../util/Command";
import { getFactionByName, getUserFaction } from "../../util/factionUtil";
import { Faction } from "../../util/FactionOOP";

export const cmd: Command = {
  name: "join",
  description: "Join an existing faction.",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description)
    .addStringOption((option: SlashCommandStringOption) => option
      .setName("faction-name")
      .setDescription("The name of the faction you would like to join.")
      .setRequired(true)
    ),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.user == null || interaction.guild == null || interaction.member == null) return;

    // Get the name of the faction the user wants to join
    const faction_name: string | undefined = interaction.options.get("faction-name")?.value?.toString();
    if (faction_name == undefined) { interaction.reply("*No faction name given.*"); return; }

    // Get the existing faction of the user if there is one and leave it if so
    const currentFaction: Faction | undefined = getUserFaction(interaction.member, interaction.guild);
    if (currentFaction != undefined) currentFaction.Leave(interaction.user);

    // Get the new faction and if it fails report an error.
    const newFaction: Faction | undefined = getFactionByName(faction_name, interaction.guild);
    if (newFaction == undefined) {
      interaction.reply(`*The faction ${faction_name} does not exist...*\n
Consider using \`/list-factions\` to find the correct name.`);
      return;
    }

    // And add them to the faction!
    const result: "SUCCESS" | "FAILURE" = await newFaction.Join(interaction.user);
    if (result === "SUCCESS") interaction.reply(`**Welcome to ${newFaction.name}!**`);
    else interaction.reply(`**Failed to join ${newFaction.name}...**\n
Either you are blacklisted from the faction or are already a member.`);
  }
}
