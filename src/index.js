const github = require("@actions/github");
const core = require("@actions/core");

const githubToken = core.getInput("github_token");
const owner =
  core.getInput("owner") || github.context.payload.repository.owner.login;
const repo = core.getInput("repo") || github.context.payload.repository.name;
const checkName = core.getInput("check_name") || github.context.job;

const octokit = github.getOctokit(githubToken);

function getPullNumber() {
  const pullNumber = core.getInput("pull_number");

  if (pullNumber) {
    return pullNumber;
  }

  if (!pullNumber) {
    switch (github.context.eventName) {
      case "issue_comment":
        return github.context.payload.issue.number;
      case "pull_request":
        return github.context.payload.pull_request.number;
    }
  }

  throw new Error(
    `Failed to prase pull request number with event_name: "${github.context.eventName}"`
  );
}

async function getCheckSuiteID() {
  const runID = github.context.runId;

  core.info(`Getting workflow with ID: ${runID}.`);

  const { data: workflowRun } = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: runID,
  });

  return workflowRun.check_suite_id;
}

async function getLastCheckSuiteRunID(checkSuiteID) {
  core.info(
    `Getting check suite runs with ID: ${checkSuiteID} and check_name: "${checkName}".`
  );

  const {
    data: { check_runs: checkRuns },
  } = await octokit.checks.listForSuite({
    owner,
    repo,
    check_suite_id: checkSuiteID,
    check_name: checkName,
  });

  return checkRuns[checkRuns.length - 1].id;
}

async function getPullRequestHeadSha() {
  const pullNumber = getPullNumber();

  core.info(`Getting pull request: #${pullNumber}.`);

  const { data: pullRequest } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return pullRequest.head.sha;
}

async function createCommitStatus(sha, checkRunID) {
  const state = core.getInput("state");

  core.info(`Creating commit status for SHA: "${sha}" with state: "${state}".`);

  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state,
    target_url: `https://github.com/coingate/cicd-test1/runs/${checkRunID}?check_suite_focus=true`,
    context: checkName,
  });
}

async function run() {
  try {
    core.info(`Starting for ${owner}/${repo}...`);

    const checkSuiteID = await getCheckSuiteID();
    const checkSuiteRunID = await getLastCheckSuiteRunID(checkSuiteID);

    const prHeadSha = await getPullRequestHeadSha();
    await createCommitStatus(prHeadSha, checkSuiteRunID);

    core.info("Completed.");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
