import { Command } from "../../util/Command";
import { SlashCommandBuilder, CommandInteraction, Guild } from "discord.js";
import { gameGuilds } from "../../util/factionUtil";

// Initialise a server:
export const cmd: Command = {
  name: "init",
  description: "Set up a server for the game",
  command: () => new SlashCommandBuilder()
    .setName(cmd.name).setDescription(cmd.description),
  execute: async (interaction: CommandInteraction) => {
    const guild: Guild | null = interaction.guild;
    if (guild == null) { interaction.reply("Game failed to create because the guild is null"); return; }
    else if (gameGuilds.has(guild)) { interaction.reply(`${guild.name} is already a game server`); return; }
    else {
      setupGuild(guild);
      interaction.reply(`${guild.name} is now ready!`);
    }
  }
}

export async function setupGuild(g: Guild) {
  gameGuilds.set(g, {
    leaderRole: await g.roles.create({
      name: "Leader",
      color: "Default",
      reason: `The faction leader role for ${g.name}`
    }),
    deputyRole: await g.roles.create({
      name: "Deputy",
      color: "Default",
      reason: `The faction deputy role for ${g.name}`
    }),
    sealEmoji: await g.emojis.create({
      attachment: "seal.png",
      name: "approval",
      reason: `The seal emoji for ${g.name}`
    })
  });
}
