## Publishing

We use [Changesets](https://github.com/changesets/changesets) for version management.

### Workflow

**1. Document changes:**
```bash
pnpm changeset
```
- Select which packages changed
- Choose bump type (patch/minor/major)
- Write a description
- Commit the generated `.changeset/*.md` file

**2. Version packages (when ready to release):**
```bash
pnpm version
git add -A
git commit -m "Version packages"
git push
```

**3. Publish to npm:**
```bash
npm login  # If not already logged in
pnpm release
git push --follow-tags
```

### Quick reference
- `pnpm changeset` - Create a changeset
- `pnpm version` - Bump versions + update CHANGELOGs
- `pnpm release` - Publish to npm
