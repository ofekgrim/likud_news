# Testing Rules

## Flutter Tests (apps/mobile/test/):
- Unit tests for BLoCs, use cases, repositories
- Widget tests for pages and complex widgets
- Use `mocktail` for mocking
- Test file naming: `{file_name}_test.dart`
- Run: `cd apps/mobile && flutter test`

## Backend Tests (backend/test/):
- Unit tests for services
- E2E tests for controllers
- Run: `cd backend && npm test`

## Admin Tests (admin/src/__tests__/):
- Component tests with vitest
- Config: `admin/vitest.config.ts`
- Run: `cd admin && npm test`

## Task Completion:
- A task is NOT complete until relevant tests pass
- Do NOT edit tests to make them pass (unless the test itself is wrong)
- Write tests for new functionality
- Run tests before declaring any task done
