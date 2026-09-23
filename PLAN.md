# Portfolio AI Chatbot — Step-by-Step Build Plan

## 1. Project Goal

Build an AI chatbot for my personal portfolio that can answer questions about:

* Me
* Education
* Work experience
* Skills
* Projects
* EcoQuest
* Internship experience
* Career interests
* Technologies I use

The chatbot should use **RAG** so that answers are based on my own portfolio data instead of relying only on the LLM's general knowledge.

### Example questions

```text
What projects has Amirul built?

Tell me about EcoQuest.

What technologies does Amirul know?

Has Amirul worked with AI?

What did Amirul do during his internship?

What technologies were used in EcoQuest?

Does Amirul have experience with Next.js?

What kind of software developer is Amirul looking for?
```

---

# 2. Target Architecture

```text
                        ┌──────────────────────┐
                        │      Portfolio       │
                        │      Next.js UI      │
                        │                      │
                        │      Chat Box        │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │    Next.js API       │
                        │    /api/chat         │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │      LangChain       │
                        │                      │
                        │  RAG orchestration   │
                        └───────┬───────┬──────┘
                                │       │
                    ┌───────────┘       └────────────┐
                    ▼                                ▼
          ┌─────────────────┐               ┌─────────────────┐
          │ Supabase        │               │ Gemini API      │
          │ pgvector        │               │                 │
          │                 │               │ LLM             │
          │ Vector Search   │               │                 │
          └────────┬────────┘               └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Portfolio Data  │
          │                 │
          │ Projects        │
          │ Skills          │
          │ Experience      │
          │ Education       │
          └─────────────────┘
```

---

# 3. Technology Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS

## AI

* Google Gemini
* LangChain

## RAG

* LangChain
* Embeddings
* Supabase pgvector

## Database

* Supabase
* PostgreSQL
* pgvector

## Deployment

* Vercel

---

# 4. Development Phases

Build the project in these phases.

```text
Phase 1  → Basic Gemini Chat
Phase 2  → Chat UI
Phase 3  → Portfolio Knowledge Base
Phase 4  → Embeddings
Phase 5  → Supabase Vector Database
Phase 6  → LangChain RAG
Phase 7  → Conversation Memory
Phase 8  → Streaming
Phase 9  → Portfolio Integration
Phase 10 → Deployment
```

Do not build everything at once.

---

# Phase 1 — Create the Next.js Project

Create the application.

```bash
npx create-next-app@latest portfolio-chatbot
```

Recommended options:

```text
TypeScript        → Yes
ESLint            → Yes
Tailwind CSS      → Yes
src/ directory    → Yes
App Router        → Yes
Turbopack         → Yes
```

Enter the project:

```bash
cd portfolio-chatbot
```

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Confirm the Next.js application works before continuing.

---

# Phase 2 — Install Dependencies

Install LangChain:

```bash
npm install langchain @langchain/core @langchain/google-genai
```

Install Supabase:

```bash
npm install @supabase/supabase-js
```

Install an embedding library if using local embeddings:

```bash
npm install @xenova/transformers
```

Depending on the final embedding approach, this package may be replaced later.

---

# Phase 3 — Environment Variables

Create:

```text
.env.local
```

Example:

```env
GOOGLE_API_KEY=your_gemini_api_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Important:

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_API_KEY
```

to the browser.

Do not prefix server-only secrets with:

```text
NEXT_PUBLIC_
```

---

# Phase 4 — Build Basic Gemini Chat

Before RAG, make sure Gemini works.

Create:

```text
src/app/api/chat/route.ts
```

Initial architecture:

```text
POST /api/chat

User message
     ↓
Gemini
     ↓
Response
```

The frontend sends:

```json
{
  "message": "Hello"
}
```

The API returns:

```json
{
  "answer": "Hello! How can I help?"
}
```

### Goal

At this stage, do NOT use:

* RAG
* embeddings
* Supabase
* LangChain retrievers

Just prove that:

```text
Next.js → API → Gemini → Next.js
```

works.

---

# Phase 5 — Build the Chat UI

Create a simple chat interface.

Suggested structure:

```text
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
│
├── components/
│   ├── ChatBox.tsx
│   ├── ChatMessage.tsx
│   └── ChatInput.tsx
│
└── lib/
```

UI:

