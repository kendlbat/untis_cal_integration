const express = require('express');
const app = express();

const untis = require('./untis');

app.get("/timetable", async (req, res) => {
    let weeks = req.query.weeks;
    if (weeks == null) weeks = 1;
    weeks = parseInt(weeks);
    if (weeks < 1) weeks = 1;
    if (weeks > 4) weeks = 4;

    let username = req.query.username;
    let password = req.query.password;
    let school = req.query.school;
    let baseurl = req.query.baseurl;

    if (username == null || password == null || school == null || baseurl == null) {
        res.status(400).send("Missing required query params");
        return;
    }

    try {
        await untis.login(school, username, password, baseurl);
    } catch {
        res.status(400).send();
    }

    let basedate = untis.util.getNextMonday(new Date());
    let tempcal;
    let cal_collection = [];

    try {
        for (let i = 0; i < weeks; i++) {
            tempcal = (await untis.getWeeklyTimetableICAL(basedate)).replace(/\r?\nEND:VCALENDAR/g, "").split("BEGIN:VEVENT");
            tempcal.shift();
            cal_collection.push(tempcal);
            basedate = untis.util.getNextMonday(new Date(basedate.getTime() + 7 * 24 * 60 * 60 * 1000));
        }
    } catch (e) {
        console.error(e);
        res.status(400).send("An unknown error occured");
    }

    let cal = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WebUntis//WebUntis//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:WebUntis\nX-WR-TIMEZONE:Europe/Berlin\nX-WR-CALDESC:WebUntis\nREFRESH-INTERVAL;VALUE=DURATION:P1H\n";

    for (let i = 0; i < cal_collection.length; i++) {
        for (let j = 0; j < cal_collection[i].length; j++) {
            cal += "BEGIN:VEVENT" + cal_collection[i][j];
        }
    }

    cal += "END:VCALENDAR";

    res.set("Content-Type", "text/calendar");
    res.send(cal);
    await untis.logout();
});

app.get("/kendltimetable", async (req, res) => {
    // weeks
    let weeks = req.query.weeks;
    if (weeks == null) weeks = 1;
    weeks = parseInt(weeks);
    if (weeks < 1) weeks = 1;
    if (weeks > 4) weeks = 4;

    try {
        await untis.login();
    } catch (e) {
        console.error(e);
        res.status(400).send();
    }

    console.log("Logged in");

    let basedate = untis.util.getNextMonday(new Date());
    let tempcal;
    let cal_collection = [];

    try {
        for (let i = 0; i < weeks; i++) {
            tempcal = (await untis.getWeeklyTimetableICAL(basedate)).replace(/\r?\nEND:VCALENDAR/g, "").split("BEGIN:VEVENT");
            tempcal.shift();
            cal_collection.push(tempcal);
            basedate = untis.util.getNextMonday(new Date(basedate.getTime() + 7 * 24 * 60 * 60 * 1000));
        }
    } catch (e) {
        console.error(e);
        res.status(400).send("An unknown error occured");
    }

    let cal = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WebUntis//WebUntis//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:WebUntis\nX-WR-TIMEZONE:Europe/Berlin\nX-WR-CALDESC:WebUntis\nREFRESH-INTERVAL;VALUE=DURATION:P1H\n";

    for (let i = 0; i < cal_collection.length; i++) {
        for (let j = 0; j < cal_collection[i].length; j++) {
            cal += "BEGIN:VEVENT" + cal_collection[i][j];
        }
    }

    cal += "END:VCALENDAR";

    res.set("Content-Type", "text/calendar");
    res.send(cal);
    await untis.logout();
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});