// src/Components/Common/CustomerSearchSelect.jsx
//
// قائمة اختيار/فلترة زبائن موحَّدة لكل صفحات النظام (طلب صريح: "فلترة
// الزبائن بكل الصفحات - تتحمّل كمية بيانات كبيرة بأفضل UX، مع بحث بدل
// الترقيم مثل الصندوق").
//
// - بحث من الخادم (GET /customers-lookup) مع debounce - لا تحميل لكل الزبائن
//   في المتصفح مهما كبر عددهم.
// - تمرير لا نهائي: الصفحة التالية تُجلب تلقائيًا عند الاقتراب من آخر القائمة.
// - استجابة خفيفة جدًا (id/الاسم/الشركة/الهاتف/المتبقي فقط) ومخزَّنة مؤقتًا
//   عبر RTK Query - نفس البحث لا يُعاد طلبه.
// - لوحة مفاتيح كاملة (↑ ↓ Enter Esc)، إغلاق بالنقر خارجها، زر مسح، تمييز
//   النص المطابق، حالات تحميل/فراغ/خطأ واضحة.
// - يعرض اسم الزبون المختار حتى لو لم يكن ضمن الصفحة المحمَّلة (يُجلب بالمعرّف).
//
// الاستخدام:
//   <CustomerSearchSelect value={customerId} onChange={(id, customer) => ...} allowAll />
//   value: معرّف الزبون (نص أو رقم) أو ""/allValue لعدم الاختيار.
//   onChange(id: string, customer: object|null)

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useLazyLookupCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";

const PER_PAGE = 20;
const DEBOUNCE_MS = 300;

export const customerDisplayName = (c) =>
  c ? c.company_name || c.full_name || `زبون #${c.id}` : "";

const Highlight = ({ text, term }) => {
  if (!term || !text) return text || null;
  const idx = String(text).toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200/70 dark:bg-yellow-500/30 text-inherit rounded px-0.5">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
};

