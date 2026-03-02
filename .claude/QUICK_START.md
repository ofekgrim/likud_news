# 🚀 AI Agents Quick Start

## How to Use Agents

### Method 1: Direct Mention (Coming Soon)
```
@engineering/frontend-developer create a new story viewer widget
```

### Method 2: Task Tool (Current)
Ask Claude: "Using the agent in `.claude/agents/engineering/frontend-developer.md`, create a new story viewer widget"

### Method 3: Context Reference
Copy the agent instructions into your prompt and ask Claude to follow them.

---

## 📋 Quick Reference by Task Type

### 🏗️ **Building Features**

| Task | Agent |Path |
|------|-------|------|
| New Flutter screen | Frontend Developer | `engineering/frontend-developer.md` |
| New API endpoint | Backend Architect | `engineering/backend-architect.md` |
| Full feature (mobile + API) | Mobile App Builder | `engineering/mobile-app-builder.md` |
| Quick prototype/MVP | Rapid Prototyper | `engineering/rapid-prototyper.md` |

### 🐛 **Fixing Issues**

| Task | Agent | Path |
|------|-------|------|
| Backend API bugs | Backend Architect | `engineering/backend-architect.md` |
| Flutter UI bugs | Frontend Developer | `engineering/frontend-developer.md` |
| Performance issues | Performance Benchmarker | `testing/performance-benchmarker.md` |
| Infrastructure issues | Infrastructure Maintainer | `studio-operations/infrastructure-maintainer.md` |

### 🎨 **Design & UX**

| Task | Agent | Path |
|------|-------|------|
| New UI design | UI Designer | `design/ui-designer.md` |
| User research | UX Researcher | `design/ux-researcher.md` |
| Brand consistency | Brand Guardian | `design/brand-guardian.md` |
| Micro-interactions | Whimsy Injector | `design/whimsy-injector.md` |
| Visual content | Visual Storyteller | `design/visual-storyteller.md` |

### 📊 **Product & Planning**

| Task | Agent | Path |
|------|-------|------|
| Feature prioritization | Sprint Prioritizer | `product/sprint-prioritizer.md` |
| User feedback analysis | Feedback Synthesizer | `product/feedback-synthesizer.md` |
| Market research | Trend Researcher | `product/trend-researcher.md` |
| A/B testing | Experiment Tracker | `project-management/experiment-tracker.md` |

### 📱 **Marketing & Growth**

| Task | Agent | Path |
|------|-------|------|
| TikTok content | TikTok Strategist | `marketing/tiktok-strategist.md` |
| Instagram content | Instagram Curator | `marketing/instagram-curator.md` |
| Twitter strategy | Twitter Engager | `marketing/twitter-engager.md` |
| App Store optimization | App Store Optimizer | `marketing/app-store-optimizer.md` |
| Growth strategy | Growth Hacker | `marketing/growth-hacker.md` |
| Content creation | Content Creator | `marketing/content-creator.md` |

### 🧪 **Testing & QA**

| Task | Agent | Path |
|------|-------|------|
| API testing | API Tester | `testing/api-tester.md` |
| Performance testing | Performance Benchmarker | `testing/performance-benchmarker.md` |
| Test coverage analysis | Test Results Analyzer | `testing/test-results-analyzer.md` |
| Tool evaluation | Tool Evaluator | `testing/tool-evaluator.md` |
| Workflow optimization | Workflow Optimizer | `testing/workflow-optimizer.md` |

### 🚀 **Deployment & Ops**

| Task | Agent | Path |
|------|-------|------|
| CI/CD pipelines | DevOps Automator | `engineering/devops-automator.md` |
| Infrastructure setup | Infrastructure Maintainer | `studio-operations/infrastructure-maintainer.md` |
| Release management | Project Shipper | `project-management/project-shipper.md` |
| Support issues | Support Responder | `studio-operations/support-responder.md` |
| Analytics reports | Analytics Reporter | `studio-operations/analytics-reporter.md` |

### 🤖 **AI & Innovation**

| Task | Agent | Path |
|------|-------|------|
| AI features | AI Engineer | `engineering/ai-engineer.md` |
| Content recommendations | AI Engineer | `engineering/ai-engineer.md` |
| Sentiment analysis | AI Engineer | `engineering/ai-engineer.md` |

---

## 💡 Common Use Cases

### 1. **Building a New Feature**
```
Step 1: @product/sprint-prioritizer - Prioritize and scope
Step 2: @design/ui-designer - Design mockups
Step 3: @engineering/mobile-app-builder - Build mobile UI
Step 4: @engineering/backend-architect - Build API
Step 5: @testing/api-tester - Write tests
Step 6: @project-management/project-shipper - Deploy
```

### 2. **Fixing a Critical Bug**
```
Step 1: @studio-operations/support-responder - Triage user reports
Step 2: @engineering/frontend-developer OR @engineering/backend-architect - Fix the bug
Step 3: @testing/test-results-analyzer - Verify fix with tests
Step 4: @project-management/project-shipper - Hotfix deployment
```

### 3. **Planning a Sprint**
```
Step 1: @product/feedback-synthesizer - Analyze user feedback
Step 2: @product/trend-researcher - Research trends
Step 3: @product/sprint-prioritizer - Create sprint plan
Step 4: @project-management/studio-producer - Coordinate team
```

### 4. **Marketing Campaign**
```
Step 1: @marketing/content-creator - Create content calendar
Step 2: @marketing/tiktok-strategist - TikTok strategy
Step 3: @marketing/instagram-curator - Instagram visuals
Step 4: @marketing/growth-hacker - Growth experiments
Step 5: @studio-operations/analytics-reporter - Track metrics
```

---

## 🎯 Pro Tips

1. **Chain agents**: Use multiple agents in sequence for complex tasks
2. **Be specific**: Include project context in your request
3. **Iterate**: Start with one agent, refine, then use another
4. **Read the docs**: Each agent has detailed instructions in their `.md` file

---

## 📚 Full Documentation
See `.claude/AGENTS_GUIDE.md` for comprehensive details on all 34 agents.
