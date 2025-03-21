#!/bin/bash

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get the latest commit hash
latest_commit=$(git rev-parse HEAD)

# Check GitHub Actions status
echo "Checking GitHub Actions status..."
gh run list --workflow=test.yml --limit=1 --json status,conclusion,headSha | jq -e '.[0].status == "completed" and .[0].conclusion == "success" and .[0].headSha == "'$latest_commit'"' > /dev/null

if [ $? -ne 0 ]; then
    echo "Error: Latest GitHub Actions workflow has not completed successfully."
    echo "Please ensure all tests pass before publishing."
    exit 1
fi

# Remove old lockfile
echo "Removing old deno.lock..."
rm -f deno.lock

# Regenerate deno.lock
echo "Regenerating deno.lock..."
deno cache --reload mod.ts

# Run checks
echo "Running format check..."
deno fmt --check

echo "Running lint..."
deno lint

echo "Running tests..."
deno test --allow-env

# Commit deno.lock changes
echo "Committing deno.lock changes..."
git add deno.lock
git commit -m "chore: update deno.lock"

# Push changes
echo "Pushing changes..."
git push

echo "Local preparation completed successfully."
echo "Now you can create a new tag to trigger the publish workflow." 