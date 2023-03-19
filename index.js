const untis = require('./webuntis_api/untis.js');
const fs = require('fs');
const crypto = require('crypto');
// ical lib
const ical = require('ical-generator');

const thunderbird_loc = "C:\\Program Files\\Mozilla Thunderbird\\thunderbird.exe";

// import lib for system commands
const { exec } = require('child_process');

async function main() {
    await untis.login();

    const storecal = "./untis-cal-integration-host";

    let cal1 = await untis.getWeeklyTimetableICAL(new Date()).split("\n");
    let cal2 = await untis.getWeeklyTimetableICAL(new Date(new Date().setDate(new Date().getDate() + 7))).split("\n");
    let cal3 = await untis.getWeeklyTimetableICAL(new Date(new Date().setDate(new Date().getDate() + 14))).split("\n");
    let cal4 = await untis.getWeeklyTimetableICAL(new Date(new Date().setDate(new Date().getDate() + 21))).split("\n");

    let call_collection = [cal1, cal2, cal3, cal4];

    // merge the ical files
    let cal = ical({domain: 'webuntis.com', name: 'WebUntis Timetable', prodId: {company: 'WebUntis', product: 'WebUntis Timetable', language: 'EN'}});

    call_collection.forEach((cal) => {
        cal.forEach((line) => {
            if (line.startsWith("BEGIN:VEVENT")) {
                cal.createEvent({
                    start: new Date(line.split("DTSTART:")[1].split("T")[0]),
                    end: new Date(line.split("DTEND:")[1].split("T")[0]),
                    summary: line.split("SUMMARY:")[1].split("\\n")[0],
                    description: line.split("DESCRIPTION:")[1].split("\\n")[0],
                    location: line.split("LOCATION:")[1].split("\\n")[0],
                    uid: crypto.createHash('md5').update(line.split("UID:")[1].split("\\n")[0]).digest("hex")
                });
            }
        });
    });

    // write the ical file to timetable.ical
    fs.writeFileSync(storecal + '/timetable.ical', cal.toString());

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