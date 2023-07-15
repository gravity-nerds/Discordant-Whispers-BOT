import { Guild, GuildMember, User, APIUser, ColorResolvable, Collection } from "discord.js";
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
type client_caches= { 
  guilds?: Collection<string, Guild>,
  users?: Collection<string, User> 
}
export let clientCache: client_caches= {}; 

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
    })
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

const fromJSON = (json: string): Faction | void => {
  const fac: bareFaction = JSON.parse(json); // Get data from text

  // Some pieces require extra processing
  const guild: Guild | undefined = clientCache.guilds?.get(fac.attachedGuild);
  if (guild == undefined) return;
  const leader: User | undefined = clientCache.users?.get(fac.leader);
  if (leader == undefined) return;

  // Create the faction
  return new Faction(
    fac.name,
    fac.color,
    leader,
    guild
  );
}

type bare_leader_deputy_roles = {
  leaderRolerID: string,
  deputyRoleID: string
}
const guildRolesToJSON = (): string => {
  // let bare_guildRoles = new Map<string, bare_leader_deputy_roles>();
  let bare_guildRoles: any = {};
  gameGuilds.forEach((key , val) => {
    console.log(`Guild: ${val.name} has roles: ${key.leaderRole.name} and ${key.deputyRole.name}`) //LOG
    const rolepair: bare_leader_deputy_roles = {
      leaderRolerID: key.leaderRole.id,
      deputyRoleID: key.deputyRole.id
    } 
    console.log(JSON.stringify(rolepair));
    bare_guildRoles[val.id] = rolepair;
  });
  console.log(JSON.stringify(bare_guildRoles)); //LOG
  return JSON.stringify(bare_guildRoles);
}
const guildRolesFromJSON = (json: string) => {
  const bare_guildRoles: Map<string, bare_leader_deputy_roles> = JSON.parse(json);
  gameGuilds = new Map<Guild, leader_deputy_roles>();
  bare_guildRoles.forEach((key, val) => {
    const guild: Guild | undefined = clientCache.guilds?.get(val);
    if (guild != undefined) {
      const leaderRole: Role | undefined = guild.roles.cache.get(key.leaderRolerID);
      const deputyRole: Role | undefined = guild.roles.cache.get(key.deputyRoleID);
      if (leaderRole != undefined && deputyRole != undefined)
        gameGuilds.set(guild, {
          leaderRole: leaderRole,
          deputyRole: deputyRole
        });
    }
  });
}

export const saveData = () => {
  // Save guild roles
  fs.writeFileSync("session/guildroles.json", guildRolesToJSON()); 

  // Save factions
  let factionJSONs: string[] = [];
  Factions.forEach((fac: Faction) => factionJSONs.push(fac.toJSON()));
  fs.writeFileSync("session/factions.json", JSON.stringify(factionJSONs));
}

export const loadData = () => {
  // Load guild roles
  guildRolesFromJSON(fs.readFileSync("session/guildroles.json", "utf-8"));

  // Load factions
  fromJSON(fs.readFileSync("session/factions.json", "utf-8"));
}
