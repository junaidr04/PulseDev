# PulseDev

**PulseDev** হলো একটি টিম ওয়ার্কস্পেস অ্যাপ। একটি জায়গা থেকে প্রজেক্ট বা initiative সাজানো, sprint-এর কাজ ভাগ করা, কাজের অগ্রগতি দেখা এবং টিমের সঙ্গে যোগাযোগ করাই এর মূল উদ্দেশ্য।

এই README-তে অ্যাপটি কী কাজে লাগে, কোন কোন সুবিধা আছে এবং নিজের কম্পিউটারে কীভাবে চালাতে হয়—ধাপে ধাপে বলা হয়েছে।

## PulseDev দিয়ে কী করা যায়?

### ১. কাজের অগ্রগতি এক নজরে দেখা

**Overview** পেজে নির্বাচিত initiative ও sprint-এর সারাংশ দেখা যায়। কোন কাজ কোন অবস্থায় আছে, কাজের অগ্রগতি কেমন এবং নিজের দায়িত্বে কী আছে—এসব দ্রুত বুঝতে এই পেজটি ব্যবহার করুন।

### ২. Initiative তৈরি ও গুছিয়ে রাখা

একটি initiative-এ সাধারণত কোনো প্রজেক্ট, বড় ফিচার বা দীর্ঘমেয়াদি কাজের লক্ষ্য রাখা হয়। প্রতিটির নাম, সংক্ষিপ্ত বিবরণ, বিভাগ, key ও label যোগ করা যায়। Initiative তালিকা থেকে একটি নির্বাচন করলে তার sprint board খোলে।

### ৩. Sprint-এর কাজ পরিচালনা

**Active Sprint** বোর্ডে কাজগুলো চারটি ধাপে সাজানো থাকে:

- **Backlog** — শুরু করার অপেক্ষায়
- **In Progress** — বর্তমানে চলছে
- **In Review (QA)** — পরীক্ষা বা review-এর জন্য প্রস্তুত
- **Done** — সম্পন্ন

প্রতিটি issue-তে শিরোনাম, বিবরণ, assignee, অগ্রাধিকার, আনুমানিক সময় এবং label রাখা যায়। বোর্ডে issue খুঁজে বা filter করে দেখা যায়, অনুমতি থাকলে এক ধাপ থেকে অন্য ধাপে নেওয়া, দায়িত্বপ্রাপ্ত ব্যক্তি বদলানো, comment যোগ করা বা issue মুছে ফেলা যায়। নতুন issue-ও সরাসরি বোর্ড থেকে তৈরি করা যায়।

কোন ব্যবহারকারী কোন কাজ পরিবর্তন করতে পারবেন, তা তাঁর role এবং issue-টির দায়িত্বে তিনি আছেন কি না—তার ওপর নির্ভর করে। তাই সব account-এ একই edit option নাও দেখা যেতে পারে।

### ৪. টিমের সঙ্গে যোগাযোগ

**Team Chat**-এ টিমের সদস্যরা বার্তা পাঠাতে ও দেখতে পারেন। Chat-এ ছবি এবং PDF, Word বা text ফাইল সংযুক্ত করার সুবিধাও আছে। নতুন কাজ বা আপডেটের notification-ও অ্যাপে দেখা যায়; notification পড়া হিসেবে চিহ্নিত করা যায়।

### ৫. Planning Assistant ব্যবহার

**Planning Assistant**-এ কয়েক ধরনের সহায়তা আছে:

- Epic বা feature-এর বর্ণনা থেকে sprint-এর কাজের খসড়া তৈরি
- নির্বাচিত বিষয়ের ওপর technical বা security review-এর খসড়া
- নির্বাচিত category অনুযায়ী interview প্রশ্নোত্তরের সহায়তা

তৈরি হওয়া sprint item প্রয়োজনমতো দেখে backlog-এ যোগ করা যায়। এই AI সুবিধাগুলোর জন্য `GEMINI_API_KEY` প্রয়োজন। AI-তে পাঠানোর আগে কোনো গোপন বা সংবেদনশীল তথ্য prompt-এ দেবেন না।

### ৬. Profile ও টিমের সদস্য

**Team Members** অংশে টিমের সদস্যদের তালিকা ও তাদের প্রোফাইল দেখা যায়। নিজের profile settings থেকে নাম, পদবি, বিভাগ এবং availability status পরিবর্তন করা যায়। Password পরিবর্তন করতে বর্তমান password দিয়ে Profile settings ব্যবহার করুন। Password ভুলে গেলে workspace admin-এর সঙ্গে যোগাযোগ করুন; email verification-সহ reset ব্যবস্থা এই অ্যাপে নেই।

