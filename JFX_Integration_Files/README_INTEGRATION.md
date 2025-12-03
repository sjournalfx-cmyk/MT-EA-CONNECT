# Integration Instructions

Here is how to add the EA feature to your JFX Journal App.

## 1. Backend Setup (The "Server")

Copy `route.ts` to your Next.js API folder:
`src/app/api/ea-webhook/route.ts`

**Note:** You need `firebase-admin` set up. If you don't have a `src/lib/firebase-admin.ts` file, create one that initializes `admin` and exports `adminDb`.

## 2. Frontend Setup (The Dashboard)

Copy `page.tsx` to your Dashboard folder:
`src/app/(dashboard)/ea-connect/page.tsx`

**Note:** Ensure imports like `@/lib/firebase` and `@/types` match your project structure.

## 3. EA Setup (MT5)

**CRITICAL FOR USER EXPERIENCE:**
To make it easy for your users (so they don't have to type a URL), you should **hardcode** your production URL in the EA code before distributing it.

1. Open your `.mq5` file.
2. Find the `Input Parameters` section.
3. **Change the default value** of `ApiUrl` to your actual live website address.
   ```cpp
   // BEFORE
   input string ApiUrl = "http://localhost:3001/api/webhook";
   
   // AFTER (Example)
   input string ApiUrl = "https://jfx-journal.com/api/ea-webhook"; 
   ```
4. **Compile the EA**.
5. Upload this compiled `.ex5` file to your website so users can download it.

Now your users only need to enter their **Sync Key**!

## 4. How it works for Users
1. User logs into your website.
2. They go to the "EA Connect" page.
3. They see a "Sync Key" (e.g., `user_123`).
4. They put that Key into the EA in MT5.
5. The EA sends data to your website.
6. Your website saves it to Firebase.
7. The Dashboard updates instantly.

**No local server required for the user!**
