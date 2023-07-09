import { Command } from "src/util/Command"
import { SlashCommandBuilder, Embed } from "@discordjs/builders"

export const cmd: Command = {
    name: "ping",
    description: "ping-pong",
    command: () => {
        return new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description)
    },
    execute: async (interaction) => {
        interaction.reply("Pong")
    }
}

        