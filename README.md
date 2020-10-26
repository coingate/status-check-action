# Status Check javascript action

This action creates commit status check for given pull request.

## Inputs

### `github_token`

**Required** GitHub token. (e.g. `secrets.GITHUB_TOKEN`).

### `state`

**Required** State of status check. (e.g. error, failure, pending, or success - [Read more](https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#create-a-commit-status--parameters)).

### `owner`

Repository owner. Default: current owner.

### `repo`

Repository name. Default: current repo.

### `pull_number`

Pull number to create status checks for. Default: current pull number.

### `check_name`

Name of the check. Default: current job.

### `commit_context`

Context to use for setting commit status for. Default: current job.

## Example usage

```
uses: coingate/status-check-action@master
with:
  github_token: '${{ secrets.GITHUB_TOKEN }}'
  state: failure
```