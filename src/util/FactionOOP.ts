import { User, Guild, ColorResolvable, Role } from "discord.js"
import { bareFaction, Factions, gameGuilds, leader_deputy_roles } from "./factionUtil";


export class Faction {

  attachedGuild: Guild;

  // Properties
  name: string;
  colour: ColorResolvable;
  members: User[] = [];
  leader: User;
  deputy: User | null = null;
  // This shouldn't be undefined but it's not 100% defined in the constructor
  factionRole: Role | undefined;  
  // The time (irl days) since the leader last messaged 
  leaderActivity: number = 0; 
  blacklist: User[] = [];

  constructor(name: string, colour: ColorResolvable, creator: User, guild: Guild) {
    // Copy some values from constructor args
    this.name = name;
    this.colour = colour;
    this.attachedGuild = guild;
    
    this.leader = creator;
    this.deputy = null;

    this.ctor(name, colour, creator, guild);
  }

  async ctor(name: string, colour: ColorResolvable, creator: User, guild: Guild) {
    await this.createFactionRole();
    //The faction role only exists after this point

    const leaderRole: Role | undefined = gameGuilds.get(this.attachedGuild)?.leaderRole
    if (leaderRole != undefined)
      this.attachedGuild.members.addRole({
        user: creator,
        role: leaderRole,
        reason: `${creator} is the leader of ${this.name}`
      })
    this.Join(creator)

    console.log(this.toJSON()); //LOG
  }

  async createFactionRole() {
    // If a role on the guild with the name of the faction exists
    // then don't create a new role, just use the existing one.
    // However this assumes that faction role names always match 
    // faction names. So hopefully noone messes this up...
    if (this.attachedGuild.roles.cache.has(this.name)) 
      this.factionRole = this.attachedGuild.roles.cache.get(this.name);
    else if (this.factionRole == undefined)
      this.factionRole = await this.attachedGuild.roles.create({
        name: this.name,
        color: this.colour,
        reason: `The role to designate members of ${this.name}`
      });
  }

  Disband() {
    if (this.factionRole != undefined)
      this.attachedGuild.roles.delete(this.factionRole, 
        `The faction "${this.name}" has been disbanded.`);
    const role_pair: leader_deputy_roles | undefined = gameGuilds.get(this.attachedGuild);
    if (role_pair!= undefined) {
      this.attachedGuild.members.removeRole({
        user: this.leader,
        role: role_pair.leaderRole,
        reason: `The faction "${this.name}" has been disbanded so can't have a leader.` 
      });
      if (this.deputy != null) this.attachedGuild.members.removeRole({
        user: this.deputy,
        role: role_pair.deputyRole,
        reason: `The faction "${this.name}" has been disbanded so can't havea deputy.`
      });
    }
    const i = Factions.indexOf(this);
    if (i > -1) Factions.splice(i, 1);
  }

  Join(newUser: User) {
    const notBlacklisted: boolean = !this.blacklist.includes(newUser);
    const factionRoleDefined: boolean = this.factionRole != undefined;
    const notInFaction: boolean = !this.members.includes(newUser);
    if (notBlacklisted && factionRoleDefined && notInFaction && this.factionRole != undefined) {
      this.members.push(newUser);
      this.attachedGuild.members.addRole({
        user: newUser,
        role: this.factionRole,
        reason: `${newUser.username} has joined ${this.name}`
      });
    }
  }

  Leave(user: User, exhile: boolean = false) {
    if (this.factionRole != undefined && this.members.includes(user)) {
      this.attachedGuild.members.removeRole({
        user: user,
        role: this.factionRole,
        reason: `${user.username} has left ${this.name}`
      })
      const i = this.members.indexOf(user);
      if (i > -1) this.members.splice(i, 1);
      if (exhile) this.blacklist.push(user);
    }
  }

  AssignDeputy(user: User) {
    const deputyRole: Role | undefined = gameGuilds.get(this.attachedGuild)?.deputyRole;
    if (deputyRole == undefined) return;
    if (this.deputy != null) 
      this.attachedGuild.members.removeRole({
        user: this.deputy,
        role: deputyRole,
        reason: `${this.deputy.username} is no longer the deputy of ${this.leader.username}`
      });
    this.deputy = user;
    this.attachedGuild.members.addRole({
      user: user,
      role: deputyRole,
      reason: `${user.username} is now the deputy of ${this.leader.username}`
    });
  }

  toJSON(): string {
    // Build the list of usernames and blacklisted users
    let memberNames: string[] = [];
    this.members.map((usr: User) => memberNames.push(usr.username));
    let blackNames: string[] = [];
    this.blacklist.map((usr: User) => blackNames.push(usr.username));
    // Deal with the deputy being null
    const deputyName = (this.deputy == null)? "" : this.deputy.username;
    
    // Build the simpler version of the faction
    const fac: bareFaction = {
      attachedGuild: this.attachedGuild.id,
      name: this.name,
      color: this.colour,
      members: memberNames,
      leader: this.leader.id,
      deputy: deputyName,
      role: this.factionRole?.name,
      leaderActivity: this.leaderActivity,
      blacklist: blackNames
    };
    return JSON.stringify(fac);
  }
}