### ৭. Admin-দের জন্য

Admin account-এ অতিরিক্ত **Security & Logs** এবং **User Impersonation** অংশ থাকে। Security log-এ sign-in, role পরিবর্তন এবং impersonation-এর মতো event দেখা যায়। Impersonation দিয়ে admin অন্য account-এর মতো workspace দেখতে পারেন; কাজ শেষ হলে সেখান থেকে বের হয়ে আসা যায়। অন্য role-এ এসব সুবিধা থাকে না।

## সাধারণ ব্যবহার

1. অ্যাপ খুলে workspace account দিয়ে sign in করুন, অথবা নতুন account তৈরি করুন।
2. **Overview** থেকে সারাংশ দেখুন এবং sidebar বা **Initiatives** থেকে কাজের initiative বাছুন।
3. **Active Sprint**-এ issue তৈরি করুন বা থাকা issue-এর অবস্থা ও বিবরণ হালনাগাদ করুন।
4. দরকার হলে Team Chat-এ যোগাযোগ করুন, notification দেখুন বা Planning Assistant-এর খসড়া নিন।
5. নিজের তথ্য ও password বদলাতে **Team Members / Profile settings** ব্যবহার করুন।

অ্যাপটিতে নমুনা account বেছে নেওয়ার ব্যবস্থাও আছে। Sign in করতে নির্বাচিত account-এর বৈধ password দিতে হবে।

## নিজের কম্পিউটারে চালানো

### প্রয়োজনীয় সফটওয়্যার

- Node.js 20 বা তার পরের compatible সংস্করণ
- npm (Node.js-এর সঙ্গে আসে)

### ইনস্টল ও চালু

টার্মিনালে project folder-এ গিয়ে চালান:

```bash
npm install --legacy-peer-deps
npm run dev
```

তারপর browser-এ খুলুন: [http://localhost:3000](http://localhost:3000)

`--legacy-peer-deps` ব্যবহার করা হয়েছে কারণ project-এর কিছু dependency-র peer version একে অপরের সঙ্গে পুরোপুরি মেলে না।

### AI সুবিধা চালু করা (ঐচ্ছিক)

সাধারণ workspace চালাতে Gemini key দরকার নেই। Planning Assistant-এর Gemini-নির্ভর অংশ ব্যবহার করতে:

1. project-এর root-এ `.env` নামে ফাইল তৈরি করুন।
2. অন্তত JWT secret এবং Gemini API key যোগ করুন। JWT secret হিসেবে cryptographically random, অন্তত 32-character মান ব্যবহার করুন:

   ```env
   JWT_SECRET=replace_with_a_long_random_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. server বন্ধ করে আবার `npm run dev` চালান। `.env`-এ `JWT_SECRET` না থাকলে development mode প্রথমবার একটি local secret বানায় এবং `backend/data/.jwt-secret`-এ রেখে দেয়। Production mode-এ `JWT_SECRET` অবশ্যই set করতে হবে।

নিজের `.env` ফাইল বা API key কারও সঙ্গে শেয়ার করবেন না এবং version control-এ যোগ করবেন না।

### Production build তৈরি

```bash
npm run build
```

এটি production frontend build তৈরি করে `dist/` folder-এ রাখে।

## ডেটা ও password

অ্যাপের backend ডেটা `backend/data/` folder-এর JSON ফাইলে রাখে। এতে account, initiative, task, notification, audit log এবং chat-সংক্রান্ত ডেটা থাকতে পারে। অ্যাপ পুনরায় চালালেও এই ফাইলগুলো থাকলে স্থানীয় ডেটা থাকে।

Password hash করে সংরক্ষণ করা হয়; plain-text password হিসেবে নয়। স্থানীয় account বা project হারাতে না চাইলে `backend/data/` folder-টি মুছবেন না এবং প্রয়োজন হলে নিরাপদ backup রাখুন। এই local JSON storage নিজে থেকে cloud backup বা একাধিক server-এর মধ্যে data sync করে না।

Public registration-এ নতুন account `developer` role পায়। Admin সুবিধা কেবল বিদ্যমান admin account বা admin-এর role-management ব্যবস্থার মাধ্যমে দেওয়া উচিত। Database inspector ও reset/reseed API-ও কেবল admin account ব্যবহার করতে পারে।

## ব্যবহৃত প্রযুক্তি

- **Frontend:** React, TypeScript, Vite এবং Tailwind CSS
- **Backend:** Node.js ও Express
- **Authentication:** JWT এবং bcrypt password hashing
- **AI integration:** ঐচ্ছিক Gemini API
- **Local persistence:** JSON ফাইল
