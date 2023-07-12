import { Guild, GuildMember } from "discord.js";
import { Faction } from "./FactionOOP";
import { Role, APIInteractionGuildMember } from "discord.js"

type leader_deputy_roles = {
  leaderRole: Role,
  deputyRole: Role
}

export var gameGuilds = new Map<Guild, leader_deputy_roles>();
export var Factions: Faction[];

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

export const getUserFaction = (usr: GuildMember | APIInteractionGuildMember): Faction | undefined=> {
  let f: Faction | undefined;
  for (let i: number = 0; i < Factions.length; i++) {
    let roleName: string | undefined = Factions[i].factionRole?.name;
    if (roleName == undefined) continue;
    if (usr instanceof GuildMember) //This is weird and jank.
      if (usr.roles.cache.has(roleName) && 
      usr.guild == Factions[i].attachedGuild) {
        f = Factions[i];
        break;
      }
    else if (usr.roles.cache.has(roleName) && usr.guild == Factions[i].attachedGuild) {
      f = Factions[i];
      break;
    }
  }
  return f;
}
