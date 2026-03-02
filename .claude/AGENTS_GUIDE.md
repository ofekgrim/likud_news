# 🤖 Metzudat HaLikud AI Agents Guide

Complete guide to using specialized AI agents for the Metzudat HaLikud project.

---

## 📁 Directory Structure

```
.claude/agents/
├── engineering/          # Technical development agents (6)
├── product/             # Product management agents (3)
├── marketing/           # Growth and marketing agents (7)
├── design/              # Design and UX agents (5)
├── project-management/  # PM and coordination agents (3)
├── studio-operations/   # Operations and support agents (5)
└── testing/             # QA and testing agents (5)
```

**Total: 34 specialized agents**

---

## 🚀 How to Use Agents

### Method 1: Direct Mention (Recommended)
```
@engineering/frontend-developer help me add a new Flutter widget for story circles
```

### Method 2: Task Tool
Ask Claude to use the Task tool and specify which agent to use based on the task context.

### Method 3: Agent File Reference
```
Using the agent defined in .claude/agents/engineering/mobile-app-builder.md,
create a new feature for...
```

---

## 🏗️ Engineering Agents (6)

### 1. Frontend Developer
**File:** `.claude/agents/engineering/frontend-developer.md`
**Expertise:** Flutter, Dart, BLoC, Clean Architecture
**Use When:**
- Building new Flutter screens/widgets
- Implementing BLoC state management
- Creating RTL layouts
- Working with go_router navigation

**Example:**
```
@engineering/frontend-developer create a new article bookmark widget
with RTL support and BLoC integration
```

---

### 2. Backend Architect
**File:** `.claude/agents/engineering/backend-architect.md`
**Expertise:** NestJS, TypeScript, TypeORM, PostgreSQL
**Use When:**
- Designing new API endpoints
- Database schema design
- Performance optimization
- Caching strategies (Redis)

**Example:**
```
@engineering/backend-architect design an API endpoint for user
voting on community polls with vote count tracking
```

---

### 3. Mobile App Builder
**File:** `.claude/agents/engineering/mobile-app-builder.md`
**Expertise:** End-to-end Flutter feature implementation
**Use When:**
- Building complete features from scratch
- Integrating multiple layers (data → domain → presentation)
- Setting up dependency injection
- Creating feature-first architecture

**Example:**
```
@engineering/mobile-app-builder implement a complete notification
center feature with push notifications and local storage
```

---

### 4. AI Engineer
**File:** `.claude/agents/engineering/ai-engineer.md`
**Expertise:** ML integration, recommendation systems
**Use When:**
- Adding personalized content recommendations
- Implementing sentiment analysis
- Creating content categorization
- User behavior prediction

**Example:**
```
@engineering/ai-engineer add a personalized news recommendation
engine based on user reading history
```

---

### 5. DevOps Automator
**File:** `.claude/agents/engineering/devops-automator.md`
**Expertise:** GitHub Actions, Docker, deployment
**Use When:**
- Setting up CI/CD pipelines
- Dockerizing services
- Automating deployments
- Infrastructure as code

**Example:**
```
@engineering/devops-automator create a GitHub Actions workflow
for automated Flutter app builds and TestFlight uploads
```

---

### 6. Rapid Prototyper
**File:** `.claude/agents/engineering/rapid-prototyper.md`
**Expertise:** Quick MVP building, proof of concepts
**Use When:**
- Validating feature ideas quickly
- Creating throwaway prototypes
- Testing technical feasibility
- Building demos

**Example:**
```
@engineering/rapid-prototyper build a quick prototype of
live election results with real-time updates
```

---

## 📊 Product Agents (3)

### 7. Trend Researcher
**File:** `.claude/agents/product/trend-researcher.md`
**Expertise:** Israeli news trends, political analysis
**Use When:**
- Researching feature ideas
- Understanding user needs
- Competitive analysis
- Market research

**Example:**
```
@product/trend-researcher analyze what features make Israel Hayom
and Ynet apps successful and suggest improvements for our app
```

---

### 8. Feedback Synthesizer
**File:** `.claude/agents/product/feedback-synthesizer.md`
**Expertise:** User feedback analysis, insight extraction
**Use When:**
- Analyzing app reviews
- Processing user feedback
- Identifying pain points
- Prioritizing improvements