```text
┌────────────────────────────────────────┐
│ Ask Amirul                         ✕  │
├────────────────────────────────────────┤
│                                        │
│ 👤 What is EcoQuest?                   │
│                                        │
│ 🤖 EcoQuest is an educational          │
│    application built with Flutter...   │
│                                        │
│                                        │
├────────────────────────────────────────┤
│ Ask me anything...                 ➤  │
└────────────────────────────────────────┘
```

Don't worry about animations yet.

Focus on functionality.

---

# Phase 6 — Prepare Portfolio Knowledge

Create a knowledge base.

```text
knowledge/
├── about.md
├── education.md
├── experience.md
├── skills.md
├── projects.md
├── ecoquest.md
├── internship.md
└── career.md
```

Example:

```md
# EcoQuest

EcoQuest is a Flutter and Dart educational
application designed for primary school students
to explore flora and fauna.

Technologies:

- Flutter
- Dart
- TensorFlow Lite
- Gemini
- Supabase

Features:

- Species recognition
- AR species information
- Learning prompts
- Quests
- Journaling
- XP
- Badges
- Offline recognition
```

Keep the information factual.

The chatbot should not invent information that isn't in the knowledge base.

---

# Phase 7 — Understand the RAG Pipeline

Before implementing LangChain, keep this mental model:

```text
Documents
    ↓
Document Loader
    ↓
Text Splitter
    ↓
Chunks
    ↓
Embeddings
    ↓
Vector Database
```

When the user asks:

```text
"What technologies does EcoQuest use?"
```

the runtime pipeline becomes:

```text
Question
    ↓
Question Embedding
    ↓
Vector Search
    ↓
Relevant Chunks
    ↓
Prompt + Context
    ↓
Gemini
    ↓
Answer
```

---

# Phase 8 — Add Supabase pgvector

Create a Supabase project.

Enable the vector extension:

```sql
create extension if not exists vector;
```

Create a documents table.

Example:

```sql
create table documents (
    id bigserial primary key,
    content text,
    metadata jsonb,
    embedding vector(384)
);
```

The `384` dimension assumes an embedding model that outputs 384-dimensional vectors.

If another embedding model is selected later, change the dimension accordingly.

---

# Phase 9 — Create the Ingestion Pipeline

Create:

```text
scripts/
└── ingest.ts
```

The ingestion pipeline should:

```text
Markdown files
      ↓
Load documents
      ↓
Split documents
      ↓
Generate embeddings
      ↓
Store in Supabase
```

Conceptually:

```typescript
const documents = loadDocuments();

const chunks = splitDocuments(documents);

const embeddings = createEmbeddings();

await vectorStore.addDocuments(chunks);
```

This is where LangChain starts becoming useful.

---

# Phase 10 — Use LangChain Embeddings

Create a dedicated module:

```text
src/lib/embeddings.ts
```

Example responsibility:

```text
embeddings.ts

createEmbedding()
```

The important concept:

```text
Document chunk
      ↓
Embedding model
      ↓
Vector
```

For example:

```text
"EcoQuest uses Flutter and Dart."

        ↓

[0.012, -0.183, 0.092, ...]
```

The exact vector values are not important.

Similarity between vectors is what matters.

---

# Phase 11 — Create the Retriever

Create:

```text
src/lib/retriever.ts
```

The retriever should answer:

> "Given this question, which pieces of my portfolio information are relevant?"

Example:

```text
Question:

"What AI technology does EcoQuest use?"
```

Retriever:

```text
Top result:
ecoquest.md

Relevant chunk:
"EcoQuest uses TensorFlow Lite for offline
species recognition and Gemini for learning
prompts."
```

Start with:

```text
topK = 4
```

You can experiment later.

---

# Phase 12 — Build the LangChain RAG Chain

Create:

```text
src/lib/rag.ts
```

Architecture:

```text
User Question
      ↓
Retriever
      ↓
Top 4 Chunks
      ↓
Prompt Template
      ↓
Gemini
      ↓
Answer
```

Prompt concept:

```text
You are Amirul's portfolio assistant.

Answer the user's question using the provided
portfolio context.

If the answer cannot be found in the context,
say that the information is not available.

Do not invent experience, projects, technologies,
or qualifications.

Context:
{context}

Question:
{question}
```

---

# Phase 13 — Connect RAG to the Chat API

Now change:

```text
POST /api/chat

Question
 ↓
Gemini
 ↓
Answer
```

into:

```text
POST /api/chat

Question
 ↓
LangChain Retriever
 ↓
Relevant documents
 ↓
Prompt
 ↓
Gemini
 ↓
Answer
```

