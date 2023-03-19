const untis = require('./webuntis_api/untis.js');
const fs = require('fs');
const crypto = require('crypto');

const thunderbird_loc = "C:\\Program Files\\Mozilla Thunderbird\\thunderbird.exe";

// import lib for system commands
const { exec } = require('child_process');

async function main() {
    await untis.login();
    fs.writeFileSync('timetable.ical', await untis.getWeeklyTimetableICAL(new Date()));

    var stashhash = crypto.randomUUID();

    exec('git stash push -m "res_timetablestash-' + stashhash + '"', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(stdout);
    });

    exec('git add timetable.ical', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(stdout);
    });

    exec('git commit -m "Update timetable"', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(stdout);
    });

    exec('git push', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(stdout);
    });

    exec('git stash pop "stash@{0}"', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(stdout);
    });

    await untis.logout();
}

if (require.main === module) {
    main();
}