**Example:**
```
@product/feedback-synthesizer analyze the last 100 app reviews
and identify the top 3 user complaints
```

---

### 9. Sprint Prioritizer
**File:** `.claude/agents/product/sprint-prioritizer.md`
**Expertise:** Feature prioritization, roadmapping
**Use When:**
- Planning sprints
- Prioritizing feature requests
- Creating roadmaps
- Estimating effort

**Example:**
```
@product/sprint-prioritizer help me prioritize these 10 feature
requests based on impact vs effort for the next sprint
```

---

## 📱 Marketing Agents (7)

### 10. TikTok Strategist
**File:** `.claude/agents/marketing/tiktok-strategist.md`
**Expertise:** Hebrew political content for TikTok
**Use When:**
- Creating TikTok content strategy
- Video content ideas
- Viral campaign planning

**Example:**
```
@marketing/tiktok-strategist create a 30-day TikTok content
calendar for promoting Metzudat HaLikud app
```

---

### 11. Instagram Curator
**File:** `.claude/agents/marketing/instagram-curator.md`
**Expertise:** Visual content curation
**Use When:**
- Planning Instagram content
- Story templates
- Feed aesthetics

**Example:**
```
@marketing/instagram-curator design an Instagram story template
for sharing breaking news from the app
```

---

### 12. Twitter Engager
**File:** `.claude/agents/marketing/twitter-engager.md`
**Expertise:** Twitter/X engagement and growth
**Use When:**
- Twitter campaign planning
- Engagement strategies
- Viral content ideas

**Example:**
```
@marketing/twitter-engager create a thread template for
sharing daily top stories from Metzudat HaLikud
```

---

### 13. Reddit Community Builder
**File:** `.claude/agents/marketing/reddit-community-builder.md`
**Expertise:** Reddit community management
**Use When:**
- Building subreddit communities
- Reddit marketing strategies
- Community engagement

**Example:**
```
@marketing/reddit-community-builder suggest a strategy for
building a community around Israeli political news on Reddit
```

---

### 14. App Store Optimizer
**File:** `.claude/agents/marketing/app-store-optimizer.md`
**Expertise:** ASO for Hebrew apps
**Use When:**
- Optimizing app store listings
- Writing descriptions (Hebrew/English)
- Keyword research
- Screenshot planning

**Example:**
```
@marketing/app-store-optimizer optimize our App Store listing
with Hebrew keywords for maximum visibility in Israel
```

---

### 15. Content Creator
**File:** `.claude/agents/marketing/content-creator.md`
**Expertise:** News content creation
**Use When:**
- Writing blog posts
- Creating social media content
- Email newsletters
- Push notification copy

**Example:**
```
@marketing/content-creator write 5 engaging push notification
templates for breaking political news
```

---

### 16. Growth Hacker
**File:** `.claude/agents/marketing/growth-hacker.md`
**Expertise:** User acquisition and viral growth
**Use When:**
- Planning growth experiments
- Referral program design
- User acquisition strategies
- Viral loop implementation

**Example:**
```
@marketing/growth-hacker design a referral program where
users get premium features for inviting friends
```

---

## 🎨 Design Agents (5)

### 17. UI Designer
**File:** `.claude/agents/design/ui-designer.md`
**Expertise:** RTL Flutter UI, Material Design
**Use When:**
- Designing new screens
- Creating component libraries
- RTL layout challenges
- Accessibility compliance

**Example:**
```
@design/ui-designer design a visually appealing RTL layout
for the election results page with charts and animations
```

---

### 18. UX Researcher
**File:** `.claude/agents/design/ux-researcher.md`
**Expertise:** Hebrew news app UX patterns
**Use When:**
- User journey mapping
- Usability testing plans
- Information architecture
- User research

**Example:**
```
@design/ux-researcher map out the optimal user journey for
a first-time user discovering our app
```

---

### 19. Brand Guardian
**File:** `.claude/agents/design/brand-guardian.md`
**Expertise:** Likud brand consistency
**Use When:**
- Ensuring brand consistency
- Color palette usage
- Typography checks
- Logo placement

**Example:**
```
@design/brand-guardian review our new onboarding screens
and ensure they follow Likud brand guidelines
```

