import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { initializeFirebase, db } from '@/lib/firebase/config';

const ensureFirebase = async () => {
  await initializeFirebase();
  if (!db) {
    throw new Error('Firebase not initialized');
  }
};

const mapProject = (docSnap: any) => {
  const data = docSnap.data();
  let createdAt: string | null = null;
  if (data.createdAt?.toDate) {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    createdAt = data.createdAt;
  }

  return {
    id: docSnap.id,
    ...data,
    createdAt,
  } as Record<string, any>;
};

export const projectService = {
  async listProjects() {
    await ensureFirebase();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(mapProject);
  },

  async createProject(projectData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      tags: projectData.tags ?? [],
      upvotes: projectData.upvotes ?? 0,
      comments: projectData.comments ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async incrementUpvotes(projectId: string, delta = 1) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      upvotes: increment(delta),
      updatedAt: serverTimestamp(),
    });
  },

  async updateProject(projectId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },
};

export type ProjectService = typeof projectService;
