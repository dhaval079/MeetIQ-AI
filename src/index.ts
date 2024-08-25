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
  },
  {
  },
  //add your meeting data here
]
