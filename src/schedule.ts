import { CronJob } from 'cron';
import { gameGuilds, guild_data, saveData } from './util/factionUtil';
import { Collection, Guild, NonThreadGuildBasedChannel } from 'discord.js';

class Schedules {
  dayJob: CronJob;
  hourJob: CronJob;
  minuteJob: CronJob;

  constructor() {
    this.dayJob = new CronJob('0 0 7 * * *', async () => {
      this.day()
    });
    this.hourJob = new CronJob('0 0 * * * *', async () => {
      this.hour()
    });
    this.minuteJob = new CronJob('0 * * * * *', async () => {
      this.minute()
    });

    // Start job
    if (!this.dayJob.running) {
      this.dayJob.start();
    }
    if (!this.hourJob.running) {
      this.hourJob.start();
    }
    if (!this.minuteJob.running) {
      this.minuteJob.start();
    }
    console.log("Jobs scheduled.")
  }

  day() { //Fires at 7am UTC
    // Increment the date and season of each guild
    console.log("Running DAILY code:");
    gameGuilds.forEach(async (val: guild_data, key: Guild) => {
      switch (val.dateData.Season) {
        case 'Highthaw':
          val.dateData.Season = 'Brightcrest';
          break;
        case 'Brightcrest':
          val.dateData.Season = 'Hazelhelm';
          break;
        case 'Hazelhelm':
          val.dateData.Season = 'Rimemeet';
          break;
        case 'Rimemeet':
          val.dateData.Season = 'Highthaw';
          val.dateData.Year++;
      }
      
      // Send a message
      key.channels.fetch().then((channels: Collection<string, NonThreadGuildBasedChannel | null>) => {
        channels.forEach((chn: NonThreadGuildBasedChannel | null) => {
          if (chn != null && chn.name === 'public-canon' && chn.isTextBased()) 
            chn.send(`
∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆
Today corresponds to **${val.dateData.Season}** of year **${val.dateData.Year}** of the ${val.dateData.Era} era.
∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆∇∆
          `);
        });
      }); 
    });
  }
  hour() { // Fires at the start of every hour
    saveData();
  }

  minute() { // Fires every minute

  }
}



export { Schedules }