Now the chatbot is officially RAG-powered.

---

# Phase 14 — Add Source Information

For a portfolio chatbot, showing sources is useful.

Example:

```text
🤖 EcoQuest uses Flutter and Dart for development.
It also uses TensorFlow Lite for offline species
recognition and Gemini for learning prompts.

Sources:
📄 EcoQuest
```

Your retrieved document metadata can contain:

```json
{
  "source": "ecoquest.md",
  "type": "project"
}
```

Use that metadata to display the source.

---

# Phase 15 — Add Conversation History

Currently:

```text
User:
Tell me about EcoQuest.

Bot:
EcoQuest is...
```

Then:

```text
User:
What AI does it use?
```

The system needs to understand that "it" refers to EcoQuest.

Store recent messages:

```text
messages = [
    {
        role: "user",
        content: "Tell me about EcoQuest"
    },
    {
        role: "assistant",
        content: "EcoQuest is..."
    },
    {
        role: "user",
        content: "What AI does it use?"
    }
]
```

Then send relevant conversation history to the LLM.

---

# Phase 16 — Separate Memory From RAG

Remember:

```text
RAG
=
Long-term knowledge

Conversation history
=
Short-term conversation context
```

Example:

```text
RAG:

"Amirul built EcoQuest using Flutter."

Conversation:

User:
Tell me about EcoQuest.

Assistant:
...

User:
What AI does it use?
```

Both can work together.

---

# Phase 17 — Add Streaming

Instead of waiting:

```text
User
 ↓
[5 seconds]
 ↓
Complete answer
```

make the response appear progressively:

```text
User
 ↓
EcoQuest is an educational...
```

then:

```text
EcoQuest is an educational application
built using Flutter and Dart...
```

then:

```text
EcoQuest is an educational application built
using Flutter and Dart, with TensorFlow Lite...
```

This makes the chatbot feel much more like a real AI product.

Do this AFTER the RAG system works.

---

# Phase 18 — Add Portfolio Actions

Make the chatbot more than a text generator.

For example:

```text
User:
Show me Amirul's AI projects.
```

The chatbot can return project cards:

```text
┌──────────────────────┐
│ EcoQuest             │
│ Flutter · AI · TFLite│
│                      │
│ View Project →       │
└──────────────────────┘
```

Other possible actions:

```text
View Project
View GitHub
View Resume
Contact Amirul
```

This connects the AI directly to your portfolio.

---

# Phase 19 — Add Suggested Questions

When the chat opens:

```text
Ask me about:

[ My projects ]

[ My AI experience ]

[ EcoQuest ]

[ My tech stack ]
```

This helps visitors understand what the chatbot can do.

---

# Phase 20 — Handle Unknown Questions

The chatbot should NOT hallucinate.

Example:

```text
User:
What is Amirul's salary?

Bot:
I don't have information about that in my
portfolio knowledge base.
```

Another:

```text
User:
What company will Amirul work for next year?

Bot:
I don't have information about future employment
plans.
```

This is important for a portfolio chatbot.

---

# Phase 21 — Add Basic Security

Never expose:

```text
GOOGLE_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

to the client.

Use:

```text
.env.local
```

and server-side API routes.

Also add basic protection against:

* Excessive requests
* Extremely long prompts
* Prompt injection
* Abuse

---

# Phase 22 — Testing

Create test questions.

### Knowledge retrieval

```text
What is EcoQuest?

What technologies does EcoQuest use?

What is UPSI Access?

What framework was used for the Hostel Registration Portal?

What did Amirul do during his internship?
```

### Multi-turn questions

```text
Tell me about EcoQuest.

What AI does it use?

Why was that technology used?
```

### Unknown information

```text
What is Amirul's salary?

What is Amirul's home address?

What company will Amirul join in 2030?
```

Expected behavior:

```text
I don't have that information.
```

---

# Phase 23 — Evaluate RAG

Don't only test whether the answer "sounds good."

Check:

```text
1. Did retrieval find the correct document?

2. Did it retrieve enough context?

3. Did Gemini use the retrieved context?

4. Did the answer contain unsupported information?

5. Was the answer relevant?
```

Example:

```text
Question:
What technology is used for species recognition?

Expected:
TensorFlow Lite

Retrieved:
ecoquest.md

Result:
Correct
```

---

# Phase 24 — Deployment

Recommended:

```text
GitHub
   ↓
