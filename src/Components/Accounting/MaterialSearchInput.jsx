import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * حقل بحث عن مادة - يبحث في فهرس المواد أثناء الكتابة، ويسمح باختيار
 * نتيجة موجودة أو الاستمرار بكتابة اسم جديد (يُضاف تلقائيًا للفهرس عند
 * حفظ الفاتورة - انظر PurchaseInvoiceService::createItems() في الباك-إند).
 */
const MaterialSearchInput = ({ value, onSelect, accounting }) => {
  const { materials, isFetchingMaterials, searchMaterials } = accounting;
  const [query, setQuery] = useState(value?.material_name || "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    setQuery(value?.material_name || "");
  }, [value?.material_name]);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (open) searchMaterials(query);
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  return (
    <div className="relative" ref={boxRef}>
      <Input
        placeholder="اسم المادة..."
        value={query}
        onFocus={() => {
          setOpen(true);
          searchMaterials(query);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect({ material_id: null, material_name: e.target.value, unit: value?.unit });
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md text-sm">
          {isFetchingMaterials && <div className="p-2 text-muted-foreground">جارٍ البحث...</div>}
          {!isFetchingMaterials && materials.length === 0 && (
            <div className="p-2 text-muted-foreground">
              لا نتائج - سيُضاف "{query}" كمادة جديدة عند الحفظ
            </div>
          )}
          {materials.map((m) => (
            <button
              type="button"
              key={m.id}
              className="block w-full text-right px-2 py-1.5 hover:bg-muted"
              onClick={() => {
                onSelect({ material_id: m.id, material_name: m.name, unit: m.unit });
                setQuery(m.name);
                setOpen(false);
              }}
            >
              {m.name} {m.unit ? `(${m.unit})` : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialSearchInput;
