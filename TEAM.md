# Caffeine
## team members and GitHub usernames
- Andrus Rähni - https://github.com/mugulane
- Ilja Sokolov - https://github.com/ohotnik523
- Martti Remmelgas - https://github.com/dotmartti
- Mathias Ranna - https://github.com/mathiasranna
- Ranno Männikust - https://github.com/s1blik

## Team Workflow
Our team uses a GitHub-based workflow where all changes are developed on topic branches, reviewed via pull requests, and merged into the main branch only after approval:
- Work starts from a clearly defined task or issue.
- A developer creates a properly named branch from `main` following the naming rules below.
- Changes are committed in small, coherent steps and pushed regularly to the remote repository.
- A pull request is opened, reviewed by at least one team member, and updated until all comments are resolved.
- Once requirements are met and reviews are approved, the pull request is merged into `main` by its creator.

## Branches
- Branch naming format: `<prefix>/<ticket id>-<name of developer>-<brief explanation of what we do in branch>`.
- There are two categories of branches: the protected long-lived `main` branch and short-lived development
  branches (for example `feature/*`, `bugfix/*`, etc.). Pushing directly to `main` is prohibited; instead,
  all work shall be done in these prefixed development branches, reviewed, and merged into `main` with a
  Pull Request.
- Prefixes used in project and their explanation:
  | Branch pattern | Description                                        |
  | `main`         | Default long-lived branch; all reviewed work is merged here |
  | `feature/*`    | New Feature                                        |
  | `bugfix/*`     | Bug Fix                                            |
  | `hotfix/*`     | Hotfix / Critical Fix                              |
  | `chore/*`      | Technical Maintenance (Refactor / Config / Cleanup)|
  | `refactor/*`   | Code Refactoring (No Functional Changes)           |
  | `docs/*`       | Documentation                                      |
  | `test/*`       | Tests (Additions / Improvements)                   |
  | `ci/*`         | CI/CD, GitHub Actions, pipeline                    |
  | `build/*`      | Build-system, dependencies                         |
  Where "*" is the remaining branch name.
- Branch names should clearly describe the job that is being done in that branch.

## Commits
- Commit messages must clearly describe what was changed in that commit
- There shouldn't be too many changes in one commit, for more transparent development. 
  (More often commits but smaller is better, than rarer ones and bigger)
- Commits shall be regularly pushed to GitHub, making the developing more transparent.

## Pull Request
- Are reviewed at least by one person
- Review comments shall be clear and fully describing the point of reviewer. 
  There shall not be unclear comments, they should be technically full and respectful.
- Are merged once all review comments are resolved, and all requirements are satisfied.
- Pull Request is merged only by it's creator.