export default function CustomerSearchSelect({
  value,
  onChange,
  placeholder = "اختر الزبون",
  allowAll = false,
  allLabel = "جميع العملاء",
  allValue = "all",
  selectedCustomer = null,
  hasRemaining = false,
  showRemaining = false,
  clearable = true,
  disabled = false,
  invalid = false,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  id,
}) {
  const autoId = useId();
  const listboxId = `${id || autoId}-listbox`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(selectedCustomer);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const requestRef = useRef(0);

  const [trigger] = useLazyLookupCustomersQuery();

  const isEmptyValue =
    value === "" ||
    value === null ||
    value === undefined ||
    (allowAll && String(value) === String(allValue));

  // ---- debounce البحث ----------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => setTerm(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const loadPage = useCallback(
    async (pageNumber, searchTerm) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await trigger(
          { search: searchTerm, page: pageNumber, per_page: PER_PAGE, has_remaining: hasRemaining },
          true
        ).unwrap();
        if (requestId !== requestRef.current) return; // نتيجة بحث قديم - تُهمَل
        const rows = Array.isArray(res?.data) ? res.data : [];
        setItems((prev) => {
          if (pageNumber === 1) return rows;
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...rows.filter((c) => !seen.has(c.id))];
        });
        setPage(pageNumber);
        setHasMore(Boolean(res?.has_more));
      } catch (e) {
        if (requestId !== requestRef.current) return;
        setError(e?.data?.message || "تعذّر تحميل الزبائن");
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [trigger, hasRemaining]
  );

  // بحث جديد (أو فتح القائمة) => الصفحة الأولى من جديد
  useEffect(() => {
    if (!open) return;
    setActiveIndex(-1);
    loadPage(1, term);
  }, [open, term, loadPage]);

  // ---- اسم الزبون المختار ------------------------------------------------
  useEffect(() => {
    if (isEmptyValue) {
      setSelected(null);
      return;
    }
    if (selected && String(selected.id) === String(value)) return;
    if (selectedCustomer && String(selectedCustomer.id) === String(value)) {
      setSelected(selectedCustomer);
      return;
    }
    const fromList = items.find((c) => String(c.id) === String(value));
    if (fromList) {
      setSelected(fromList);
      return;
    }
    let cancelled = false;
    trigger({ ids: [value], per_page: 1 }, true)
      .unwrap()
      .then((res) => {
        if (!cancelled) setSelected(res?.data?.[0] || { id: value, full_name: `زبون #${value}` });
      })
      .catch(() => {
        if (!cancelled) setSelected({ id: value, full_name: `زبون #${value}` });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedCustomer]);

  // ---- إغلاق بالنقر خارج المكوّن ----------------------------------------
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setSearch("");
  }, [open]);

  // خيارات القائمة: "الكل" (إن سُمح وبلا بحث) + الزبائن
  const options = useMemo(() => {
    const list = items.map((c) => ({ kind: "customer", customer: c }));
    return allowAll && !term ? [{ kind: "all" }, ...list] : list;
  }, [items, allowAll, term]);

  const choose = (option) => {
    if (!option) return;
    if (option.kind === "all") {
      setSelected(null);
      onChange?.(allValue, null);
    } else {
      setSelected(option.customer);
      onChange?.(String(option.customer.id), option.customer);
    }
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onChange?.(allowAll ? allValue : "", null);
  };

  const scrollActiveIntoView = (index) => {
    const el = listRef.current?.querySelector(`[data-index="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, options.length - 1);
      setActiveIndex(next);
      scrollActiveIntoView(next);
      if (next >= options.length - 3 && hasMore && !loading) loadPage(page + 1, term);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, 0);
      setActiveIndex(prev);
      scrollActiveIntoView(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(options[activeIndex >= 0 ? activeIndex : 0]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const onListScroll = (e) => {
    const el = e.currentTarget;
    if (hasMore && !loading && el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      loadPage(page + 1, term);
    }
  };

  const triggerLabel = isEmptyValue
    ? allowAll
      ? allLabel
      : ""
    : customerDisplayName(selected) || "جارٍ التحميل...";

  return (
    <div ref={rootRef} className={`relative w-full ${className}`} dir="rtl">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (["ArrowDown", "Enter", " "].includes(e.key) && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex h-10 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm text-right
          focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50
          ${invalid ? "border-destructive" : "border-input"} ${triggerClassName}`}
      >
        <Icon icon="mdi:account-search-outline" className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={`flex-1 truncate ${triggerLabel ? "" : "text-muted-foreground"}`}>
          {triggerLabel || placeholder}
        </span>
        {clearable && !isEmptyValue && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={clear}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="مسح الاختيار"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </span>
        )}
        <Icon
          icon="mdi:chevron-down"
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full z-[60] mt-1 w-full min-w-[280px] overflow-hidden rounded-md border border-border
            bg-popover text-popover-foreground shadow-lg ${dropdownClassName}`}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="ابحث بالاسم أو الشركة أو الهاتف أو الرقم..."
                className="h-9 w-full rounded-md border border-input bg-background pr-8 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-autocomplete="list"
                aria-controls={listboxId}
              />
              {loading && (
                <Icon icon="mdi:loading" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            onScroll={onListScroll}
            className="max-h-72 overflow-y-auto py-1"
          >
            {options.map((option, index) => {
              const active = index === activeIndex;
              if (option.kind === "all") {
                const isSel = isEmptyValue;
                return (
                  <li
                    key="__all"
                    data-index={index}
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option)}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${active ? "bg-muted" : ""}`}
                  >
                    <Icon icon="mdi:account-group-outline" className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{allLabel}</span>
                    {isSel && <Icon icon="mdi:check" className="h-4 w-4 text-primary" />}
                  </li>
                );
              }
              const c = option.customer;
              const isSel = !isEmptyValue && String(c.id) === String(value);
              const main = customerDisplayName(c);
              const sub = c.company_name && c.full_name && c.full_name !== c.company_name ? c.full_name : null;
              return (
                <li
                  key={c.id}
                  data-index={index}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${active ? "bg-muted" : ""} ${isSel ? "font-semibold" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <Highlight text={main} term={term} />
                    </div>
                    <div className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {sub && <Highlight text={sub} term={term} />}
                      {c.phone_number && (
                        <span dir="ltr">
                          <Highlight text={c.phone_number} term={term} />
                        </span>
                      )}
                      <span className="opacity-60">#{c.id}</span>
                    </div>
                  </div>
                  {showRemaining && Number(c.remaining) > 0.009 && (
                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      {Number(c.remaining).toLocaleString("en-US", { maximumFractionDigits: 2 })} $
                    </span>
                  )}
                  {isSel && <Icon icon="mdi:check" className="h-4 w-4 shrink-0 text-primary" />}
                </li>
              );
            })}

            {!loading && !error && items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {term ? `لا يوجد زبائن مطابقون لـ "${term}"` : "لا يوجد زبائن"}
              </li>
            )}
            {error && (
              <li className="px-3 py-4 text-center text-sm text-destructive">
                {error}
                <button type="button" className="mr-2 underline" onClick={() => loadPage(1, term)}>
                  إعادة المحاولة
                </button>
              </li>
            )}
            {loading && items.length > 0 && (
              <li className="px-3 py-2 text-center text-xs text-muted-foreground">جارٍ تحميل المزيد...</li>
            )}
            {loading && items.length === 0 &&
              [0, 1, 2, 3].map((i) => (
                <li key={`sk-${i}`} className="px-3 py-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-muted" />
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
