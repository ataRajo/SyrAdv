import React, { useState, useCallback } from "react";
import { SAC_COLORS, SAC_CONTACT, SAC_LOGO_PATH } from "../../utils/branding/sacBrand";

const PaymentsPdf = ({ customer, title = "تقرير الدفعات" }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  // Handle different data shapes
  const isCustomerArray = Array.isArray(customer);
  let payments = [];
  let customerInfo = {};

  if (isCustomerArray) {
    payments = customer;
    if (payments.length > 0 && payments[0]?.customer) {
      customerInfo = payments[0].customer;
    }
  } else if (customer && typeof customer === "object") {
    customerInfo = customer?.customerData || customer;
    payments = customer?.payments || [];
  }

  if (!Array.isArray(payments)) {
    payments = [];
  }

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p?.paid) || 0), 0);
  const totalRemaining = payments.reduce((sum, p) => sum + (parseFloat(p?.remaining) || 0), 0);
  const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p?.total) || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "غير محدد";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "غير محدد";
      return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "غير محدد";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 1: return { text: "قيد الانتظار", color: "#f59e0b" };
      case 2: return { text: "مقبول", color: "#10b981" };
      case 3: return { text: "مرفوض", color: "#ef4444" };
      default: return { text: "غير معروف", color: "#6b7280" };
    }
  };

  const handlePrint = useCallback(() => {
    if (payments.length === 0) {
      alert("لا توجد دفعات للطباعة");
      return;
    }
    setIsPrinting(true);
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, [payments.length]);

  return (
    <>
      {/* Print Styles - injected once */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }

          body * {
            visibility: hidden;
          }

          .payments-print-container,
          .payments-print-container * {
            visibility: visible;
          }

          .payments-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .payments-print-container table {
            page-break-inside: auto;
          }

          .payments-print-container tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .payments-print-container thead {
            display: table-header-group;
          }

          .payments-print-container tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={isPrinting || payments.length === 0}
        type="button"
        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
      >
        {isPrinting ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            جاري التحضير...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            تصدير / طباعة PDF
          </>
        )}
      </button>

      {/* Hidden Print Container - Only visible when printing */}
      <div className="payments-print-container" style={{ display: "none" }}>
        <div
          style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            direction: "rtl",
            padding: "20px",
            color: "#1f2937",
            background: "#fff",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: `3px solid ${SAC_COLORS.gold}`, paddingBottom: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: SAC_COLORS.dark }}>{title}</h1>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                تاريخ التقرير: {formatDate(new Date())}
              </p>
            </div>
            <img
              src={SAC_LOGO_PATH}
              alt="SAC"
              style={{ width: "90px", height: "auto", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Customer Info Card */}
          {customerInfo && Object.keys(customerInfo).length > 0 && (
            <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "16px", marginBottom: "20px", borderRight: "4px solid #2563eb" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "14px", color: "#1A1817", fontWeight: "bold" }}>معلومات العميل</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>اسم الشركة:</span>
                  <p style={{ margin: "2px 0 0", fontWeight: "600", fontSize: "13px" }}>{customerInfo.company_name || "غير متوفر"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>اسم الزبون:</span>
                  <p style={{ margin: "2px 0 0", fontWeight: "600", fontSize: "13px" }}>{customerInfo.full_name || "غير متوفر"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>رقم الهاتف:</span>
                  <p style={{ margin: "2px 0 0", fontWeight: "600", fontSize: "13px", direction: "ltr", textAlign: "right" }}>{customerInfo.phone_number || "غير متوفر"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>العنوان:</span>
                  <p style={{ margin: "2px 0 0", fontWeight: "600", fontSize: "13px" }}>{customerInfo.address || "غير متوفر"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "#dbeafe", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#1A1817" }}>عدد الدفعات</p>
              <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "bold", color: "#1A1817" }}>{payments.length}</p>
            </div>
            <div style={{ background: "#dcfce7", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#166534" }}>إجمالي المدفوع</p>
              <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "bold", color: "#166534" }}>{totalPaid.toFixed(2)} $</p>
            </div>
            <div style={{ background: "#fee2e2", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#991b1b" }}>إجمالي المتبقي</p>
              <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "bold", color: "#991b1b" }}>{totalRemaining.toFixed(2)} $</p>
            </div>
            <div style={{ background: "#fef3c7", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#92400e" }}>المبلغ الكلي</p>
              <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "bold", color: "#92400e" }}>{totalAmount.toFixed(2)} $</p>
            </div>
          </div>

          {/* Payments Table */}
          <div>
            <h3 style={{ margin: "0 0 10px", fontSize: "14px", color: "#1A1817", fontWeight: "bold" }}>تفاصيل الدفعات</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#1A1817", color: "#fff" }}>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>#</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>رقم الدفعة</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>التاريخ</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>العميل</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>الموظف</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>المبلغ الكلي</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>المدفوع</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>المتبقي</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                      لا توجد دفعات لعرضها
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => {
                    const status = getStatusLabel(payment?.status);
                    const paymentCustomer = payment?.customer || customerInfo;
                    const paymentUser = payment?.user;
                    return (
                      <tr key={payment?.id || index} style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb" }}>{index + 1}</td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: "600" }}>{payment?.payment_number || "—"}</td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb" }}>{formatDate(payment?.date)}</td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: "600" }}>
                          {paymentCustomer?.company_name || paymentCustomer?.full_name || "—"}
                        </td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                          {paymentUser?.full_name || paymentUser?.username || "—"}
                        </td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb", direction: "ltr" }}>{(parseFloat(payment?.total) || 0).toFixed(2)} $</td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb", direction: "ltr", color: "#166534", fontWeight: "600" }}>
                          {(parseFloat(payment?.paid) || 0).toFixed(2)} $
                        </td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb", direction: "ltr", color: "#991b1b", fontWeight: "600" }}>
                          {(parseFloat(payment?.remaining) || 0).toFixed(2)} $
                        </td>
                        <td style={{ padding: "8px 6px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: status.color + "20",
                            color: status.color,
                          }}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {payments.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#1A1817", color: "#fff", fontWeight: "bold" }}>
                    <td colSpan={5} style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}>الإجمالي</td>
                    <td style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817", direction: "ltr" }}>{totalAmount.toFixed(2)} $</td>
                    <td style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817", direction: "ltr" }}>{totalPaid.toFixed(2)} $</td>
                    <td style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817", direction: "ltr" }}>{totalRemaining.toFixed(2)} $</td>
                    <td style={{ padding: "10px 6px", textAlign: "center", border: "1px solid #1A1817" }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "20px", paddingTop: "10px", textAlign: "center", fontSize: "11px", color: "#6b7280" }}>
            <p style={{ margin: "2px 0" }}>تم إنشاء هذا التقرير آلياً بتاريخ {formatDate(new Date())}</p>
          </div>
          <div
            dir="ltr"
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: `linear-gradient(90deg, ${SAC_COLORS.goldLight} 0%, ${SAC_COLORS.gold} 45%, ${SAC_COLORS.goldDark} 100%)`,
              color: "#fff",
              fontSize: "11px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>{SAC_CONTACT.website}</span>
            <span>
              {SAC_CONTACT.phones.map((p) => `${p.number} ${p.city}`).join("   |   ")}
            </span>
            <span>{SAC_CONTACT.email}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentsPdf;