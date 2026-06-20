// src/Components/Broker/AddCustomerModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Mail, Phone, User, Building2, Lock , UserPlus  } from "lucide-react";

export function AddCustomerModal({ isOpen, onClose, onSubmit, formData, onInputChange, isSubmitting }) {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            إضافة عميل جديد
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            أدخل معلومات العميل الجديد
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Personal Information */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">المعلومات الشخصية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">الاسم الكامل</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={formData.full_name}
                    onChange={(e) => onInputChange("full_name", e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                    className="bg-white/10 border-white/30 text-white pr-10"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300">اسم المستخدم</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={formData.username}
                    onChange={(e) => onInputChange("username", e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="bg-white/10 border-white/30 text-white pr-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">البريد الإلكتروني *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => onInputChange("email", e.target.value)}
                    placeholder="example@domain.com"
                    className="bg-white/10 border-white/30 text-white pr-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300">رقم الهاتف *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => onInputChange("phone_number", e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="bg-white/10 border-white/30 text-white pr-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-gray-300">العنوان</Label>
              <Input
                value={formData.address}
                onChange={(e) => onInputChange("address", e.target.value)}
                placeholder="أدخل العنوان"
                className="bg-white/10 border-white/30 text-white mt-1"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">معلومات الشركة</h3>
            
            <div>
              <Label className="text-gray-300">اسم الشركة</Label>
              <div className="relative mt-1">
                <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={formData.company_name}
                  onChange={(e) => onInputChange("company_name", e.target.value)}
                  placeholder="أدخل اسم الشركة"
                  className="bg-white/10 border-white/30 text-white pr-10"
                />
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">معلومات الأمان</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">كلمة المرور *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => onInputChange("password", e.target.value)}
                    placeholder="********"
                    className="bg-white/10 border-white/30 text-white pr-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300">تأكيد كلمة المرور *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => onInputChange("password_confirmation", e.target.value)}
                    placeholder="********"
                    className="bg-white/10 border-white/30 text-white pr-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-green-400 mb-3">ملاحظات إضافية</h3>
            
            <Textarea
              value={formData.notes}
              onChange={(e) => onInputChange("notes", e.target.value)}
              placeholder="أضف ملاحظات إضافية..."
              className="bg-white/10 border-white/30 text-white mt-1"
              rows="3"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة العميل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}