const express = require('express');
const app = express();
require('dotenv').config();
const body = require('body-parser');
const cheerioClient = require('cheerio-httpcli');
const { createEventAdapter } = require('@slack/events-api');
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackEvents = createEventAdapter(slackSigningSecret);
const port = process.env.PORT || 3000;

const sendMsg = require('./sendMsg');
const getCofo = require('./getCofo');

app.use('/slack/msg', slackEvents.requestListener());

slackEvents.on('message', (event, res) => {
    if (!event.bot_profile) {
        console.log('received');
        getCofo.tier(event.channel, event.text)
    }
})

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEvents.on('error', (error) => {
    console.log(error.name); // TypeError
});

app.use(body.json());
app.use(body.urlencoded({ extended: true }));

// cf today
// cf week
// cf month
// cf handle

// cf alert on cf
// cf alert on cf+edu
// cf alert off
// cf djs100201 on
// cf djs100201 off
// or
let alertOnCont = [];
let alertOnUsers = [];
app.use('/slack/slash', (req, res) => {
    let data = req.body;
    let parsedData = data.text.split(' ');
    if (parsedData.length >= 2) {
        if (parsedData[0] == "alert") {
            if (parsedData[1] == "on") {
                if (alertOnCont.indexOf(data.channel_id) != -1) {
                    sendMsg.text(data.channel_id, "Already receiving Contest alert");
                } else {
                    alertOnCont.push(data.channel_id);
                    sendMsg.text(data.channel_id, "Receive CodeForces Content alert");
                }
            } else if (parsedData[1] == "off") {
                if (alertOnCont.indexOf(data.channel_id) == -1) {
                    sendMsg.text(data.channel_id, "Already not receiving Contest alert");
                } else {
                    alertOnCont.splice(alertOnCont.indexOf(data.channel_id), 1);
                    sendMsg.text(data.channel_id, "Don't receive CodeForces Contest alert");
                }
            }
        } else {
            // handle alert!
            if (parsedData[1] == "on") {
                if (alertOnUsers[parsedData[0]] == undefined) {
                    alertOnUsers[parsedData[0]] = []
                    alertOnUsers[parsedData[0]].push(data.channel_id);
                    sendMsg.text(data.channel_id, "Receive CodeForces alert of " + parsedData[0]);
                } else {
                    alertOnUsers[parsedData[0]].push(data.channel_id);
                    sendMsg.text(data.channel_id, "Receive CodeForces alert of " + parsedData[0]);
                }
            } else if (parsedData[1] == "off") {
                if (alertOnUsers[parsedData[0]] == undefined) {
                    sendMsg.text(data.channel_id, "Already not receiving CodeForces alert of " + parsedData[0]);
                } else if (alertOnUsers[parsedData[0]].indexOf(data.channel_id) == -1) {
                    sendMsg.text(data.channel_id, "Already not receiving CodeForces alert of " + parsedData[0]);
                } else {
                    alertOnUsers[parsedData[0]].splice(alertOnUsers[parsedData[0]].indexOf(data.channel_id), 1)
                    sendMsg.text(data.channel_id, "Don't receive CodeForces alert of " + parsedData[0]);
                }
            }
        }
    } else if (parsedData.length == 1) {
        if (parsedData[0] == "today") {
            let now = Date.now() / 1000;
            let ret = [];
            pInfo.map((val, idx) => {
                if (val.startTimeSeconds < now) {
                    return false;
                } else if (val.startTimeSeconds < now + 86400) {
                    ret.push(val.name);
                }
            })
            if (ret.length == 0) {
                sendMsg.text(data.channel_id, "no contest in 24 hours");
            } else {
                let str = "";
                ret.map((val, idx) => {
                    if (idx == 0) {
                        str += val;
                    } else {
                        str += "\n" + val;
                    }
                })
                sendMsg.text(data.channel_id, str + " is uphead!");
            }
        } else if (parsedData[0] == "week") {
            let now = Date.now() / 1000;
            let ret = [];
            pInfo.map((val, idx) => {
                if (val.startTimeSeconds < now) {
                    return false;
                } else if (val.startTimeSeconds < now + 604800) {
                    ret.push(val.name);
                }
            })
            if (ret.length == 0) {
                sendMsg.text(data.channel_id, "no contest in 7 days");
            } else {
                let str = "";
                ret.map((val, idx) => {
                    if (idx == 0) {
                        str += val;
                    } else {
                        str += "\n" + val;
                    }
                })
                sendMsg.text(data.channel_id, str + " is uphead!");
            }
        } else if (parsedData[0] == "month") {
            let now = Date.now() / 1000;
            let ret = [];
            pInfo.map((val, idx) => {
                if (val.startTimeSeconds < now) {
                    return false;
                } else if (val.startTimeSeconds < now + 2592000) {
                    ret.push(val.name);
                }
            })
            if (ret.length == 0) {
                sendMsg.text(data.channel_id, "no contest in 30 days");
            } else {
                let str = "";
                ret.map((val, idx) => {
                    if (idx == 0) {
                        str += val;
                    } else {
                        str += "\n" + val;
                    }
                })
                sendMsg.text(data.channel_id, str + " is uphead!");
            }
        } else {
            getCofo.tier(data.channel_id, parsedData[0]);
        }
    }
    res.end('')
})



// get contest info on server start
pInfo = getCofo.contest();

// send message about contest info
let uphead = [];
let upheadChk = [];
const cryil = /[а-яА-ЯЁё]/;
setInterval(() => {
    let url = "https://codeforces.com/api/contest.list?gym=false";
    cheerioClient.fetch(url, {}, (err, $, result) => {
        pInfo = JSON.parse($.html()).result;
        pInfo.map((val, idx) => {
            // 아직 안들어간 대회 있으면 큐에 넣기
            if (val.phase == "BEFORE" && upheadChk[val.id] == undefined) {
                if (!cryil.test(val.name)) {
                    upheadChk[val.id] = 1;
                    uphead.push(val);
                }
            }
        })

        let now = Date.now() / 1000;
        let untilWhen = -1;
        let contRet = "";
        let stTimeRet = "";
        uphead.map((val, idx) => {
            if (now + 86400 >= val.startTimeSeconds) {
                untilWhen = idx;
                contRet += val.name + "\n";
                let tmp = new Date(val.startTimeSeconds * 1000).toLocaleString();
                tmp = tmp.substring(tmp.indexOf('.') + 2)
                tmp = tmp.substring(0, tmp.length - 3)
                tmp = tmp.replace('.', '월')
                tmp = tmp.replace('.', '일')
                tmp = tmp.replace(':', '시 ')
                tmp += '분';
                stTimeRet += tmp + "\n";
            }
        })
        if (contRet != "") {
            alertOnCont.map((val, idx) => {
                sendMsg.text(val, contRet + "\n" + stTimeRet);
            })
            uphead.splice(0, untilWhen + 1);
            // }
        }
        console.log('received');
    });
}, 5000);

// send message when contest rating changes
setInterval(() => {
    console.log('alertonusers : ', alertOnUsers);
    if (alertOnUsers)
        getCofo.contCngChk(1471).then(done => {
            if (done) {
                getCofo.userCng(1471, alertOnUsers)
                .then(res=>{
                    console.log(res);
                })
                .catch(console.error());
            } else {
                console.log('not yet')
            }
        });
}, 5000)


const server = app.listen(port, () => {
    console.log('started on port ' + port);
});