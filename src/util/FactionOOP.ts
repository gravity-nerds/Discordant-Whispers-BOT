import { User, Guild, ColorResolvable, Role, GuildMemberManager, Collection, GuildMember, ChannelType, PermissionsBitField, CategoryChannel } from "discord.js"
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
  category: CategoryChannel | undefined;

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

    const leaderRole: Role | undefined = gameGuilds.get(this.attachedGuild)?.leaderRole;
    const guildMembers: Collection<string, GuildMember> = await this.attachedGuild.members.fetch();
    const creatorMember: GuildMember | undefined = guildMembers.get(creator.id);
    if (leaderRole != undefined && creatorMember != undefined &&
      !creatorMember.roles.cache.has(leaderRole.id)) {
      console.log(`About to add ${leaderRole.name} to ${creator.username}`); //LOG
      this.attachedGuild.members.addRole({
        user: creator,
        role: leaderRole,
        reason: `${creator} is the leader of ${this.name}`
      });
    }
    this.Join(creator)

    // If the required category doesn't exist in the server then create it
    // PRAY that the category name is always the name of the faction
    const channels = await this.attachedGuild.channels.fetch();
    if (!channels.find(ch => ch!.name === this.name))
      this.createChannels()
  }

  async createChannels() {
    // Get the leader and deputy roles
    const leaderRole: Role | undefined = gameGuilds.get(this.attachedGuild)?.leaderRole;
    const deputyRole: Role | undefined = gameGuilds.get(this.attachedGuild)?.deputyRole;
    if (leaderRole == undefined || deputyRole == undefined) return;

    // Create the category to contain the channels
    this.category = await this.attachedGuild.channels.create({
      name: `${this.name}`,
      reason: "Every faction has a category containing it's channels",
      type: ChannelType.GuildCategory,
      topic: `The private correspondences and plans of ${this.name}`,
      permissionOverwrites: [
        {
          id: this.factionRole!.id,
          allow: PermissionsBitField.Default
        },
        {
          id: this.attachedGuild.roles.everyone,
          deny: PermissionsBitField.All
        },
        {
          id: leaderRole,
          allow: [PermissionsBitField.Flags.ManageNicknames, PermissionsBitField.Flags.ManageThreads]
        },
        {
          id: deputyRole,
          allow: [PermissionsBitField.Flags.ManageNicknames, PermissionsBitField.Flags.ManageThreads]
        }
      ]
    });

    // Create all the other channels
    this.attachedGuild.channels.create({
      name: `${this.name}-ooc`,
      reason: "Every faction has an out of character channel",
      type: ChannelType.GuildText,
      parent: this.category,
      topic: "A place to discuss secret plans or just chill out"
    });

    this.attachedGuild.channels.create({
      name: `${this.name}-in-character`,
      reason: "Every faction has an in character channel",
      type: ChannelType.GuildText,
      parent: this.category,
      topic: "A place to argue/debate, plan or hang out in character"
    });

    this.attachedGuild.channels.create({
      name: `${this.name} VC`,
      reason: "Every faction has a voice channel",
      type: ChannelType.GuildVoice,
      parent: this.category,
      topic: "A voice call for in and out of character conversation",
      permissionOverwrites: [
        {
          id: leaderRole,
          allow: [
            PermissionsBitField.Flags.PrioritySpeaker,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.DeafenMembers
          ]
        },
        {
          id: deputyRole,
          allow: [
            PermissionsBitField.Flags.PrioritySpeaker,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.DeafenMembers
          ]
        },
        {
          id: this.attachedGuild.roles.everyone,
          deny: PermissionsBitField.Flags.ViewChannel
        }
      ]
    });
  }

  async createFactionRole(existingRole: string | undefined) {
    const roleCache = await this.attachedGuild.roles.fetch();
    if (existingRole == undefined)
      this.factionRole = await this.attachedGuild.roles.create({
        name: this.name,
        color: this.colour,
        reason: `The role to designate members of ${this.name}`
      });
    else if (roleCache.has(existingRole))
      this.factionRole = roleCache.get(existingRole);
  }

  Disband() {
    console.log(`Disbanding ${this.name}`); //LOG
    // Remove leader and deputy roles from leader/deputy
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
        reason: `The faction "${this.name}" has been disbanded so can't have a deputy.`
      });
    }

    // Remove the faction role for all members
    // This conveniently locks faction channels as a side effect
    this.members.forEach((member: User) => {
      if (this.factionRole != undefined)
        this.attachedGuild.members.removeRole({
          user: member,
          role: this.factionRole,
          reason: `The faction ${this.name} has been disbanded and so has no members`
        });
    });

    // However the category needs to be made readable to @everyone
    this.category?.permissionOverwrites.edit(this.attachedGuild.roles.everyone, { ReadMessageHistory: true });

    // Remove this faction from the list
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
    let memberIDs: string[] = [];
    this.members.map((usr: User) => memberIDs.push(usr.id));
    let blackNames: string[] = [];
    this.blacklist.map((usr: User) => blackNames.push(usr.id));
    // Deal with the deputy being null
    const deputyID: string = (this.deputy == null) ? "" : this.deputy.id;

    // Build the simpler version of the faction
    const fac: bareFaction = {
      attachedGuild: this.attachedGuild.id,
      name: this.name,
      color: this.colour,
      members: memberIDs,
      leader: this.leader.id,
      deputy: deputyID,
      role: this.factionRole?.id,
      leaderActivity: this.leaderActivity,
      blacklist: blackNames
    };
    // return JSON.stringify(fac);
    return fac;
  }
}
