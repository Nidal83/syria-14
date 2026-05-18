# i18n + a11y audit — captured 2026-05-18

Scope: public/auth surfaces only.
Off-limits files (recorded but not fixed): `src/pages/office/**`, `src/pages/admin/**`, `src/pages/user/**`, `src/features/**`, `src/providers/**`, `src/routes/**`, `src/integrations/supabase/**`, `supabase/**`

---

## 1. Dictionary parity (AR vs EN)

Both `src/lib/i18n/locales/ar.ts` and `src/lib/i18n/locales/en.ts` share the same top-level keys:
`dir`, `lang`, `common`, `nav`, `auth`, `roles`, `property`, `office`, `admin`, `pages`, `search`, `home`, `errors`, `account`, `notifications`, `validation`

**No top-level drift detected.**

**Missing keys (both dictionaries):**
| Key | Needed by |
|-----|-----------|
| `validation.invalidEmail` | Global Zod error map (Phase B) |
| `validation.atLeastOne` | Global Zod error map (Phase B) |
| `auth.passwordsNotMatch` | `RegisterPage`, `ResetPasswordPage` |
| `register.sectionAccount` | `RegisterPage` line 472 |
| `register.sectionOffice` | `RegisterPage` line 523 |
| `register.sectionDocuments` | `RegisterPage` line 569 |
| `register.documentsHint` | `RegisterPage` line 570 |
| `register.companyDocLabel` | `RegisterPage` line 576 |
| `register.idDocLabel` | `RegisterPage` line 581 |
| `register.submitOffice` | `RegisterPage` line 592 |
| `register.chooseType` | `RegisterPage` line 615 |
| `register.userTitle` | `RegisterPage` line 622 |
| `register.userDescription` | `RegisterPage` line 623 |
| `register.officeTitle` | `RegisterPage` line 628 |
| `register.officeDescription` | `RegisterPage` line 629 |
| `register.userFormTitle` | `RegisterPage` line 647 |
| `register.officeFormTitle` | `RegisterPage` line 647 |
| `register.selectCity` | `RegisterPage` line 547 (placeholder) |
| `register.invalidDocType` | `RegisterPage` line 109 |
| `register.docTooLarge` | `RegisterPage` line 113 |
| `register.docHint` | `RegisterPage` line 165 |
| `register.cityRequired` | `RegisterPage` line 374 |
| `register.companyDocRequired` | `RegisterPage` line 375 |
| `register.idDocRequired` | `RegisterPage` line 376 |
| `register.officeSuccess.title` | `RegisterPage` lines 456–464 |
| `register.officeSuccess.body` | `RegisterPage` lines 456–464 |
| `register.officeSuccess.cta` | `RegisterPage` lines 456–464 |

---

## 2. Hardcoded strings in allowed files

### `src/pages/auth/RegisterPage.tsx`

| Line    | Hardcoded value                                      | Proposed key                                              |
| ------- | ---------------------------------------------------- | --------------------------------------------------------- |
| 57, 70  | `'Passwords do not match'`                           | `t.auth.passwordsNotMatch`                                |
| 109     | `'يرجى رفع صورة أو ملف PDF'`                         | `t.register.invalidDocType`                               |
| 113     | `` `الحجم الأقصى ${MAX_MB}MB` ``                     | `t.register.docTooLarge` (with `{max}` interpolation)     |
| 165     | `'JPG, PNG, PDF — max {MAX_MB}MB'`                   | `t.register.docHint` (with `{max}` interpolation)         |
| 374     | `'يرجى اختيار المدينة'`                              | `t.register.cityRequired`                                 |
| 375     | `'يرجى رفع وثيقة الشركة الرسمية'`                    | `t.register.companyDocRequired`                           |
| 376     | `'يرجى رفع وثيقة الهوية'`                            | `t.register.idDocRequired`                                |
| 456–464 | Success state Arabic block                           | `t.register.officeSuccess.{title,body,cta}`               |
| 472     | `'بيانات الحساب'`                                    | `t.register.sectionAccount`                               |
| 523     | `'بيانات المكتب'`                                    | `t.register.sectionOffice`                                |
| 547     | `placeholder="اختر المدينة"`                         | `t.register.selectCity`                                   |
| 569     | `'الوثائق الرسمية'`                                  | `t.register.sectionDocuments`                             |
| 570     | `'مطلوبة لمراجعة وقبول الطلب'`                       | `t.register.documentsHint`                                |
| 576     | `'السجل التجاري أو وثيقة الشركة الرسمية'`            | `t.register.companyDocLabel`                              |
| 581     | `'وثيقة الهوية الشخصية'`                             | `t.register.idDocLabel`                                   |
| 592     | `'تسجيل وتقديم طلب المكتب'`                          | `t.register.submitOffice`                                 |
| 615     | `'اختر نوع الحساب للمتابعة'`                         | `t.register.chooseType`                                   |
| 622     | `'مستخدم عادي'`                                      | `t.register.userTitle`                                    |
| 623     | `'للأفراد الراغبين في البحث عن عقارات وحفظ المفضلة'` | `t.register.userDescription`                              |
| 628     | `'مكتب عقاري'`                                       | `t.register.officeTitle`                                  |
| 629     | `'للمكاتب الراغبة في نشر عقاراتها وإدارة قوائمها'`   | `t.register.officeDescription`                            |
| 647     | `'إنشاء حساب مستخدم'` / `'تسجيل مكتب عقاري'`         | `t.register.userFormTitle` / `t.register.officeFormTitle` |

