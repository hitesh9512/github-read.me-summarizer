const { PrismaClient } = require('@prisma/client');
const { generateSummary, chatAboutSummary } = require('../services/groq.service');

const prisma = new PrismaClient();

const parseGitHubUrl = (url) => {
  const cleaned = url.trim().replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
  if (!match) {
    const err = new Error(
      'Invalid GitHub URL. Expected format: https://github.com/owner/repository'
    );
    err.status = 400;
    throw err;
  }
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
};

const createSummary = async (req, res, next) => {
  try {
    const { repoUrl, analysisMode, userPrompt } = req.body;
    if (!repoUrl) {
      const err = new Error('repoUrl is required');
      err.status = 400;
      throw err;
    }
    const normalizedMode = analysisMode === 'codebase' ? 'codebase' : 'general';
    const normalizedPrompt = String(userPrompt || '').trim();
    const hasCustomRequest = normalizedMode !== 'general' || Boolean(normalizedPrompt);

    const { owner, repo } = parseGitHubUrl(repoUrl);
    const normalizedUrl = `https://github.com/${owner}/${repo}`;

    if (!hasCustomRequest) {
      // Check cache per user
      const cached = await prisma.summary.findUnique({
        where: { repoUrl_userId: { repoUrl: normalizedUrl, userId: req.user.userId } },
      });
      if (cached) return res.json({ ...cached, cached: true });

      // Reuse any existing summary for this repo (from any user) to avoid extra AI calls.
      const sharedCached = await prisma.summary.findFirst({
        where: { repoUrl: normalizedUrl },
        orderBy: { createdAt: 'desc' },
      });
      if (sharedCached) {
        const cloned = await prisma.summary.create({
          data: {
            repoUrl: normalizedUrl,
            owner,
            repoName: repo,
            stars: sharedCached.stars,
            forks: sharedCached.forks,
            language: sharedCached.language,
            lastUpdated: sharedCached.lastUpdated,
            content: sharedCached.content,
            userId: req.user.userId,
          },
        });
        return res.json({ ...cloned, cached: true });
      }
    }

    // Generate summary via Groq using only the repository URL
    const content = await generateSummary(normalizedUrl, {
      analysisMode: normalizedMode,
      userPrompt: normalizedPrompt,
    });

    // Persist to DB
    const summary = await prisma.summary.upsert({
      where: { repoUrl_userId: { repoUrl: normalizedUrl, userId: req.user.userId } },
      create: {
        repoUrl: normalizedUrl,
        owner,
        repoName: repo,
        stars: null,
        forks: null,
        language: null,
        lastUpdated: null,
        content,
        userId: req.user.userId,
      },
      update: {
        owner,
        repoName: repo,
        stars: null,
        forks: null,
        language: null,
        lastUpdated: null,
        content,
      },
    });

    res.status(201).json({ ...summary, cached: false });
  } catch (err) {
    next(err);
  }
};

const chatOnSummary = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !String(prompt).trim()) {
      const err = new Error('prompt is required');
      err.status = 400;
      throw err;
    }

    const summary = await prisma.summary.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!summary) {
      const err = new Error('Summary not found');
      err.status = 404;
      throw err;
    }

    const answer = await chatAboutSummary({
      repoUrl: summary.repoUrl,
      summaryContent: summary.content,
      userPrompt: prompt,
    });

    res.json({ answer });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const summaries = await prisma.summary.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ summaries });
  } catch (err) {
    next(err);
  }
};

const getSummaryById = async (req, res, next) => {
  try {
    const summary = await prisma.summary.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!summary) {
      const err = new Error('Summary not found');
      err.status = 404;
      throw err;
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

const deleteSummary = async (req, res, next) => {
  try {
    const existing = await prisma.summary.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!existing) {
      const err = new Error('Summary not found');
      err.status = 404;
      throw err;
    }
    await prisma.summary.delete({ where: { id: req.params.id } });
    res.json({ message: 'Summary deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSummary, getHistory, getSummaryById, deleteSummary, chatOnSummary };
