import { Command } from "../util/Command";
import { SlashCommandBuilder, SlashCommandStringOption, CommandInteraction, ColorResolvable } from "discord.js";
import { Factions } from "../util/factionUtil";
import { Faction } from "../util/FactionOOP";

// Command to create a faction:
export const cmd: Command = {
  name: "create-faction",
  description: "Found a new faction",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name)
    .setDescription(cmd.description)
    .addStringOption((option: SlashCommandStringOption) =>
      option.setName("faction-name").setDescription("The name of the faction").setRequired(true))
    .addStringOption((option: SlashCommandStringOption) =>
      option.setName("faction-colour").setDescription("The colour the faction will use (good hex please)").setRequired(true)),
  execute: async (interaction: CommandInteraction) => {
    // Faction name and colour are required so these hopefully should never be undefined
    const faction_name: string | undefined = interaction.options.get("faction-name")?.value?.toString();
    let nameUsed: boolean = false;
    Factions.map((fac: Faction) => {
      if (fac.name === faction_name && !nameUsed && fac.attachedGuild == interaction.guild) nameUsed = true;
    });
    if (nameUsed) {
      interaction.reply(`The name "*${faction_name}*" is already taken.`);
      return;
    }

    const faction_colour_txt: `#${string}` | undefined = `#${interaction.options.get("faction-colour")?.value?.toString().replaceAll('#', '')}`;
    let faction_colour: ColorResolvable = [0, 0, 0];
    const validationRegex: RegExp = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    if (faction_colour_txt != undefined && validationRegex.test(faction_colour_txt)) faction_colour = faction_colour_txt;
    if (faction_name != undefined && faction_colour_txt != undefined && interaction.guild != null) {
      const fac: Faction = new Faction(faction_name, faction_colour, interaction.user, interaction.guild);
      await fac.ctor(interaction.user);
      Factions.push(fac);
    } // This might not be needed
    interaction.reply(`Faction: "${faction_name}" successfully created!`);
  }
}