---

### 20. Visual Storyteller
**File:** `.claude/agents/design/visual-storyteller.md`
**Expertise:** Visual content narratives
**Use When:**
- Creating infographics
- Data visualization
- Story-driven designs
- Emotional design

**Example:**
```
@design/visual-storyteller design an infographic showing
election turnout statistics in an engaging way
```

---

### 21. Whimsy Injector
**File:** `.claude/agents/design/whimsy-injector.md`
**Expertise:** Delightful micro-interactions
**Use When:**
- Adding animations
- Easter eggs
- Delightful UX details
- Empty state designs

**Example:**
```
@design/whimsy-injector add delightful animations when
users bookmark an article or share content
```

---

## 📋 Project Management Agents (3)

### 22. Experiment Tracker
**File:** `.claude/agents/project-management/experiment-tracker.md`
**Expertise:** A/B testing, feature experiments
**Use When:**
- Planning A/B tests
- Tracking experiment results
- Statistical analysis
- Feature flag management

**Example:**
```
@project-management/experiment-tracker design an A/B test
for testing two different home feed algorithms
```

---

### 23. Project Shipper
**File:** `.claude/agents/project-management/project-shipper.md`
**Expertise:** Release management, deployment
**Use When:**
- Planning releases
- Creating release notes
- Deployment checklists
- Go-to-market coordination

**Example:**
```
@project-management/project-shipper create a release plan
and checklist for shipping the primaries voting feature
```

---

### 24. Studio Producer
**File:** `.claude/agents/project-management/studio-producer.md`
**Expertise:** Multi-feature coordination
**Use When:**
- Coordinating multiple teams
- Cross-feature dependencies
- Timeline management
- Resource allocation

**Example:**
```
@project-management/studio-producer coordinate the development
of 3 features that need to launch simultaneously
```

---

## 🛠️ Studio Operations Agents (5)

### 25. Support Responder
**File:** `.claude/agents/studio-operations/support-responder.md`
**Expertise:** User support, issue resolution
**Use When:**
- Handling user complaints
- Creating support documentation
- Troubleshooting guides
- FAQ creation

**Example:**
```
@studio-operations/support-responder create a troubleshooting
guide for users who can't log in or vote in primaries
```

---

### 26. Analytics Reporter
**File:** `.claude/agents/studio-operations/analytics-reporter.md`
**Expertise:** App analytics and metrics
**Use When:**
- Creating dashboards
- Analyzing user behavior
- Generating reports
- KPI tracking

**Example:**
```
@studio-operations/analytics-reporter create a weekly
analytics report template for tracking engagement metrics
```

---

### 27. Infrastructure Maintainer
**File:** `.claude/agents/studio-operations/infrastructure-maintainer.md`
**Expertise:** Infrastructure management
**Use When:**
- Database optimization
- Server maintenance
- Performance monitoring
- Cost optimization

**Example:**
```
@studio-operations/infrastructure-maintainer analyze our
PostgreSQL database performance and suggest optimizations
```

---

### 28. Legal Compliance Checker
**File:** `.claude/agents/studio-operations/legal-compliance-checker.md`
**Expertise:** Israeli legal compliance
**Use When:**
- Privacy policy updates
- GDPR/data protection
- Terms of service
- Content moderation policies

**Example:**
```
@studio-operations/legal-compliance-checker review our
comment moderation policy for legal compliance in Israel
```

---

### 29. Finance Tracker
**File:** `.claude/agents/studio-operations/finance-tracker.md`
**Expertise:** Budget and cost tracking
**Use When:**
- Cost analysis
- Budget planning
- ROI calculations
- Expense tracking

**Example:**
```
@studio-operations/finance-tracker calculate the monthly
infrastructure costs for hosting the app
```

---

## 🧪 Testing Agents (5)

### 30. Tool Evaluator
**File:** `.claude/agents/testing/tool-evaluator.md`
**Expertise:** Third-party tool evaluation
**Use When:**
- Evaluating new tools
- Library comparisons
- Vendor selection
- Technology decisions

**Example:**
```
@testing/tool-evaluator compare 3 push notification services
and recommend the best one for our Hebrew app
```

---