### `src/pages/auth/ResetPasswordPage.tsx`

| Line  | Hardcoded value                                    | Proposed key               |
| ----- | -------------------------------------------------- | -------------------------- |
| 20–23 | `message: 'Passwords do not match'` in `.refine()` | `t.auth.passwordsNotMatch` |

### Other allowed files

`src/pages/auth/LoginPage.tsx`, `src/pages/auth/ForgotPasswordPage.tsx`, `src/pages/public/HomePage.tsx` — **No hardcoded user-visible strings found.**

---

## 3. Zod schemas without i18n error map

All schemas in auth pages use raw Zod without a global error map, so built-in messages (e.g. "Invalid email", "Required") surface in English regardless of locale.

| File                     | Schema fields affected                                       |
| ------------------------ | ------------------------------------------------------------ |
| `LoginPage.tsx`          | `email` (`.email()`), `password` (`.min(1)`)                 |
| `RegisterPage.tsx`       | All base and office schema fields; both `.refine()` messages |
| `ForgotPasswordPage.tsx` | `email` (`.email()`)                                         |
| `ResetPasswordPage.tsx`  | `password` (`.min(8)`), `.refine()` message                  |

**Fix:** Install global Zod error map in `I18nProvider` via `z.setErrorMap(...)` — see Phase B.

---

## 4. Accessibility findings

### Critical

| Location                                    | Issue                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/components/layout/PageLayout.tsx`      | No skip-to-content link; `<main>` has no `id="main-content"`                                         |
| `src/components/layout/DashboardLayout.tsx` | No skip-to-content link; `<main>` has no `id` (off-limits for full edits; skip link + landmark only) |

### Serious

| Location                                  | Line(s)                   | Issue                                                              |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| `src/pages/public/PropertyDetailPage.tsx` | 347–354                   | Prev/next gallery buttons have no `aria-label`                     |
| `src/pages/public/PropertyDetailPage.tsx` | 360–368                   | Dot indicator buttons have no `aria-label`                         |
| `src/pages/public/PropertyDetailPage.tsx` | 375–388                   | Thumbnail buttons have no `aria-label`                             |
| `src/pages/auth/RegisterPage.tsx`         | `PasswordField` component | Eye-toggle `<button>` has no `aria-label`                          |
| `src/pages/auth/RegisterPage.tsx`         | ~147–151                  | `DocUploadArea` remove-file `<button>` has no `aria-label`         |
| `src/pages/auth/RegisterPage.tsx`         | 542–545                   | `<Label>` for city `<Select>` has no `htmlFor`; select has no `id` |

### Minor

| Location                               | Line | Issue                                                                             |
| -------------------------------------- | ---- | --------------------------------------------------------------------------------- |
| `src/pages/auth/ResetPasswordPage.tsx` | 61   | `<form>` has no `noValidate`; browser will show native English validation bubbles |

---

## 5. Off-limits issues (recorded, not fixed)

| File                                                       | Issue                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/features/properties/components/EditPhotosSection.tsx` | Remove/set-cover overlay buttons have no `aria-label`             |
| `src/features/properties/components/PhotosSection.tsx`     | Remove/reorder buttons likely have no `aria-label` (same pattern) |

These must be addressed in a dedicated features/office pass, not in this prompt.
