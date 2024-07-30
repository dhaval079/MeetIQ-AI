//@ts-nocheck
import { serve } from '@hono/node-server'
import { Prisma, PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
// import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import cosSimilarity from "cos-similarity";
import pgvector from 'pgvector';

import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;
// const openai = new OpenAI({
//   apiKey: process.env.OPENAPI_KEY,
// });
const port = 3000
const app = new Hono()
const prisma = new PrismaClient()
const client = new Client({
  connectionString: connectionString
});
// client.connect(err => {
//   if (err) {
//     console.error('connection error', err.stack);
//   } else {
//     console.log('connected to the database');
//   }
// })

app.get('/', async (c) => {
  return c.text("Hello hono")
})

app.get('/alldata', async (c) => {

  await client.connect(err => {
    if (err) {
      console.error('connection error', err.stack);
    } else {
      console.log('connected to the database');
    }
  });

  const fetchEntries = ` SELECT * FROM "Meeting" `;
  const { rows } = await client.query(fetchEntries);
  return c.json(rows);
})

app.post('/', async (c) => {
  const body = await c.req.json();

  const gc_emails = body.emails || "";
  const gc_time = body.time || "";

  console.log("Full Body", body);
  console.log("Data", body.data);

  const filterdata = formatMeetingInput(body.data)!;

  try {
    const data = await prisma.meeting.create({
      data: {
        Meet_link: filterdata.meet_link || "",
        Title: filterdata.title || "",
        Time: gc_time ? gc_time : filterdata.time,
        Month: parseInt(filterdata.month.toString()) || 0,
        Year: filterdata.year || 0,
        Full_Date: filterdata.full_date,
        Attendees: filterdata.attendees || "",
        Attendees_Emails: gc_emails ? gc_emails : "",
        Meeting_Agenda: filterdata.meeting_Agenda || "",
        Meeting_Highlights: filterdata.meeting_Highlights || "",
        Meeting_Transcript: filterdata.meeting_Transcript || "",
        Meeting_summary: filterdata.meeting_summary || "",
      }
    });
    return c.text(data.id);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

// app.post('/embedding', async (c) => {

//   const body = await c.req.json();
//   const gc_emails = body.emails || "";
//   const gc_time = body.time || "";

//   // console.log("Full Body", body);
//   // console.log("Data", body.data);

//   const filterdata = formatMeetingInput(body.data)!;
//   //openai
//   // const title_embedding = await generateEmbedding(filterdata.title)
//   // const summary_Embedding = await generateEmbedding(filterdata.meeting_summary)
//   // const transcript_Embedding = await generateEmbedding(filterdata.meeting_Transcript);

//   //gemini
//   const title_embedding = await generateEmbeddingGoogle(filterdata.title)
//   const summary_embedding = await generateEmbeddingGoogle(filterdata.meeting_summary)
//   const transcript_embedding = await generateEmbeddingGoogle(filterdata.meeting_Transcript);

//   // console.log(title_embedding)
//   // console.log(summary_embedding)
//   // console.log(transcript_embedding)
//   console.log("Meet_link:", filterdata.meet_link.toString() || "");
//   console.log("Title:", filterdata.title || "");
//   console.log("Title_Embedding:", title_embedding);
//   console.log("Time:", gc_time ? gc_time : filterdata.time);
//   console.log("Month:", parseInt(filterdata.month.toString()) || 0);
//   console.log("Year:", filterdata.year || 0);
//   console.log("Full_Date:", filterdata.full_date);
//   console.log("Attendees:", filterdata.attendees || "");
//   console.log("Attendees_Emails:", gc_emails ? gc_emails : "");
//   console.log("Meeting_Agenda:", filterdata.meeting_Agenda || "");
//   console.log("Meeting_Highlights:", filterdata.meeting_Highlights || "");
//   console.log("Meeting_Transcript:", filterdata.meeting_Transcript || "");
//   console.log("Meeting_Transcript_Embedding:", transcript_embedding);
//   console.log("Meeting_summary:", filterdata.meeting_summary || "");
//   console.log("Meeting_summary_Embedding:", summary_embedding);

//   try {
//     const id = uuidv4();
//     console.log(id);
//     const query = Prisma.sql`INSERT INTO "Meeting" (
//         "id"
//         "Meet_link",
//         "Title",
//         "Title_Embedding",
//         "Time",
//         "Month",
//         "Year",
//         "Full_Date",
//         "Attendees",
//         "Attendees_Emails",
//         "Meeting_Agenda",
//         "Meeting_Highlights",
//         "Meeting_Transcript",
//         "Meeting_Transcript_Embedding",
//         "Meeting_summary",
//         "Meeting_summary_Embedding",
//         "Chunk_number"
//       ) VALUES (
//         ${id},
//         ${filterdata.meet_link.toString() || ""},
//         ${filterdata.title || ""},
//         ${title_embedding ? title_embedding : null}::vector(768),
//         ${gc_time ? gc_time : filterdata.time},
//         ${parseInt(filterdata.month.toString()) || 0},
//         ${filterdata.year || 0},
//         ${filterdata.full_date},
//         ${filterdata.attendees || ""},
//         ${gc_emails ? gc_emails : ""},
//         ${filterdata.meeting_Agenda || ""},
//         ${filterdata.meeting_Highlights || ""},
//         ${filterdata.meeting_Transcript || ""},
//         ${transcript_embedding ? transcript_embedding : null}::vector(768),
//         ${filterdata.meeting_summary || ""},
//         ${summary_embedding ? summary_embedding : null}::vector(768),
//         ${"XYZ"}
//       ) RETURNING "id";
//     `;
//     // const result = await prisma.$executeRaw`
//     //   INSERT INTO "Meeting" (
//     //     "id"
//     //     "Meet_link",
//     //     "Title",
//     //     "Title_Embedding",
//     //     "Time",
//     //     "Month",
//     //     "Year",
//     //     "Full_Date",
//     //     "Attendees",
//     //     "Attendees_Emails",
//     //     "Meeting_Agenda",
//     //     "Meeting_Highlights",
//     //     "Meeting_Transcript",
//     //     "Meeting_Transcript_Embedding",
//     //     "Meeting_summary",
//     //     "Meeting_summary_Embedding",
//     //     "Chunk_number"
//     //   ) VALUES (
//     //     ${id},
//     //     ${filterdata.meet_link.toString() || ""},
//     //     ${filterdata.title || ""},
//     //     ${title_embedding ? title_embedding : null}::vector(768),
//     //     ${gc_time ? gc_time : filterdata.time},
//     //     ${parseInt(filterdata.month.toString()) || 0},
//     //     ${filterdata.year || 0},
//     //     ${filterdata.full_date},
//     //     ${filterdata.attendees || ""},
//     //     ${gc_emails ? gc_emails : ""},
//     //     ${filterdata.meeting_Agenda || ""},
//     //     ${filterdata.meeting_Highlights || ""},
//     //     ${filterdata.meeting_Transcript || ""},
//     //     ${transcript_embedding ? transcript_embedding : null}::vector(768),
//     //     ${filterdata.meeting_summary || ""},
//     //     ${summary_embedding ? summary_embedding : null}::vector(768),
//     //     ${"XYZ"}
//     //   ) RETURNING "id";
//     // `;
//     const result = await prisma.$queryRaw(query);
//     return c.text(result);
//   } catch (error) {
//     return c.json({ error: error.message }, 500);
//   } 
// })

app.post('/embedding', async (c) => {
  const body = await c.req.json();
  const gc_emails = body.emails || "";
  const gc_time = body.time || "";

  const filterdata = formatMeetingInput(body.data)!;

  // Generate embeddings
  const title_embedding = await generateEmbeddingGoogle(filterdata.title);
  const summary_embedding = await generateEmbeddingGoogle(filterdata.meeting_summary);
  const transcript_embedding = await generateEmbeddingGoogle(filterdata.meeting_Transcript);

  // console.log(title_embedding);
  // console.log(summary_embedding);
  // console.log(transcript_embedding);

  try {
    // Step 1: Insert initial data using Prisma create method
    const meeting = await prisma.meeting.create({
      data: {
        Meet_link: filterdata.meet_link || "",
        Title: filterdata.title || "",
        Time: gc_time ? gc_time : filterdata.time,
        Month: parseInt(filterdata.month.toString()) || 0,
        Year: filterdata.year || 0,
        Full_Date: filterdata.full_date,
        Attendees: filterdata.attendees || "",
        Attendees_Emails: gc_emails ? gc_emails : "",
        Meeting_Agenda: filterdata.meeting_Agenda || "",
        Meeting_Highlights: filterdata.meeting_Highlights || "",
        Meeting_Transcript: filterdata.meeting_Transcript || "",
        Meeting_summary: filterdata.meeting_summary || "",
      }
    });

    // Step 2: Update embedding fields using $executeRaw
    const result = await prisma.$executeRaw`
      UPDATE "Meeting"
      SET
        "Title_Embedding" = ${title_embedding ? title_embedding : null}::vector(768),
        "Meeting_Transcript_Embedding" = ${transcript_embedding ? transcript_embedding : null}::vector(768),
        "Meeting_summary_Embedding" = ${summary_embedding ? summary_embedding : null}::vector(768)
      WHERE
        "id" = ${meeting.id}
      RETURNING "id";
    `;

    if(result){
      return c.text(meeting.id);
    }
    return c.text("Error occured")

  } catch (error) {

    console.error("Insert/update error:", error);
    return c.json({ error: error.message }, 500);

  } finally {
    await prisma.$disconnect();
  }
});

// app.post('/embedding', async (c) => {
//   const body = await c.req.json();
//   const gc_emails = body.emails || '';
//   const gc_time = body.time || '';

//   const filterdata = formatMeetingInput(body.data)!;

//   // Generate embeddings
//   const title_embedding = await generateEmbeddingGoogle(filterdata.title);
//   // const summary_embedding = await generateEmbeddingGoogle(filterdata.meeting_summary);
//   // const transcript_embedding = await generateEmbeddingGoogle(filterdata.meeting_Transcript);

//   try {
//     const id = uuidv4();

//     // const query = `
//     //     INSERT INTO "Meeting" (
//     //       "id", "Meet_link", "Title", "Time", "Month", "Year", "Full_Date", 
//     //       "Attendees", "Attendees_Emails", "Meeting_Agenda", "Meeting_Highlights", 
//     //       "Meeting_Transcript", "Meeting_summary"
//     //     ) VALUES (
//     //       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
//     //     ) RETURNING *
//     // `;
//     const query = `
//       INSERT INTO "Meeting" (
//         "id", "Title_Embedding"
//       )
//       VALUES ($1, $2::vector(768))
//       RETURNING *;
//     `;

//     const values = [
//       id,
//       title_embedding ? title_embedding : null,
//     ];

//     const { rows: [result] } = await client.query(query, values);

//     return c.json({result});
//   } catch (error) {
//     console.error("Insert error:", error);
//     return c.json({ error: error.message }, 500);
//   } finally {
//     await client.end();
//   }
// });

app.post('/retrieve', async (c) => {
  const body = await c.req.json();
  const userQuestion = body.question || "";

  // Generate embedding for the user's question
  const questionEmbedding = await generateEmbeddingGoogle(userQuestion);

  try {
    // Fetch all meetings from the database
    const meetings = await prisma.meeting.findMany();

    // Function to calculate cosine similarity
    const cosineSimilarity = (a: any, b: any) => {
      const dotProduct = a.reduce((sum: any, ai: any, i: any) => sum + ai * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum: any, ai: any) => sum + ai * ai, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum: any, bi: any) => sum + bi * bi, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    // Find the meeting summary with the highest similarity to the question
    let bestMatch = null;
    let highestSimilarity = -1;

    meetings.forEach(meeting => {
      const summaryEmbedding = meeting.Meeting_summary_Embedding?.Embedding;
      if (summaryEmbedding) {
        const similarity = cosineSimilarity(questionEmbedding, summaryEmbedding);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = meeting;
        }
      }
    });

    if (bestMatch) {
      const sum = bestMatch.Meeting_summary
      console.log(sum);

      const ans = await QuestionAnswer(userQuestion, sum)
      console.log(ans);

      return c.json({
        id: bestMatch.id,
        title: bestMatch.Title,
        meeting_summary: bestMatch.Meeting_summary,
        similarity: highestSimilarity,
        ans
      });
    } else {
      return c.json({ message: "No matching meeting summary found" }, 404);
    }

  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }

});

app.post('/user', async (c) => {
  // const user = await prisma.chat.create({
  //   data: {
  //     Email: "abc@gmail.com",
  //     // ThreadID:"221akdj55s59",
  //     // Entire_data:{Data:"Data2"},

  //     User_threadID: "221akdj55s59",
  //     Question: "What is how3",
  //     Answer: "how is kese3"
  //   }
  // })
  // return c.json({ user })

  // const data = await FilterMeetingByEmail("yashagrawal946@gmail.com");
  const ans = await FindContentToAnswer(Selected_Meetings,"Why does Tanweer Alam need to fill out a form for Marjara’s audit?")
  return c.json(ans);

})


console.log(`Server is running on port ${port}`)
serve({
  fetch: app.fetch,
  port
})

function formatMeetingInput(input: string) {
  // Split the input into lines
  const lines = input.split('\n');

  // Join all lines into a single string without newlines
  const formattedOutput = lines.join('');

  const filterdata = filterMeetingData(formattedOutput);

  return filterdata;
}

function filterMeetingData(rawData: string) {
  rawData = rawData.replace(/^\uFEFF/, ''); // Remove BOM

  const titleMatch = rawData.match(/Title: ([^\n]+)Location/);
  const linkMatch = rawData.match(/Link: ([^\n]+)Agenda:/);
  const dateMatch = rawData.match(/Date: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
  const attendeesMatch = rawData.match(/Attendees: ([^\n]+)Link:/);
  const agendaMatch = rawData.match(/Agenda: ([\s\S]+?)Meeting Summary/);
  const summaryMatch = rawData.match(/Meeting Summary([\s\S]+?)Meeting Highlights/);
  const highlightsMatch = rawData.match(/Meeting Highlights([\s\S]+?)Meeting Transcript/);
  const transcriptMatch = rawData.match(/Meeting Transcript([\s\S]+)/);

  if (!dateMatch) {
    console.error('Date field not found or invalid format');
    return null;
  }

  const { year, month, day, time } = convertUTCToIST(dateMatch[1].trim());

  function cleanString(str: string) {
    return str.replace(/\n/g, ' ').replace(/\+/g, '').trim();
  }

  return {
    meet_link: linkMatch ? cleanString(linkMatch[1]) : "",
    title: titleMatch ? cleanString(titleMatch[1]) : "",
    time: time,
    date: day,
    month: month,
    year: year,
    full_date: `${year}-${month}-${day}`,
    attendees: attendeesMatch ? cleanString(attendeesMatch[1]) : "",
    meeting_Agenda: agendaMatch ? cleanString(agendaMatch[1]) : "",
    meeting_Highlights: highlightsMatch ? cleanString(highlightsMatch[1]) : "",
    meeting_Transcript: transcriptMatch ? cleanString(transcriptMatch[1]) : "",
    meeting_summary: summaryMatch ? cleanString(summaryMatch[1]) : "",
  };
}

function convertUTCToIST(dateStr: string) {
  const dateObj = new Date(dateStr);
  const offsetIST = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istDateObj = new Date(dateObj.getTime() + offsetIST);

  const year = istDateObj.getUTCFullYear();
  const month = (istDateObj.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = istDateObj.getUTCDate().toString().padStart(2, '0');
  const time = istDateObj.toTimeString().split(' ')[0]; // HH:MM:SS

  return { year, month, day, time };
}

async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-3-large', // Specify the model you want to use
  });
  console.log(response.data[0].embedding);
  return response.data[0].embedding;
}

export async function generateEmbeddingGoogle(text: string) {

  // Access your API key as an environment variable (see "Set up your API key" above)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

  // For embeddings, use the embedding-001 model
  const model = genAI.getGenerativeModel({ model: "embedding-001" });

  // const text = "What is dynamic programming ? ?."

  const result = await model.embedContent(text);
  const embedding = result.embedding;
  // console.log(embedding.values);

  return embedding.values;
}

export async function QuestionAnswer(question: string, sumary: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Give answer according to the transcript given below ${sumary} ${question}`

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  // console.log(text);
  return text;
}

export default async function FilterMeetingByEmail(email: string) {
  await client.connect(err => {
    if (err) {
      console.error('connection error', err.stack);
    } else {
      console.log('connected to the database');
    }
  });

  const fetchEntries = `
      SELECT "id", "Title", "Full_Date", "Attendees", "Attendees_Emails", "Time", "Meeting_Transcript", "Meeting_Transcript_Embedding"
      FROM "Meeting";
    `;
  const { rows } = await client.query(fetchEntries);

  return rows.filter(meeting => {
    const attendeeEmails = meeting.Attendees_Emails.split(',').map(email => email.trim());
    return attendeeEmails.includes(email);
  });
}

async function FindContentToAnswer(Selecting_Meetings:[], userQuestion: string) {

  const questionEmbedding = await generateEmbeddingGoogle(userQuestion);
  console.log("QuestionEmbedding",typeof questionEmbedding);
  // const em = pgvector.toSql(questionEmbedding);
  // console.log(typeof em);
  

  try {
    // Find the meeting summary with the highest similarity to the question
    let bestMatch = null;
    let highestSimilarity = -1;

    Selected_Meetings.forEach(meeting => {
      const transcriptEmbedding = meeting.Meeting_Transcript_Embedding;
      console.log("TransCriptEmbedding",typeof transcriptEmbedding);

      const trimmedStr = transcriptEmbedding.slice(1, -1);

      // Step 2: Split the string by commas
      const strArray = trimmedStr.split(',');

      // Step 3: Convert the resulting substrings to numbers
      const numArray = strArray.map(Number);
      // console.log(numArray);
      
      
      if (transcriptEmbedding) {
        console.log("Start");
        const similarity = cosSimilarity(questionEmbedding, numArray);
        console.log(similarity);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = meeting.Meeting_Transcript;
        }
      }
    });

    if (bestMatch) {
      // console.log(bestMatch);
      const ans = await QuestionAnswer(userQuestion, bestMatch)
      console.log(ans);
      return ans;
    } else {
      return "some error occured";
    }

  } catch (error) {
    return error;
  }
}

const Selected_Meetings = [
  {
      "id": "0b7ee21f-2ab6-462a-9b44-f3160ada0773",
      "Title": "Note Taker Test Call3",
      "Full_Date": "2024-05-01",
      "Attendees": "Manish Srivastava, Tanweer Alam",
      "Attendees_Emails": "dmi.meetings@dmifinance.in,dhaval.rupapara@dmifinance.in, dhaval.rce21@sot.pdpu.ac.in, yashagrawal946@gmail.com",
      "Time": "12:16AM",
      "Meeting_Transcript": "Unknown speaker - 01:47Seems you joined the wrong meeting the previous month, is that correct?So when I joined this call, this DMI meeting node keeper is already here.Manish Srivastava - 02:01And if we see this console, what is there?So it is recording this particular thing.And the interesting thing is I have not activated the Joom account associated with the DMI meetings.It seems it does not require any Joom account as such.Yes, for participants it is not required to Joom.I don't think we need to activate this.Manish Srivastava - 02:40If we end this call, I am sending you a separate Joom so that we could check So I think we can discuss two or three minutes more.Tanweer Alam - 02:52I have one more thing that needs to be discussed.So just I am saving my screen.Let us do one thing.So once we have this transcript, if we receive this transcript over email, I will inform Siv that I am going to test this particular thing.And I will ask Manish to add this email id in view of the SIV's call.Yes, I think he could add this email id as a participant.Tanweer Alam - 03:25Yes.Then let us see what is going to happen.But the primary thing is that we receive an email, at least me and you receive an email from this email id.What is the transcript and what is the purpose of the meeting?And then try to check what else we can do.Now, let me know.Tanweer Alam - 03:44So, I am setting my screen.So, I think one thing is pending for Marjara's audit.So, just I have opened the requirements.A list of participants is a list of participants that may occur during meetingYes, this one.So, Manish is asking to fill this form but I am not able to find all the details which is available in this list actually.Tanweer Alam - 04:57And why they need this?I don't know why this is.After completion of audit, he required some details in this format.Purpose of the questionnaire.Obtaining and understanding of the IT environment in capacity step in our audit methodology.This questionnaire contains matters that the auditor may consider in obtaining and understanding of the IT environment and is based on ISA 315R.Tanweer Alam - 05:41Completed with a specific subject from the majora's audit methodology.That this tab is a calling permission is required, so just call it down.Send this form to me, just send this form to me, let me have a look of it.Sure, sure, sure.And then we will connect our call and we could try to fill it out, maybe tomorrow or day after.Sure, sure, so I am just setting.Tanweer Alam - 06:17And you can uninstall this firethumb.This firethumb is no more required.Tick, tick, ok, I will do Tick, I am ending this call and sending you a separate room.Sure, sure, ok.",
      "Meeting_Transcript_Embedding": "[0.01627949,-0.01602609,-0.049096756,-0.011891124,0.03667856,0.0073984163,-0.0007277211,-0.030838992,-0.025854958,0.09065079,-0.0015806578,0.02187459,-0.035661038,-0.019839542,-0.008292172,-0.016174272,0.040496908,-0.0055469885,-0.014284709,-0.0034404572,-0.026387466,0.026812822,-0.036776423,-0.00679996,0.036326747,0.033574056,0.036494788,-0.020849397,-0.027785404,0.037807867,-0.046549782,0.069850825,-0.039531328,0.02763885,-0.0247179,-0.040937155,-0.020774366,0.010860433,0.00033836934,0.050965045,-0.0049526733,-0.059120327,-0.01878409,0.011132936,-0.0066584023,0.0056577013,-0.04280972,0.016063733,0.015511578,0.0011755788,0.033780783,0.011369224,0.010293139,0.0007191651,-0.027694086,0.020219492,0.012164434,0.038795453,-0.020318443,-0.015207336,0.024471754,-0.024584092,-0.03013281,0.03294183,-0.020844959,-0.031433325,-0.011804364,-0.019486163,0.0635735,-0.0005862638,0.024883298,0.0048659337,0.07853692,-0.0043955264,-0.06442048,-0.12189893,0.0015627906,0.04903604,0.023575878,0.028664669,-0.012705246,-0.018130504,-0.029242694,-0.023113152,-0.06086933,0.012687402,0.00029293276,0.048449133,0.0049340017,0.012997987,0.001314025,0.02998642,0.0019167034,-0.06821229,0.020082017,0.083836146,-0.03747635,-0.024507975,-0.01460026,-0.014153075,-0.05073053,-0.051166657,-0.048937127,-0.007563265,0.037166316,0.025489613,-0.044079475,0.043530405,-0.059889566,0.05471209,-0.05537088,0.01924749,0.025822919,-0.024195813,0.031999364,-0.016678056,-0.010516429,0.08991519,0.03680557,-0.038195502,0.041387692,0.030264439,0.048097845,-0.013584218,-0.017811336,0.0038160768,0.006187744,-0.015176005,0.06485984,-0.00559839,0.009848908,0.004825394,0.004178837,0.0041750832,0.031239016,0.032191068,0.05238209,-0.04896761,0.06949835,0.030389288,-0.00039762157,0.005750892,-0.03427833,0.012010288,0.008118706,0.02776254,-0.002503008,-0.022469768,0.06694924,0.0283739,0.009241379,-0.04774275,-0.047146752,0.008026952,0.009302717,0.0042903833,-0.029648727,0.011311323,0.026836993,0.008888812,0.060874134,0.04650512,0.057651453,0.017746722,0.026502442,-0.047597338,0.026719665,-0.016353244,-0.017063107,0.05161689,0.003174038,0.030389093,-0.06447976,-0.038439862,-0.012300103,-0.024221791,0.018004136,-0.008014348,-0.06976162,-0.018146735,-0.03354337,0.007179007,0.01805371,0.02540143,0.053246927,-0.0045886813,0.06499256,-0.037194,-0.06179589,-0.026073942,0.022531172,-0.011474387,-0.015523591,-0.042890657,-0.028563859,0.055358496,-0.010227293,0.03639366,-0.012126838,-0.015207781,0.0076662763,0.07214616,0.04760833,0.007873336,0.08127003,-0.033448357,0.0387517,-0.008101852,-0.0476552,0.0435678,-0.06857306,-0.015375579,-0.03647711,0.051659655,0.004576931,0.009633036,0.00169288,0.01555784,0.013080547,-0.038363785,0.025079025,-0.013730941,0.016250674,0.013906434,0.00013119078,-0.03040764,0.0054364745,0.054667633,0.03388285,-0.06662036,-0.0287965,0.06319114,0.0047318726,-0.027958438,0.04192802,0.0041983854,-0.02080696,0.03441165,0.03192992,0.008812403,-0.03417277,0.022220703,0.055165727,0.05899308,0.0024519812,-0.04219771,-0.02919548,0.0083227325,-0.033596717,0.06519373,-0.01368142,-0.10122797,0.026352908,-0.011057474,-0.07793807,0.03446891,-0.046499953,-0.013069766,0.0010576277,-0.05330965,0.049246777,0.0071581663,-0.002070735,0.011931532,0.034597944,-0.023213437,-0.05339252,-0.053976137,0.018914161,-0.021627981,0.0011900569,-0.030615272,0.09812815,0.044395205,-0.034791,0.031916823,-0.016551115,0.03652417,-0.0022837752,-0.028721858,0.02529441,0.022866342,-0.012133743,-0.072024204,-0.021472609,0.020685598,-0.0052572135,-0.030553441,0.031383257,-0.09010233,-0.05962325,-0.024166595,0.021947393,-0.073514596,-0.009594707,0.0641291,-0.015821123,0.036685545,0.010008464,-0.0027504913,-0.015413782,-0.03847186,-0.02193749,-0.009707702,-0.024438974,-0.019906133,-0.034062233,-0.02319056,0.019226803,-0.040069155,-0.024686243,-0.02692334,0.006769598,0.025099332,0.038047694,0.038075496,-0.030033486,0.03932267,-0.017840037,0.044436894,0.0038994348,0.040298402,0.014999835,-0.037529305,-0.00014537373,0.09962487,-0.01400093,0.0056403484,-0.042419687,0.02184696,-0.002389465,-0.02047721,-0.0038295097,0.03213749,-0.031228237,0.013305279,-0.069969036,0.018900707,-0.0495584,-0.025843987,0.026023861,0.05217377,-0.04182135,-0.018359512,0.028930385,0.014793276,-0.033536937,-0.017867353,0.08309154,-0.0005805079,0.015007756,0.053878393,-0.039793056,-0.013602252,-0.009116012,-0.02761262,0.048943188,0.012073433,0.041086648,-0.032579944,-0.07493618,0.0056753308,-0.015919741,-0.026841357,0.0076324134,0.022051878,-0.008360009,0.059947148,-0.02487301,0.033594925,0.066873305,-0.044568457,-0.01429474,-0.02229864,0.009931179,-0.08641866,-0.042166714,-0.010642484,0.052581448,-0.0211534,0.0008226748,0.01065394,0.08013386,0.0682695,0.027249018,0.047481645,0.023925755,0.0414506,-0.027185373,-0.010854739,0.010449606,0.033257607,0.08165655,-0.013146088,0.026461102,-0.037274692,-0.07567519,-0.039073106,0.014912829,-0.037538875,0.03207182,-0.05807912,-0.02372498,-0.05255185,-0.020179033,0.012737276,0.03805817,-0.08211388,-0.011533785,-0.02682113,0.0067142267,0.08134318,0.031958926,-0.053475756,-0.034286704,-0.011969257,0.02077399,-0.053879086,0.014471575,-0.03967824,-0.029199947,-0.021510936,-0.019289194,-0.02280561,-0.049555603,-0.066475235,-0.034232475,0.0033015595,0.035052966,-0.017068239,0.003750751,0.016369265,-0.01288807,-0.061849345,0.003117991,-0.038928725,0.006526757,0.027105147,-0.051267624,-0.009369404,0.019124838,-0.0017292873,0.035431627,-0.0268676,-0.034148786,-0.015060772,-0.029066555,-0.05789417,0.027795687,-0.04110921,0.04579707,-0.04035693,-0.06851787,-0.04867982,-0.0059945793,-0.049473666,0.034016874,-0.0102759795,0.01170897,0.009153424,-0.021356156,-0.024061508,0.015397368,-0.05119693,-0.0147932805,-0.0145712,0.019154344,-0.03084555,0.026801629,0.036409337,0.016186034,-0.03327714,0.026400823,0.010572384,0.034174588,-0.002794671,-0.09330809,0.05891254,-0.022816183,-0.036802,0.0054281894,-0.0047769207,0.056460787,-0.026738448,-0.023698306,-0.020369794,-0.023934355,0.026079638,-0.014234837,0.06781087,0.0006414148,-0.026350096,-0.006333071,-0.034078687,-0.0023477247,0.008686611,-0.045400262,0.055997066,0.02909133,0.004334548,-0.004096333,-0.026362501,-0.016292185,-0.02370919,0.047694,-0.024994504,0.0034593437,-0.0017264878,0.045686338,0.025575956,0.014518138,0.01210467,0.007952755,-0.076696634,0.03947023,0.0050095473,0.018389221,0.06778853,-0.011354745,-0.006870839,0.042412054,-0.03473933,-0.049222756,-0.016240818,0.031903632,-0.05964454,0.03169456,0.05045855,-0.043512568,0.047445428,-0.03515794,0.072267555,-0.0725646,0.023267848,-0.034854222,-0.0063442625,0.013940438,0.013044295,0.06249441,0.0039472166,0.03354109,0.022317875,0.022625674,-0.009774106,-0.0060921647,0.03740352,0.00421308,-0.09585586,0.0536603,-0.016087322,-0.015315649,0.034453917,0.027910922,-0.04775162,-0.005371069,-0.013216858,-0.0155923115,-0.03452844,-0.014680296,-0.0077368836,-0.010362155,0.0105334,0.026375573,-0.021861501,0.04747084,0.0021745875,-0.013545878,-0.023652365,0.025268162,0.008234313,0.01628121,0.016717171,-0.0075437324,-0.01746084,0.05737496,-0.05672066,-0.03184725,0.010788341,0.016423313,0.009073566,-0.0142192785,0.02372472,-0.06752908,0.05532568,0.037167847,0.047181085,0.044156887,0.018095804,0.023586195,-0.028379582,-0.032021254,0.06580868,-0.06653552,0.0027542796,0.033036385,0.03680165,-0.01051331,0.00035514694,0.02673367,-0.010264402,0.016420377,-0.042696778,0.057180658,-0.038457163,0.06396458,-0.026014995,-0.0024609137,0.0010753045,0.02769898,0.055228665,0.01562575,0.0079133725,0.020817937,-0.0068666954,-0.0059866444,-0.006472586,0.033799637,-0.026940405,0.024900952,-0.025138052,0.01912036,-0.033090316,0.010980622,-0.019911084,0.0395164,0.027147084,0.02181863,0.006602812,0.080255754,-0.0145429745,0.024768474,0.09369619,0.023963366,-0.0013371798,-0.06746511,0.008339503,-0.024847483,0.021772295,0.03816823,0.040221363,-0.1016634,0.011362837,0.011084681,-0.016954988,0.007863526,0.052209977,-0.016033238,-0.041119866,-0.027817534,0.016873246,-0.046511825,-0.0033429766,0.028200418,-0.0056276945,-0.0070248744,0.038796965,-0.044849742,-0.035893444,0.023809932,-0.0021301517,-0.02977494,0.005882937,-0.011693702,-0.0151127875,-0.012105677,-0.021708217,-0.019413117,-0.049822457,-0.048396558,0.031395435,-0.07354659,0.026777327,0.057155307,-0.0057960944,0.029630644,-0.001306779,-0.01390428,0.014564886,0.04425651,0.03886256,-0.03860564,-0.027730323,0.0065537225,-0.026742537,0.0022833804,-0.0037291856,-0.030873371,0.03596761,-0.052820936,-0.005083799,0.0146031,-0.010864949,-0.048773322,0.032400858,0.08056325,0.028939461,-0.025191756,0.0069188657,0.052944552,0.07390008,-0.021732058,-0.0447556,-0.0057965806,0.04031473,-6.469404e-05,0.043043952,0.026216112,0.033643506,0.050295535,0.058774624,0.042921174,-0.022581654,-0.014618628,0.02785504,0.004492553,0.017646704,-0.011454965,-0.024788052,-0.017392153,0.07012217,0.023839653,0.01476434,0.035592753,0.019096563,-0.017759014,0.07362237,-0.010061221,0.041428026,0.023502957,-0.035065055,0.0124496,-0.016825544,-0.009891368,0.07399001,-0.06956246,0.035480075,0.009672069,0.043887157,-0.06653184,-0.07324449,-0.042176068,-0.02464293,-0.004013292,0.013136521,0.05198291,-0.035796057,0.01002043,0.0061701233,-0.0028749586,-0.040683024,-0.0508785,0.016341563,-0.00030985652,0.027487975,0.061645713,-0.07023507,-0.009168633,0.012893412,-0.039602123,0.048401248,-0.021774683,0.00921202,0.037446465,-0.0015287205,0.00038079883,0.04028422,-0.04217838,0.05758646]"
  },
  {
      "id": "f42074f6-6900-447d-933f-f99c12f52ffd",
      "Title": "Note Taker Test Call1",
      "Full_Date": "2024-05-01",
      "Attendees": "Manish Srivastava, Tanweer Alam",
      "Attendees_Emails": "dmi.meetings@dmifinance.in,dhaval.rupapara@dmifinance.in, dhaval.rce21@sot.pdpu.ac.in, yashagrawal946@gmail.com",
      "Time": "12:16AM",
      "Meeting_Transcript": "Unknown speaker - 01:47Seems you joined the wrong meeting the previous month, is that correct?So when I joined this call, this DMI meeting node keeper is already here.Manish Srivastava - 02:01And if we see this console, what is there?So it is recording this particular thing.And the interesting thing is I have not activated the Joom account associated with the DMI meetings.It seems it does not require any Joom account as such.Yes, for participants it is not required to Joom.I don't think we need to activate this.Manish Srivastava - 02:40If we end this call, I am sending you a separate Joom so that we could check So I think we can discuss two or three minutes more.Tanweer Alam - 02:52I have one more thing that needs to be discussed.So just I am saving my screen.Let us do one thing.So once we have this transcript, if we receive this transcript over email, I will inform Siv that I am going to test this particular thing.And I will ask Manish to add this email id in view of the SIV's call.Yes, I think he could add this email id as a participant.Tanweer Alam - 03:25Yes.Then let us see what is going to happen.But the primary thing is that we receive an email, at least me and you receive an email from this email id.What is the transcript and what is the purpose of the meeting?And then try to check what else we can do.Now, let me know.Tanweer Alam - 03:44So, I am setting my screen.So, I think one thing is pending for Marjara's audit.So, just I have opened the requirements.A list of participants is a list of participants that may occur during meetingYes, this one.So, Manish is asking to fill this form but I am not able to find all the details which is available in this list actually.Tanweer Alam - 04:57And why they need this?I don't know why this is.After completion of audit, he required some details in this format.Purpose of the questionnaire.Obtaining and understanding of the IT environment in capacity step in our audit methodology.This questionnaire contains matters that the auditor may consider in obtaining and understanding of the IT environment and is based on ISA 315R.Tanweer Alam - 05:41Completed with a specific subject from the majora's audit methodology.That this tab is a calling permission is required, so just call it down.Send this form to me, just send this form to me, let me have a look of it.Sure, sure, sure.And then we will connect our call and we could try to fill it out, maybe tomorrow or day after.Sure, sure, so I am just setting.Tanweer Alam - 06:17And you can uninstall this firethumb.This firethumb is no more required.Tick, tick, ok, I will do Tick, I am ending this call and sending you a separate room.Sure, sure, ok.",
      "Meeting_Transcript_Embedding": "[0.01627949,-0.01602609,-0.049096756,-0.011891124,0.03667856,0.0073984163,-0.0007277211,-0.030838992,-0.025854958,0.09065079,-0.0015806578,0.02187459,-0.035661038,-0.019839542,-0.008292172,-0.016174272,0.040496908,-0.0055469885,-0.014284709,-0.0034404572,-0.026387466,0.026812822,-0.036776423,-0.00679996,0.036326747,0.033574056,0.036494788,-0.020849397,-0.027785404,0.037807867,-0.046549782,0.069850825,-0.039531328,0.02763885,-0.0247179,-0.040937155,-0.020774366,0.010860433,0.00033836934,0.050965045,-0.0049526733,-0.059120327,-0.01878409,0.011132936,-0.0066584023,0.0056577013,-0.04280972,0.016063733,0.015511578,0.0011755788,0.033780783,0.011369224,0.010293139,0.0007191651,-0.027694086,0.020219492,0.012164434,0.038795453,-0.020318443,-0.015207336,0.024471754,-0.024584092,-0.03013281,0.03294183,-0.020844959,-0.031433325,-0.011804364,-0.019486163,0.0635735,-0.0005862638,0.024883298,0.0048659337,0.07853692,-0.0043955264,-0.06442048,-0.12189893,0.0015627906,0.04903604,0.023575878,0.028664669,-0.012705246,-0.018130504,-0.029242694,-0.023113152,-0.06086933,0.012687402,0.00029293276,0.048449133,0.0049340017,0.012997987,0.001314025,0.02998642,0.0019167034,-0.06821229,0.020082017,0.083836146,-0.03747635,-0.024507975,-0.01460026,-0.014153075,-0.05073053,-0.051166657,-0.048937127,-0.007563265,0.037166316,0.025489613,-0.044079475,0.043530405,-0.059889566,0.05471209,-0.05537088,0.01924749,0.025822919,-0.024195813,0.031999364,-0.016678056,-0.010516429,0.08991519,0.03680557,-0.038195502,0.041387692,0.030264439,0.048097845,-0.013584218,-0.017811336,0.0038160768,0.006187744,-0.015176005,0.06485984,-0.00559839,0.009848908,0.004825394,0.004178837,0.0041750832,0.031239016,0.032191068,0.05238209,-0.04896761,0.06949835,0.030389288,-0.00039762157,0.005750892,-0.03427833,0.012010288,0.008118706,0.02776254,-0.002503008,-0.022469768,0.06694924,0.0283739,0.009241379,-0.04774275,-0.047146752,0.008026952,0.009302717,0.0042903833,-0.029648727,0.011311323,0.026836993,0.008888812,0.060874134,0.04650512,0.057651453,0.017746722,0.026502442,-0.047597338,0.026719665,-0.016353244,-0.017063107,0.05161689,0.003174038,0.030389093,-0.06447976,-0.038439862,-0.012300103,-0.024221791,0.018004136,-0.008014348,-0.06976162,-0.018146735,-0.03354337,0.007179007,0.01805371,0.02540143,0.053246927,-0.0045886813,0.06499256,-0.037194,-0.06179589,-0.026073942,0.022531172,-0.011474387,-0.015523591,-0.042890657,-0.028563859,0.055358496,-0.010227293,0.03639366,-0.012126838,-0.015207781,0.0076662763,0.07214616,0.04760833,0.007873336,0.08127003,-0.033448357,0.0387517,-0.008101852,-0.0476552,0.0435678,-0.06857306,-0.015375579,-0.03647711,0.051659655,0.004576931,0.009633036,0.00169288,0.01555784,0.013080547,-0.038363785,0.025079025,-0.013730941,0.016250674,0.013906434,0.00013119078,-0.03040764,0.0054364745,0.054667633,0.03388285,-0.06662036,-0.0287965,0.06319114,0.0047318726,-0.027958438,0.04192802,0.0041983854,-0.02080696,0.03441165,0.03192992,0.008812403,-0.03417277,0.022220703,0.055165727,0.05899308,0.0024519812,-0.04219771,-0.02919548,0.0083227325,-0.033596717,0.06519373,-0.01368142,-0.10122797,0.026352908,-0.011057474,-0.07793807,0.03446891,-0.046499953,-0.013069766,0.0010576277,-0.05330965,0.049246777,0.0071581663,-0.002070735,0.011931532,0.034597944,-0.023213437,-0.05339252,-0.053976137,0.018914161,-0.021627981,0.0011900569,-0.030615272,0.09812815,0.044395205,-0.034791,0.031916823,-0.016551115,0.03652417,-0.0022837752,-0.028721858,0.02529441,0.022866342,-0.012133743,-0.072024204,-0.021472609,0.020685598,-0.0052572135,-0.030553441,0.031383257,-0.09010233,-0.05962325,-0.024166595,0.021947393,-0.073514596,-0.009594707,0.0641291,-0.015821123,0.036685545,0.010008464,-0.0027504913,-0.015413782,-0.03847186,-0.02193749,-0.009707702,-0.024438974,-0.019906133,-0.034062233,-0.02319056,0.019226803,-0.040069155,-0.024686243,-0.02692334,0.006769598,0.025099332,0.038047694,0.038075496,-0.030033486,0.03932267,-0.017840037,0.044436894,0.0038994348,0.040298402,0.014999835,-0.037529305,-0.00014537373,0.09962487,-0.01400093,0.0056403484,-0.042419687,0.02184696,-0.002389465,-0.02047721,-0.0038295097,0.03213749,-0.031228237,0.013305279,-0.069969036,0.018900707,-0.0495584,-0.025843987,0.026023861,0.05217377,-0.04182135,-0.018359512,0.028930385,0.014793276,-0.033536937,-0.017867353,0.08309154,-0.0005805079,0.015007756,0.053878393,-0.039793056,-0.013602252,-0.009116012,-0.02761262,0.048943188,0.012073433,0.041086648,-0.032579944,-0.07493618,0.0056753308,-0.015919741,-0.026841357,0.0076324134,0.022051878,-0.008360009,0.059947148,-0.02487301,0.033594925,0.066873305,-0.044568457,-0.01429474,-0.02229864,0.009931179,-0.08641866,-0.042166714,-0.010642484,0.052581448,-0.0211534,0.0008226748,0.01065394,0.08013386,0.0682695,0.027249018,0.047481645,0.023925755,0.0414506,-0.027185373,-0.010854739,0.010449606,0.033257607,0.08165655,-0.013146088,0.026461102,-0.037274692,-0.07567519,-0.039073106,0.014912829,-0.037538875,0.03207182,-0.05807912,-0.02372498,-0.05255185,-0.020179033,0.012737276,0.03805817,-0.08211388,-0.011533785,-0.02682113,0.0067142267,0.08134318,0.031958926,-0.053475756,-0.034286704,-0.011969257,0.02077399,-0.053879086,0.014471575,-0.03967824,-0.029199947,-0.021510936,-0.019289194,-0.02280561,-0.049555603,-0.066475235,-0.034232475,0.0033015595,0.035052966,-0.017068239,0.003750751,0.016369265,-0.01288807,-0.061849345,0.003117991,-0.038928725,0.006526757,0.027105147,-0.051267624,-0.009369404,0.019124838,-0.0017292873,0.035431627,-0.0268676,-0.034148786,-0.015060772,-0.029066555,-0.05789417,0.027795687,-0.04110921,0.04579707,-0.04035693,-0.06851787,-0.04867982,-0.0059945793,-0.049473666,0.034016874,-0.0102759795,0.01170897,0.009153424,-0.021356156,-0.024061508,0.015397368,-0.05119693,-0.0147932805,-0.0145712,0.019154344,-0.03084555,0.026801629,0.036409337,0.016186034,-0.03327714,0.026400823,0.010572384,0.034174588,-0.002794671,-0.09330809,0.05891254,-0.022816183,-0.036802,0.0054281894,-0.0047769207,0.056460787,-0.026738448,-0.023698306,-0.020369794,-0.023934355,0.026079638,-0.014234837,0.06781087,0.0006414148,-0.026350096,-0.006333071,-0.034078687,-0.0023477247,0.008686611,-0.045400262,0.055997066,0.02909133,0.004334548,-0.004096333,-0.026362501,-0.016292185,-0.02370919,0.047694,-0.024994504,0.0034593437,-0.0017264878,0.045686338,0.025575956,0.014518138,0.01210467,0.007952755,-0.076696634,0.03947023,0.0050095473,0.018389221,0.06778853,-0.011354745,-0.006870839,0.042412054,-0.03473933,-0.049222756,-0.016240818,0.031903632,-0.05964454,0.03169456,0.05045855,-0.043512568,0.047445428,-0.03515794,0.072267555,-0.0725646,0.023267848,-0.034854222,-0.0063442625,0.013940438,0.013044295,0.06249441,0.0039472166,0.03354109,0.022317875,0.022625674,-0.009774106,-0.0060921647,0.03740352,0.00421308,-0.09585586,0.0536603,-0.016087322,-0.015315649,0.034453917,0.027910922,-0.04775162,-0.005371069,-0.013216858,-0.0155923115,-0.03452844,-0.014680296,-0.0077368836,-0.010362155,0.0105334,0.026375573,-0.021861501,0.04747084,0.0021745875,-0.013545878,-0.023652365,0.025268162,0.008234313,0.01628121,0.016717171,-0.0075437324,-0.01746084,0.05737496,-0.05672066,-0.03184725,0.010788341,0.016423313,0.009073566,-0.0142192785,0.02372472,-0.06752908,0.05532568,0.037167847,0.047181085,0.044156887,0.018095804,0.023586195,-0.028379582,-0.032021254,0.06580868,-0.06653552,0.0027542796,0.033036385,0.03680165,-0.01051331,0.00035514694,0.02673367,-0.010264402,0.016420377,-0.042696778,0.057180658,-0.038457163,0.06396458,-0.026014995,-0.0024609137,0.0010753045,0.02769898,0.055228665,0.01562575,0.0079133725,0.020817937,-0.0068666954,-0.0059866444,-0.006472586,0.033799637,-0.026940405,0.024900952,-0.025138052,0.01912036,-0.033090316,0.010980622,-0.019911084,0.0395164,0.027147084,0.02181863,0.006602812,0.080255754,-0.0145429745,0.024768474,0.09369619,0.023963366,-0.0013371798,-0.06746511,0.008339503,-0.024847483,0.021772295,0.03816823,0.040221363,-0.1016634,0.011362837,0.011084681,-0.016954988,0.007863526,0.052209977,-0.016033238,-0.041119866,-0.027817534,0.016873246,-0.046511825,-0.0033429766,0.028200418,-0.0056276945,-0.0070248744,0.038796965,-0.044849742,-0.035893444,0.023809932,-0.0021301517,-0.02977494,0.005882937,-0.011693702,-0.0151127875,-0.012105677,-0.021708217,-0.019413117,-0.049822457,-0.048396558,0.031395435,-0.07354659,0.026777327,0.057155307,-0.0057960944,0.029630644,-0.001306779,-0.01390428,0.014564886,0.04425651,0.03886256,-0.03860564,-0.027730323,0.0065537225,-0.026742537,0.0022833804,-0.0037291856,-0.030873371,0.03596761,-0.052820936,-0.005083799,0.0146031,-0.010864949,-0.048773322,0.032400858,0.08056325,0.028939461,-0.025191756,0.0069188657,0.052944552,0.07390008,-0.021732058,-0.0447556,-0.0057965806,0.04031473,-6.469404e-05,0.043043952,0.026216112,0.033643506,0.050295535,0.058774624,0.042921174,-0.022581654,-0.014618628,0.02785504,0.004492553,0.017646704,-0.011454965,-0.024788052,-0.017392153,0.07012217,0.023839653,0.01476434,0.035592753,0.019096563,-0.017759014,0.07362237,-0.010061221,0.041428026,0.023502957,-0.035065055,0.0124496,-0.016825544,-0.009891368,0.07399001,-0.06956246,0.035480075,0.009672069,0.043887157,-0.06653184,-0.07324449,-0.042176068,-0.02464293,-0.004013292,0.013136521,0.05198291,-0.035796057,0.01002043,0.0061701233,-0.0028749586,-0.040683024,-0.0508785,0.016341563,-0.00030985652,0.027487975,0.061645713,-0.07023507,-0.009168633,0.012893412,-0.039602123,0.048401248,-0.021774683,0.00921202,0.037446465,-0.0015287205,0.00038079883,0.04028422,-0.04217838,0.05758646]"
  },
  {
      "id": "81fd31ac-ee07-49b7-93df-2566ecc0449e",
      "Title": "Note Taker Test Call2",
      "Full_Date": "2024-05-01",
      "Attendees": "Manish Srivastava, Tanweer Alam",
      "Attendees_Emails": "dmi.meetings@dmifinance.in,dhaval.rupapara@dmifinance.in, dhaval.rce21@sot.pdpu.ac.in, yashagrawal946@gmail.com",
      "Time": "12:16AM",
      "Meeting_Transcript": "Unknown speaker - 01:47Seems you joined the wrong meeting the previous month, is that correct?So when I joined this call, this DMI meeting node keeper is already here.Manish Srivastava - 02:01And if we see this console, what is there?So it is recording this particular thing.And the interesting thing is I have not activated the Joom account associated with the DMI meetings.It seems it does not require any Joom account as such.Yes, for participants it is not required to Joom.I don't think we need to activate this.Manish Srivastava - 02:40If we end this call, I am sending you a separate Joom so that we could check So I think we can discuss two or three minutes more.Tanweer Alam - 02:52I have one more thing that needs to be discussed.So just I am saving my screen.Let us do one thing.So once we have this transcript, if we receive this transcript over email, I will inform Siv that I am going to test this particular thing.And I will ask Manish to add this email id in view of the SIV's call.Yes, I think he could add this email id as a participant.Tanweer Alam - 03:25Yes.Then let us see what is going to happen.But the primary thing is that we receive an email, at least me and you receive an email from this email id.What is the transcript and what is the purpose of the meeting?And then try to check what else we can do.Now, let me know.Tanweer Alam - 03:44So, I am setting my screen.So, I think one thing is pending for Marjara's audit.So, just I have opened the requirements.A list of participants is a list of participants that may occur during meetingYes, this one.So, Manish is asking to fill this form but I am not able to find all the details which is available in this list actually.Tanweer Alam - 04:57And why they need this?I don't know why this is.After completion of audit, he required some details in this format.Purpose of the questionnaire.Obtaining and understanding of the IT environment in capacity step in our audit methodology.This questionnaire contains matters that the auditor may consider in obtaining and understanding of the IT environment and is based on ISA 315R.Tanweer Alam - 05:41Completed with a specific subject from the majora's audit methodology.That this tab is a calling permission is required, so just call it down.Send this form to me, just send this form to me, let me have a look of it.Sure, sure, sure.And then we will connect our call and we could try to fill it out, maybe tomorrow or day after.Sure, sure, so I am just setting.Tanweer Alam - 06:17And you can uninstall this firethumb.This firethumb is no more required.Tick, tick, ok, I will do Tick, I am ending this call and sending you a separate room.Sure, sure, ok.",
      "Meeting_Transcript_Embedding": "[0.01627949,-0.01602609,-0.049096756,-0.011891124,0.03667856,0.0073984163,-0.0007277211,-0.030838992,-0.025854958,0.09065079,-0.0015806578,0.02187459,-0.035661038,-0.019839542,-0.008292172,-0.016174272,0.040496908,-0.0055469885,-0.014284709,-0.0034404572,-0.026387466,0.026812822,-0.036776423,-0.00679996,0.036326747,0.033574056,0.036494788,-0.020849397,-0.027785404,0.037807867,-0.046549782,0.069850825,-0.039531328,0.02763885,-0.0247179,-0.040937155,-0.020774366,0.010860433,0.00033836934,0.050965045,-0.0049526733,-0.059120327,-0.01878409,0.011132936,-0.0066584023,0.0056577013,-0.04280972,0.016063733,0.015511578,0.0011755788,0.033780783,0.011369224,0.010293139,0.0007191651,-0.027694086,0.020219492,0.012164434,0.038795453,-0.020318443,-0.015207336,0.024471754,-0.024584092,-0.03013281,0.03294183,-0.020844959,-0.031433325,-0.011804364,-0.019486163,0.0635735,-0.0005862638,0.024883298,0.0048659337,0.07853692,-0.0043955264,-0.06442048,-0.12189893,0.0015627906,0.04903604,0.023575878,0.028664669,-0.012705246,-0.018130504,-0.029242694,-0.023113152,-0.06086933,0.012687402,0.00029293276,0.048449133,0.0049340017,0.012997987,0.001314025,0.02998642,0.0019167034,-0.06821229,0.020082017,0.083836146,-0.03747635,-0.024507975,-0.01460026,-0.014153075,-0.05073053,-0.051166657,-0.048937127,-0.007563265,0.037166316,0.025489613,-0.044079475,0.043530405,-0.059889566,0.05471209,-0.05537088,0.01924749,0.025822919,-0.024195813,0.031999364,-0.016678056,-0.010516429,0.08991519,0.03680557,-0.038195502,0.041387692,0.030264439,0.048097845,-0.013584218,-0.017811336,0.0038160768,0.006187744,-0.015176005,0.06485984,-0.00559839,0.009848908,0.004825394,0.004178837,0.0041750832,0.031239016,0.032191068,0.05238209,-0.04896761,0.06949835,0.030389288,-0.00039762157,0.005750892,-0.03427833,0.012010288,0.008118706,0.02776254,-0.002503008,-0.022469768,0.06694924,0.0283739,0.009241379,-0.04774275,-0.047146752,0.008026952,0.009302717,0.0042903833,-0.029648727,0.011311323,0.026836993,0.008888812,0.060874134,0.04650512,0.057651453,0.017746722,0.026502442,-0.047597338,0.026719665,-0.016353244,-0.017063107,0.05161689,0.003174038,0.030389093,-0.06447976,-0.038439862,-0.012300103,-0.024221791,0.018004136,-0.008014348,-0.06976162,-0.018146735,-0.03354337,0.007179007,0.01805371,0.02540143,0.053246927,-0.0045886813,0.06499256,-0.037194,-0.06179589,-0.026073942,0.022531172,-0.011474387,-0.015523591,-0.042890657,-0.028563859,0.055358496,-0.010227293,0.03639366,-0.012126838,-0.015207781,0.0076662763,0.07214616,0.04760833,0.007873336,0.08127003,-0.033448357,0.0387517,-0.008101852,-0.0476552,0.0435678,-0.06857306,-0.015375579,-0.03647711,0.051659655,0.004576931,0.009633036,0.00169288,0.01555784,0.013080547,-0.038363785,0.025079025,-0.013730941,0.016250674,0.013906434,0.00013119078,-0.03040764,0.0054364745,0.054667633,0.03388285,-0.06662036,-0.0287965,0.06319114,0.0047318726,-0.027958438,0.04192802,0.0041983854,-0.02080696,0.03441165,0.03192992,0.008812403,-0.03417277,0.022220703,0.055165727,0.05899308,0.0024519812,-0.04219771,-0.02919548,0.0083227325,-0.033596717,0.06519373,-0.01368142,-0.10122797,0.026352908,-0.011057474,-0.07793807,0.03446891,-0.046499953,-0.013069766,0.0010576277,-0.05330965,0.049246777,0.0071581663,-0.002070735,0.011931532,0.034597944,-0.023213437,-0.05339252,-0.053976137,0.018914161,-0.021627981,0.0011900569,-0.030615272,0.09812815,0.044395205,-0.034791,0.031916823,-0.016551115,0.03652417,-0.0022837752,-0.028721858,0.02529441,0.022866342,-0.012133743,-0.072024204,-0.021472609,0.020685598,-0.0052572135,-0.030553441,0.031383257,-0.09010233,-0.05962325,-0.024166595,0.021947393,-0.073514596,-0.009594707,0.0641291,-0.015821123,0.036685545,0.010008464,-0.0027504913,-0.015413782,-0.03847186,-0.02193749,-0.009707702,-0.024438974,-0.019906133,-0.034062233,-0.02319056,0.019226803,-0.040069155,-0.024686243,-0.02692334,0.006769598,0.025099332,0.038047694,0.038075496,-0.030033486,0.03932267,-0.017840037,0.044436894,0.0038994348,0.040298402,0.014999835,-0.037529305,-0.00014537373,0.09962487,-0.01400093,0.0056403484,-0.042419687,0.02184696,-0.002389465,-0.02047721,-0.0038295097,0.03213749,-0.031228237,0.013305279,-0.069969036,0.018900707,-0.0495584,-0.025843987,0.026023861,0.05217377,-0.04182135,-0.018359512,0.028930385,0.014793276,-0.033536937,-0.017867353,0.08309154,-0.0005805079,0.015007756,0.053878393,-0.039793056,-0.013602252,-0.009116012,-0.02761262,0.048943188,0.012073433,0.041086648,-0.032579944,-0.07493618,0.0056753308,-0.015919741,-0.026841357,0.0076324134,0.022051878,-0.008360009,0.059947148,-0.02487301,0.033594925,0.066873305,-0.044568457,-0.01429474,-0.02229864,0.009931179,-0.08641866,-0.042166714,-0.010642484,0.052581448,-0.0211534,0.0008226748,0.01065394,0.08013386,0.0682695,0.027249018,0.047481645,0.023925755,0.0414506,-0.027185373,-0.010854739,0.010449606,0.033257607,0.08165655,-0.013146088,0.026461102,-0.037274692,-0.07567519,-0.039073106,0.014912829,-0.037538875,0.03207182,-0.05807912,-0.02372498,-0.05255185,-0.020179033,0.012737276,0.03805817,-0.08211388,-0.011533785,-0.02682113,0.0067142267,0.08134318,0.031958926,-0.053475756,-0.034286704,-0.011969257,0.02077399,-0.053879086,0.014471575,-0.03967824,-0.029199947,-0.021510936,-0.019289194,-0.02280561,-0.049555603,-0.066475235,-0.034232475,0.0033015595,0.035052966,-0.017068239,0.003750751,0.016369265,-0.01288807,-0.061849345,0.003117991,-0.038928725,0.006526757,0.027105147,-0.051267624,-0.009369404,0.019124838,-0.0017292873,0.035431627,-0.0268676,-0.034148786,-0.015060772,-0.029066555,-0.05789417,0.027795687,-0.04110921,0.04579707,-0.04035693,-0.06851787,-0.04867982,-0.0059945793,-0.049473666,0.034016874,-0.0102759795,0.01170897,0.009153424,-0.021356156,-0.024061508,0.015397368,-0.05119693,-0.0147932805,-0.0145712,0.019154344,-0.03084555,0.026801629,0.036409337,0.016186034,-0.03327714,0.026400823,0.010572384,0.034174588,-0.002794671,-0.09330809,0.05891254,-0.022816183,-0.036802,0.0054281894,-0.0047769207,0.056460787,-0.026738448,-0.023698306,-0.020369794,-0.023934355,0.026079638,-0.014234837,0.06781087,0.0006414148,-0.026350096,-0.006333071,-0.034078687,-0.0023477247,0.008686611,-0.045400262,0.055997066,0.02909133,0.004334548,-0.004096333,-0.026362501,-0.016292185,-0.02370919,0.047694,-0.024994504,0.0034593437,-0.0017264878,0.045686338,0.025575956,0.014518138,0.01210467,0.007952755,-0.076696634,0.03947023,0.0050095473,0.018389221,0.06778853,-0.011354745,-0.006870839,0.042412054,-0.03473933,-0.049222756,-0.016240818,0.031903632,-0.05964454,0.03169456,0.05045855,-0.043512568,0.047445428,-0.03515794,0.072267555,-0.0725646,0.023267848,-0.034854222,-0.0063442625,0.013940438,0.013044295,0.06249441,0.0039472166,0.03354109,0.022317875,0.022625674,-0.009774106,-0.0060921647,0.03740352,0.00421308,-0.09585586,0.0536603,-0.016087322,-0.015315649,0.034453917,0.027910922,-0.04775162,-0.005371069,-0.013216858,-0.0155923115,-0.03452844,-0.014680296,-0.0077368836,-0.010362155,0.0105334,0.026375573,-0.021861501,0.04747084,0.0021745875,-0.013545878,-0.023652365,0.025268162,0.008234313,0.01628121,0.016717171,-0.0075437324,-0.01746084,0.05737496,-0.05672066,-0.03184725,0.010788341,0.016423313,0.009073566,-0.0142192785,0.02372472,-0.06752908,0.05532568,0.037167847,0.047181085,0.044156887,0.018095804,0.023586195,-0.028379582,-0.032021254,0.06580868,-0.06653552,0.0027542796,0.033036385,0.03680165,-0.01051331,0.00035514694,0.02673367,-0.010264402,0.016420377,-0.042696778,0.057180658,-0.038457163,0.06396458,-0.026014995,-0.0024609137,0.0010753045,0.02769898,0.055228665,0.01562575,0.0079133725,0.020817937,-0.0068666954,-0.0059866444,-0.006472586,0.033799637,-0.026940405,0.024900952,-0.025138052,0.01912036,-0.033090316,0.010980622,-0.019911084,0.0395164,0.027147084,0.02181863,0.006602812,0.080255754,-0.0145429745,0.024768474,0.09369619,0.023963366,-0.0013371798,-0.06746511,0.008339503,-0.024847483,0.021772295,0.03816823,0.040221363,-0.1016634,0.011362837,0.011084681,-0.016954988,0.007863526,0.052209977,-0.016033238,-0.041119866,-0.027817534,0.016873246,-0.046511825,-0.0033429766,0.028200418,-0.0056276945,-0.0070248744,0.038796965,-0.044849742,-0.035893444,0.023809932,-0.0021301517,-0.02977494,0.005882937,-0.011693702,-0.0151127875,-0.012105677,-0.021708217,-0.019413117,-0.049822457,-0.048396558,0.031395435,-0.07354659,0.026777327,0.057155307,-0.0057960944,0.029630644,-0.001306779,-0.01390428,0.014564886,0.04425651,0.03886256,-0.03860564,-0.027730323,0.0065537225,-0.026742537,0.0022833804,-0.0037291856,-0.030873371,0.03596761,-0.052820936,-0.005083799,0.0146031,-0.010864949,-0.048773322,0.032400858,0.08056325,0.028939461,-0.025191756,0.0069188657,0.052944552,0.07390008,-0.021732058,-0.0447556,-0.0057965806,0.04031473,-6.469404e-05,0.043043952,0.026216112,0.033643506,0.050295535,0.058774624,0.042921174,-0.022581654,-0.014618628,0.02785504,0.004492553,0.017646704,-0.011454965,-0.024788052,-0.017392153,0.07012217,0.023839653,0.01476434,0.035592753,0.019096563,-0.017759014,0.07362237,-0.010061221,0.041428026,0.023502957,-0.035065055,0.0124496,-0.016825544,-0.009891368,0.07399001,-0.06956246,0.035480075,0.009672069,0.043887157,-0.06653184,-0.07324449,-0.042176068,-0.02464293,-0.004013292,0.013136521,0.05198291,-0.035796057,0.01002043,0.0061701233,-0.0028749586,-0.040683024,-0.0508785,0.016341563,-0.00030985652,0.027487975,0.061645713,-0.07023507,-0.009168633,0.012893412,-0.039602123,0.048401248,-0.021774683,0.00921202,0.037446465,-0.0015287205,0.00038079883,0.04028422,-0.04217838,0.05758646]"
  }
]