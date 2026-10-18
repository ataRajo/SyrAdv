// idbStorage.js — simple IndexedDB key/value helper for storing sign photos.
// Put this file next to SummaryBookings.jsx (e.g. pages/idbStorage.js) and import it.

const DB_NAME = "bookingImagesDB";
const STORE = "images";
const DB_VERSION = 1;

// إصلاح PDF: كانت openDB تفتح اتصال indexedDB.open() جديد بكل استدعاء.
// عند الطباعة نقرأ كل صور اللوحات دفعة واحدة (Promise.all)، فهذا كان يعني
// عشرات اتصالات indexedDB.open() متزامنة - مصدر إضافي محتمل لفشل عابر
// بقراءة واحدة (تُقرَأ بالخطأ كـ "لا توجد صورة"). الآن اتصال واحد فقط
// يُفتح ويُعاد استخدامه لكل قراءة/كتابة لاحقة.
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // لو أُغلِق الاتصال (مثلاً من تبويب آخر يطلب ترقية نسخة)، نُبطِل
      // الذاكرة المؤقتة كي يُفتح اتصال جديد بالاستدعاء التالي بدل تعليق كل
      // القراءات/الكتابات اللاحقة على اتصال ميت.
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

export async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbClearAllBookingImages() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.getAllKeys();
    req.onsuccess = () => {
      req.result.forEach((k) => {
        if (typeof k === "string" && k.startsWith("booking_images_")) {
          store.delete(k);
        }
      });
    };
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}