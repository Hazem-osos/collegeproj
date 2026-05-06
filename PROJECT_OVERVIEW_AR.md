# نظرة عامة على مشروع Course Management (شرح بالعربية)

هذا الملف يشرح **كيف يعمل التطبيق**، **تنظيم المجلدات**، و**قاعدة البيانات**، وبنية **المصادقة والأدوار**، مع إرشادات أولية **لإضافة دور الدكتور/المُدرّس مع تسجيل دخول** لاحقًا.

---

## 1. ماذا يوجد في هذا المستودع؟

- **التطبيق الفعلي (اللي تطوّره وتشغّله عادةً):** مجلد **`web/`**.
  - **Next.js 15** مع **React 19** و**App Router**.
  - **واجهة المستخدم + واجهات برمجية REST** تحت **`/api/*`** في نفس المشروع (full-stack)، وليس شرطًا استدعاء API خارجي منفصل.

- **خادم REST إضافي في الجذر:** **`CourseManagementAPI` (ASP.NET Core + EF Core + Pomelo MySQL)**.
  - يستخدم **نفس قاعدة MySQL وجداول Prisma** (بما في ذلك **`Users`** ومزامنة علاقة الطالب بحسابه).
  - مسارات **`/api/...`** مُطبَّعة لتقريبًا **نفس منطق وحماية Next** على الموارد الأساسية (أدمن فقط، PATCH، **`/api/enrollments`**، **`/api/instructor-profiles`**).
  - **التوجيه من الواجهة ليس تلقائيًا:** الواجهة تتصل بـ dotnet فقط بعد ضبط **`NEXT_PUBLIC_DOTNET_API_URL`** في **`web/.env`** (انظر **[§10](#10-ربط-الواجهة-web-بـ-aspnet-آلية-العمل-وماذا-يُنجلب-ومِن-أين)**). بدون هذا المتغير، كل استدعاءات **`/api/*`** تبقى على خادم Next.

---

## 2. كيف «يمشي» الطلب من المتصفّح إلى البيانات؟

1. المستخدم يفتح صفحة في **`web`** (مثلاً `/login` أو `/courses`).
2. لمعظم الصفحات المحمية، **`middleware`** يقرأ الكوكي **`cm_session`** ويحقق توقيع الـ JWT. إذا مفيش توكن سليم يتم التوجيه إلى **`/login`** مع معامل **`next`** للرجوع بعد الدخول.
3. الواجهة تستدعي **`fetch`** أو **Axios** (مع **`withCredentials`** عند اللزوم) لمسارات **`/api/...`**.
4. **Route handlers** تحت **`web/src/app/api/`** تنفّذ المنطق:
   - **`requireAuth`:** يتحقق من وجود Bearer أو كوكي الجلسة ويصفِّي الـ JWT.
   - **`requireAdminDb`:** يتأكد أن المستخدم إداري (من جدول **`Users`** أولًا؛ مع استثناء أدمن تجريبي في كود الدخول).
   - **`requireStudentScoped`:** للطالب المربوط بسجل **`Students`** عبر **`Users.studentId`**.
5. التعامل مع MySQL يتم عبر **Prisma Client** (`web/src/lib/prisma.ts`) حسب **`schema.prisma`**.

**ملاحظة:** ملف **`web/src/middleware.ts`** لا يحمي مسارات **`/api`**؛ الحماية هناك داخل كل route أو عبر دوال **`require*`** المذكورة.

---

## 3. المصادقة (Auth) بالتفصيل

### 3.1 الجلسة والكوكي

- اسم الكوكي: **`cm_session`** (تاريخ انتهاء ساعة تقريبًا، انظر `session-cookie.ts`).
- المحتوى: **JWT** موقَّع بخوارزمية **HS256** عبر مكتبة **`jose`**.
- المتغيرات البيئة المهمّة: **`JWT_KEY`** (إلزامي)، واختياريًا **`JWT_ISSUER`** و **`JWT_AUDIENCE`** لتطابق **`auth-jwt.ts`**.

### 3.2 ماذا يُكتب داخل الـ JWT؟

من النوع **`AuthPayload`** (ملخص):

- **`email`** (مُطبَّعة lowercase في التخزين/التحقق عادةً).
- **`role`:** نص (القيم المستخدمة فعليًا حاليًا **`Admin`** و **`Student`**).
- **`studentId`** (اختياري): للطالب عندما يكون **`Users.studentId`** مربوطًا بجدول **`Students`**.

المُدرّسون **`Instructors`** في قاعدة البيانات **ليسوا** جزءًا من نوع **`AuthPayload`** حاليًا (لا **`instructorId`** في التوكن).

### 3.3 تسجيل الدخول

- ملف **`web/src/app/api/auth/login/route.ts`**:
  - يبحث عن **`User`** بالإيميل، يتحقق من كلمة المرور عبر **`bcryptjs`**.
  - لو المستخدم غير موجود: يوجد مسار تجريبي لأدمن ثابت (`admin@uni.com` / `password123`) يُنشئ JWT بدور **`Admin`** بدون صف في **`Users`** (مفيد للتجربة قبل الـ seed).
  - لو الدور **`Student`** و`**studentId`** موجود: يُضاف **`studentId`** للتوكن ويُرجَع الاسم المعروض من **`Students`** في الاستجابة JSON.

استخراج التوكن في الـ API: **`extractAuthToken`** يفضّل **Bearer** ثم يفكّ الكوكي من رأس **`Cookie`**.

---

## 4. الأدوار (Roles) وحماية الصفحات

### 4.1 من يستطيع الوصول لماذا؟

| الدور الحالي في `Users.role` / JWT | صفحات الواجهة (توجيه Middleware) | واجهات الإدارة تحت `/api/*` التحتاج `requireAdminDb` |
|--------------------------------------|-----------------------------------|------------------------------------------------------|
| **Admin**                             | الوصول لـ **`/`** ومسارات CRUD تحت الأمثلة: **`/courses`**, **`/instructors`**, إلخ. إذا دخل **`/my-courses`** يُحوَّل إلى **`/`**. | مسموح (مع تحقّق دور من قاعدة البيانات عند وجود مستخدم). |
| **Student**                           | **`/my-courses`**, **`/settings`**. المحاولة لدخول مسارات «إدارية للصفحة» → إعادة توجيه لـ **`/my-courses`**. قائمة البادئات المحظورة معرّفة في **`auth-redirects.ts`** (`STUDENT_BLOCKED_PREFIXES` وأيضًا **`/`** يعتبر لوحة تحكم إدارية للطالب). | غالبًا **403** على مسارات الإدارة. مسارات **`/api/me/*`** مخصّصة للطالب مع **`requireStudentScoped`**. |

بعد **`/login`**، **`postLoginRedirectPath`** تحدّد وجهة الأدمن (أو **`next`** الآمن)، والطالب إلى **`/my-courses`** أو **`next`** لو كان مسموحًا (`/settings` أو تحت **`/my-courses`**).

### 4.2 الفرق بين «Instructor» ككيان وبين «المستخدم الذي يسجل دخول»

- **`Instructor` + `InstructorProfile`:** جداول لبيانات أعضاء هيئة التدريس ومقرّهم المكتبي والسيرة، وربطهم بـ **`Course`**.
- **`User`:** حساب الدخول (إيميل + هاش كلمة مرور + **`role`** + اختياري **`studentId`**).
- **لا يوجد** حاليًا حقل **`instructorId`** على **`User`** ولا دور JWT منفصل «Instructor». إنشاء حساب وتعديل المواد للهيئة الإدارية فقط من واجهة الإدارة.

هذا يعني: **إضافة «الدكتور» كمستخدم يدخل النظام** تحتاج توسعة متعمّدة (سكيمة + توكن + مسارات + حماية).

---

## 5. قاعدة البيانات

### 5.1 التقنية

- **MySQL 8**.
- **ORM:** **Prisma 5** (ملف السكيمة: **`web/prisma/schema.prisma`**).
- سلسلة الاتصال: متغير **`DATABASE_URL`** داخل **`web/.env`** (انظر **`web/.env.example`**).

### 5.2 تشغيل MySQL محليًا بسرعة

من **جذر المستودع**:

```bash
docker compose up -d
```

- الحاوية ترفع قاعدة **`coursemanagement`** وتعرّض المنفذ **3306** (انظر **`docker-compose.yml`**).

من **`web/`** بعد **`npm install`**:

- **`npm run setup:dev`** (توليد Prisma، دفع السكيمة، seed)، أو وفق **`README.md`** للـ migrate/deploy.

### 5.3 الجداول والعلاقات (ملخص)

| الموديل Prisma       | اسم الجدول الفعلي   | علاقات مختصرة |
|----------------------|---------------------|----------------|
| `User`               | `Users`             | اختياري 1–1 مع `Student` عبر **`studentId`**. |
| `Student`            | `Students`          | تسجيلات `Enrollment`; اختياري `user`. |
| `Instructor`         | `Instructors`       | `courses`; `profile` واحد أو لا شيء. |
| `InstructorProfile`  | `InstructorProfiles`| يساوي واحد‑لواحد مع `Instructor`. |
| `Course`             | `Courses`           | FK إلى `Instructor`; `enrollments`. |
| `Enrollment`         | `Enrollments`       | FK إلى `Student` و `Course`؛ تاريخ التسجيل ودرجة اختيارية. |

حقول مهمة على **`Users`:**

- **`Role`**: نص (**`Admin`** / **`Student`** افتراضيًا للتسجيل).
- **`StudentId`**: فريد عند وجود قيمة (يسمح بتعدّد صفوف بـ `NULL` في MySQL لغير الطلّاب)، يربط الطالب بحسابه.

---

## 6. هيكل مجلدات **`web/`** (أهم المواضع)

| المسار | الغرض |
|--------|--------|
| `src/app/(main)/` | صفحات الإدارة (كورسات، مدرّسون، طلاب، enrollments، إلخ) |
| `src/app/(student)/` | تجربة الطالب (**`my-courses`**) |
| `src/app/login/` , `register/` | صفحات الدخول والتسجيل |
| `src/app/api/` | كل REST handlers |
| `src/middleware.ts` | حماية المسارات الأمامية (ليس `/api`) |
| `src/lib/prisma.ts` | عميل قاعدة البيانات |
| `src/lib/auth-jwt.ts` | توقيع/تحقّق JWT وحقل **`AuthPayload`** |
| `src/lib/api-helpers.ts` | `requireAuth`, `requireAdminDb`, `requireStudentScoped` |
| `src/lib/auth-redirects.ts` | من يُسمح له بأي مسار بعد الدخول |
| `src/lib/session-cookie.ts` | اسم الكوكي وخياراتها |
| `prisma/schema.prisma` | تعريف الجداول |
| `package.json` | سكربتات **`dev`**, **`setup:dev`**, **`db:*`**, إلخ |

---

## 7. أوامر مفيدة من **`README`**

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تشغيل وضع التطوير (Turbopack) |
| `npm run setup:dev` | `generate` + `db push` + seed سريع |
| `npm run db:deploy` ثم `db:seed` | مناسب لفرق أو CI بعد migrations |

---

## 8. إضافة دور «الدكتور / المُدرّس مع Login» لاحقًا (خطة تنفيذ مقترحة)

هذه نقاط تنفيذ عالية المستوى؛ التفاصيل البرمجية تُكمَّل عند قبول المتطلبات (هل الدكتور يرى طلاب كورساته فقط؟ هل يعدّل درجات؟).

1. **السكيمة (Prisma):**
   - إضافة حقل **`instructorId`** اختياري وفريد على **`User`** (مشابه **`studentId`**)، FK إلى **`Instructors`**.
   - أو إنشاء جدول ربط إن كان لمُدرّس واحد أكثر من حالة خاصّة تتطلّب ذلك.
   - قيمة **`Role`** جديدة مثل **`Instructor`** (أو **`Doctor`** إن كان الاسم المتفق عليه؛ المهم أن يكون **متسقًا** بين DB و JWT والواجهة).

2. **JWT (`auth-jwt.ts`):**
   - توسعة **`AuthPayload`** و **`signToken`** / **`verifyToken`** لتضمين **`instructorId`** عندما يكون الدور مُدرّسًا ومربوطًا بسجل.

3. **تسجيل الدخول وتسجيل المستخدم:**
   - عند **`login`/`register`**، لا تُنشأ صف **`Instructor`** تلقائيًا بالضرورة؛ غالبًا الأدمن ينشئ **`Instructor`** ثم يُربط بحساب **`User`** (أو تدفق تسجيل مقيّد بموافقة).

4. **حماية API:**
   - دالة مساعدة مثل **`requireInstructorScoped`** تشبه **`requireStudentScoped`**: تقرأ من DB أن **`role === "Instructor"`** و`**instructorId`** غير فارغ وتطابق المنطقة المطلوبة (مثل تعديل كورس حيث **`course.instructorId === auth.instructorId`**).

5. **Middleware و `auth-redirects.ts`:**
   - تحديد أي مسارات **محظورة/مسموحة** للمُدرّس (ليست كل إدارة الأدمن ولا تجربة الطالب فقط).
   - تحديث **`postLoginRedirectPath`** لمسار افتراضي للمُدرّس بعد الدخول (مثلاً **`/teacher`** أو **`/my-teaching`** — حسب ما تُضيفه في **`app`**).

6. **واجهة المستخدم:**
   - تخطيط (`layout`) قائمة تنقّل وصفحات CRUD ضيقة حسب ما يصرّح له الدور الجديد (`AuthedLayout` و أي شروط على **`role`**).

بهذا تصبح الخطوة التالية لتطويع «الدكتور» واضحة: **ربط حساب بتسجيل دخول بكيان Instructor في الجداول + توحيد الاسم بين Role في DB وJWT + قيود Middleware و API.**

---

## 9. واجهة ASP.NET Core: ما المربوط بإيه؟

| المكوّن | الربط |
|--------|--------|
| **قاعدة البيانات** | نفس MySQL (`DefaultConnection` في **`appsettings.json`** ≈ `DATABASE_URL` في **`web/.env`**). جداول **`Users`**, **`Students`**, **`Courses`**, إلخ، مطابقة لسكيمة Prisma. |
| **JWT** | نفس المفتاح والمصدّر والجمهور حسب الإعدادات: **`Jwt:Key`** يجب أن يطابق **`JWT_KEY`** في **`web/.env`** حتى يقبل كل من Next وسلسلة **Bearer** على الـ C# نفس التوكن. المطالبات في التوكن: **`email`**, **`role`**, واختياري **`studentId`** (رقم)، مع **`MapInboundClaims = false`** و **`RoleClaimType = "role"`** لتطابق **`jose`**. |
| **تسجيل الدخول** | **`POST /api/auth/login`**: التحقق من **`Users`** بـ **BCrypt** (متوافق مع **`bcryptjs`** في الـ seed)، مع نفس fallback التجربة **`admin@uni.com` / `password123`** إذا لم يُعثَر على صف. الاستجابة تتضمن **`token`** وكائن **`user`** (Next يضع التوكن في كوكي فقط؛ هنا مناسب لـ **`Authorization: Bearer`**). |
| **الموارد الإدارية** | مسارات بصيغة Next: **`/api/courses`**, **`/api/students`**, **`/api/instructors`**, **`/api/enrollments`**, **`/api/instructor-profiles`** — كلها تتطلّب دور **`Admin`**. استجابات الأخطاء والحالات تشبه الغرض من الواجهة في Next (**400** تحقّق، **404** غير موجود، **409** تكرار التسجيل أو الملف الشخصي). |
| **غير موجود في مشروع الجذر (ما زال حصريًا على Next)** | **`POST /api/auth/register`**، **`/api/auth/me`**, **`/api/auth/logout`**, **`/api/auth/password`**, **`GET /api/me/enrollments`**, **`PATCH /api/me/profile`**. هذه تكمل تجربة الويب والكوكي للطالب. |

**كيف تجرب الخادم C# بعد تشغيل MySQL وفق الـ README:** من الجذر `dotnet restore` ثم `dotnet run`؛ في Scalar/OpenAPI مرّر هيدر **`Authorization: Bearer`** مع قيمة التوكن الناتجة من **`/api/auth/login`**.

---

## 10. ربط الواجهة (`web`) بـ ASP.NET: آلية العمل وماذا يُنجلب ومِن أين؟

التشغيل الافتراضي: الواجهة تتصل **بـ Next فقط** (`localhost:3000`) وجميع **`/api/*`** تنفَّذ على **خدمة Next + Prisma** وتقرأ/تكتب **MySQL** من نفس السكيمة.

عند الرغبة بجعل **ASP.NET هو «الخلفية» لتسجيل الدخول ولوحة الإدارة**، تضبط في **`web/.env`**:

```env
NEXT_PUBLIC_DOTNET_API_URL=http://localhost:5007
```

ثم **`npm run dev`** من جديد (متغيرات **`NEXT_PUBLIC_***`** تُبنى وقت التشغيل).

### 10.1 ماذا «يتواصل» وبأي عنوان؟

| جهة الطلب من المتصفّح | العنوان الفعلي (مثال) | من يخدم الطلب |
|----------------------|-------------------------|----------------|
| صفحات الواجهة (React) | `http://localhost:3000/...` | **Next.js** (واجهة فقط) |
| مسارات تبقى على Next | `http://localhost:3000/api/...` | **Route Handlers** في **`web/src/app/api/`** + **Prisma** → **MySQL** |
| مسارات تُحمَّل إلى ASP.NET بعد التفعيل | `http://localhost:5007/api/...` | **ASP.NET** + **EF Core** → **نفس MySQL** |

التوجيه بين العمودين الأخيرين يحدث في **`web/src/lib/axios-instance.ts`**: اعتراض Axios يضيف **`Authorization: Bearer &lt;jwt&gt;`** (من **`sessionStorage`**) للطلبات التي تذهب إلى عنوان الـ dotnet.

### 10.2 ما الذي يظل حصريًا على Next (ولا يُرسل لـ dotnet)؟

هذه المسارات تعالج بالكامل على **خدمة Next** (نفس المنفذ 3000) لأنها مرتبطة بـ Prisma لتجربة الطالب أو كوكي الجلسة:

| مسار تقريبي | لماذا على Next |
|-------------|------------------|
| `GET /api/auth/me` | يقرأ مستخدم JWT من الكوكي ويقارن بدور مستخدم من **Prisma** (`requireAuth` + DB). |
| `POST /api/auth/register` | إنشاء طالب + مستخدم + هاش كلمة مرور عبر **Prisma**. |
| `POST /api/auth/logout` | مسح كوكي **`cm_session`**. |
| `POST /api/auth/password` | تغيير كلمة المرور عبر **Prisma**. |
| `POST /api/auth/bootstrap-session` | يستقبل JWT من الـ dotnet بعد تسجيل الدخول ويتحقّق به (`verifyToken`) ويملأ كوكي **`cm_session`** حتى **middleware** الصفحات يعمل بدون قراءة `sessionStorage` (الكوكي httpOnly). |
| `GET/PATCH …/api/me/*` | تسجيلات الطالب وتحديث الاسم — **Prisma** + **`requireStudentScoped`**. |

بعد **`POST /api/auth/register`**، الاستجابة تتضمن أيضًا حقل **`token`** (JWT) حتى يُخزَّن في **`sessionStorage`** عند تفعيل وضع dotnet ويُستخدم كـ **Bearer** لطلبات الإدارة دون إعادة تسجيل دخول.

### 10.3 ما الذي يذهب إلى ASP.NET بعد التفعيل؟

| مجموعة الموارد | مثال | مصدر البيانات في الخادم |
|----------------|------|---------------------------|
| تسجيل الدخول (الأدمن/المستخدم الداعم لتجربة C#) | `POST /api/auth/login` | **C#**: التحقق من **`Users`** (BCrypt) + إرجاع **`token`** + **`user`** |
| لوحة الإدارة (قراءة/كتابة) | `/api/courses`, `/api/students`, `/api/instructors`, `/api/enrollments`, `/api/instructor-profiles` ومعرّفاتها | **C#**: **EF Core** على نفس الجداول في **MySQL** |

### 10.4 تسلسل المصادقة عند توجيه التسجيل لـ dotnet

1. المستخدم يضغط تسجيل دخول → Axios يوجّه **`POST /api/auth/login`** إلى **`http://localhost:5007/api/auth/login`**.
2. الاستجابة تحتوي **`token`** (JWT) و **`user`**.
3. الواجهة تحفظ **`token`** في **`sessionStorage`** (لطلبات **Bearer** التالية إلى dotnet).
4. طلب **`POST /api/auth/bootstrap-session`** إلى **Next** بجسم `{ token }` → يضبط كوكي **`cm_session`** بنفس الـ JWT (إذا تطابق **`JWT_KEY`** مع **`Jwt:Key`**).
5. **`GET /api/auth/me`** يبقى على Next ويستخدم **الكوكي** لتحديث حالة المستخدم في السياق.
6. صفحات الإدارة (كورسات، إلخ) تستدعي مثلًا **`GET /api/courses`** → يذهب إلى **5007** مع **Bearer**.
7. **تسجيل الخروج** يمسح الكوكي عبر **`POST /api/auth/logout`** (Next) ويمسح **sessionStorage** للـ Bearer.

### 10.5 شروط تطابق JWT بين الطرفين

- **`JWT_KEY`** في **`web/.env`** = **`Jwt:Key`** في **`appsettings.json`**.
- **`JWT_ISSUER`** / **`JWT_AUDIENCE`** تطابق **`Jwt:Issuer`** / **`Jwt:Audience`**.
- على خادم **ASP.NET** مفعّل **CORS** لأصل **`http://localhost:3000`** (انظر **`Program.cs`**).

### Next.js ↔ ASP.NET Core (English — current wiring)

| Topic | Behaviour |
|-------|-----------|
| **Toggle** | Set **`NEXT_PUBLIC_DOTNET_API_URL`** (e.g. `http://localhost:5007`) in **`web/.env`; restart **`npm run dev`**. |
| **Client HTTP** | **`web/src/lib/axios-instance.ts`** keeps some paths on **same-origin Next** (`/api/auth/me`, `/api/auth/register`, `/api/me/*`, logout, password, **bootstrap-session**); all other **`/api/*`** requests use **`NEXT_PUBLIC_DOTNET_API_URL`** as **`baseURL`** and attach **`Authorization: Bearer`** from **`sessionStorage`** when present. |
| **Who reads MySQL for admin CRUD when enabled?** | **EF Core** in **`CourseManagementAPI`**. Student self-service stays on **Prisma** Route Handlers. |
| **Session for pages vs API** | **`cm_session` cookie** for Next **`middleware`** (page routes); **Bearer** for cross-origin calls to dotnet; **bootstrap-session** copies the JWT from login into the cookie. |
| **Logout** | **`POST /api/auth/logout`** (Next) + clear **`sessionStorage`** bearer in **`AuthContext`**. |

---

## 11. المراجع السريعة داخل الشفرة

- إعداد خادم **ASP.NET** وحقن الخدمات: **`Program.cs`**, **`appsettings.json`**.
- نقطة بدء التطبيق الحالي: **`web/package.json`**, **`web/src/app/layout.tsx`** ومسارات **`web/src/app/`**.
- المصادقة: **`web/src/app/api/auth/login/route.ts`**, **`web/src/lib/auth-jwt.ts`**, **`web/src/middleware.ts`**.

لمزيد من التعليمات الإنجليزية الموحّدة مع المستودع، راجع أيضًا **`README.md`** في الجذر.
