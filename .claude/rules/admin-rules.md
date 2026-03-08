# Admin Panel Rules (admin)

## Stack:
- Next.js 15 with App Router
- shadcn/ui for components (in `components/ui/`)
- TipTap rich text editor for article content (Hebrew RTL)
- TanStack Query for data fetching
- React Hook Form + Zod for form validation

## Structure:
- `(authenticated)/` route group with JWT auth guard
- Pages in `app/(authenticated)/{feature}/page.tsx`
- Shared components in `components/`
- API client in `lib/api.ts`
- Types in `lib/types.ts`

## Conventions:
- RTL support for Hebrew content editing
- Use shadcn/ui components wherever possible
- Follow existing patterns in the codebase for consistency
