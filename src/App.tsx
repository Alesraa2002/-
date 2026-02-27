import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  Send, 
  FileText, 
  Search,
  LayoutDashboard,
  LogOut,
  Check,
  AlertCircle,
  Archive,
  Download,
  Settings,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BeneficiaryForm, Role } from './types';

export default function App() {
  const [user, setUser] = useState<{ id: number, username: string, role: Role, fullName: string } | null>(null);
  const [forms, setForms] = useState<BeneficiaryForm[]>([]);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL' | 'SETTINGS'>('LIST');
  const [selectedForm, setSelectedForm] = useState<BeneficiaryForm | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'SUBMITTER') {
      fetchForms();
    }
  }, [user]);

  const safeParse = (str: string) => {
    try {
      return JSON.parse(str || '[]');
    } catch (e) {
      return [];
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      setForms(data.map((f: any) => ({
        ...f,
        accessChannel: safeParse(f.accessChannel),
        problemDescription: safeParse(f.problemDescription),
        suggestedAid: safeParse(f.suggestedAid),
        isMainBreadwinner: !!f.isMainBreadwinner
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('LIST');
    setSelectedForm(null);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const role = user.role;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-xl">
                <ClipboardList className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 hidden sm:block">نظام ترشيح المستفيدين</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-left hidden md:block">
                <p className="text-xs text-slate-500">مرحباً بك</p>
                <p className="text-sm font-semibold">{user.fullName}</p>
              </div>
              <button 
                onClick={() => setView('SETTINGS')}
                className={`p-2 rounded-full transition-colors ${view === 'SETTINGS' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-100 text-slate-500'}`}
                title="الإعدادات"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {role === 'SUBMITTER' && view === 'LIST' && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <UserPlus className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2">ابدأ بتقديم طلب جديد</h2>
            <p className="text-slate-500 mb-8">يمكنك تعبئة نموذج ترشيح مستفيد للحصول على مساعدة إغاثية</p>
            <button 
              onClick={() => setView('CREATE')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              تعبئة نموذج جديد
            </button>
          </div>
        )}

        {role !== 'SUBMITTER' && view === 'LIST' && (
          <Dashboard 
            forms={forms} 
            role={role} 
            onViewDetail={(form) => {
              setSelectedForm(form);
              setView('DETAIL');
            }} 
            loading={loading}
          />
        )}

        {view === 'CREATE' && (
          <BeneficiaryFormView 
            onCancel={() => setView('LIST')} 
            onSubmitSuccess={() => {
              if (role === 'SUBMITTER') {
                alert('تم إرسال الطلب بنجاح');
                setView('LIST');
              } else {
                fetchForms();
                setView('LIST');
              }
            }}
          />
        )}

        {view === 'DETAIL' && selectedForm && (
          <FormDetailView 
            form={selectedForm} 
            role={role} 
            onBack={() => {
              setView('LIST');
              setSelectedForm(null);
            }}
            onUpdate={() => {
              fetchForms();
              setView('LIST');
              setSelectedForm(null);
            }}
          />
        )}

        {view === 'SETTINGS' && (
          <SettingsView 
            user={user} 
            onBack={() => setView('LIST')} 
          />
        )}
      </main>
    </div>
  );
}

function getRoleName(role: Role) {
  switch (role) {
    case 'SUBMITTER': return 'مقدم الطلب / المستفيد';
    case 'FIELD_COORDINATOR': return 'المنسق الميداني';
    case 'RELIEF_MANAGER': return 'مدير برنامج الإغاثة';
    case 'PROGRAM_DIRECTOR': return 'مديرة البرامج';
  }
}

function SettingsView({ user, onBack }: { user: any, onBack: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمات المرور غير متطابقة' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'فشل تغيير كلمة المرور' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">إعدادات الحساب</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="bg-slate-100 p-4 rounded-2xl">
            <Settings className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">اسم المستخدم الثابت</p>
            <p className="text-xl font-bold text-slate-900">{user.username}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            تغيير كلمة المرور
          </h3>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الجديدة</label>
              <input 
                required
                type="password"
                className="form-input"
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تأكيد كلمة المرور</label>
              <input 
                required
                type="password"
                className="form-input"
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200">
            <ClipboardList className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">بوابة جمعية سنابل</h1>
          <p className="text-slate-500">نظام إدارة المساعدات الإغاثية</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <input 
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <input 
                required
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              هذا النظام مخصص لموظفي جمعية سنابل والمستفيدين المعتمدين.<br/>
              في حال فقدان كلمة المرور يرجى مراجعة قسم تكنولوجيا المعلومات.
            </p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="bg-slate-100 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500">حساب تجريبي: مقدم طلب</p>
            <p className="text-xs font-bold text-slate-700">user / 123</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500">حساب تجريبي: منسق ميداني</p>
            <p className="text-xs font-bold text-slate-700">field / 123</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500">حساب تجريبي: مدير إغاثة</p>
            <p className="text-xs font-bold text-slate-700">relief / 123</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500">حساب تجريبي: مديرة برامج</p>
            <p className="text-xs font-bold text-slate-700">admin / 123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ forms, role, onViewDetail, loading }: { forms: BeneficiaryForm[], role: Role, onViewDetail: (f: BeneficiaryForm) => void, loading: boolean }) {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ARCHIVE'>('PENDING');

  const pendingForms = forms.filter(f => {
    if (role === 'FIELD_COORDINATOR') return f.status === 'FIELD_REVIEW_PENDING';
    if (role === 'RELIEF_MANAGER') return f.status === 'RELIEF_MANAGER_PENDING';
    if (role === 'PROGRAM_DIRECTOR') return f.status === 'DIRECTOR_PENDING';
    if (role === 'SUBMITTER') return f.status !== 'COMPLETED';
    return true;
  });

  const archiveForms = forms.filter(f => {
    if (role === 'SUBMITTER') return f.status === 'COMPLETED';
    if (role === 'FIELD_COORDINATOR') return f.status !== 'FIELD_REVIEW_PENDING';
    if (role === 'RELIEF_MANAGER') return f.status !== 'RELIEF_MANAGER_PENDING' && f.status !== 'FIELD_REVIEW_PENDING';
    if (role === 'PROGRAM_DIRECTOR') return f.status === 'COMPLETED';
    return f.status === 'COMPLETED';
  });

  const displayForms = activeTab === 'PENDING' ? pendingForms : archiveForms;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">لوحة تحكم جمعية سنابل</h2>
          <p className="text-slate-500">
            {activeTab === 'PENDING' 
              ? `لديك ${pendingForms.length} طلبات بانتظار الإجراء` 
              : `لديك ${archiveForms.length} طلبات في الأرشيف`}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'PENDING' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            الطلبات المعلقة
          </button>
          <button 
            onClick={() => setActiveTab('ARCHIVE')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'ARCHIVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            الأرشيف / المكتملة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : displayForms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'PENDING' ? <Check className="text-slate-400 w-8 h-8" /> : <Archive className="text-slate-400 w-8 h-8" />}
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            {activeTab === 'PENDING' ? 'لا توجد طلبات معلقة' : 'الأرشيف فارغ'}
          </h3>
          <p className="text-slate-500">
            {activeTab === 'PENDING' ? 'تمت معالجة جميع الطلبات الحالية' : 'لا توجد طلبات مؤرشفة بعد'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayForms.map((form) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={form.id}
              onClick={() => onViewDetail(form)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-emerald-50 transition-colors">
                  <FileText className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{form.beneficiaryName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>{form.idNumber}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{form.submissionDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-left hidden sm:block">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(form.status)}`}>
                    {getStatusLabel(form.status)}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PENDING': return 'بانتظار المراجعة';
    case 'FIELD_REVIEW_PENDING': return 'بانتظار الزيارة الميدانية';
    case 'RELIEF_MANAGER_PENDING': return 'بانتظار مدير الإغاثة';
    case 'DIRECTOR_PENDING': return 'بانتظار مديرة البرامج';
    case 'COMPLETED': return 'مكتمل';
    default: return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-slate-100 text-slate-600';
    case 'FIELD_REVIEW_PENDING': return 'bg-amber-100 text-amber-700';
    case 'RELIEF_MANAGER_PENDING': return 'bg-indigo-100 text-indigo-700';
    case 'DIRECTOR_PENDING': return 'bg-purple-100 text-purple-700';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function BeneficiaryFormView({ onCancel, onSubmitSuccess }: { onCancel: () => void, onSubmitSuccess: () => void }) {
  const [formData, setFormData] = useState<Partial<BeneficiaryForm>>({
    beneficiaryName: '',
    address: '',
    idNumber: '',
    familyCount: 1,
    phone: '',
    isMainBreadwinner: true,
    maritalStatus: 'MARRIED',
    submissionDate: new Date().toISOString().split('T')[0],
    accessChannel: '[]',
    problemDescription: '[]',
    submitterName: '',
    submitterSignature: '',
    wifeName: '',
    wifeIdNumber: '',
    officeLocation: '',
    referralDetails: '',
    problemOther: '',
    medicalReports: '[]',
  });

  const [accessChannels, setAccessChannels] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [medicalFiles, setMedicalFiles] = useState<{name: string, data: string}[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedicalFiles(prev => [...prev, {
          name: file.name,
          data: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accessChannel: accessChannels,
          problemDescription: problems,
          medicalReports: medicalFiles,
        }),
      });
      if (res.ok) onSubmitSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">S</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">جمعية سنابل</h2>
            <p className="text-xs text-slate-500 font-medium">نظام ترشيح المستفيدين</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 font-medium">إلغاء</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1 */}
        <div className="card">
          <h3 className="section-title">أولاً: بيانات المستفيد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">الاسم الكامل</label>
              <input 
                required
                className="form-input" 
                value={formData.beneficiaryName} 
                onChange={e => setFormData({...formData, beneficiaryName: e.target.value})} 
              />
            </div>
            <div>
              <label className="form-label">مكان السكن</label>
              <input 
                required
                className="form-input" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
            <div>
              <label className="form-label">رقم الهوية</label>
              <input 
                required
                className="form-input" 
                value={formData.idNumber} 
                onChange={e => setFormData({...formData, idNumber: e.target.value})} 
              />
            </div>
            <div>
              <label className="form-label">عدد أفراد الأسرة</label>
              <input 
                required
                type="number"
                min="1"
                className="form-input" 
                value={formData.familyCount || ''} 
                onChange={e => setFormData({...formData, familyCount: e.target.value ? parseInt(e.target.value) : 0})} 
              />
            </div>
            <div>
              <label className="form-label">رقم التواصل</label>
              <input 
                required
                className="form-input" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div>
              <label className="form-label">المعيل الرئيسي للأسرة</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={formData.isMainBreadwinner} onChange={() => setFormData({...formData, isMainBreadwinner: true})} />
                  نعم
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!formData.isMainBreadwinner} onChange={() => setFormData({...formData, isMainBreadwinner: false})} />
                  لا
                </label>
              </div>
            </div>
            <div>
              <label className="form-label">الحالة الاجتماعية</label>
              <select 
                className="form-input"
                value={formData.maritalStatus}
                onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})}
              >
                <option value="SINGLE">أعزب</option>
                <option value="MARRIED">متزوج</option>
                <option value="WIDOWED">أرمل</option>
                <option value="DIVORCED">مطلق</option>
              </select>
            </div>
            <div>
              <label className="form-label">تاريخ تعبئة النموذج</label>
              <input 
                type="date"
                className="form-input" 
                value={formData.submissionDate} 
                onChange={e => setFormData({...formData, submissionDate: e.target.value})} 
              />
            </div>
          </div>

          {formData.maritalStatus === 'MARRIED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
              <div>
                <label className="form-label">اسم الزوجة</label>
                <input 
                  className="form-input" 
                  value={formData.wifeName} 
                  onChange={e => setFormData({...formData, wifeName: e.target.value})} 
                />
              </div>
              <div>
                <label className="form-label">رقم هوية الزوجة</label>
                <input 
                  className="form-input" 
                  value={formData.wifeIdNumber} 
                  onChange={e => setFormData({...formData, wifeIdNumber: e.target.value})} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2 */}
        <div className="card">
          <h3 className="section-title">ثانياً: قناة الوصول إلى الحالة</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {[
                'مراجعة المستفيد للمكتب',
                'زيارة ميدانية',
                'شكوى / مناشدة',
                'إحالة من جهة أخرى'
              ].map(channel => (
                <label key={channel} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                  <input 
                    type="checkbox" 
                    checked={accessChannels.includes(channel)}
                    onChange={e => {
                      if (e.target.checked) setAccessChannels([...accessChannels, channel]);
                      else setAccessChannels(accessChannels.filter(c => c !== channel));
                    }}
                  />
                  <span className="text-sm font-medium">{channel}</span>
                </label>
              ))}
            </div>
            
            {accessChannels.includes('مراجعة المستفيد للمكتب') && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                <label className="form-label">المكتب:</label>
                <div className="flex gap-4">
                  {['مكتب خانيونس', 'مكتب دير البلح', 'مكتب الشمال'].map(loc => (
                    <label key={loc} className="flex items-center gap-2">
                      <input type="radio" name="office" value={loc} onChange={e => setFormData({...formData, officeLocation: e.target.value})} />
                      {loc}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {accessChannels.includes('إحالة من جهة أخرى') && (
              <div className="mt-4">
                <label className="form-label">يرجى التحديد:</label>
                <input className="form-input" value={formData.referralDetails} onChange={e => setFormData({...formData, referralDetails: e.target.value})} />
              </div>
            )}
          </div>
        </div>

        {/* Section 3 */}
        <div className="card">
          <h3 className="section-title">ثالثاً: وصف مشكلة المستفيد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'ظروف صحية خطيرة أو مزمنة',
              'ظروف معيشية قاسية / عدم القدرة على تأمين الاحتياجات الأساسية',
              'فقدان مصدر الدخل أو انعدامه',
              'حالة طارئة أو إنسانية خاصة',
              'نزوح أو تضرر المسكن بسبب الأحداث',
              'عجز أو إعاقة تؤثر على القدرة على العمل',
              'أخرى'
            ].map(prob => (
              <label key={prob} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                <input 
                  type="checkbox" 
                  className="mt-1"
                  checked={problems.includes(prob)}
                  onChange={e => {
                    if (e.target.checked) setProblems([...problems, prob]);
                    else setProblems(problems.filter(p => p !== prob));
                  }}
                />
                <span className="text-sm font-medium leading-relaxed">{prob}</span>
              </label>
            ))}
          </div>
          {problems.includes('أخرى') && (
            <div className="mt-4">
              <label className="form-label">يرجى التوضيح:</label>
              <textarea className="form-input" rows={3} value={formData.problemOther} onChange={e => setFormData({...formData, problemOther: e.target.value})} />
            </div>
          )}
        </div>

        {/* Section 4: Medical Reports */}
        <div className="card">
          <h3 className="section-title">رابعاً: التقارير الطبية والمرفقات</h3>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-emerald-500 transition-all cursor-pointer bg-slate-50/50 group relative">
              <input 
                type="file" 
                multiple 
                accept="image/*,.pdf" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-bold text-slate-700">اضغط لرفع الصور والملفات</p>
                <p className="text-xs text-slate-500 mt-1">يمكنك اختيار أكثر من ملف (صور أو PDF)</p>
              </div>
            </div>

            {medicalFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {medicalFiles.map((file, idx) => (
                  <div key={idx} className="relative group bg-white border border-slate-200 rounded-xl p-2">
                    {file.data.startsWith('data:image') ? (
                      <img src={file.data} alt={file.name} className="w-full h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-slate-50 rounded-lg">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <p className="text-[10px] mt-1 truncate font-medium text-slate-500">{file.name}</p>
                    <button 
                      type="button"
                      onClick={() => setMedicalFiles(medicalFiles.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 5 */}
        <div className="card">
          <h3 className="section-title">خامساً: صحة المعلومات المسجلة أعلاه</h3>
          <p className="text-slate-600 mb-6 text-sm">أقرّ أنا مقدم هذه المناشدة بصحة المعلومات المقدمة، وأوافق على قيام فريق المؤسسة بزيارة ميدانية للتحقق من المعلومات المذكورة أعلاه.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">الاسم الكامل</label>
              <input required placeholder="أدخل الاسم الرباعي" className="form-input" value={formData.submitterName} onChange={e => setFormData({...formData, submitterName: e.target.value})} />
            </div>
            <div>
              <label className="form-label">التوقيع (اكتب اسمك)</label>
              <input required placeholder="اكتب اسمك هنا كإقرار" className="form-input italic font-serif" value={formData.submitterSignature} onChange={e => setFormData({...formData, submitterSignature: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pb-12">
          <button type="button" onClick={onCancel} className="px-8 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">إلغاء</button>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2">
            <Send className="w-5 h-5" />
            إرسال الطلب للمراجعة الميدانية
          </button>
        </div>
      </form>
    </div>
  );
}

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

function FormDetailView({ form, role, onBack, onUpdate }: { form: BeneficiaryForm, role: Role, onBack: () => void, onUpdate: () => void }) {
  const [updateData, setUpdateData] = useState<Partial<BeneficiaryForm>>({
    fieldVisitDate: new Date().toISOString().split('T')[0],
    fieldReport: '',
    fieldDecision: 'APPROVED',
    fieldAidType: '',
    fieldRejectionReason: '',
    fieldCoordinatorName: '',
    reliefManagerDecision: 'APPROVED',
    reliefManagerReason: '',
    reliefManagerSignature: '',
    reliefManagerName: '',
    directorApproval: 'APPROVED',
    directorReason: '',
    directorName: '',
    directorSignature: '',
    directorStamp: '',
    directorDate: new Date().toISOString().split('T')[0],
  });
  const [exportLang, setExportLang] = useState<'AR' | 'EN'>('AR');
  const [isExporting, setIsExporting] = useState(false);

  const medicalReports = Array.isArray(form.medicalReports) ? form.medicalReports : (typeof form.medicalReports === 'string' ? JSON.parse(form.medicalReports || '[]') : []);

  const handleAction = async (status: string, extraData: any = {}) => {
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extraData,
          status
        }),
      });
      if (res.ok) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('pdf-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`beneficiary-form-${form.id}-${exportLang}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const t = (ar: string, en: string) => exportLang === 'AR' ? ar : en;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">تفاصيل الطلب #{form.id}</h2>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="text-sm border border-slate-200 rounded-lg px-2 py-1"
            value={exportLang}
            onChange={(e) => setExportLang(e.target.value as 'AR' | 'EN')}
          >
            <option value="AR">العربية</option>
            <option value="EN">English</option>
          </select>
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50"
          >
            {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
          </button>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getStatusColor(form.status)}`}>
            {getStatusLabel(form.status)}
          </span>
        </div>
      </div>

      {/* Hidden PDF Content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <div id="pdf-content" className={`${exportLang === 'AR' ? 'rtl' : 'ltr'}`} style={{ width: '800px', minHeight: '1100px', padding: '60px 40px', backgroundColor: '#ffffff', color: '#0f172a', direction: exportLang === 'AR' ? 'rtl' : 'ltr', fontFamily: 'sans-serif', position: 'relative' }}>
          
          {/* Decorative Corner (Top Right) */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '40px', backgroundColor: '#2e7d32', borderRadius: '0 0 0 40px' }}></div>

          {/* Institution Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2e7d32', paddingBottom: '24px', marginBottom: '32px' }}>
            {form.institutionHeaderImage ? (
              <div style={{ width: '100%', height: '100px', display: 'flex', justifyContent: 'center' }}>
                <img src={form.institutionHeaderImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Institution Header" />
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#2e7d32', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>S</div>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#2e7d32' }}>{t('جمعية سنابل', 'Senabil Assoc.')}</h1>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: '#1565c0' }}>SENABIL ASSOCIATION</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{t('قطاع غزة - فلسطين', 'Gaza Strip - Palestine')}</p>
                </div>
                
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0', color: '#334155' }}>{t('نموذج ترشيح مستفيد', 'Beneficiary Nomination Form')}</h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{t('جمعية سنابل للإغاثة والتنمية', 'Senabil Association for Relief and Development')}</p>
                </div>

                <div style={{ textAlign: exportLang === 'AR' ? 'left' : 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{t('رقم الطلب', 'Form ID')}: {form.id}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>{t('التاريخ', 'Date')}: {form.submissionDate}</p>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Watermark Logo (Centered Background) */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03, fontSize: '150px', fontWeight: 'bold', pointerEvents: 'none', zIndex: 0 }}>SENABIL</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', zIndex: 1 }}>
              <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '4px' }}><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{t('الاسم الكامل', 'Full Name')}:</span> {form.beneficiaryName}</div>
              <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '4px' }}><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{t('رقم الهوية', 'ID Number')}:</span> {form.idNumber}</div>
              <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '4px' }}><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{t('مكان السكن', 'Address')}:</span> {form.address}</div>
              <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '4px' }}><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{t('رقم التواصل', 'Phone')}:</span> {form.phone}</div>
              <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '4px' }}><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{t('عدد أفراد الأسرة', 'Family Count')}:</span> {form.familyCount}</div>
              <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '4px' }}><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{t('الحالة الاجتماعية', 'Marital Status')}:</span> {form.maritalStatus}</div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', backgroundColor: '#f8fafc', zIndex: 1 }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '6px', margin: 0, color: '#2e7d32', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>{t('وصف المشكلة وقناة الوصول', 'Problem Description & Access Channel')}:</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>{t('قناة الوصول', 'Access Channel')}: {(typeof form.accessChannel === 'string' ? JSON.parse(form.accessChannel) : form.accessChannel).join(', ')}</p>
              <p style={{ fontSize: '13px', marginTop: '4px', margin: 0 }}>{t('المشكلة', 'Problem')}: {(typeof form.problemDescription === 'string' ? JSON.parse(form.problemDescription) : form.problemDescription).join(', ')}</p>
              {form.problemOther && <p style={{ fontSize: '13px', marginTop: '4px', margin: 0 }}>{form.problemOther}</p>}
            </div>

            {medicalReports.length > 0 && (
              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', zIndex: 1 }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: 0, color: '#2e7d32' }}>{t('التقارير الطبية والمرفقات', 'Medical Reports & Attachments')}:</h3>
                <ul style={{ fontSize: '12px', margin: 0, paddingRight: exportLang === 'AR' ? '20px' : '0', paddingLeft: exportLang === 'EN' ? '20px' : '0' }}>
                  {medicalReports.map((file: any, idx: number) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {form.fieldReport && (
              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', zIndex: 1 }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: 0, color: '#2e7d32' }}>{t('تقرير المنسق الميداني', 'Field Coordinator Report')} ({form.fieldVisitDate}):</h3>
                <p style={{ fontSize: '13px', margin: 0 }}>{form.fieldReport}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                  <span>{t('القرار', 'Decision')}: {form.fieldDecision === 'APPROVED' ? t('تم الاعتماد', 'Approved') : t('تم الرفض', 'Rejected')}</span>
                  {form.fieldDecision === 'APPROVED' ? (
                    <span>{t('شكل المساعدة', 'Aid Type')}: {form.fieldAidType}</span>
                  ) : (
                    <span style={{ color: '#e11d48' }}>{t('سبب الرفض', 'Rejection Reason')}: {form.fieldRejectionReason}</span>
                  )}
                </div>
                <p style={{ fontSize: '11px', marginTop: '4px', margin: 0 }}>{t('المنسق الميداني', 'Field Coordinator')}: {form.fieldCoordinatorName}</p>
              </div>
            )}

            {form.reliefManagerDecision && (
              <div style={{ border: '1px solid #c7d2fe', padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(238, 242, 255, 0.3)', zIndex: 1 }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #c7d2fe', paddingBottom: '4px', margin: 0, color: '#1565c0' }}>{t('مراجعة مدير برنامج الإغاثة', 'Relief Program Manager Review')}:</h3>
                <p style={{ fontSize: '13px', margin: 0 }}>{t('القرار', 'Decision')}: {form.reliefManagerDecision === 'APPROVED' ? t('تم الاعتماد', 'Approved') : t('تم الرفض', 'Rejected')}</p>
                <p style={{ fontSize: '13px', marginTop: '4px', margin: 0 }}>{t('السبب/التعليق', 'Reason/Comment')}: {form.reliefManagerReason}</p>
                <p style={{ fontSize: '11px', marginTop: '4px', margin: 0, fontStyle: 'italic' }}>{t('التوقيع', 'Signature')}: {form.reliefManagerSignature}</p>
              </div>
            )}

            {form.directorApproval && (
              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', backgroundColor: form.directorApproval === 'APPROVED' ? '#ecfdf5' : '#fff1f2', zIndex: 1 }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: 0, color: '#059669' }}>{t('قرار مديرة البرامج', 'Program Director Decision')}:</h3>
                <p style={{ fontSize: '13px', margin: 0 }}>{t('القرار', 'Decision')}: {form.directorApproval === 'APPROVED' ? t('معتمد نهائياً', 'Final Approval') : t('مرفوض', 'Rejected')}</p>
                <p style={{ fontSize: '13px', marginTop: '4px', margin: 0 }}>{t('السبب/التعليق', 'Reason/Comment')}: {form.directorReason}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '40px', zIndex: 1 }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px', position: 'relative' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '24px', margin: 0 }}>{t('مدير برنامج الإغاثة', 'Relief Program Manager')}</p>
                <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>{form.reliefManagerSignature}</p>
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px', position: 'relative' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '24px', margin: 0 }}>{t('مديرة البرامج', 'Program Director')}</p>
                <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>{form.directorSignature}</p>
                {form.directorStampImage ? (
                  <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%) rotate(-5deg)', width: '100px', height: '100px', pointerEvents: 'none' }}>
                    <img src={form.directorStampImage} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} alt="Official Stamp" />
                  </div>
                ) : form.directorStamp && (
                  <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%) rotate(-12deg)', width: '80px', height: '80px', border: '3px solid rgba(46, 125, 50, 0.3)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#2e7d32', fontWeight: 'bold', pointerEvents: 'none' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0 }}>{t('جمعية سنابل', 'Senabil Assoc.')}</p>
                      <p style={{ borderTop: '1px solid rgba(46, 125, 50, 0.3)', borderBottom: '1px solid rgba(46, 125, 50, 0.3)', margin: '1px 0' }}>{form.directorStamp}</p>
                      <p style={{ margin: 0 }}>{t('اعتماد المديرة', 'Director App.')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Decorative Curves & Info */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 40px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', fontSize: '10px', color: '#64748b' }}>
              <span>senabilcharity</span>
              <span>www.senabil-pal.org</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>pal-gaza@senabilcharity.org</div>
            {/* Bottom Curve */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '10px', backgroundColor: '#2e7d32', borderRadius: '0 10px 0 0' }}></div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Read-only sections 1-4 */}
        <div className="card bg-slate-50/50">
          <h3 className="section-title">بيانات المستفيد</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div><p className="text-slate-500">الاسم</p><p className="font-bold">{form.beneficiaryName}</p></div>
            <div><p className="text-slate-500">الهوية</p><p className="font-bold">{form.idNumber}</p></div>
            <div><p className="text-slate-500">السكن</p><p className="font-bold">{form.address}</p></div>
            <div><p className="text-slate-500">التواصل</p><p className="font-bold">{form.phone}</p></div>
            <div><p className="text-slate-500">أفراد الأسرة</p><p className="font-bold">{form.familyCount}</p></div>
            <div><p className="text-slate-500">المعيل</p><p className="font-bold">{form.isMainBreadwinner ? 'نعم' : 'لا'}</p></div>
            {form.maritalStatus === 'MARRIED' && (
              <>
                <div><p className="text-slate-500">اسم الزوجة</p><p className="font-bold">{form.wifeName || '-'}</p></div>
                <div><p className="text-slate-500">هوية الزوجة</p><p className="font-bold">{form.wifeIdNumber || '-'}</p></div>
              </>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-slate-500 mb-2">قناة الوصول:</p>
            <div className="flex flex-wrap gap-2">
              {(typeof form.accessChannel === 'string' ? JSON.parse(form.accessChannel) : form.accessChannel).map((c: string) => (
                <span key={c} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-medium">{c}</span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-slate-500 mb-2">المشكلة:</p>
            <div className="flex flex-wrap gap-2">
              {(typeof form.problemDescription === 'string' ? JSON.parse(form.problemDescription) : form.problemDescription).map((p: string) => (
                <span key={p} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-medium">{p}</span>
              ))}
            </div>
            {form.problemOther && <p className="mt-2 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">{form.problemOther}</p>}
          </div>

          {medicalReports.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-slate-500 mb-3">التقارير الطبية والمرفقات:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {medicalReports.map((file: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2 text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/10 transition-colors pointer-events-none"></div>
                    {file.data.startsWith('data:image') ? (
                      <div className="relative">
                        <img src={file.data} alt={file.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={file.data} 
                            download={file.name}
                            className="bg-white text-emerald-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                            title="تحميل الصورة"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-24 flex flex-col items-center justify-center bg-slate-50 rounded-lg mb-1 relative">
                        <FileText className="w-8 h-8 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-400">PDF / ملف</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={file.data} 
                            download={file.name}
                            className="bg-white text-emerald-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                            title="تحميل الملف"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] truncate text-slate-500 px-1">{file.name}</p>
                    <button 
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }
                      }}
                      className="text-[10px] text-emerald-600 font-bold mt-1 hover:underline"
                    >
                      فتح في نافذة جديدة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role-specific Action Sections */}
        
        {/* Section 5: Field Coordinator */}
        {role === 'FIELD_COORDINATOR' && form.status === 'FIELD_REVIEW_PENDING' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border-emerald-200 bg-emerald-50/30">
            <h3 className="section-title border-emerald-500">تقرير المنسق الميداني</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAction('RELIEF_MANAGER_PENDING', updateData); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">تاريخ الزيارة:</label>
                  <input type="date" required className="form-input" value={updateData.fieldVisitDate} onChange={e => setUpdateData({...updateData, fieldVisitDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">اسم المنسق الميداني:</label>
                  <input required className="form-input" value={updateData.fieldCoordinatorName} onChange={e => setUpdateData({...updateData, fieldCoordinatorName: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="form-label">تقرير الزيارة الميدانية:</label>
                <textarea required className="form-input" rows={4} value={updateData.fieldReport} onChange={e => setUpdateData({...updateData, fieldReport: e.target.value})} />
              </div>

              <div>
                <label className="form-label">قرار المنسق:</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-700">
                    <input required type="radio" name="fieldDecision" value="APPROVED" checked={updateData.fieldDecision === 'APPROVED'} onChange={() => setUpdateData({...updateData, fieldDecision: 'APPROVED'})} />
                    تم الاعتماد
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                    <input required type="radio" name="fieldDecision" value="REJECTED" checked={updateData.fieldDecision === 'REJECTED'} onChange={() => setUpdateData({...updateData, fieldDecision: 'REJECTED'})} />
                    تم الرفض
                  </label>
                </div>
              </div>

              {updateData.fieldDecision === 'APPROVED' ? (
                <div>
                  <label className="form-label">شكل المساعدة:</label>
                  <input required className="form-input" placeholder="مثلاً: طرد غذائي، مساعدة نقدية..." value={updateData.fieldAidType} onChange={e => setUpdateData({...updateData, fieldAidType: e.target.value})} />
                </div>
              ) : (
                <div>
                  <label className="form-label">سبب الرفض:</label>
                  <textarea required className="form-input" rows={2} value={updateData.fieldRejectionReason} onChange={e => setUpdateData({...updateData, fieldRejectionReason: e.target.value})} />
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all">إرسال لمدير برنامج الإغاثة</button>
            </form>
          </motion.div>
        )}

        {/* Section 6: Relief Manager */}
        {role === 'RELIEF_MANAGER' && form.status === 'RELIEF_MANAGER_PENDING' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border-amber-200 bg-amber-50/30">
            <h3 className="section-title border-amber-500">مراجعة مدير برنامج الإغاثة</h3>
            
            <div className="bg-white p-4 rounded-xl border border-amber-100 mb-6 text-sm">
              <p className="font-bold text-slate-700 mb-1">تقرير الميدان ({form.fieldVisitDate}):</p>
              <p className="text-slate-600 italic mb-2">"{form.fieldReport}"</p>
              <p className="font-bold text-emerald-600">القرار: {form.fieldDecision === 'APPROVED' ? `معتمد (${form.fieldAidType})` : `مرفوض (${form.fieldRejectionReason})`}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAction('DIRECTOR_PENDING', updateData); }} className="space-y-6">
              <div>
                <label className="form-label">قرار مدير الإغاثة:</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-700">
                    <input required type="radio" name="reliefDecision" value="APPROVED" checked={updateData.reliefManagerDecision === 'APPROVED'} onChange={() => setUpdateData({...updateData, reliefManagerDecision: 'APPROVED'})} />
                    اعتماد وإرسال للمديرة
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                    <input required type="radio" name="reliefDecision" value="REJECTED" checked={updateData.reliefManagerDecision === 'REJECTED'} onChange={() => setUpdateData({...updateData, reliefManagerDecision: 'REJECTED'})} />
                    رفض الطلب
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">السبب / التعليق:</label>
                <textarea required className="form-input" rows={3} value={updateData.reliefManagerReason} onChange={e => setUpdateData({...updateData, reliefManagerReason: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">اسم مدير الإغاثة:</label>
                  <input required className="form-input" value={updateData.reliefManagerName} onChange={e => setUpdateData({...updateData, reliefManagerName: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">التوقيع:</label>
                  <input required className="form-input italic" placeholder="توقيع إلكتروني" value={updateData.reliefManagerSignature} onChange={e => setUpdateData({...updateData, reliefManagerSignature: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold transition-all">إرسال لمديرة البرامج</button>
            </form>
          </motion.div>
        )}

        {/* Section 7: Program Director */}
        {role === 'PROGRAM_DIRECTOR' && form.status === 'DIRECTOR_PENDING' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border-purple-200 bg-purple-50/30">
            <h3 className="section-title border-purple-500">اعتماد مديرة البرامج</h3>
            
            <div className="bg-white p-4 rounded-xl border border-purple-100 mb-6 text-sm space-y-3">
              <div>
                <p className="font-bold text-slate-700">رأي مدير برنامج الإغاثة:</p>
                <p className="text-slate-600 italic">"{updateData.reliefManagerReason || form.reliefManagerReason}"</p>
                <p className={`font-bold ${form.reliefManagerDecision === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'}`}>القرار: {form.reliefManagerDecision === 'APPROVED' ? 'معتمد' : 'مرفوض'}</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAction('COMPLETED', updateData); }} className="space-y-6">
              <div>
                <label className="form-label">قرار الاعتماد النهائي:</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-700">
                    <input required type="radio" name="directorApp" value="APPROVED" checked={updateData.directorApproval === 'APPROVED'} onChange={() => setUpdateData({...updateData, directorApproval: 'APPROVED'})} />
                    معتمد نهائياً
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                    <input required type="radio" name="directorApp" value="REJECTED" checked={updateData.directorApproval === 'REJECTED'} onChange={() => setUpdateData({...updateData, directorApproval: 'REJECTED'})} />
                    غير معتمد
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">السبب / التعليق:</label>
                <textarea required className="form-input" rows={3} value={updateData.directorReason} onChange={e => setUpdateData({...updateData, directorReason: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">اسم مديرة البرامج:</label>
                  <input required className="form-input" value={updateData.directorName} onChange={e => setUpdateData({...updateData, directorName: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">التوقيع:</label>
                  <input required className="form-input italic" placeholder="توقيع إلكتروني" value={updateData.directorSignature} onChange={e => setUpdateData({...updateData, directorSignature: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">الختم:</label>
                  <input required className="form-input" placeholder="رقم الختم" value={updateData.directorStamp} onChange={e => setUpdateData({...updateData, directorStamp: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">تاريخ الاعتماد:</label>
                  <input required type="date" className="form-input" value={updateData.directorDate} onChange={e => setUpdateData({...updateData, directorDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border-2 border-dashed border-purple-200 rounded-xl bg-white">
                  <label className="form-label flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    رفع ترويسة المؤسسة (Header):
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setUpdateData({...updateData, institutionHeaderImage: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-2 text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {updateData.institutionHeaderImage && <img src={updateData.institutionHeaderImage} className="mt-2 h-16 object-contain border rounded" alt="Header Preview" />}
                </div>

                <div className="p-4 border-2 border-dashed border-purple-200 rounded-xl bg-white">
                  <label className="form-label flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    رفع صورة الختم الرسمي (Stamp):
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setUpdateData({...updateData, directorStampImage: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-2 text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {updateData.directorStampImage && <img src={updateData.directorStampImage} className="mt-2 h-16 w-16 object-contain border rounded-full" alt="Stamp Preview" />}
                </div>
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all">اعتماد نهائي وختم</button>
            </form>
          </motion.div>
        )}

        {/* Display previous steps if completed */}
        {form.status !== 'FIELD_REVIEW_PENDING' && (
          <div className="space-y-4 opacity-75">
            {form.fieldDecision && (
              <div className="p-4 bg-white rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  {form.fieldDecision === 'APPROVED' ? <CheckCircle2 className="text-emerald-500 w-5 h-5" /> : <XCircle className="text-rose-500 w-5 h-5" />}
                  <h4 className="font-bold">تقرير المنسق الميداني ({form.fieldVisitDate})</h4>
                </div>
                <p className="text-sm text-slate-600 mb-2">{form.fieldReport}</p>
                {form.fieldDecision === 'APPROVED' ? (
                  <p className="text-sm text-emerald-600 font-bold">المساعدة المقترحة: {form.fieldAidType}</p>
                ) : (
                  <p className="text-sm text-rose-600 font-bold">سبب الرفض: {form.fieldRejectionReason}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">بواسطة: {form.fieldCoordinatorName}</p>
              </div>
            )}
            {form.reliefManagerDecision && (
              <div className="p-4 bg-white rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  {form.reliefManagerDecision === 'APPROVED' ? <CheckCircle2 className="text-amber-500 w-5 h-5" /> : <XCircle className="text-rose-500 w-5 h-5" />}
                  <h4 className="font-bold">مراجعة مدير برنامج الإغاثة</h4>
                </div>
                <p className="text-sm text-slate-600 mb-1">{form.reliefManagerReason}</p>
                <div className="flex justify-between items-end text-xs text-slate-500">
                  <span>المدير: {form.reliefManagerName}</span>
                  <span>التوقيع: {form.reliefManagerSignature}</span>
                </div>
              </div>
            )}
            {form.directorApproval && (
              <div className={`p-4 rounded-xl border ${form.directorApproval === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {form.directorApproval === 'APPROVED' ? <CheckCircle2 className="text-emerald-600 w-5 h-5" /> : <XCircle className="text-rose-600 w-5 h-5" />}
                  <h4 className="font-bold">{form.directorApproval === 'APPROVED' ? 'تم الاعتماد النهائي' : 'تم الرفض النهائي'}</h4>
                </div>
                <p className="text-sm text-slate-700 mb-2">{form.directorReason}</p>
                <div className="flex justify-between items-end text-xs text-slate-500">
                  <span>المديرة: {form.directorName}</span>
                  <span>التاريخ: {form.directorDate}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
