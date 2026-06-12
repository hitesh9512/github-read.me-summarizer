const axios = require('axios');

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
  timeout: 10000,
});

const getRepoMetadata = async (owner, repo) => {
  try {
    const { data } = await githubApi.get(`/repos/${owner}/${repo}`);
    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      lastUpdated: data.updated_at,
      description: data.description,
      topics: data.topics || [],
      defaultBranch: data.default_branch,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      const e = new Error(`Repository "${owner}/${repo}" not found on GitHub`);
      e.status = 404;
      throw e;
    }
    if (err.response?.status === 403) {
      const e = new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env');
      e.status = 429;
      throw e;
    }
    throw err;
  }
};

const getReadme = async (owner, repo) => {
  try {
    const { data } = await githubApi.get(`/repos/${owner}/${repo}/readme`);
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (err) {
    if (err.response?.status === 404) return 'No README available.';
    throw err;
  }
};

const getFileTree = async (owner, repo) => {
  try {
    const { data } = await githubApi.get(
      `/repos/${owner}/${repo}/git/trees/HEAD?recursive=0`
    );
    return data.tree
      .filter((f) => f.type === 'blob' || f.type === 'tree')
      .map((f) => f.path)
      .slice(0, 80)
      .join('\n');
  } catch {
    return '';
  }
};

module.exports = { getRepoMetadata, getReadme, getFileTree };
