import { CronJob } from 'cron';
import { saveData } from './util/factionUtil';

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

  }
  hour() { // Fires at the start of every hour
    saveData();
  }

  minute() { // Fires every minute

  }
}



export { Schedules }
