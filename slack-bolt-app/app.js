dotenv.config();
import * as dotenv from "dotenv";
import pkg from "@slack/bolt";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cosSimilarity from "cos-similarity";

const { App } = pkg;
const { Client } = pg;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString: connectionString });

// Initializes your app with credentials
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // enable to use socket mode
  appToken: process.env.SLACK_APP_TOKEN,
});

let msg = "";
let user_email = "yashagrawal946@gmail.com";
let Filtered_Meetings = "";

app.message("form", async ({ message, body, say }) => {
  msg = message.ts;

  console.log("Thread ID : ", msg);
  console.log("\n");
  console.log("Body of form : ", body);
  try {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Hi, I am MeetIQ, your intelligent meeting assistant, designed to provide quick answers to all the queries from your past meetings. Let's search the meetings you are referring to. Enter the details below to start.*",
          },
        },
        {
          type: "divider",
        },
        {
          type: "input",
          block_id: "title_block",
          element: {
            type: "plain_text_input",
            action_id: "title_input",
            placeholder: {
              type: "plain_text",
              text: "Enter the title here...",
              emoji: true,
            },
          },
          label: {
            type: "plain_text",
            text: "Do you recall the title of your meeting?",
            emoji: true,
          },
        },
        {
          type: "input",
          element: {
            type: "radio_buttons",
            options: [
              {
                text: {
                  type: "mrkdwn",
                  text: "*Wide search* _( for near about time )_",
                },
                value: "wide_search",
              },
              {
                text: {
                  type: "mrkdwn",
                  text: "*Precise search* _( If u remember the exact month )_",
                },
                value: "precise_search",
              },
            ],
            action_id: "radio_button",
          },
          label: {
            type: "plain_text",
            text: "When did this meeting occur?",
            emoji: true,
          },
        },
        {
          type: "input",
          element: {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select a timeframe",
              emoji: true,
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "This Week",
                  emoji: true,
                },
                value: "This Week",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Last 7 days",
                  emoji: true,
                },
                value: "Last 7 days",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Last Month",
                  emoji: true,
                },
                value: "Last Month",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Last 3 Months",
                  emoji: true,
                },
                value: "Last 3 Months",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Last 6 Months",
                  emoji: true,
                },
                value: "Last 6 Months",
              },
              {
                text: {
                  type: "plain_text",
                  text: "More than 6 Months",
                  emoji: true,
                },
                value: "More than 6 Months",
              },
            ],
            action_id: "timeframe_select",
          },
          label: {
            type: "plain_text",
            text: "Wide search",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "_or_",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Precise search*",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select a month",
                emoji: true,
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "January",
                    emoji: true,
                  },
                  value: "January",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "February",
                    emoji: true,
                  },
                  value: "February",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "March",
                    emoji: true,
                  },
                  value: "March",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "April",
                    emoji: true,
                  },
                  value: "April",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "May",
                    emoji: true,
                  },
                  value: "May",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "June",
                    emoji: true,
                  },
                  value: "June",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "July",
                    emoji: true,
                  },
                  value: "July",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "August",
                    emoji: true,
                  },
                  value: "August",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "September",
                    emoji: true,
                  },
                  value: "September",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "October",
                    emoji: true,
                  },
                  value: "October",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "November",
                    emoji: true,
                  },
                  value: "November",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "December",
                    emoji: true,
                  },
                  value: "December",
                },
              ],
              action_id: "month_select",
            },
            {
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select a year",
                emoji: true,
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "2024",
                    emoji: true,
                  },
                  value: "2024",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2023",
                    emoji: true,
                  },
                  value: "2023",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2022",
                    emoji: true,
                  },
                  value: "2022",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2021",
                    emoji: true,
                  },
                  value: "2021",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2020",
                    emoji: true,
                  },
                  value: "2020",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2019",
                    emoji: true,
                  },
                  value: "2019",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2018",
                    emoji: true,
                  },
                  value: "2018",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2017",
                    emoji: true,
                  },
                  value: "2017",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2016",
                    emoji: true,
                  },
                  value: "2016",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "2015",
                    emoji: true,
                  },
                  value: "2015",
                },
              ],
              action_id: "year_select",
            },
          ],
        },
        {
          type: "input",
          block_id: "attendees_block",
          element: {
            type: "plain_text_input",
            action_id: "attendees_input",
            placeholder: {
              type: "plain_text",
              text: "Enter attendees' names or emails...",
              emoji: true,
            },
          },
          label: {
            type: "plain_text",
            text: "Do you recall who else was in the meeting?",
            emoji: true,
          },
        },
        {
          type: "input",
          block_id: "keyword_block",
          element: {
            type: "plain_text_input",
            action_id: "keyword_input",
            placeholder: {
              type: "plain_text",
              text: "Enter title elements here...",
              emoji: true,
            },
          },
          label: {
            type: "plain_text",
            text: "Do you recall anything discussed from the meeting?",
            emoji: true,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Submit",
                emoji: true,
              },
              value: "submit_meeting_details",
              action_id: "submit_button",
            },
          ],
        },
      ],
      thread_ts: msg,
    });
  } catch (error) {
    console.error("Error responding to /form command:", error);
  }
});

