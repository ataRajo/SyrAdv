export const ActivityFieldsShow = [
  { 
    label: "النشاط", 
    key: "activity", 
    icon: "mdi:history",
    format: (value) => {
      if (typeof value === 'string' && value.includes('\\u')) {
        try {
          return JSON.parse(`"${value}"`);
        } catch (e) {
          return value.replace(/\\u[\dA-F]{4}/gi, (match) => {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
          });
        }
      }
      return value || "لا يوجد نشاط";
    }
  },
  {
    label: "انشاء",
    key: "created_at",
    icon: "mdi:calendar",
    format: (value) => new Date(value).toLocaleDateString("ar-SA"),
  },
];