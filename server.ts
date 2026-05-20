
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

dotenv.config();

// Initialize Firebase Admin (lazy)
function getAdmin() {
  const currentAdmin = (admin as any).default || admin;
  const apps = currentAdmin.apps || [];
  console.log("Checking admin apps length:", apps.length);
  if (apps.length === 0) {
    try {
      console.log("Initializing Firebase Admin");
      let initConfig: any = {};
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const configFile = fs.readFileSync(configPath, "utf8");
          const config = JSON.parse(configFile);
          if (config.projectId) {
            initConfig.projectId = config.projectId;
            process.env.GOOGLE_CLOUD_PROJECT = config.projectId;
            process.env.GCLOUD_PROJECT = config.projectId;
          }
        }
      } catch (errConfig) {
        console.warn("Could not load firebase-applet-config.json:", errConfig);
      }
      const app = currentAdmin.initializeApp(initConfig);
      console.log("Firebase Admin initialized successfully with config:", initConfig);
      return app;
    } catch (e) {
      console.error("Failed to initialize Firebase Admin:", e);
      throw e;
    }
  }
  return currentAdmin.app();
}

let firestoreDb: any = null;

function getFirestoreDb() {
  if (!firestoreDb) {
    const app = getAdmin();
    let databaseId: string | undefined = undefined;
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configFile);
        if (config.firestoreDatabaseId) {
          databaseId = config.firestoreDatabaseId;
        }
      }
    } catch (errConfig) {
      console.warn("Could not load firestoreDatabaseId from config:", errConfig);
    }
    
    if (databaseId) {
      console.log("Initializing Firestore with custom database ID:", databaseId);
      firestoreDb = getFirestore(app, databaseId);
    } else {
      console.log("Initializing firestore default database");
      firestoreDb = getFirestore(app);
    }
  }
  return firestoreDb;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Insights
  app.post("/api/gemini-insights", async (req, res) => {
    try {
      const { dataSummary, language } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ 
          error: language === 'am' ? 'የGemini API ቁልፍ አልተቀናበረም።' : 'Gemini API key is not configured.' 
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are the AI Business Advisor for "Meliq Equb", a modern decentralized Equb platform in Ethiopia. 
      Analyze the following system data and provide strategic insights, growth recommendations, and potential risk alerts.
      Provide the response in ${language === 'am' ? 'Amharic' : 'English'}.
      Use a professional yet visionary tone. Include specific numbers if helpful.
      
      System Data:
      ${JSON.stringify(dataSummary, null, 2)}
      
      Format the output using Markdown with clear headings and bullet points. Focus on:
      1. User Growth & Retention
      2. Financial Health & Payout Efficiency
      3. Risk Analysis (Late payments/Pending KYC)
      4. Recommendations for new Group Types based on current activity.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Error generating insights' });
    }
  });

  // API to toggle admin permission
  app.post("/api/admin/toggle-permission", async (req, res) => {
    try {
      const { adminUid, permission, value, requesterUid } = req.body;

      // Security Check: Verify requester is super-admin
      const requesterDoc = await getFirestoreDb().collection('users').doc(requesterUid).get();
      const isSuper = requesterDoc.exists && (
        requesterDoc.data()?.isSuperAdmin === true || 
        requesterDoc.data()?.role === 'super_admin' || 
        requesterDoc.data()?.role === 'superadmin'
      );
      if (!isSuper) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const adminRef = getFirestoreDb().collection('users').doc(adminUid);
      await adminRef.update({
        [`permissions.${permission}`]: value
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error toggling permission:', error);
      res.status(500).json({ error: 'Failed to update permission' });
    }
  });

  // API to delete admin
  app.post("/api/admin/delete-admin", async (req, res) => {
    try {
      console.log("Delete admin request body:", req.body);
      const { adminUid, requesterUid } = req.body;

      // Security Check: Verify requester is super-admin
      const requesterDoc = await getFirestoreDb().collection('users').doc(requesterUid).get();
      const isSuper = requesterDoc.exists && (
        requesterDoc.data()?.isSuperAdmin === true || 
        requesterDoc.data()?.role === 'super_admin' || 
        requesterDoc.data()?.role === 'superadmin'
      );
      if (!isSuper) {
        console.warn("Unauthorized delete attempt by:", requesterUid);
        return res.status(403).json({ error: 'Unauthorized' });
      }

      console.log("Attempting deletion for:", adminUid);
      // 1. Delete user document from Firestore (if it still exists post-client cleanup)
      try {
        await getFirestoreDb().collection('users').doc(adminUid).delete();
      } catch (dbErr: any) {
        console.warn("Firestore document deletion skipped or failed:", dbErr.message || dbErr);
      }

      // 2. Delete user from Firebase Auth
      let authDeleted = false;
      try {
        await getAuth(getAdmin()).deleteUser(adminUid);
        authDeleted = true;
        console.log("Deletion successful from Auth for:", adminUid);
      } catch (authErr: any) {
        console.warn("Firebase Auth user deletion failed (could be pre-production IAM boundary):", authErr.message || authErr);
      }

      res.json({ success: true, authDeleted });
    } catch (error) {
      console.error('Error deleting admin:', error);
      res.status(500).json({ error: 'Failed to delete admin: ' + (error as any).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