// // Find conversation ID using the conversations.list method
// async function findConversation(name) {
//   try {
//     // Call the conversations.list method using the built-in WebClient
//     const result = await app.client.conversations.list({
//       // The token you used to initialize your app
//       token: "xoxb-your-token"
//     });

//     for (const channel of result.channels) {
//       if (channel.name === name) {
//         conversationId = channel.id;

//         // Print result
//         console.log("Found conversation ID: " + conversationId);
//         // Break from for loop
//         break;
//       }
//     }
//   }
//   catch (error) {
//     console.error(error);
//   }
// }

// // Find conversation with a specified channel `name`
// findConversation("MeetIQ");

let timeframe = "";
let month = "";
let year = "";

app.action("timeframe_select", async ({ ack, body, logger }) => {
  try {
    // Acknowledge the action right away
    await ack();

    // Extract the selected value
    const selectedTimeframe = body.actions[0].selected_option.value;
    timeframe = selectedTimeframe;
    logger.info(`User selected timeframe: ${timeframe}`);
    console.log("TimeFrame ", timeframe);
  } catch (error) {
    logger.error(error);
  }
});

app.action("month_select", async ({ ack, body, logger }) => {
  try {
    // Acknowledge the action right away
    await ack();

    // Extract the selected value
    const selectedTimeframe = body.actions[0].selected_option.value;
    month = selectedTimeframe;
    logger.info(`User selected Month: ${month}`);
    console.log("Month ", month);
  } catch (error) {
    logger.error(error);
  }
});

app.action("year_select", async ({ ack, body, logger }) => {
  try {
    // Acknowledge the action right away
    await ack();

    // Extract the selected value
    const selectedTimeframe = body.actions[0].selected_option.value;
    year = selectedTimeframe;
    logger.info(`User selected Year: ${year}`);
    console.log("Year ", year);
  } catch (error) {
    logger.error(error);
  }
});

let radio_buttons = "";
app.action("radio_button", async ({ ack, body, logger }) => {
  try {
    // Acknowledge the action right away
    await ack();

    // Extract the selected value
    const radio_button = body.actions[0].selected_option.value;
    console.log("Radio Button Selected : ", radio_button);
    radio_buttons = radio_button;
    logger.info(`User selected Year: `, radio_button);
    console.log("radio_button ", radio_button);
  } catch (error) {
    logger.error(error);
  }
});

