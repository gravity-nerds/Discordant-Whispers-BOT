import { User, Guild, ColorResolvable, RoleResolvable } from "discord.js"

class Faction {

  attachedGuild: Guild;

  // Properties
  name: string;
  colour: ColorResolvable;
  members: User[] = [];
  leader: User;
  deputy: User | null;
  // This shouldn't be undefined but it's not 100% defined in the constructor
  factionRole: RoleResolvable | undefined;  
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

    this.createFactionRole();
    //The faction role only exists after this point

    this.Join(creator)
  }

  async createFactionRole() {
    if (this.factionRole == undefined)
      this.factionRole = await this.attachedGuild.roles.create({
        name: this.name,
        color: this.colour,
        reason: `The role to designate members of ${this.name}`
      });
  }

  Join(newUser: User) {
    if (!this.blacklist.includes(newUser) && 
      this.factionRole != undefined && 
      !this.members.includes(newUser)) {
        this.members.push(newUser);
        this.attachedGuild.members.addRole(newUser, this.factionRole, `${newUser.username} has joined ${this.name}`)
    }
  }

  Leave(user: User, exhile: boolean = false) {
    if (this.factionRole != undefined && this.members.includes(user)) {
      this.attachedGuild.members.removeRole(user, this.factionRole, `${user.username} has left ${this.name}`)
      const i = this.members.indexOf(user);
      if (i > -1) this.members.splice(i, 1);
      if (exhile) this.blacklist.push(user);
    }
  }
}
