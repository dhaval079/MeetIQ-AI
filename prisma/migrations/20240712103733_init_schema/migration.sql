-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "Meet_link" TEXT,
    "Title" TEXT,
    "Title_Embedding" vector(768),
    "Time" TEXT,
    "Month" INTEGER,
    "Year" INTEGER,
    "Full_Date" TEXT,
    "Attendees" TEXT,
    "Attendees_Emails" TEXT,
    "Meeting_Agenda" TEXT,
    "Meeting_Highlights" TEXT,
    "Meeting_Transcript" TEXT,
    "Meeting_Transcript_Embedding" vector(768),
    "Meeting_summary" TEXT,
    "Meeting_summary_Embedding" vector(768),
    "Chunk_number" TEXT,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadUserData" (
    "id" TEXT NOT NULL,
    "User_Email" TEXT NOT NULL,

    CONSTRAINT "ThreadUserData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "ThreadID" TEXT NOT NULL,
    "Entire_data" JSONB NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "User_threadID" TEXT NOT NULL,
    "Question" TEXT NOT NULL,
    "Answer" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreadUserData_User_Email_key" ON "ThreadUserData"("User_Email");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_ThreadID_key" ON "Conversation"("ThreadID");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_Email_fkey" FOREIGN KEY ("Email") REFERENCES "ThreadUserData"("User_Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_User_threadID_fkey" FOREIGN KEY ("User_threadID") REFERENCES "Conversation"("ThreadID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_Email_fkey" FOREIGN KEY ("Email") REFERENCES "ThreadUserData"("User_Email") ON DELETE RESTRICT ON UPDATE CASCADE;
