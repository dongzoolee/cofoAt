const cheerioClient = require('cheerio-httpcli');
const { createEventAdapter } = require('@slack/events-api');

require('dotenv').config();
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackBotToken = process.env.SLACK_BOT_TOKEN;
const slackEvents = createEventAdapter(slackSigningSecret);
const port = process.env.PORT || 3000;

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('message', (event, res) => {
    if (!event.bot_profile) {
        console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
        findTier(event.channel, event.text)
    }

});

(async () => {
    const server = await slackEvents.start(port);
    console.log(`Listening for events on ${server.address().port}`);
})();

const { WebClient, LogLevel } = require("@slack/web-api");


// WebClient insantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.
const client = new WebClient({
    token: slackBotToken,
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG
});
// ID of the channel you want to send the message to

function findTier(channel, id) {
    let url = "https://codeforces.com/api/user.info?handles=" + id;

    cheerioClient.fetch(url, {}, (err, $, result) => {
        if (err) return;
        let pInfo = JSON.parse($.html()).result;
        if (pInfo == undefined) {
            console.log('no id!')
            return;
        }else{
            sendMsg(channel, pInfo[0].rank +" "+ pInfo[0].rating +" :tada:");
        }
    })
    

}

async function sendMsg(id, text) {
    try {
        // Call the chat.postMessage method using the built-in WebClient
        const result = await client.chat.postMessage({
            // The token you used to initialize your app
            token: slackBotToken,
            channel: id,
            text: text
            // You could also use a blocks[] array to send richer content
        });

        // Print result, which includes information about the message (like TS)
        // console.log(result);
    }
    catch (error) {
        console.error(error);
    }
}
