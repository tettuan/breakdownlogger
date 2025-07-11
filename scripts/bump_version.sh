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
    echo "Please ensure all tests pass before bumping version."
    exit 1
fi

# Try to get latest version from JSR
echo "Checking latest version from JSR..."
latest_jsr_version=$(curl -s https://jsr.io/@tettuan/breakdownlogger/versions | grep -o '0\.[0-9]\+\.[0-9]\+' | head -n 1)

if [ -z "$latest_jsr_version" ]; then
    echo "Warning: Could not determine latest version from JSR, using local version"
    # Read current version from deno.json
    latest_jsr_version=$(deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); console.log(config.version);")
fi

echo "Latest version: $latest_jsr_version"

# Get all GitHub tags
echo "Checking GitHub tags..."
git fetch --tags
all_tags=$(git tag -l "v*" | sort -V)

# Get all published versions from JSR
echo "Fetching all published versions from JSR..."
jsr_versions=$(curl -s https://jsr.io/@tettuan/breakdownlogger/versions | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | sort -u)

# Remove GitHub tags that are not published on JSR
for tag in $all_tags; do
    tag_version=${tag#v}
    if ! echo "$jsr_versions" | grep -q "^$tag_version$"; then
        echo "Removing tag $tag (version $tag_version not found on JSR)"
        git tag -d "$tag"
        git push origin ":refs/tags/$tag"
    fi
done

# Split version into major.minor.patch
IFS='.' read -r major minor patch <<< "$latest_jsr_version"

# Increment patch version
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

echo "New version: $new_version"

# Update only the version in deno.json
deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$new_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"

# Commit the version change
git add deno.json
git commit -m "chore: bump version to $new_version"

# Create and push tag
git tag "v$new_version"
git push origin "v$new_version"

echo "Version bumped to $new_version and tag v$new_version created" 