// Action handler for the submit button
app.action("submit_button", async ({ body, ack, client, say }) => {
  await ack();

  try {
    const userId = body.user.id;
    console.log(userId);
    // console.log(body)
    // console.log("User Email :",user_email)
    const channelId = body.container.channel_id; // Correct way to get the channel ID
    console.log("Channel ID : ", channelId);

    const titleBlock = body.state.values.title_block;
    const titleKey = Object.keys(titleBlock)[0];
    const title = titleBlock[titleKey].value || "No title provided";

    const attendeesBlock = body.state.values.attendees_block;
    const attendeesKey = Object.keys(attendeesBlock)[0];
    const attendees =
      attendeesBlock[attendeesKey].value || "No attendees provided";

    const keywordBlock = body.state.values.keyword_block;
    const keywordKey = Object.keys(keywordBlock)[0];
    const keywords = keywordBlock[keywordKey].value || "No keywords provided";

    // Assuming `radio_buttons`, `timeframe`, `month`, and `year` are defined elsewhere in your code
    let timeInfo = "";
    let selected_search = "";
    if (radio_buttons === "wide_search") {
      timeInfo = timeframe;
      selected_search = "Wide Search";
    } else if (radio_buttons === "precise_search") {
      timeInfo = month + " " + year;
      selected_search = "Precise Search";
    } else {
      console.log("None of the radio buttons selected");
      timeInfo = "None of the radio buttons selected";
    }
    // const url = `https://slack.com/api/users.info?user=${userId}&pretty=1`;
    // try {
    //   const email_response = await axios.get(url, {
    //     headers: {
    //       'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
    //     }
    //   });
    //   console.log("EmailResponse",email_response)
    //   user_email = email_response.data.user.profile.email
    //   ;
    //   console.log("UserEmail",user_email);
    // } catch (error) {
    //   console.error("Error fetching user info:", error);
    // }

    Filtered_Meetings = await FilterMeetingByEmail(user_email);
    // console.log(Filtered_Meetings);
    console.log(Filtered_Meetings.length);

    // const Score_Meetings = await axios.get('');

    const options = Filtered_Meetings.map((meeting, index) => {
      return {
        text: {
          type: "mrkdwn",
          text: `*${meeting.Title}*`,
        },
        description: {
          type: "mrkdwn",
          text: `Date: ${meeting.Full_Date} | Time: ${meeting.Time} | Attendees: ${meeting.Attendees}`,
        },
        value: `value-${index}`,
      };
    });
    // Call the chat.postMessage method using the built-in WebClient

    // Uses a known channel ID and message TS
    // const fs = require('fs');

    // Construct the JSON object
    const postData = {
      Filtered_Meetings: Filtered_Meetings,
      Meeting_Title: title,
      Meeting_Search: selected_search,
      Meeting_Time: timeInfo,
      Meeting_Attendees: attendees,
      Meeting_Keywords: keywords,
    };

    // console.log("Postdata : ", postData);
    // Send the POST request
    // async function sendPostAndWriteFile() {
    //   try {
    //     // Send the POST request
    //     // axios.post('https://slack-endpoint-90ri.onrender.com/alldata?email', postData);
    //     console.log('POST request successful');

    //     // Convert JSON object to string
    //     const jsonData = JSON.stringify(postData, null, 2);

    //     // Define the file path and name
    //     const filePath = 'postData_1.json';

    //     // Write the JSON string to a file
    //     fs.writeFile(filePath, jsonData, (err) => {
    //       if (err) {
    //         console.error('Error writing file:', err);
    //       } else {
    //         console.log('File has been written successfully');
    //       }
    //     });
    //   } catch (error) {
    //     console.error('Error sending POST request:', error);
    //   }
    // }

    // Call the function
    // sendPostAndWriteFile();

    console.log("Meetings Fetched");

    await client.chat.postMessage({
      channel: channelId,
      thread_ts: msg,
      text: `Thank you <@${userId}>! You entered:
              - Email: ${user_email}
              - Title: ${title}
              - Time: ${timeInfo}
              - Attendees: ${attendees}
              - Keywords: ${keywords}`,

      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Hi, I am MeetIQ, your intelligent meeting assistant, designed to provide quick answers to all the queries from your past meetings. Let's search the meetings you are referring to. Enter the details below to start.",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Thank You for Narrowing down the search. Please select from the following results*",
          },
          accessory: {
            type: "checkboxes",
            options: options,
            action_id: "checkboxes-action",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Next",
                emoji: true,
              },
              value: "Submit",
              action_id: "actionId-1",
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Submit",
                emoji: true,
              },
              value: "Submit",
              action_id: "actionId-0",
            },
          ],
        },
      ],
    });

    // Reset the variables if needed
    timeInfo = "";
    timeframe = "";
    month = "";
    year = "";
  } catch (error) {
    console.error(error);
  }
});

