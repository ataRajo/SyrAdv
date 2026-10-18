// utils/idbImageStorage.js
//
// تخزين صور اللوحات (road-sign photos) لكل حجز عبر IndexedDB بدل
// localStorage - الأخيرة محدودة بحصة صغيرة (5-10MB لكل الموقع مجتمعًا)
// وتفشل بصمت (QuotaExceededError) مع أول صورتين/ثلاث غير مضغوطة، مما كان
// يؤدي لاختفاء الصور من صفحة الحجز والـ PDF المولَّد منها.
//
// ملف واحد مشترك يستورده كل من:
// - Components/Customers/SummaryBookings.jsx
// - Pages/Booking/BookingDetails.jsx
// بدل تكرار/نسخ نفس المنطق في مكانين (وكان أحدهما قديمًا لا يزال يستخدم
// localStorage مباشرة - راجع تعليق الإصلاح في BookingDetails.jsx).

const DB_NAME = "bookingImagesDB";
const STORE = "images";
const DB_VERSION = 1;

// اتصال واحد يُفتح ويُعاد استخدامه (بدل indexedDB.open() جديد بكل
// idbGet/idbSet) - يقلّل احتمال أي تعارض عابر عند قراءات متوازية كثيرة.
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
      db.onclose = () => { dbPromise = null; };
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

// المفتاح الموحَّد المستخدَم في كل مكان (حجز + لوحة) - دالة واحدة بدل
// تكرار الـ template string في كل ملف يستخدم هذا التخزين.
export const imageStorageKey = (bookingId, signId) => `booking_images_${bookingId}_sign_${signId}`;

// تصغير/ضغط الصورة قبل حفظها (1200px عرض أقصى، جودة JPEG 0.7) - يبقيها
// بحجم مناسب لعرضها بالصفحة وللقصها لاحقًا داخل html2canvas عند توليد PDF.
export const compressImage = (file, maxWidth = 1200, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
