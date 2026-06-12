const axios = require('axios');

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not configured in backend environment variables.');
}

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_QUOTA_COOLDOWN_MS = Number(process.env.GROQ_QUOTA_COOLDOWN_MS || 10 * 60 * 1000);
let groqPauseUntilMs = 0;

const toUserFacingGroqError = (error) => {
  const rawMessage = String(error?.response?.data?.error?.message || error?.message || '');
  const statusCode = error?.response?.status || error?.status || error?.statusCode;

  if (statusCode === 429 || /quota|rate limit|too many requests/i.test(rawMessage)) {
    const err = new Error(
      'Groq API quota or rate limit reached. Please wait and try again, or switch to another free model.'
    );
    err.status = 429;
    return err;
  }

  if (statusCode === 401 || /api key|unauthorized|forbidden|permission/i.test(rawMessage)) {
    const err = new Error('Groq API key is invalid or missing required permissions.');
    err.status = 401;
    return err;
  }

  if (statusCode === 404 || /model|not found|unsupported/i.test(rawMessage)) {
    const err = new Error(
      `Configured Groq model "${GROQ_MODEL}" is unavailable. Update GROQ_MODEL to a supported model and retry.`
    );
    err.status = 502;
    return err;
  }

  const err = new Error('Failed to generate summary with Groq. Please try again.');
  err.status = 502;
  return err;
};

const callGroq = async (messages, temperature = 0.2) => {
  if (Date.now() < groqPauseUntilMs) {
    const waitSeconds = Math.ceil((groqPauseUntilMs - Date.now()) / 1000);
    const err = new Error(
      `Groq is temporarily paused after quota/rate-limit errors. Please retry in about ${waitSeconds} seconds.`
    );
    err.status = 429;
    throw err;
  }

  try {
    const { data } = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: GROQ_MODEL,
        temperature,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );
    return String(data?.choices?.[0]?.message?.content || '').trim();
  } catch (error) {
    const statusCode = error?.response?.status || error?.status || error?.statusCode;
    const rawMessage = String(error?.response?.data?.error?.message || error?.message || '');
    if (statusCode === 429 || /quota|rate limit|too many requests/i.test(rawMessage)) {
      groqPauseUntilMs = Date.now() + GROQ_QUOTA_COOLDOWN_MS;
    }
    throw toUserFacingGroqError(error);
  }
};

const generateSummary = async (repoUrl, options = {}) => {
  const analysisMode = options.analysisMode === 'codebase' ? 'codebase' : 'general';
  const userPrompt = String(options.userPrompt || '').trim();

  const prompt = `You are an expert software engineer and technical writer.

Summarize the GitHub repository from this URL:
${repoUrl}

Requested analysis mode: ${analysisMode === 'codebase' ? 'Codebase Structure Deep-Dive' : 'General Project Summary'}

Use your knowledge and any public information you can infer from the repository URL context.
If specific details are unknown, state reasonable assumptions clearly instead of inventing facts.
Prioritize depth and clarity over brevity.
${userPrompt ? `Additional user request to satisfy:\n${userPrompt}\n` : ''}

Return ONLY a valid JSON object (no markdown, no code fences, no extra text) with exactly these 6 fields:
{
  "overview": "Write 6-8 detailed sentences covering project purpose, target users, likely architecture, and strengths/tradeoffs.",
  "keyFeatures": ["At least 5 specific features with brief practical detail each"],
  "techStack": ["At least 5 concrete technologies/tools/libraries with role where possible"],
  "useCases": ["At least 4 realistic use cases and who benefits"],
  "beginnerExplanation": "Write 6-8 beginner-friendly sentences using analogies and plain language.",
  "technicalExplanation": "Write 6-8 technical sentences with implementation-level insight and constraints."
}`;

  const text = await callGroq([
    {
      role: 'system',
      content:
        'You produce structured and factual engineering summaries. Return strictly valid JSON only with the requested fields.',
    },
    { role: 'user', content: prompt },
  ]);

  // Strip markdown fences if present
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(stripped);
  } catch (_) {
    // Fallback: extract first {...} JSON block from the response
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {}
    }
    const err = new Error('Groq returned an unparseable response. Please try again.');
    err.status = 502;
    throw err;
  }
};

const chatAboutSummary = async ({ repoUrl, summaryContent, userPrompt }) => {
  const prompt = String(userPrompt || '').trim();
  if (!prompt) {
    const err = new Error('prompt is required');
    err.status = 400;
    throw err;
  }

  const answer = await callGroq(
    [
      {
        role: 'system',
        content:
          'You are a helpful senior software engineer. Answer questions about the repository using the provided summary context. Be clear, actionable, and concise.',
      },
      {
        role: 'user',
        content: `Repository URL: ${repoUrl}\nSummary JSON context:\n${JSON.stringify(summaryContent, null, 2)}\n\nUser question:\n${prompt}`,
      },
    ],
    0.3
  );

  return answer;
};

module.exports = { generateSummary, chatAboutSummary };
