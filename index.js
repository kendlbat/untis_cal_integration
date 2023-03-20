const untis = require('./untis.js');
const fs = require('fs');

const thunderbird_loc = "C:\\Program Files\\Mozilla Thunderbird\\thunderbird.exe";

// import lib for system commands
const { exec } = require('child_process');

async function pushToGit(storecal) {
    exec('cd ' + storecal + ' && git add ./timetable.ical', (err, stdout, stderr) => {
        console.log(stdout);
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });

    exec('cd ' + storecal + ' && git commit -m "Update timetable"', (err, stdout, stderr) => {
        console.log(stdout);
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });

    exec('cd ' + storecal + ' && git push', (err, stdout, stderr) => {
        console.log(stdout);
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
}

async function main() {
    await untis.login();

    const storecal = "./untis-cal-integration-host";

    let basedate = untis.util.getNextMonday(new Date());

    console.log("Getting week: " + basedate.toISOString().split('T')[0]);
    let cal1 = (await untis.getWeeklyTimetableICAL(basedate)).replace(/\r?\nEND:VCALENDAR/g, "").split("BEGIN:VEVENT");
    cal1.shift();
    basedate = untis.util.getNextMonday(new Date(basedate.getTime() + 7 * 24 * 60 * 60 * 1000));
    console.log("Getting week: " + basedate.toISOString().split('T')[0]);
    let cal2 = (await untis.getWeeklyTimetableICAL(basedate)).replace(/\r?\nEND:VCALENDAR/g, "").split("BEGIN:VEVENT");
    cal2.shift();
    basedate = untis.util.getNextMonday(new Date(basedate.getTime() + 7 * 24 * 60 * 60 * 1000));
    console.log("Getting week: " + basedate.toISOString().split('T')[0]);
    let cal3 = (await untis.getWeeklyTimetableICAL(basedate)).replace(/\r?\nEND:VCALENDAR/g, "").split("BEGIN:VEVENT");
    cal3.shift();
    basedate = untis.util.getNextMonday(new Date(basedate.getTime() + 7 * 24 * 60 * 60 * 1000));
    console.log("Getting week: " + basedate.toISOString().split('T')[0]);
    let cal4 = (await untis.getWeeklyTimetableICAL(basedate)).replace(/\r?\nEND:VCALENDAR/g, "").split("BEGIN:VEVENT");
    cal4.shift();

    let call_collection = [cal1, cal2, cal3, cal4];

    let cal = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WebUntis//WebUntis//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:WebUntis\nX-WR-TIMEZONE:Europe/Berlin\nX-WR-CALDESC:WebUntis\nREFRESH-INTERVAL;VALUE=DURATION:P1H\n";

    for (let i = 0; i < call_collection.length; i++) {
        for (let j = 0; j < call_collection[i].length; j++) {
            cal += "BEGIN:VEVENT" + call_collection[i][j];
        }
    }

    cal += "END:VCALENDAR";

    let oldcal = fs.readFileSync(storecal + '/timetable.ical', 'utf8').replace(/^DTSTAMP:.*$/mg, "");

    if (oldcal.localeCompare(cal.replace(/^DTSTAMP:.*$/mg, "")) == 0) {
        console.log("No changes detected, exiting...");
        process.exit(0);
    }

    console.log("Changes:");

    let oldcal_lines = oldcal.split("\n");
    let cal_lines = cal.replace(/^DTSTAMP:.*$/mg, "").split("\n");

    for (let i = 0; i < oldcal_lines.length; i++) {
        if (oldcal_lines[i].localeCompare(cal_lines[i]) != 0) {
            console.log("  -" + oldcal_lines[i]);
            console.log("  +" + cal_lines[i]);
            console.log("\n");
        }
    }

    // write the ical file to timetable.ical
    fs.writeFileSync(storecal + '/timetable.ical', cal);

    pushToGit(storecal);

    await untis.logout();
}

if (require.main === module) {
    main();
}
