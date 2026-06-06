/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Survey, Question, QuestionOption, Response, Answer, ResponseMetadata } from './types';
import { initializeDB, dbService, toUUID, generateId } from './lib/db';
import { AdminNavbar } from './components/AdminNavbar';
import { SurveyList } from './components/SurveyList';
import { SurveyEditor } from './components/SurveyEditor';
import { SurveyStats } from './components/SurveyStats';
import { UserSurveyForm } from './components/UserSurveyForm';
import {
  Sparkles,
  Inbox,
  ArrowRight,
  PlusCircle,
  Vote,
  Compass,
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  Lock,
  X,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

const formatToDateTimeString = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export default function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem('isAdminAuthenticated') !== 'false';
    }
    return true;
  });

  // Page Tabs: 'admin' workspace vs 'user' survey filling workspace
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>(() => {
    const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (queryParams && queryParams.has('survey')) {
      return 'user';
    }
    return 'admin';
  });

  // Flag indicating if the current user behaves as a real external survey respondent
  const [isSurveyRespondent, setIsSurveyRespondent] = useState<boolean>(() => {
    const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    return !!(queryParams && queryParams.has('survey'));
  });

  // Lock status modal and password
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Database core state
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);

  // Admin sub-navigation views: 'list' | 'edit' | 'stats'
  const [adminView, setAdminView] = useState<'list' | 'edit' | 'stats'>('list');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  // User tab state: Which survey is currently being filled
  const [userSelectedSurveyId, setUserSelectedSurveyId] = useState<string | null>(null);

  // Status message alerts toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const [dbStatus, setDbStatus] = useState<{
    isSupabase: boolean;
    schemaMissing: boolean;
    error?: string;
  }>({ isSupabase: false, schemaMissing: false });

  const [schoolName, setSchoolName] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('school_banner_text') || 'E-LAC';
    }
    return 'E-LAC';
  });

  const [schoolLogo, setSchoolLogo] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('school_url_or_base64_logo');
    }
    return null;
  });

  // Synchronize school branding, browser tab title and favicon dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && window.document) {
      document.title = `${schoolName} - Hệ thống Khảo sát & Ý kiến`;
      
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      if (schoolLogo) {
        link.href = schoolLogo;
      } else {
        link.href = '/favicon.ico';
      }
    }
  }, [schoolName, schoolLogo]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'school_banner_text') {
        setSchoolName(e.newValue || 'E-LAC');
      } else if (e.key === 'school_url_or_base64_logo') {
        setSchoolLogo(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Initialize and load database on mount
  useEffect(() => {
    initializeDB();

    const queryParams = new URLSearchParams(window.location.search);
    const surveyParamId = queryParams.get('survey');
    const adminParam = queryParams.get('admin');
    const viewParam = queryParams.get('view');
    const surveyIdParam = queryParams.get('surveyId');

    reloadDatabaseStates(viewParam === 'stats' ? surveyIdParam : null);

    if (adminParam === 'true') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setActiveTab('admin');
      setIsSurveyRespondent(false);
      
      // Clean query parameter silently from address bar for visual purity
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (surveyParamId) {
      setUserSelectedSurveyId(surveyParamId);
      setActiveTab('user');
      setIsSurveyRespondent(true);
    } else {
      // DEFAULT: Open Admin, clear respondent flag
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setActiveTab('admin');
      setIsSurveyRespondent(false);
    }
  }, []);

  const defaultQuestionTypes = [
    { id: 'YES_NO', name: 'Câu hỏi Có/Không (YES_NO)' },
    { id: 'TEXT', name: 'Câu hỏi Văn bản tự do (TEXT)' },
    { id: 'SINGLE_CHOICE', name: 'Trắc nghiệm chọn 1 đáp án (SINGLE_CHOICE)' },
    { id: 'MULTIPLE_CHOICE', name: 'Trắc nghiệm nhiều đáp án (MULTIPLE_CHOICE)' },
    { id: 'RATING', name: 'Thang điểm (1-5) (RATING)' }
  ];

  const reloadDatabaseStates = async (statsSurveyId: string | null = null) => {
    try {
      const res = await fetch("/api/db/state");
      const data = await res.json();

      // Synchronize branding configuration down from the server
      if (data.schoolName) {
        setSchoolName(data.schoolName);
        localStorage.setItem('school_banner_text', data.schoolName);
      }
      if (data.schoolLogo !== undefined) {
        setSchoolLogo(data.schoolLogo);
        if (data.schoolLogo) {
          localStorage.setItem('school_url_or_base64_logo', data.schoolLogo);
        } else {
          localStorage.removeItem('school_url_or_base64_logo');
        }
      }

      if (data.isSupabase) {
        if (data.schemaMissing) {
          setDbStatus({
            isSupabase: true,
            schemaMissing: true,
            error: data.error
          });
          // Fallback to local storage
          const localSurveys = dbService.getSurveys();
          setSurveys(localSurveys);
          setQuestions(dbService.getQuestions());
          setOptions(dbService.getOptions());
          setResponses(dbService.getResponses());
          setAnswers(dbService.getAnswers());
          setQuestionTypes(defaultQuestionTypes);

          if (statsSurveyId) {
            const tgt = localSurveys.find(s => s.id === statsSurveyId);
            if (tgt) {
              setSelectedSurvey(tgt);
              setAdminView('stats');
            }
          }
        } else {
          setDbStatus({
            isSupabase: true,
            schemaMissing: false
          });
          const fetchedSurveys = data.surveys || [];
          setSurveys(fetchedSurveys);
          setQuestions(data.questions || []);
          setOptions(data.options || []);
          setResponses(data.responses || []);
          setAnswers(data.answers || []);
          
          // Combine loaded DB question_types with any missing default types
          const dbTypes = data.question_types || [];
          const combinedTypes = [...dbTypes];
          defaultQuestionTypes.forEach(def => {
            if (!combinedTypes.some(ct => ct.id === def.id)) {
              combinedTypes.push(def);
            }
          });
          setQuestionTypes(combinedTypes);

          if (statsSurveyId) {
            const tgt = fetchedSurveys.find((s: Survey) => s.id === statsSurveyId);
            if (tgt) {
              setSelectedSurvey(tgt);
              setAdminView('stats');
            }
          }
        }
      } else {
        setDbStatus({
          isSupabase: false,
          schemaMissing: false,
          error: data.error
        });
        const localSurveys = dbService.getSurveys();
        setSurveys(localSurveys);
        setQuestions(dbService.getQuestions());
        setOptions(dbService.getOptions());
        setResponses(dbService.getResponses());
        setAnswers(dbService.getAnswers());
        setQuestionTypes(defaultQuestionTypes);

        if (statsSurveyId) {
          const tgt = localSurveys.find(s => s.id === statsSurveyId);
          if (tgt) {
            setSelectedSurvey(tgt);
            setAdminView('stats');
          }
        }
      }
    } catch (err: any) {
      console.warn("Could not load backend state, falling back to local database:", err);
      setDbStatus({
        isSupabase: false,
        schemaMissing: false,
        error: err.message
      });
      const localSurveys = dbService.getSurveys();
      setSurveys(localSurveys);
      setQuestions(dbService.getQuestions());
      setOptions(dbService.getOptions());
      setResponses(dbService.getResponses());
      setAnswers(dbService.getAnswers());
      setQuestionTypes(defaultQuestionTypes);

      if (statsSurveyId) {
        const tgt = localSurveys.find(s => s.id === statsSurveyId);
        if (tgt) {
          setSelectedSurvey(tgt);
          setAdminView('stats');
        }
      }
    }
  };

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- DATABASE MUTATION TRIGGERS WITH SUPABASE CLOUD & LOCAL FAIL-SAFES ---

  // Quick switch status (PUBLISHED / CLOSED)
  const handleToggleStatus = async (id: string, currentStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED') => {
    const freshStatus = currentStatus === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    const target = surveys.find(s => s.id === id);
    if (target) {
      const updated = { ...target, status: freshStatus };
      if (dbStatus.isSupabase && !dbStatus.schemaMissing) {
        try {
          const res = await fetch("/api/db/survey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ survey: updated })
          });
          if (!res.ok) throw new Error("Failed to save survey in Supabase");
        } catch (err: any) {
          console.error("Supabase toggle failed:", err);
        }
      }
      
      // Mirror locally
      dbService.saveSurvey(updated);
      await reloadDatabaseStates();
      
      showToast(
        freshStatus === 'CLOSED'
          ? 'Đã đóng nhận ý kiến của đợt khảo sát.'
          : 'Đã phát hành đợt khảo sát hoạt động đóng.',
        freshStatus === 'CLOSED' ? 'info' : 'success'
      );
    }
  };

  // Clone Survey core transaction trigger with full UUID mapping
  const handleCloneSurvey = async (id: string) => {
    try {
      const sourceSurvey = surveys.find(s => s.id === id);
      if (!sourceSurvey) throw new Error("Không tìm thấy đợt khảo sát gốc.");

      const sourceQs = questions.filter(q => q.survey_id === id);
      const sourceQIds = sourceQs.map(q => q.id);
      const sourceOpts = options.filter(o => sourceQIds.includes(o.question_id));

      const newSurveyId = generateId(); // dynamic uuid
      const clonedSurvey: Survey = {
        ...sourceSurvey,
        id: newSurveyId,
        title: `${sourceSurvey.title} (Bản sao)`,
        status: 'DRAFT',
        created_at: new Date().toISOString()
      };

      // Map question IDs to new UUIDs
      const qIdMap: Record<string, string> = {};
      const clonedQuestions: Question[] = sourceQs.map(q => {
        const newQId = generateId();
        qIdMap[q.id] = newQId;
        
        let meta = { ...q.metadata };
        return {
          ...q,
          id: newQId,
          survey_id: newSurveyId,
          metadata: meta
        };
      });

      // Post-process dependencies question translation
      clonedQuestions.forEach(q => {
        if (q.metadata && q.metadata.dependency) {
          const oldDepQid = q.metadata.dependency.question_id;
          const oldDepOptId = q.metadata.dependency.expected_option_id;
          const newDepQid = qIdMap[oldDepQid] || oldDepQid;
          
          q.metadata.dependency = {
            question_id: newDepQid,
            expected_option_id: oldDepOptId
          };
        }
      });

      // Map option IDs to new UUIDs
      const optIdMap: Record<string, string> = {};
      const clonedOptions: QuestionOption[] = sourceOpts.map(o => {
        const newOptId = generateId();
        optIdMap[o.id] = newOptId;
        return {
          ...o,
          id: newOptId,
          question_id: qIdMap[o.question_id] || o.question_id
        };
      });

      // Map expected option IDs in dependencies
      clonedQuestions.forEach(q => {
        if (q.metadata && q.metadata.dependency) {
          const oldDepOptId = q.metadata.dependency.expected_option_id;
          if (optIdMap[oldDepOptId]) {
            q.metadata.dependency.expected_option_id = optIdMap[oldDepOptId];
          }
        }
      });

      if (dbStatus.isSupabase && !dbStatus.schemaMissing) {
        // Save to Supabase
        const surveyRes = await fetch("/api/db/survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ survey: clonedSurvey })
        });
        if (!surveyRes.ok) throw new Error("Không thể lưu cấu hình nhân bản lên Supabase");

        const qosRes = await fetch("/api/db/questions-and-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyId: newSurveyId,
            questions: clonedQuestions,
            options: clonedOptions
          })
        });
        if (!qosRes.ok) throw new Error("Không thể lưu bộ câu hỏi nhân bản lên Supabase");
      }

      // Sync locally as backup
      dbService.saveSurvey(clonedSurvey);
      dbService.saveQuestionsAndOptions(newSurveyId, clonedQuestions, clonedOptions);

      await reloadDatabaseStates();
      showToast(`Nhân bản thành công đợt khảo sát! Bản nháp đã được lưu.`, 'success');
    } catch (err: any) {
      alert(`Lỗi nhân bản khảo sát: ${err.message}`);
    }
  };

  // Delete survey
  const handleDeleteSurvey = async (id: string) => {
    if (dbStatus.isSupabase && !dbStatus.schemaMissing) {
      try {
        const res = await fetch("/api/db/delete-survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        if (!res.ok) throw new Error("Failed to delete survey in Supabase");
      } catch (err: any) {
        console.error("Supabase delete failed:", err);
      }
    }
    
    // Delete locally
    dbService.deleteSurvey(id);
    await reloadDatabaseStates();
    showToast('Đã xóa vĩnh viễn đợt khảo sát và toàn bộ chuỗi phản hồi liên quan.', 'info');
  };

  // Save new survey or changes (within Editor)
  const handleSaveSurveyAndQuestions = async (surveyObj: Survey, quesList: Question[], optsList: QuestionOption[]) => {
    // Standardize ids with UUID formatting
    surveyObj.id = toUUID(surveyObj.id);
    const mappedQs = quesList.map(q => {
      const meta = { ...q.metadata };
      if (meta && meta.dependency) {
        const dOpt = meta.dependency.expected_option_id;
        const mappedDepOpt = (dOpt === 'YES' || dOpt === 'NO') ? dOpt : toUUID(dOpt);
        meta.dependency = {
          question_id: toUUID(meta.dependency.question_id),
          expected_option_id: mappedDepOpt
        };
      }
      return {
        ...q,
        id: toUUID(q.id),
        survey_id: surveyObj.id,
        metadata: meta
      };
    });
    const mappedOpts = optsList.map(o => ({ ...o, id: toUUID(o.id), question_id: toUUID(o.question_id) }));

    let isSavedToCloud = false;
    if (dbStatus.isSupabase && !dbStatus.schemaMissing) {
      try {
        const res1 = await fetch("/api/db/survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ survey: surveyObj })
        });
        if (!res1.ok) throw new Error("Cannot save survey metadata to Supabase");

        const res2 = await fetch("/api/db/questions-and-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyId: surveyObj.id,
            questions: mappedQs,
            options: mappedOpts
          })
        });
        if (!res2.ok) throw new Error("Cannot save questions and options to Supabase");
        isSavedToCloud = true;
      } catch (err: any) {
        console.error("Supabase saving error:", err);
        showToast("Chú ý: Không đồng bộ được lên Cloud. Đã sao lưu dữ liệu Ngoại tuyến (Offline) tại trình duyệt của bạn!", "info");
      }
    }

    // Always mirror locally
    dbService.saveSurvey(surveyObj);
    dbService.saveQuestionsAndOptions(surveyObj.id, mappedQs, mappedOpts);
    
    if (isSavedToCloud) {
      await reloadDatabaseStates();
    } else {
      // Offline fallback: load from local storage directly so we don't fetch stale cloud data
      setSurveys(dbService.getSurveys());
      setQuestions(dbService.getQuestions());
      setOptions(dbService.getOptions());
    }
    setAdminView('list');
    showToast('Đã phê chuẩn lưu trữ phân hệ câu hỏi khảo sát thành công!', 'success');
  };

  // Submit User responses
  const handleUserResponseSubmit = async (metadata: ResponseMetadata, answersList: { question_id: string; answer_text: string; option_id?: string }[]) => {
    if (!userSelectedSurveyId) return;

    if (dbStatus.isSupabase && !dbStatus.schemaMissing) {
      try {
        const res = await fetch("/api/db/submit-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyId: userSelectedSurveyId,
            metadata,
            userAnswers: answersList
          })
        });
        if (!res.ok) throw new Error("Gửi bài làm lên Supabase lỗi");
      } catch (err: any) {
        console.error("Supabase user response submission failed:", err);
      }
    }

    // Always mirror locally
    dbService.submitResponse(userSelectedSurveyId, metadata, answersList);
    await reloadDatabaseStates();
    showToast('Gửi ý kiến phản hồi khảo sát thành công!', 'success');
  };

  const handleResetDB = async () => {
    if (dbStatus.isSupabase && !dbStatus.schemaMissing) {
      try {
        const res = await fetch("/api/db/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error("Gặp lỗi khi đặt lại cơ sở dữ liệu trên Supabase Cloud");
      } catch (err: any) {
        console.error("Supabase reset database error:", err);
      }
    }

    // Reset locally
    dbService.resetToDefault();
    await reloadDatabaseStates();
    setAdminView('list');
    setUserSelectedSurveyId(null);
    showToast('Khôi phục cơ sở dữ liệu mẫu thành công.', 'info');
  };

  // Count reviews / answers for directories Map
  const responsesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    surveys.forEach(s => {
      map[s.id] = responses.filter(r => r.survey_id === s.id).length;
    });
    return map;
  }, [surveys, responses]);

  // Selected survey for filling
  const activeUserSurvey = useMemo(() => {
    if (!userSelectedSurveyId) return null;
    return surveys.find(s => s.id === userSelectedSurveyId) || null;
  }, [userSelectedSurveyId, surveys]);

  // Only show active surveys for users to choose unless checked via direct link
  const userVisibleSurveys = useMemo(() => {
    return surveys.filter(s => s.status === 'PUBLISHED');
  }, [surveys]);

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col text-slate-800">
      {/* Target Global header navigation */}
      <AdminNavbar
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        onSaveBrand={async (name, logo) => {
          setSchoolName(name);
          setSchoolLogo(logo);
          try {
            const resp = await fetch("/api/db/branding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, logo })
            });
            const resData = await resp.json();
            if (resData.success) {
              showToast("Cập nhật thương hiệu trường học thành công!", "success");
            }
          } catch (err) {
            console.error("Failed to save brand to server:", err);
            showToast("Lưu cấu hình lên máy chủ chưa thành công, đã lưu tạm ở trình duyệt.", "info");
          }
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDB={handleResetDB}
        isAdminAuthenticated={isAdminAuthenticated}
        isSurveyRespondent={isSurveyRespondent}
        dbStatus={dbStatus}
        onLogout={() => {
          setIsAdminAuthenticated(false);
          sessionStorage.removeItem('isAdminAuthenticated');
          setActiveTab('user');
          showToast('Đã đăng xuất khỏi cổng Quản trị.', 'info');
        }}
        onLoginClick={() => {
          setLoginPassword('');
          setLoginError('');
          setShowLoginModal(true);
        }}
      />

      {/* Main Container workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TOAST NOTIFICATION OVERLAY */}
         {toastMessage && (
           <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-slate-900 border border-slate-755 p-4 rounded-2xl text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
             <div className="bg-emerald-500 rounded-full p-1">
               <CheckCircle2 className="h-4 w-4 text-slate-950" />
             </div>
             <div>
               <p className="text-xs font-bold leading-tight">{toastMessage.text}</p>
             </div>
           </div>
         )}

         {/* tab 1: BACKOFFICE ADMIN WORKSPACE */}
         {activeTab === 'admin' && (
           <div className="space-y-6">
             {/* SQL Warning Notice for Supabase schema init */}
             {dbStatus.isSupabase && dbStatus.schemaMissing && (
               <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-md text-slate-850 space-y-4">
                 <div className="flex items-start space-x-4">
                   <div className="p-3 bg-amber-100 rounded-2xl border border-amber-200 text-amber-600 shrink-0">
                     <AlertTriangle className="h-6 w-6" />
                   </div>
                   <div className="space-y-2 flex-1">
                     <h3 className="font-sans font-extrabold text-base tracking-tight text-amber-950">
                       ⚠️ Chưa chạy mã SQL khởi tạo cơ sở dữ liệu Supabase!
                     </h3>
                     <p className="text-xs text-amber-800 leading-normal">
                       Hệ thống kết nối đến tài khoản dự án Supabase thành công nhưng chưa tìm thấy các bảng thông tin dữ liệu (<code>surveys</code>, <code>questions</code>, vv). Chúng tôi đang tự động chuyển hướng sử dụng <strong>Cơ sở dữ liệu cục bộ (LocalStorage)</strong> để không làm gián đoạn bài làm, nhưng dữ liệu này không được đồng bộ hóa đám mây.
                     </p>
                     <p className="text-xs font-bold text-amber-950">
                       Vui lòng truy cập Tab "SQL Editor" trong bảng điều khiển Supabase của bạn và chạy đoạn mã SQL tạo bảng dưới đây để hoàn tất cấu hình:
                     </p>
                   </div>
                 </div>
                 
                 <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] leading-relaxed max-h-56 overflow-y-auto shadow-inner relative group">
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="bg-slate-800 px-2.5 py-1 rounded text-[9px] font-bold text-slate-450">SQL Schema</span>
                   </div>
                   <pre className="whitespace-pre">{`CREATE TABLE public.surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  type character varying DEFAULT 'GENERAL'::character varying,
  status character varying DEFAULT 'DRAFT'::character varying,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  CONSTRAINT surveys_pkey PRIMARY KEY (id)
);

CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_type character varying NOT NULL,
  question_text text NOT NULL,
  is_required boolean DEFAULT false,
  order_number integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.question_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  order_number integer DEFAULT 1,
  CONSTRAINT question_options_pkey PRIMARY KEY (id)
);

CREATE TABLE public.responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE,
  submitted_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT responses_pkey PRIMARY KEY (id)
);

CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id uuid REFERENCES public.question_options(id) ON DELETE SET NULL,
  answer_text text,
  CONSTRAINT answers_pkey PRIMARY KEY (id)
);`}</pre>
                 </div>
                 <div className="text-[10px] text-amber-700 font-medium">
                   💡 Sau khi chạy xong đoạn mã trên, hãy tải lại trang này (F5). Hệ thống E-Survey sẽ tự động nhận diện và gieo mầm dữ liệu Seed mẫu hoàn chỉnh lên đám mây Supabase cho bạn ngay lập tức!
                 </div>
               </div>
             )}

             {/* List view */}
             {adminView === 'list' && (
               <SurveyList
                 surveys={surveys}
                 responsesCountMap={responsesCountMap}
                 onEdit={(srv) => {
                   setSelectedSurvey(srv);
                   setAdminView('edit');
                 }}
                 onClone={handleCloneSurvey}
                 onDelete={handleDeleteSurvey}
                 onToggleStatus={handleToggleStatus}
                 onViewStats={(srv) => {
                   setSelectedSurvey(srv);
                   setAdminView('stats');
                 }}
                 onSelectSurveyForUser={(id) => {
                   setUserSelectedSurveyId(id);
                   setActiveTab('user');
                 }}
                 onCreateNew={() => {
                   setSelectedSurvey(null);
                   setAdminView('edit');
                 }}
               />
             )}

             {/* Edit mode designer */}
             {adminView === 'edit' && (
               <SurveyEditor
                 survey={selectedSurvey}
                 questions={questions}
                 options={options}
                 onSave={handleSaveSurveyAndQuestions}
                 onCancel={() => setAdminView('list')}
                 questionTypes={questionTypes}
               />
             )}

             {/* Stats dashboard */}
             {adminView === 'stats' && selectedSurvey && (
               <SurveyStats
                 survey={selectedSurvey}
                 questions={questions}
                 options={options}
                 responses={responses}
                 answers={answers}
                 onBack={() => setAdminView('list')}
               />
             )}
           </div>
         )}

         {/* tab 2: END-USER GUEST FORM WORKSPACE */}
         {activeTab === 'user' && (
           <div className="space-y-6">
             {activeUserSurvey ? (
               <UserSurveyForm schoolLogo={schoolLogo} schoolName={schoolName}
                 survey={activeUserSurvey}
                 questions={questions}
                 options={options}
                 responses={responses}
                 onSubmit={handleUserResponseSubmit}
                 onCancel={() => {
                   // Clear search query param and reset select
                   window.history.replaceState({}, '', window.location.pathname);
                   setUserSelectedSurveyId(null);
                 }}
               />
             ) : (
               // Select Survey screen
               <div className="max-w-4xl mx-auto space-y-6">
                 {/* Intro Header */}
                 <div className="text-center space-y-3 py-6">
                   <div className="relative inline-flex items-center justify-center">
                     <div className="p-3.5 bg-gradient-to-tr from-teal-500 via-emerald-500 to-emerald-600 text-white rounded-2xl shadow-xl shadow-teal-500/10 border border-teal-100/20 flex items-center justify-center h-14 w-14 transform hover:scale-105 transition duration-300">
                       <ClipboardList className="h-7 w-7 text-white animate-pulse" />
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-1 rounded-full border-2 border-white shadow-md">
                       <Sparkles className="h-2.5 w-2.5 text-amber-950" />
                     </div>
                   </div>
                   <h2 className="font-sans font-extrabold text-2xl text-slate-800 tracking-tight">
                     Hệ thống Khảo sát ý kiến người học và doanh nghiệp
                   </h2>
                   <p className="text-slate-500 text-xs max-w-xl mx-auto">
                     Chọn đợt khảo sát để bắt đầu.
                   </p>
                 </div>

                 {/* List of published surveys */}
                 {userVisibleSurveys.length === 0 ? (
                   <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center space-y-4">
                     <Inbox className="h-12 w-12 text-slate-350 mx-auto stroke-1" />
                     <div>
                       <h3 className="font-sans font-bold text-slate-700 text-sm">Chưa có đợt khảo sát nào công bố</h3>
                       <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                         {isSurveyRespondent 
                          ? "Vui lòng liên hệ với Ban tổ chức hoặc Thầy cô phụ trách để được cấp liên kết khảo sát hoạt động."
                          : "Vui lòng truy cập \"Bàn làm việc Admin\" ở trên và chuyển trạng thái đợt sang \"Đang mở chạy (PUBLISHED)\" để người học làm khảo sát ý kiến."}
                       </p>
                     </div>
                     <button
                       onClick={() => setActiveTab('admin')}
                       className={`px-4 py-2 bg-slate-850 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition inline-flex items-center space-x-1.5 ${isSurveyRespondent ? 'hidden' : ''}`}
                     >
                       <LayoutDashboard className="h-3.5 w-3.5" />
                       <span>Về trang chủ Admin</span>
                     </button>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     {userVisibleSurveys.map(srv => (
                       <div
                         key={srv.id}
                         onClick={() => setUserSelectedSurveyId(srv.id)}
                         className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                       >
                         <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                               srv.type === 'TEACHING'
                                 ? 'bg-indigo-100 text-indigo-800'
                                 : srv.type === 'ALUMNI'
                                 ? 'bg-sky-100 text-sky-800'
                                 : 'bg-teal-100 text-teal-800'
                             }`}>
                               {srv.type === 'TEACHING'
                                 ? 'Đánh giá giảng dạy'
                                 : srv.type === 'ALUMNI'
                                 ? 'Khảo sát việc làm'
                                 : 'Ý kiến Doanh nghiệp'}
                             </span>
                             <span className="text-slate-400 font-mono text-[9px]">ID: {srv.id}</span>
                           </div>

                           <h3 className="font-sans font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition leading-snug">
                             {srv.title}
                           </h3>
                           <p className="text-slate-500 text-xs line-clamp-3">
                             {srv.description}
                           </p>
                         </div>

                         <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] text-slate-400.5 font-medium">
                           <span className="flex items-center gap-1">
                             <Calendar className="h-3.5 w-3.5" />
                             Hạn: {formatToDateTimeString(srv.end_date)}
                           </span>

                           <span className="flex items-center gap-0.5 text-indigo-600 font-bold group-hover:underline">
                             <span>Thực hiện khảo sát</span>
                             <ArrowRight className="h-3.5 w-3.5" />
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             )}
           </div>
         )}

      </main>

      {/* Target footer */}
      <footer className="bg-[#0a1931] border-t border-indigo-950/40 py-8 mt-12 print:hidden text-center text-slate-300 text-xs shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400">
            © 2026 E-LAC Platform. Thiết kế và phát triển từ đội ngũ chuyển đổ số Nhà trường.
          </p>
          <div className="flex items-center space-x-4">
            {isSurveyRespondent ? (
              <span className="text-[11px] text-teal-400 font-bold">
                Cổng Học viên Đóng góp Ý kiến
              </span>
            ) : !isAdminAuthenticated ? (
              <button
                onClick={() => {
                  setLoginPassword('');
                  setLoginError('');
                  setShowLoginModal(true);
                }}
                className="inline-flex items-center space-x-1.5 text-[11px] text-slate-400 hover:text-sky-300 hover:underline transition duration-150"
              >
                <Lock className="h-3 w-3 text-sky-500" />
                <span>Cổng Quản trị viên (Admin Portal)</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-500 font-bold flex items-center space-x-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[bounce_1s_infinite]"></span>
                <span>Chế độ: Đã kết nối Quản trị</span>
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* CUSTOM DIALOG: Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative animate-in zoom-in duration-200">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition duration-150"
            >
              <X className="h-5 w-5" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanPass = loginPassword.trim();
                if (cleanPass === 'admin' || cleanPass === 'admin123' || cleanPass === '123456') {
                  setIsAdminAuthenticated(true);
                  sessionStorage.setItem('isAdminAuthenticated', 'true');
                  setShowLoginModal(false);
                  setActiveTab('admin');
                  showToast('Đăng nhập thành công! Phân hệ Quản trị đã được mở khóa.', 'success');
                } else {
                  setLoginError('Mật khẩu quản trị chưa chính xác. Vui lòng thử "admin"');
                }
              }}
              className="space-y-4 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-650 text-white shadow-lg shadow-sky-500/10">
                <Lock className="h-6 w-6 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-lg text-slate-900 leading-snug tracking-tight">
                  Xác thực Quyền Quản trị
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed px-1">
                  Vui lòng nhập mật khẩu quản lý để thiết lập và thống kê khảo sát.
                </p>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  Mật khẩu truy cập
                </label>
                <input
                  type="password"
                  required
                  placeholder='Nhập mật khẩu (Gợi ý: "admin")'
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-505 outline-none transition"
                />
                
                {loginError && (
                  <p className="text-[10.5px] text-rose-500 font-semibold animate-[shake_0.5s_ease-in-out]">
                    ⚠️ {loginError}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-150"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition duration-150 shadow-md shadow-sky-500/10"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
