import { Guild, GuildMember, User, APIUser, ColorResolvable, Collection, UserManager } from "discord.js";
import { Faction } from "./FactionOOP";
import { Role, APIInteractionGuildMember } from "discord.js"
import * as fs from "fs";

export type leader_deputy_roles = {
  leaderRole: Role,
  deputyRole: Role
}

export let gameGuilds = new Map<Guild, leader_deputy_roles>();
export let Factions: Faction[] = [];

// Pulling client caches to the global scope
type client_caches = {
  guilds?: Collection<string, Guild>,
  users?: UserManager
}
export let clientCache: client_caches = {};

export async function setupGuild(g: Guild) {
  gameGuilds.set(g, {
    leaderRole: await g.roles.create({
      name: "Leader",
      color: "Gold",
      reason: `The faction leader role for ${g.name}`
    }),
    deputyRole: await g.roles.create({
      name: "Deputy",
      color: "DarkGold",
      reason: `The faction deputy role for ${g.name}`
    }),
  });
}

export const getUserFaction = (usr: GuildMember | APIInteractionGuildMember,
  guild: Guild): Faction | undefined => {
  let U: User | APIUser = usr.user;
  let f: Faction | undefined;
  Factions.map((Fac: Faction) => {
    if (U instanceof User &&
      Fac.members.includes(U) &&
      guild.equals(Fac.attachedGuild))
      f = Fac;
  });
  return f;
}

export type bareFaction = {
  attachedGuild: string,
  name: string,
  color: ColorResolvable,
  members: string[],
  leader: string,
  deputy: string,
  role?: string,
  leaderActivity: number,
  blacklist: string[]
}

const fromJSON = async (json: string) => {
  let bareFactions: bareFaction[];
  try { bareFactions = JSON.parse(json); } // Get data from text
  catch (e: any) {
    console.log("An error has occurred while parsing JSON from session/factions.json.");
    console.log(" - Most likely cause: invalid or empty JSON file");
    return;
  }

  bareFactions.forEach(async (fac: bareFaction) => {

    // Some pieces require extra processing
    const guild: Guild | undefined = clientCache.guilds?.get(fac.attachedGuild);
    if (guild == undefined) { console.log(`${fac.attachedGuild} is an undefined guild!`); return; }
    const leader: User | undefined = await clientCache.users?.fetch(fac.leader);
    if (leader == undefined) { console.log(`${fac.leader} is an undefined user!`); return; }

    // Create the faction
    const F = new Faction(
      fac.name,
      fac.color,
      leader,
      guild
    );
    await F.ctor(leader, fac.role);

    // Populate with existing members
    fac.members.forEach((uname: string) => {
      const member: GuildMember | undefined = guild.members.cache.get(uname);
      if (member != undefined) {
        F.Join(member.user);
      }
    });

    // Set the deputy if there is one
    if (fac.deputy == "") F.deputy = null
    else {
      const deputy: User | undefined = guild.members.cache.get(fac.deputy)?.user;
      if (deputy != undefined)
        F.deputy = deputy;
    }


    // Put the finished faction into the list
    Factions.push(F);
  });
}

type bare_leader_deputy_roles = {
  leaderRolerID: string,
  deputyRoleID: string
}
const guildRolesToJSON = (): string => {
  let bare_guildRoles: any = {};
  gameGuilds.forEach((key, val) => {
    const rolepair: bare_leader_deputy_roles = {
      leaderRolerID: key.leaderRole.id,
      deputyRoleID: key.deputyRole.id
    }
    console.log(JSON.stringify(rolepair));
    bare_guildRoles[val.id] = rolepair;
  });
  return JSON.stringify(bare_guildRoles);
}
const guildRolesFromJSON = (json: string) => {
  type FileData = { [guildID: string]: bare_leader_deputy_roles };
  const bare_guildRoles: FileData = JSON.parse(json);
  gameGuilds = new Map<Guild, leader_deputy_roles>();
  for (let guildID in bare_guildRoles) {
    const guild: Guild | undefined = clientCache.guilds?.get(guildID);
    if (guild != undefined) {
      const leaderRole: Role | undefined = guild.roles.cache.get(bare_guildRoles[guildID].leaderRolerID);
      const deputyRole: Role | undefined = guild.roles.cache.get(bare_guildRoles[guildID].deputyRoleID);
      if (leaderRole != undefined && deputyRole != undefined)
        gameGuilds.set(guild, {
          leaderRole: leaderRole,
          deputyRole: deputyRole
        });
    }
  }
}

export const saveData = () => {
  // Save guild roles
  fs.writeFileSync("session/guildroles.json", guildRolesToJSON());

  // Save factions
  let factionJSONs: bareFaction[] = [];
  Factions.forEach((fac: Faction) => factionJSONs.push(fac.toJSON()));
  fs.writeFileSync("session/factions.json", JSON.stringify(factionJSONs));
}

export const loadData = async () => {
  // Load guild roles
  console.log("Loading guildroles from file..."); //LOG
  guildRolesFromJSON(fs.readFileSync("session/guildroles.json", "utf-8"));
  console.log("Guildroles loaded!"); //LOG 
  // Load factions
  console.log("Loading factions from file..."); //LOG
  await fromJSON(fs.readFileSync("session/factions.json", "utf-8"));
  console.log("Factions loaded!"); //LOG
}
