import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create data directory:", e);
  }
}

// Helper to ensure file exists
const ensureFile = (filePath, defaultData = []) => {
    if (!fs.existsSync(filePath)) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        } catch (e) {
            console.error(`Failed to create ${filePath}:`, e);
        }
    }
};

ensureFile(USERS_FILE);
ensureFile(SESSIONS_FILE);
ensureFile(QUESTIONS_FILE);

const readFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
};

export const mockDb = {
  // --- Users ---
  findUserByEmail: async (email) => {
    const users = readFile(USERS_FILE);
    return users.find(u => u.email === email) || null;
  },
  createUser: async (userData) => {
    const users = readFile(USERS_FILE);
    const newUser = {
      ...userData,
      _id: 'mock_user_' + Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeFile(USERS_FILE, users);
    return newUser;
  },

  // --- Sessions ---
  createSession: async (sessionData) => {
      const sessions = readFile(SESSIONS_FILE);
      const newSession = {
          ...sessionData,
          _id: 'mock_session_' + Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
      };
      sessions.push(newSession);
      writeFile(SESSIONS_FILE, sessions);
      return newSession;
  },
  
  // --- Questions ---
  createQuestions: async (questionsData) => {
      const questions = readFile(QUESTIONS_FILE);
      const newQuestions = questionsData.map(q => ({
          ...q,
          _id: 'mock_q_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
      }));
      questions.push(...newQuestions);
      writeFile(QUESTIONS_FILE, questions);
      return newQuestions;
  },

  deleteSession: async (sessionId, userId) => {
    const sessions = readFile(SESSIONS_FILE);
    const questions = readFile(QUESTIONS_FILE);
    
    // Find session to verify ownership
    const sessionIndex = sessions.findIndex(s => s._id === sessionId && s.user_id === userId);
    
    if (sessionIndex === -1) {
        return false;
    }
    
    // Remove session
    sessions.splice(sessionIndex, 1);
    writeFile(SESSIONS_FILE, sessions);
    
    // Remove associated questions
    const newQuestions = questions.filter(q => q.session_id !== sessionId);
    writeFile(QUESTIONS_FILE, newQuestions);
    
    return true;
  }
};