let bulletListElements = "";
let selectedMeetingsData = [];

// Reply to a message with the channel ID and message TS
app.action("checkboxes-action", async ({ ack, body, client }) => {
  await ack();

  // Extract selected values from the checkboxes
  const selectedOptions = body.actions[0].selected_options;
  console.log(selectedOptions);

  // Function to remove asterisks from the text
  const removeAsterisks = (text) => text.replace(/\*/g, "");

  // Create the list of selected meetings with cleaned text
  const selectedMeetings = selectedOptions
    .map((option) => {
      const { text, description } = option;
      return `${removeAsterisks(text.text)}\n${removeAsterisks(
        description.text
      )}`;
    })
    .join("\n\n");

  console.log(selectedMeetings);

  // Create bullet list elements
  bulletListElements = selectedMeetings.split("\n\n").map((meeting) => ({
    type: "rich_text_section",
    elements: [
      {
        type: "text",
        text: meeting,
      },
    ],
  }));

  // Create an array to hold the matching meeting data
  // Match the title with the API title and push the meeting data to the array
  bulletListElements.forEach((bullet) => {
    const meetingTitle = bullet.elements[0].text.split("\n")[0]; // Extract the meeting title
    const meetingData = Filtered_Meetings.find(
      (meeting) => meeting.Title === meetingTitle
    );
    if (meetingData) {
      selectedMeetingsData.push(meetingData);
    }
  });

  console.log("Selected Meetings Data:", selectedMeetingsData);
  console.log("Selected Meetings Data Length:", selectedMeetingsData.length);
});

app.action("actionId-0", async ({ ack, body, client }) => {
  await ack();

  // Replace this with the actual data you want to display
  console.log("Bulltets : ", bulletListElements);

  await client.chat.postMessage({
    channel: body.container.channel_id,
    thread_ts: body.message.ts,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "You have selected the following meetings:",
        },
      },
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_list",
            style: "bullet",
            elements: bulletListElements,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Please wait while I fetch the necessary information.",
        },
      },
      {
        type: "input",
        block_id: "question_block",
        element: {
          type: "plain_text_input",
          action_id: "question",
          placeholder: {
            type: "plain_text",
            text: "Enter the question here...",
            emoji: true,
          },
        },
        label: {
          type: "plain_text",
          text: "Now you can ask a question",
          emoji: true,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Submit",
              emoji: true,
            },
            value: "user_question",
            action_id: "submit_question",
          },
        ],
      },
    ],
  });
});

