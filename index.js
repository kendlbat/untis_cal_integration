const untis = require('./webuntis_api/untis.js');
const fs = require('fs');
const crypto = require('crypto');

const thunderbird_loc = "C:\\Program Files\\Mozilla Thunderbird\\thunderbird.exe";

// import lib for system commands
const { exec } = require('child_process');

async function main() {
    await untis.login();

    const storecal = "./untis-cal-integration-host";

    let cal1 = (await untis.getWeeklyTimetableICAL(new Date())).replace("END:VCALENDAR", "").split("BEGIN:VEVENT");
    cal1.shift();
    let cal2 = (await untis.getWeeklyTimetableICAL(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000))).replace("END:VCALENDAR", "").split("BEGIN:VEVENT");
    cal2.shift();
    let cal3 = (await untis.getWeeklyTimetableICAL(new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000))).replace("END:VCALENDAR", "").split("BEGIN:VEVENT");
    cal3.shift();
    let cal4 = (await untis.getWeeklyTimetableICAL(new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000))).replace("END:VCALENDAR", "").split("BEGIN:VEVENT");
    cal4.shift();

    let call_collection = [cal1, cal2, cal3, cal4];

    console.log(call_collection);

    let cal = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WebUntis//WebUntis//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:WebUntis\nX-WR-TIMEZONE:Europe/Berlin\nX-WR-CALDESC:WebUntis\n";

    for (let i = 0; i < call_collection.length; i++) {
        for (let j = 0; j < call_collection[i].length; j++) {
            cal += "BEGIN:VEVENT" + call_collection[i][j];
        }
    }

    cal += "END:VCALENDAR";

    console.log(cal);

    // write the ical file to timetable.ical
    fs.writeFileSync(storecal + '/timetable.ical', cal);

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

    await untis.logout();
}

if (require.main === module) {
    main();
}