Vercel
   ↓
Next.js
```

Database:

```text
Supabase
```

AI:

```text
Gemini API
```

Architecture:

```text
             Vercel
               │
        ┌──────┴──────┐
        │   Next.js   │
        │   Chat UI   │
        └──────┬──────┘
               │
               ▼
        ┌──────────────┐
        │ API Routes   │
        │ + LangChain  │
        └──────┬───────┘
               │
       ┌───────┴────────┐
       ▼                ▼
   Supabase           Gemini
   pgvector             API
```

---

# 25. Final Project Structure

A possible final structure:

```text
portfolio-chatbot/
│
├── knowledge/
│   ├── about.md
│   ├── education.md
│   ├── experience.md
│   ├── skills.md
│   ├── projects.md
│   ├── ecoquest.md
│   └── internship.md
│
├── scripts/
│   └── ingest.ts
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   │
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ChatBox.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   └── SuggestedQuestions.tsx
│   │
│   └── lib/
│       ├── embeddings.ts
│       ├── rag.ts
│       ├── retriever.ts
│       ├── supabase.ts
│       └── gemini.ts
│
├── .env.local
├── package.json
└── README.md
```

---

# 26. Final User Flow

```text
Visitor opens portfolio
        ↓
Clicks "Ask Amirul"
        ↓
Chatbox opens
        ↓
"What projects has Amirul built?"
        ↓
Next.js API
        ↓
LangChain
        ↓
Retriever
        ↓
Supabase pgvector
        ↓
Top relevant documents
        ↓
Gemini
        ↓
Generated answer
        ↓
Answer displayed
        ↓
Sources / project cards
```

---

# 27. What I Should Be Able to Explain in an Interview

After completing this project, I should understand:

### LangChain

* What LangChain is
* Why I used it
* What a chain is
* What a retriever is
* What a prompt template is
* How LangChain interacts with Gemini

### RAG

* Why RAG is needed
* Chunking
* Embeddings
* Vector similarity
* Vector databases
* Retrieval
* Context injection
* Hallucination control

### Embeddings

* What embeddings represent
* Why documents are embedded
* Why questions are embedded
* How similarity search works
* Why embedding dimensions matter

### Supabase

* PostgreSQL
* pgvector
* Vector search
* Metadata filtering

### AI

* LLM vs embedding model
* Gemini API
* Context window
* Temperature
* Token usage
* API costs

### Production

* API security
* Environment variables
* Rate limiting
* Streaming
* Error handling
* Deployment

---

# 28. Portfolio / Resume Description

After completing the project, a concise project description could be:

> **AI Portfolio Assistant** — Built a RAG-powered chatbot using Next.js, LangChain, Gemini, and Supabase pgvector to answer questions about my projects, skills, education, and professional experience. Implemented semantic retrieval, conversational context, source attribution, and streaming responses.

---

# 29. Recommended Build Order

Do not jump ahead.

Follow this exact order:

```text
[ ] 1. Create Next.js project

[ ] 2. Install LangChain + Gemini dependencies

[ ] 3. Configure environment variables

[ ] 4. Make a basic Gemini API call

[ ] 5. Build basic chat UI

[ ] 6. Create portfolio knowledge files

[ ] 7. Set up Supabase

[ ] 8. Enable pgvector

[ ] 9. Build document ingestion

[ ] 10. Generate embeddings

[ ] 11. Store embeddings in Supabase

[ ] 12. Build LangChain retriever

[ ] 13. Build RAG chain

[ ] 14. Connect RAG to chat API

[ ] 15. Display sources

[ ] 16. Add conversation history

[ ] 17. Add streaming

[ ] 18. Add project cards/actions

[ ] 19. Test hallucinations

[ ] 20. Deploy to Vercel

[ ] 21. Write README

[ ] 22. Add project to portfolio
```

## Important

Because I have already built a RAG system manually, I should **not** treat LangChain as a black box.

For every major LangChain component, I should be able to answer:

> "What did this component replace in my manual RAG implementation?"

For example:

```text
Manual RAG                  LangChain
------------------------------------------------
Document loading       →    Document Loader

Chunking               →    Text Splitter

Embedding generation   →    Embeddings

Vector search          →    Retriever

Prompt construction    →    Prompt Template

LLM call               →    Chat Model

Pipeline orchestration →    Chain / Runnable
```

That way, this project demonstrates both **RAG understanding** and **framework usage**, rather than just calling an AI API.
