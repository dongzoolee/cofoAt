var getCofo = module.exports = {};
const fetch = require("node-fetch");
const cheerioClient = require('cheerio-httpcli');
const { resolve } = require("path");
const sendMsg = require('./sendMsg');

getCofo.tier = (channel, id) => {
    let url = "https://codeforces.com/api/user.info?handles=" + id;

    cheerioClient.fetch(url, {}, (err, $, result) => {
        if (err) {
            if (err.statusCode == 400) {
                sendMsg.text(channel, "Wrong Handle");
                console.log('no id!')
                return;
            }
        } else {
            let pInfo = JSON.parse($.html()).result;
            sendMsg.text(channel, pInfo[0].rank + " " + pInfo[0].rating + " :tada:");
        }
    })
}

getCofo.contest = () => {
    let url = "https://codeforces.com/api/contest.list?gym=false";
    cheerioClient.fetch(url, {}, (err, $, result) => {
        console.log('received');
        return JSON.parse($.html()).result;
    })
}

getCofo.userCng = (contId, users) => { return doit(contId, users) }
async function doit(contId, users) {
    let ret = [];
    let handle, data;

    let url;
    let cheerwait = (id) => {
        return new Promise((resolve, reject) => {
            fetch(url).then((result) => {
                result.json().then(async (res) => {
                    await new Promise(resolv => { handle = id, data = res.result; resolv(); });
                    await Promise.all(
                        data.reverse().map((val1, key1) => {
                            if (val1.contestId === contId) {
                                console.log('insert')
                                ret.push({
                                    handle: handle,
                                    old: val1.oldRating,
                                    new: val1.newRating
                                });
                                return false;
                            }
                        })
                    );
                    resolve();
                })
            })
        })
    }

    let promises = Object.keys(users).map(async (val, key) => {
        url = "https://codeforces.com/api/user.rating?handle=" + val;
        await cheerwait(val);
    })

    await Promise.all(promises)
    console.log('return')
    return ret;
}
// ~~async는 await이 return 되기를 기다림~~
// await은 new Promise()를 기다림
// new Promise()는 resolve(...)을 기다림
getCofo.contCngChk = (id) => { return get(id); }
async function get(contId) {
    let url = "https://codeforces.com/api/contest.ratingChanges?contestId=" + contId;
    let ret = new Promise((res, rej) => {
        cheerioClient.fetch(url, {}, (err, $, result) => {
            if (!err) {
                res(true)
            } else {
                res(false)
            }
        })
    });
    let ans = await ret;
    return ans;
}