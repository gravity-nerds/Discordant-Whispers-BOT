
import { autocompletes } from "./autocomplete"
import { Client, IntentsBitField, REST, Routes, Guild } from "discord.js"
import { Command } from "./util/Command"
import * as dotenv from "dotenv"
import * as fs from "fs"
import { clientCache, loadData, gameGuilds } from "./util/factionUtil"
import { Schedules } from "./schedule";
import * as Path from "path";
dotenv.config()

const config: any = require("../config.json")
const TOKEN: any = process.env.TOKEN

if (!fs.existsSync('session')) { fs.mkdirSync("session") }
if (!fs.existsSync('session/guildroles.json')) { fs.writeFileSync('session/guildroles.json', '{}') }
if (!fs.existsSync('session/factions.json')) { fs.writeFileSync('session/factions.json', '[]') }
let schedules: Schedules = new Schedules();

const Rest = new REST({ version: '9' }).setToken(TOKEN);


const client: Client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildMessages
  ]
})

//CLEAR ALL SLASH COMMANDS ON START
Rest.put(Routes.applicationGuildCommands(config["client-id"], config["dev-server"]), { body: [] })
  .then(() => console.log("Guild Commands RESET!")).catch(console.error);
Rest.put(Routes.applicationCommands(config["client-id"]), { body: [] })
  .then(() => console.log("Client Commands RESET!")).catch(console.error);

let cmds: { [key: string]: Command } = {}

let filenames: string[] = [];
const recursiveCMDsearch = (dir: string) => {
  fs.readdirSync(dir).forEach((name: string) => {
    const absolute: string = Path.join(dir, name);
    if (fs.statSync(absolute).isDirectory()) return recursiveCMDsearch(absolute);
    else return filenames.push(absolute);
  });
}

async function uploadCommands() {
  let rest: Array<any> = []

  recursiveCMDsearch(`${__dirname}/commands`);
  filenames.forEach(filename => {
    const cmd: Command = require(filename).cmd
    rest.push(cmd.command())
    cmds[cmd.name] = cmd
  });

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
  client.guilds.fetch()

  // Pull client caches out to global scope
  clientCache.guilds = client.guilds.cache;
  clientCache.users = client.users;

  loadData();
  uploadCommands()

  client.on('interactionCreate', (interaction) => {
    client.guilds.fetch()

    // Pull client caches out to global scope
    clientCache.guilds = client.guilds.cache;
    clientCache.users = client.users;

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
