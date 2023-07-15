
import { autocompletes } from "./autocomplete"
import { Client, IntentsBitField, REST, Routes } from "discord.js"
import { Command } from "./util/Command"
import * as dotenv from "dotenv"
import * as fs from "fs"
import { clientCache } from "./util/factionUtil"



dotenv.config()

const config: any = require("../config.json")
const TOKEN: any = process.env.TOKEN


const Rest = new REST({ version: '9' }).setToken(TOKEN);


const client: Client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds
    ]
})

//CLEAR ALL SLASH COMMANDS ON START
Rest.put(Routes.applicationGuildCommands(config["client-id"], config["dev-server"]), {body: []})
  .then(() => console.log("Commands RESET!")).catch(console.error);

let cmds: { [key: string]: Command } = {}

async function uploadCommands() {
    let rest: Array<any> = []
    
    const filenames: Array<string> = await fs.readdirSync(`${__dirname}/commands`)
    filenames.forEach(filename => {
        const cmd: Command = require(`./commands/${filename}`).cmd
        rest.push(cmd.command())
        cmds[cmd.name] = cmd
    })

    try {
		if (config.mode == "DEV") {
            await Rest.put(
                Routes.applicationGuildCommands(config["client-id"], config["dev-server"]),
                { body: rest }
            );
            console.log('Successfully reloaded application (/) commands.');
        } else if (config.mode == "PRODUCTION") {
            await Rest.put(
                Routes.applicationCommands(config["client-id"]),
                { body: rest }
            )
        }
	} catch (error) {
		console.error(error)
	}
}

client.on("ready", () => {
    console.log(`Bot logged in at ${client.user?.tag}`);

    uploadCommands()


    client.on('interactionCreate', (interaction) => {
        client.guilds.fetch()
  
        // Pull client caches out to global scope
        clientCache.guilds = client.guilds.cache;
        clientCache.users = client.users.cache;

        if (interaction.isCommand()) {
            if (interaction.commandName in cmds) {
                const command = cmds[interaction.commandName]
                command.execute(interaction)
            }
        } else if (interaction.isAutocomplete()) {
            console.log(interaction.commandName)
            if (interaction.commandName in autocompletes) {
                interaction.respond(autocompletes[interaction.commandName])
            } else {
                interaction.respond([])
            }

        }
    })
})

client.login(TOKEN)
