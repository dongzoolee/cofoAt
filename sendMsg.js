var sendMsg = module.exports = {};

const { WebClient, LogLevel } = require("@slack/web-api");
require('dotenv').config();
const slackBotToken = process.env.SLACK_BOT_TOKEN;


// WebClient insantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.
const client = new WebClient({
    token: slackBotToken,
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG
});

sendMsg.text = async (id, text) => {
    try {
        // Call the chat.postMessage method using the built-in WebClient
        const result = await client.chat.postMessage({
            // The token you used to initialize your app
            token: slackBotToken,
            channel: id,
            text: text
            // blocks: [
            //     {
            //         type: "section",
            //         text: {
            //             type: "mrkdwn",
            //             text: "님의 레이팅입니다"
            //         },
            //     }
            // ],
            // attachments: [
            //     {
            //         "text": text
            //     }
            // ]
            // You could also use a blocks[]  array to send richer content
        });
        // Print result, which includes information about the message (like TS)
        // console.log(result);
    }
    catch (error) {
        console.error(error);
    }
}
