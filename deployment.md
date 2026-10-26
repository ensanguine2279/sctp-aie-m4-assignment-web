# Deployment Workflow

This GitHub Actions workflow ([CI/CD Pipeline & Semantic Release](https://github.com/ensanguine2279/sctp-aie-m4-assignment-web/actions/workflows/ci.yml)) runs automatically whenever code is pushed to the `main` branch. It executes a sequential 3-job pipeline to validate code, release version tags, and publish a Docker image.

![Running GitHub Actions workflow](images/web-gha-pipeline.jpg)

GitHub Repository: [sctp-aie-m4-assignment-web](https://github.com/ensanguine2279/sctp-aie-m4-assignment-web)

---

### Step 1: Code Verification (`test` Job)

The workflow first ensures the codebase is healthy before allowing any release or deployment steps:

1. **Environment Setup**: Checks out the repository code and initializes Node.js (LTS release) with `npm` dependency caching.

2. **Dependencies**: Runs `npm ci` for a clean install of project dependencies.

3. **Quality Checks**: Safely executes `npm run lint`, `npm test`, and `npm run build` (using `--if-present` so missing scripts won't break the build).

---

### Step 2: Automated Versioning & Release (`release` Job)

Once testing passes, the workflow calculates semantic versioning and creates official GitHub releases:

1. **Full History Fetch**: Checks out the complete Git commit history (`fetch-depth: 0`) required for version evaluation.

2. **Semantic Release Execution**: Runs `cycjimmy/semantic-release-action@v8` using conventional commit messages to automatically determine the next version number, tag the repository, and create release notes on GitHub.

3. **Outputs & Summary**: Captures version metadata (`new_release_published`, `new_release_version`, `new_release_git_tag`, `commit_sha`) and appends a summary table directly to the GitHub step summary.

---

### Step 3: Containerization & Registry Push (`publish` Job)

After versioning completes and if a new version is released, the application is packaged and published to Docker Hub:

1. **Docker Setup**: Configures Docker Buildx and logs in to Docker Hub using stored secrets (`DOCKER_USERNAME` and `DOCKER_TOKEN`).

2. **Dynamic Tagging**: Generates container tags for `${DOCKER_USERNAME}/taskflow-nextjs`:

- Always applies `:latest` and the full commit SHA tag (:${{ github.sha }}).

- Includes exact semantic version tags (e.g., `:1.2.0` and `:v1.2.0`) if a new release was published during Step 2.

3. **Build & Push**: Compiles the Docker image and pushes all tagged variations to Docker Hub in a single operation.

![taskflow-nextjs repository on Docker Hub](images/web-docker-repo.jpg)

---

### Note on Deployment (`deploy` Job)

The final Railway deployment job is currently commented out in the workflow configuration. Docker image building and registry publishing occur on push, while production application hosting/deployment is handled separately (such as on Vercel).

![taskflow-nextjs deployed on Vercel](images/vercel-deployment.jpg)
