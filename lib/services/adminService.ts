import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase, db } from '@/lib/firebase/config';

const ensureFirebase = async () => {
  await initializeFirebase();
  if (!db) {
    throw new Error('Firebase not initialized');
  }
};

export const adminService = {
  // ===== Courses =====
  async getCourses() {
    await ensureFirebase();
    const snapshot = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },

  async getCourse(courseId: string) {
    await ensureFirebase();
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    return { id: courseSnap.id, ...courseSnap.data() };
  },

  async createCourse(courseData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      modules: courseData.modules ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateCourse(courseId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'courses', courseId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteCourse(courseId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'courses', courseId));
  },

  // ===== Modules =====
  async getModules(courseId?: string) {
    await ensureFirebase();
    let qRef;
    if (courseId) {
      qRef = query(
        collection(db, 'modules'),
        where('courseId', '==', courseId),
        orderBy('order', 'asc')
      );
    } else {
      qRef = query(collection(db, 'modules'), orderBy('order', 'asc'));
    }
    const snapshot = await getDocs(qRef);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },

  async createModule(moduleData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'modules'), {
      ...moduleData,
      lessons: moduleData.lessons ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateModule(moduleId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'modules', moduleId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteModule(moduleId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'modules', moduleId));
  },

  // ===== Lessons =====
  async getLessons(moduleId?: string) {
    await ensureFirebase();
    let qRef;
    if (moduleId) {
      qRef = query(
        collection(db, 'lessons'),
        where('moduleId', '==', moduleId),
        orderBy('order', 'asc')
      );
    } else {
      qRef = query(collection(db, 'lessons'), orderBy('order', 'asc'));
    }
    const snapshot = await getDocs(qRef);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },

  async createLesson(lessonData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'lessons'), {
      ...lessonData,
      completed: lessonData.completed ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateLesson(lessonId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'lessons', lessonId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteLesson(lessonId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'lessons', lessonId));
  },

  // ===== Projects =====
  async getProjects() {
    await ensureFirebase();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },

  async createProject(projectData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      isPublic: true,
      tags: projectData.tags ?? [],
      upvotes: projectData.upvotes ?? 0,
      comments: projectData.comments ?? 0,
      aiReview: projectData.aiReview ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProject(projectId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProject(projectId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'projects', projectId));
  },

  // ===== Stats =====
  async getStats() {
    await ensureFirebase();
    const [coursesSnap, modulesSnap, projectsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'modules')),
      getDocs(collection(db, 'projects')),
      getDocs(collection(db, 'users')),
    ]);

    return {
      totalUsers: usersSnap.size,
      totalModules: modulesSnap.size,
      totalProjects: projectsSnap.size,
      totalCourses: coursesSnap.size,
    };
  },

  // ===== Users =====
  async getUsers() {
    await ensureFirebase();
    const snapshot = await getDocs(collection(db, 'users'));

    return snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as { id: string; createdAt?: any; [key: string]: any }))
      .sort((a, b) => {
        const aDate =
          typeof a.createdAt?.toDate === 'function'
            ? a.createdAt.toDate().getTime()
            : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
        const bDate =
          typeof b.createdAt?.toDate === 'function'
            ? b.createdAt.toDate().getTime()
            : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
        return bDate - aDate;
      });
  },
};

export type AdminService = typeof adminService;