app.action("submit_question", async ({ ack, body, client }) => {
  await ack();

  const questionBlock = body.state.values.question_block;
  const qkey = Object.keys(questionBlock)[0];
  const question = questionBlock[qkey].value || "No title provided";

  console.log("Question : ", question);
  const ans = await FindAnswer(selectedMeetingsData,question);
  

  try {
    await client.chat.postMessage({
      channel: body.container.channel_id,
      thread_ts: body.message.thread_ts || body.message.ts,
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Response to your question*:\n\n${ans}`
          }
        },  
        {
          "type": "input",
          "block_id": "question_block1",
          "element": {
            "type": "plain_text_input",
            "action_id": "question1",
            "placeholder": {
              "type": "plain_text",
              "text": "Enter the question here...",
              "emoji": true
            }
          },
          "label": {
            "type": "plain_text",
            "text": "Now you can ask a question ?",
            "emoji": true
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Submit",
                "emoji": true
              },
              "value": "user_question",
              "action_id": "submit_question1"
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error(error);
    await client.chat.postMessage({
      channel: body.container.channel_id,
      thread_ts: body.message.thread_ts || body.message.ts,
      text: `An error occurred while fetching the response: ${error.message}`,
    });
  }
});

app.action('submit_question1', async ({ ack, body, client }) => {  
  await ack();

  const questionBlock = body.state.values.question_block1;
  const qkey = Object.keys(questionBlock)[0];
  const question1 = questionBlock[qkey].value || "No title provided";

  console.log("Question : ", question1);
  const ans = await FindAnswer(selectedMeetingsData,question1);

  try {

    await client.chat.postMessage({
      channel: body.container.channel_id,
      thread_ts: body.message.thread_ts || body.message.ts,
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Response to your question*:\n\n${ans}`
          }
        },
        {
          "type": "input",
          "block_id": "question_block1",
          "element": {
            "type": "plain_text_input",
            "action_id": "question1",
            "placeholder": {
              "type": "plain_text",
              "text": "Enter the question here...",
              "emoji": true
            }
          },
          "label": {
            "type": "plain_text",
            "text": "Now you can ask a question ?",
            "emoji": true
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Submit",
                "emoji": true
              },
              "value": "user_question",
              "action_id": "submit_question1"
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error(error);
    await client.chat.postMessage({
      channel: body.container.channel_id,
      thread_ts: body.message.thread_ts || body.message.ts,
      text: `An error occurred while fetching the response: ${error.message}`
    });
  }
});

(async () => {
  const port = 3000;
  await app.start(process.env.PORT || port);
  console.log(` ️ Bolt app is running on port ${port}! ️`);
})();

async function FilterMeetingByEmail(email) {
  client.connect((err) => {
    if (err) {
      console.error("connection error", err.stack);
    } else {
      console.log("connected to the database");
    }
  });
  console.log(email);
  const fetchEntries = `
      SELECT "id", "Title", "Full_Date", "Attendees", "Attendees_Emails", "Time", "Meeting_Transcript", "Meeting_Transcript_Embedding"
      FROM "Meeting";
    `;
  const { rows } = await client.query(fetchEntries);
  // console.log(rows);

  return rows.filter((meeting) => {
    const attendeeEmails = meeting.Attendees_Emails.split(",").map((email) =>
      email.trim()
    );
    return attendeeEmails.includes(email);
  });
}

async function generateEmbeddingGoogle(text) {
  // For embeddings, use the embedding-001 model
  const model = genAI.getGenerativeModel({ model: "embedding-001" });

  // const text = "What is dynamic programming ? ?."

  const result = await model.embedContent(text);
  const embedding = result.embedding;
  // console.log(embedding.values);

  return embedding.values;
}

async function QuestionAnswer(question, sumary) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Give answer according to the transcript given below ${sumary} ${question}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  // console.log(text);
  return text;
}

async function FindAnswer(finalmeetings, userQuestion) {
  const questionEmbedding = await generateEmbeddingGoogle(userQuestion);
  console.log("QuestionEmbedding", typeof questionEmbedding);
  // const em = pgvector.toSql(questionEmbedding);
  // console.log(typeof em);

  try {
    let bestMatch = null;
    let highestSimilarity = -1;

    finalmeetings.forEach((meeting) => {
      const transcriptEmbedding = meeting.Meeting_Transcript_Embedding;
      // console.log("TransCriptEmbedding", typeof transcriptEmbedding);

      const trimmedStr = transcriptEmbedding.slice(1, -1);

      // Step 2: Split the string by commas
      const strArray = trimmedStr.split(",");

      // Step 3: Convert the resulting substrings to numbers
      const numArray = strArray.map(Number);
      // console.log(numArray);

      if (transcriptEmbedding) {
        // console.log("Start");
        const similarity = cosSimilarity(questionEmbedding, numArray);
        // console.log(similarity);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = meeting.Meeting_Transcript;
        }
      }
    });

    if (bestMatch) {
      // console.log(bestMatch);
      const ans = await QuestionAnswer(userQuestion, bestMatch);
      console.log(ans);
      return ans;
    } else {
      return "some error occured";
    }
  } catch (error) {
    return error;
  }
}
