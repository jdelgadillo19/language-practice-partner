# AI Language Practice Partner - Planning Document

## 1. Product Vision
Build an AI-powered conversation partner that helps users practice a target language through realistic chat and speech interactions, adapted to each user's proficiency level (A1-C2).

Core value:
- Practice speaking/writing freely in the target language
- Receive support appropriate to proficiency level
- Learn progressively through guided correction and teaching modes

## 2. Initial User Flows

### A. Onboarding
1. User selects target language.
2. User selects proficiency source:
   - Import score from external platform (for example, Duolingo score)
   - Take in-app placement test
3. System maps result to CEFR level (A1, A2, B1, B2, C1, C2).
4. User picks a learning mode:
   - Chat with me
   - Correct me
   - Teach me

### B. Practice Session
1. User starts a conversation (text first, voice later).
2. AI responds with language complexity and tone matching CEFR level.
3. Mode behavior:
   - Chat with me: keep flow natural and forgiving.
   - Correct me: provide corrections based on selected correction style.
   - Teach me: introduce vocabulary and grammar in context.
4. User can switch mode mid-conversation.

## 3. Mode Definitions (MVP-level behavior)

### Chat with me
- Objective: confidence and fluency.
- AI behavior:
  - Understand imperfect input.
  - Avoid over-correcting.
  - Prioritize flow and engagement.

### Correct me
- Objective: improve accuracy.
- AI behavior:
  - Reply naturally, then include correction.
  - Support multiple correction styles (planned):
    1. Inline fix
    2. End-of-message corrections
    3. Explain the rule briefly

### Teach me
- Objective: explicit learning through conversation.
- AI behavior:
  - Introduce 1-2 words/phrases per exchange.
  - Add short grammar tips tied to the user's own sentence.
  - Prompt user to reuse new language.

## 4. CEFR Adaptation Strategy
- A1-A2: short sentences, basic vocabulary, high repetition.
- B1-B2: varied sentence patterns, moderate idioms, topic expansion.
- C1-C2: nuanced vocabulary, idiomatic language, complex structures.

Prompt controls to include:
- Target language
- CEFR level
- Mode
- User preference for correction intensity

## 5. Technical Plan

### MVP (current step)
- Frontend-only prototype with:
  - AI source selector:
    - Default Agent (managed, ready-to-go)
    - Bring Your Own Model (provider/model/API key fields)
  - Chat display
  - Text input
  - Submit button
- Simulated bot responses in JavaScript to validate interaction flow.

### Phase 2
- Add backend API for LLM calls.
- Implement provider adapter layer so both managed default agent and user-provided model endpoints use one chat pipeline.
- Add session state and conversation history persistence.
- Add onboarding form (language + CEFR source + mode).

### Phase 3
- Add placement test flow and CEFR mapping logic.
- Add import adapters for external platform scores.
- Add configurable correction styles.

### Phase 4
- Add speech input/output.
- Add pronunciation and speaking feedback.

## 6. Data Model (draft)
- User:
  - id
  - targetLanguage
  - proficiencyLevel (A1-C2)
  - proficiencySource (imported/test/manual)
- Session:
  - id
  - userId
  - mode
  - startedAt
- Message:
  - id
  - sessionId
  - role (user/assistant/system)
  - text
  - createdAt

## 7. Safety and UX Guidelines
- Encourage learning, avoid shaming language.
- Keep corrections concise and actionable.
- Provide clear distinction between "natural reply" and "correction/teaching note".
- Preserve user motivation with positive reinforcement.

## 8. Immediate Next Tasks
1. Build text-only chat UI with submit interaction.
2. Add mode selector UI.
3. Add language selector and mock CEFR selector.
4. Connect frontend to an LLM endpoint.
5. Implement mode-specific prompt templates.
