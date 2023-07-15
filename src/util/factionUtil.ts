import { Guild, GuildMember, User, APIUser, ColorResolvable, Collection } from "discord.js";
import { Faction } from "./FactionOOP";
import { Role, APIInteractionGuildMember } from "discord.js"

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

export const fromJSON = (json: string): Faction | void => {
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
