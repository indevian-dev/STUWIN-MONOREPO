# Fix: API Response Envelope Double-Unwrapping

## Problem

Two API client functions exist in `SpaApiClient.ts`:

| Function | Returns | Use Case |
|---|---|---|
| `apiCallForSpaHelper()` | Raw `AxiosResponse` — `response.data` = `{ success, data: {...} }` | Low-level, full control |
| `apiCall<T>()` | Unwrapped `T` — already extracts `body.data` from the envelope | Typed, convenient |

**The bug:** Many components use `apiCall<any>()` but then access `.data` on the result, effectively double-unwrapping and getting `undefined`.

```typescript
// ❌ WRONG — double unwrap
const response = await apiCall<any>({ url: '...', method: 'GET' });
setSomething(response.data); // undefined!

// ✅ CORRECT
const data = await apiCall<MyType[]>({ url: '...', method: 'GET' });
setSomething(data);
```

Similarly, `apiCallForSpaHelper` callers must unwrap manually:
```typescript
// ✅ CORRECT for apiCallForSpaHelper
const response = await apiCallForSpaHelper({ ... });
const innerData = response.data.data; // Axios envelope → API envelope → actual data
```

## Scope

Search pattern: `apiCall<any>` across all widget/page files, then check if `.data` is accessed on the result.

```bash
grep -rn "apiCall<any>" next/app/
grep -rn "response\.data" next/app/ --include="*.tsx"
```

## Files Already Fixed
- [x] `GlobalAuthProfileContext.tsx` — `apiCallForSpaHelper` envelope unwrap
- [x] `ProviderSubjectMediaLibrarySection.tsx` — 5 occurrences of `apiCall<any>` + `.data`

## Checklist
- [ ] Audit all `apiCall<any>` usages across `next/app/`
- [ ] Replace `<any>` with proper types
- [ ] Remove `.data` access on `apiCall` results
- [ ] Verify no runtime errors remain
