import { CommandInteraction } from "discord.js"

interface CommandFuction {
    (interaction: CommandInteraction): void
}

interface Builder {
    (): any
}

export interface Command {
    name: string
    description: string
    command: Builder

    execute: CommandFuction
}