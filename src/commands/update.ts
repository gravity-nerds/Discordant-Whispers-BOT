import { Command } from "../util/Command"
import {  SlashCommandBuilder } from "discord.js"

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
