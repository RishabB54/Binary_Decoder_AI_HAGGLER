# 🔒 SECURITY SETUP - API Keys

## ⚠️ IMPORTANT: Never Commit API Keys!

Your API keys are **sensitive credentials** and should **NEVER** be pushed to GitHub or any public repository.

---

## ✅ Secure Setup (Required)

### Step 1: Create .env File

In the `backend` folder, create a file named `.env`:

```bash
cd backend
touch .env
```

### Step 2: Add Your API Keys

Open `.env` and add your keys:

```env
# Gemini 2.5 Flash API Keys - Team: binarydecoders
# Valid: 22-23 Jan 2026 (10am to 11:59pm)

# Text Model
GEMINI_TEXT_API_KEY=3057dfce551f4941ae42ecb8b72f5f93

# Image Model (optional)
GEMINI_IMAGE_API_KEY=bbef49c51dad4a7e8f8b5420c30e4f6c

# Server Config
PORT=8080
NODE_ENV=development
```

### Step 3: Verify .gitignore

The `.env` file is already ignored by git (see `backend/.gitignore`):

```
# Environment variables - NEVER COMMIT THIS!
.env
.env.local
.env.*.local
```

---

## 🎯 For Team Members

If someone else needs to run the project:

1. **Don't share the `.env` file** directly
2. Share the `env.example` file as a template
3. They create their own `.env` with their keys
4. Keys stay local, never in git

---

## ✅ Verification

After creating `.env`, restart the backend:

```bash
npm run dev
```

You should see:
```
🔧 [Gemini] Text API Key: ✅ Configured
🔧 [Gemini] Image API Key: ✅ Configured
```

**Not:**
```
⚠️  WARNING: GEMINI_TEXT_API_KEY not set in environment!
```

---

## 🚨 What NOT to Do

❌ **Don't commit:**
- `.env` file
- Any file with actual API keys
- `API_KEYS.txt` (deleted for security)

❌ **Don't hardcode keys in:**
- `.js` files
- `.json` files
- `.md` documentation
- Comments in code

✅ **Do commit:**
- `env.example` (template without real keys)
- `.gitignore` (to protect .env)
- This documentation

---

## 🔍 Check Before Pushing

Before `git push`, verify:

```bash
# Check what you're about to commit
git status

# Make sure .env is NOT listed
# If it is, it means .gitignore isn't working!

# Check .gitignore exists
cat backend/.gitignore | grep .env
```

Should show:
```
.env
.env.local
.env.*.local
```

---

## 🎓 Why This Matters

**Public Keys =** 
- ❌ Anyone can use your API quota
- ❌ Keys can be revoked
- ❌ Security vulnerability
- ❌ Bad practice

**Environment Variables =**
- ✅ Keys stay local
- ✅ Each developer has their own
- ✅ Can be different per environment
- ✅ Industry best practice

---

## 📋 Quick Reference

| File | Contains | Git Status |
|------|----------|------------|
| `.env` | Real keys | **IGNORED** ✅ |
| `env.example` | Template | **COMMITTED** ✅ |
| `.gitignore` | Protection rules | **COMMITTED** ✅ |
| `geminiService.js` | Loads from env | **COMMITTED** ✅ |

---

## 🆘 Troubleshooting

### Bot shows "(no reply)" or fallback responses

**Cause:** API keys not loaded

**Fix:**
1. Check `.env` file exists in `backend/` folder
2. Check keys are correct (no extra spaces)
3. Restart backend: `Ctrl+C` then `npm run dev`

### Error: "GEMINI_TEXT_API_KEY not set"

**Cause:** `.env` file missing or not loaded

**Fix:**
1. Create `backend/.env` file
2. Copy keys from secure source
3. Restart backend

---

**Your keys are now secure!** 🔒

Only people with access to your local `.env` file can use them.