### 31. API Tester
**File:** `.claude/agents/testing/api-tester.md`
**Expertise:** NestJS API testing
**Use When:**
- Writing API tests
- Integration testing
- Load testing
- API documentation

**Example:**
```
@testing/api-tester write comprehensive integration tests
for the feed API endpoint
```

---

### 32. Workflow Optimizer
**File:** `.claude/agents/testing/workflow-optimizer.md`
**Expertise:** Development workflow improvement
**Use When:**
- Optimizing build times
- CI/CD improvements
- Developer experience
- Automation opportunities

**Example:**
```
@testing/workflow-optimizer analyze our current development
workflow and suggest 5 improvements
```

---

### 33. Performance Benchmarker
**File:** `.claude/agents/testing/performance-benchmarker.md`
**Expertise:** App performance testing
**Use When:**
- Performance testing
- Load testing
- Benchmarking
- Optimization recommendations

**Example:**
```
@testing/performance-benchmarker benchmark the feed loading
time and suggest performance optimizations
```

---

### 34. Test Results Analyzer
**File:** `.claude/agents/testing/test-results-analyzer.md`
**Expertise:** Test coverage analysis
**Use When:**
- Analyzing test coverage
- Identifying gaps
- Test quality assessment
- Flaky test detection

**Example:**
```
@testing/test-results-analyzer analyze our current test
suite and identify areas with low coverage
```

---

## 💡 Best Practices

### 1. **Be Specific**
Instead of: "help with backend"
Use: "@engineering/backend-architect design a caching strategy for the feed API"

### 2. **Chain Agents**
Use multiple agents in sequence:
```
1. @product/trend-researcher - Research the feature
2. @design/ux-researcher - Design user flows
3. @engineering/mobile-app-builder - Build the feature
4. @testing/api-tester - Test the implementation
```

### 3. **Context Matters**
Provide relevant context:
```
@engineering/frontend-developer using our existing BLoC pattern
and following the feature-first architecture in apps/mobile/lib/features/,
create a new notifications feature
```

### 4. **Iterate**
Work with agents iteratively:
```
Round 1: @design/ui-designer create initial mockup
Round 2: @design/brand-guardian review for brand consistency
Round 3: @design/ui-designer refine based on feedback
```

---

## 🎯 Common Workflows

### Building a New Feature
1. **Research:** `@product/trend-researcher`
2. **Design:** `@design/ux-researcher` + `@design/ui-designer`
3. **Plan:** `@product/sprint-prioritizer`
4. **Build:** `@engineering/mobile-app-builder` + `@engineering/backend-architect`
5. **Test:** `@testing/api-tester` + `@testing/performance-benchmarker`
6. **Launch:** `@project-management/project-shipper`
7. **Promote:** `@marketing/content-creator` + `@marketing/growth-hacker`

### Fixing a Bug
1. **Reproduce:** `@testing/api-tester`
2. **Fix:** `@engineering/frontend-developer` or `@engineering/backend-architect`
3. **Test:** `@testing/test-results-analyzer`
4. **Deploy:** `@engineering/devops-automator`

### Improving Performance
1. **Benchmark:** `@testing/performance-benchmarker`
2. **Analyze:** `@studio-operations/analytics-reporter`
3. **Optimize:** `@engineering/backend-architect` + `@studio-operations/infrastructure-maintainer`
4. **Verify:** `@testing/performance-benchmarker`

---

## 📚 Additional Resources

- **Project Documentation:** `CLAUDE.md`
- **Memory System:** `.claude/memory/MEMORY.md`
- **Implementation Plans:** `.claude/plans/`
- **Agent Files:** `.claude/agents/`

---

## 🔄 Updating Agents

Agents are markdown files. To customize:

1. Edit the agent file in `.claude/agents/`
2. Update instructions, expertise, or examples
3. Agents will use the updated instructions immediately

**Example customization:**
```bash
# Edit an agent
code .claude/agents/engineering/frontend-developer.md

# Add project-specific context
# Update example tasks
# Refine instructions
```

---

## 🤝 Getting Help

If you need help using agents:
1. Read the agent's markdown file for detailed instructions
2. Ask Claude: "How do I use the [agent name] agent?"
3. See examples in this guide

---

**Happy building! 🚀**
