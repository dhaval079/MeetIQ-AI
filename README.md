# MeetIQ

An AI-powered meeting assistant that transforms Google Meet conversations into actionable insights.

## Features

- Automated data collection from Google Meet sessions
- AI-driven transcription and analysis of meeting content
- Seamless integration with Slack for team-wide access to meeting insights
- Interactive Q&A system based on processed meeting content
- Efficient data flow across multiple platforms (Google Meet, Drive, PostgreSQL, Slack)


![My Project Logo](meetiq.jpg)


## Technology Stack

- Backend: Node.js, Express.js, TypeScript
- Cloud Services: Google Cloud Platform, AWS
- Database: PostgreSQL
- AI and Machine Learning: OpenAI API
- Integrations: Zapier, Google Drive, Slack


### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- PostgreSQL
- Slack API credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meetiq.git
cd meetiq
```

2. Set up the Slack bot frontend:
```bash
cd slack-bolt-app
npm install
```

3. Set up the database:
```bash
cd ../prisma
npm install
```



5. Create .env files:

For slack-bolt-app/.env:
```bash

SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```


5. For prisma/.env:
```bash

DATABASE_URL="postgresql://username:password@localhost:5432/meetiq"
```


6. Initialize the database:
```bash

cd prisma
npx prisma migrate dev
```


7. Running the Application
Start the database service:
```bash

cd prisma
npm run start
```


8. In a new terminal, start the Slack bot:
```bash

cd slack-bolt-app
npm run start
```


### Development

Modify database schema in prisma/schema.prisma
Apply schema changes: npx prisma migrate dev
Slack bot logic located in slack-bolt-app/app.js
Core application logic in src/index.ts

### Testing

9. Run tests for each component:
```bash
cd slack-bolt-app
npm test

cd ../prisma
npm test
```

## System Architecture

1. Data Capture: Collect meeting data from Google Meet
2. Transcription: Generate accurate transcripts using MeetGeek
3. Storage: Save transcripts to Google Drive
4. Automation: Process data through custom Zapier workflows
5. Database: Store structured data in PostgreSQL on Google Cloud Platform
6. Analysis: Process data using custom APIs deployed on AWS
7. AI Enhancement: Utilize OpenAI for advanced data structuring and insights
8. Delivery: Present processed information to users via Slack interface

## Key Achievements

- Achieved 95% accuracy in AI-generated query responses
- Automated data collection for over 1,000 meetings monthly
- Significantly reduced manual data entry and processing time
- Improved team collaboration through easily accessible meeting insights

## Planned Enhancements

- Implement real-time meeting summary generation
- Develop sentiment analysis for team dynamics insights
- Integrate with popular project management tools
- Expand language support for international teams

## Contributing

We welcome contributions to the MeetIQ project. Please refer to our CONTRIBUTING.md file for guidelines on how to submit pull requests, report issues, and suggest enhancements.

## License

This project is licensed under the MIT License. See the LICENSE.md file for full details.

