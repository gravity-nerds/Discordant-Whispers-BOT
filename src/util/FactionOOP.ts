import { User, Guild, ColorResolvable, Role, GuildMemberManager, Collection, GuildMember } from "discord.js"
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

  }

  public async ctor(creator: User, existingRole: string | undefined = undefined) {
    await this.createFactionRole(existingRole);
    //The faction role only exists after this point

    const leaderRole: Role | undefined = gameGuilds.get(this.attachedGuild)?.leaderRole
    if (leaderRole != undefined &&
      this.attachedGuild.members.cache.get(creator.id)?.roles.cache.has(leaderRole.id)) {
      console.log(`About to add ${leaderRole.name} to ${creator.username}`); //LOG
      this.attachedGuild.members.addRole({
        user: creator,
        role: leaderRole,
        reason: `${creator} is the leader of ${this.name}`
      });
    }
    this.Join(creator)
  }

  async createFactionRole(existingRole: string | undefined) {
    console.log(`--- Creating role for ${this.name}...`); //LOG
    console.log(`--- Role provided: ${existingRole}`); //LOG
    const roleCache = await this.attachedGuild.roles.fetch();
    if (existingRole == undefined) {
      console.log(`--- No existing role provided...`); //LOG
      this.factionRole = await this.attachedGuild.roles.create({
        name: this.name,
        color: this.colour,
        reason: `The role to designate members of ${this.name}`
      });
    }
    else if (roleCache.has(existingRole)) {
      console.log(`--- Existing Role ${existingRole} and is found in ${this.attachedGuild.name}!`); //LOG
      this.factionRole = roleCache.get(existingRole);
    }
  }

  Disband() {
    if (this.factionRole != undefined)
      this.attachedGuild.roles.delete(this.factionRole,
        `The faction "${this.name}" has been disbanded.`);
    const role_pair: leader_deputy_roles | undefined = gameGuilds.get(this.attachedGuild);
    if (role_pair != undefined) {
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

  async Join(newUser: User) {
    const notBlacklisted: boolean = !this.blacklist.includes(newUser);
    const factionRoleDefined: boolean = this.factionRole != undefined;
    const notInFaction: boolean = !this.members.includes(newUser);
    if (notBlacklisted && factionRoleDefined && notInFaction && this.factionRole != undefined) {
      this.members.push(newUser);
      const members: Collection<string, GuildMember> = await this.attachedGuild.members.fetch();
      const hasRole: boolean | undefined = members.get(newUser.id)?.roles.cache.has(this.factionRole.id);
      if (!hasRole)
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
    console.log(`About to add ${deputyRole.name} to ${user.username}`); //LOG
    this.attachedGuild.members.addRole({
      user: user,
      role: deputyRole,
      reason: `${user.username} is now the deputy of ${this.leader.username}`
    });
  }

  toJSON(): bareFaction {
    // Build the list of usernames and blacklisted users
    let memberNames: string[] = [];
    this.members.map((usr: User) => memberNames.push(usr.username));
    let blackNames: string[] = [];
    this.blacklist.map((usr: User) => blackNames.push(usr.username));
    // Deal with the deputy being null
    const deputyName = (this.deputy == null) ? "" : this.deputy.username;

    // Build the simpler version of the faction
    const fac: bareFaction = {
      attachedGuild: this.attachedGuild.id,
      name: this.name,
      color: this.colour,
      members: memberNames,
      leader: this.leader.id,
      deputy: deputyName,
      role: this.factionRole?.id,
      leaderActivity: this.leaderActivity,
      blacklist: blackNames
    };
    // return JSON.stringify(fac);
    return fac;
  }
}
