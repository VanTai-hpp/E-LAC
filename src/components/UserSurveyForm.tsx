/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Survey, Question, QuestionOption, Response, ResponseMetadata } from '../types';
import { generateId } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  FileText,
  User,
  Check,
  Building,
  GraduationCap,
  Camera,
  Sparkles,
  X
} from 'lucide-react';

interface UserSurveyFormProps {
  survey: Survey;
  questions: Question[];
  options: QuestionOption[];
  responses: Response[];
  onSubmit: (metadata: ResponseMetadata, answers: { question_id: string; answer_text: string; option_id?: string }[]) => void;
  onCancel: () => void;
  schoolLogo?: string | null;
  schoolName?: string;
}

export const UserSurveyForm: React.FC<UserSurveyFormProps> = ({
  survey,
  questions,
  options,
  responses,
  onSubmit,
  onCancel,
  schoolLogo,
  schoolName
}) => {
  // --- LOAD SURVEY-SPECIFIC QUESTIONS ---
  const surveyQuestions = useMemo(() => {
    return questions
      .filter(q => q.survey_id === survey.id)
      .sort((a, b) => a.order_number - b.order_number);
  }, [questions, survey.id]);

  // Split into Part 2 Parameter questions and Part 3 Content questions
  const parameterQuestions = useMemo(() => {
    return surveyQuestions.filter(q => q.metadata?.is_parameter === true);
  }, [surveyQuestions]);

  const mainQuestions = useMemo(() => {
    return surveyQuestions.filter(q => q.metadata?.is_parameter !== true);
  }, [surveyQuestions]);

  // --- ANSWERS AND VALIDATION STATES ---
  // Store answers by Question ID
  const [answersState, setAnswersState] = useState<Record<string, { answer_text: string; option_id?: string }>>({});
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- CUSTOMIZABLE SURVEY HERO BANNER STATE ---
  const [bannerImage, setBannerImage] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('school_survey_banner_image') || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80';
    }
    return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80';
  });
  const [bannerBadgeText, setBannerBadgeText] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('school_survey_banner_badge') || 'Khảo sát Học viên';
    }
    return 'Khảo sát Học viên';
  });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState(bannerImage);
  const [tempBadgeText, setTempBadgeText] = useState(bannerBadgeText);

  const isAdminAuthenticated = useMemo(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem('isAdminAuthenticated') === 'true';
    }
    return false;
  }, []);

  const handleSaveBanner = () => {
    if (tempBannerUrl.trim()) {
      localStorage.setItem('school_survey_banner_image', tempBannerUrl.trim());
      setBannerImage(tempBannerUrl.trim());
    } else {
      localStorage.removeItem('school_survey_banner_image');
      setBannerImage('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80');
    }
    localStorage.setItem('school_survey_banner_badge', tempBadgeText.trim() || 'Khảo sát Học viên');
    setBannerBadgeText(tempBadgeText.trim() || 'Khảo sát Học viên');
    setShowBannerModal(false);
  };

  // Get options for a given question
  const getQuestionOptions = (qid: string) => {
    return options.filter(o => o.question_id === qid).sort((a, b) => a.order_number - b.order_number);
  };

  // Helper to update text answers
  const handleUpdateTextAnswer = (qid: string, textValue: string) => {
    setAnswersState(prev => ({
      ...prev,
      [qid]: { answer_text: textValue }
    }));
    setErrorMessage(null);
  };

  // Helper to update selection answers (YES_NO or SINGLE_CHOICE)
  const handleUpdateSelectAnswer = (qid: string, valueStr: string, optId?: string) => {
    setAnswersState(prev => ({
      ...prev,
      [qid]: {
        answer_text: valueStr,
        option_id: optId
      }
    }));
    setErrorMessage(null);
  };

  // Check if all required Part 2 parameters have been filled
  const isPart2Completed = useMemo(() => {
    for (const q of parameterQuestions) {
      if (q.is_required) {
        const ans = answersState[q.id];
        if (!ans || !ans.answer_text.trim()) {
          return false;
        }
      }
    }
    return true;
  }, [parameterQuestions, answersState]);

  // Determine currently visible Part 3 questions based on JavaScript Branching logic
  const visibleMainQuestions = useMemo(() => {
    return mainQuestions.filter(q => {
      const dep = q.metadata?.dependency;
      if (!dep) return true; // Default: visible

      const parentQId = dep.question_id;
      const expectedOptId = dep.expected_option_id;

      const parentAnswer = answersState[parentQId];
      if (!parentAnswer) return false;

      // YES_NO matches exact standard code (e.g. 'YES' / 'NO')
      // SINGLE_CHOICE matches the option ID
      if (parentAnswer.option_id) {
        return parentAnswer.option_id === expectedOptId;
      }
      return parentAnswer.answer_text === expectedOptId;
    });
  }, [mainQuestions, answersState]);

  // --- SUBMIT HANDLING ---
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verify Part 2 first
    if (!isPart2Completed) {
      setErrorMessage('Vui lòng hoàn thiện tất cả các thông tin yêu cầu ở Phần 2 trước khi tiếp tục.');
      return;
    }

    // 2. Verify visible required questions in Part 3
    for (const q of visibleMainQuestions) {
      if (q.is_required) {
        const ans = answersState[q.id];
        if (!ans || (!ans.answer_text.trim() && !ans.option_id)) {
          setErrorMessage(`Vui lòng trả lời câu hỏi bắt buộc: "${q.question_text}"`);
          return;
        }
      }
    }

    // --- INTERPRET RETRIEVED VALUES TO FLATTEN METADATA FOR BACK-COMPAT AND FILTERS ---
    // Extract labels to standard columns dynamically
    const legacyMetadata: ResponseMetadata = {};
    parameterQuestions.forEach(q => {
      const ans = answersState[q.id];
      if (!ans) return;

      const text = q.question_text.toLowerCase();
      const val = ans.answer_text;

      if (text.includes('lớp') || text.includes('class')) {
        legacyMetadata.class_name = val;
      } else if (text.includes('môn') || text.includes('học phần') || text.includes('subject')) {
        legacyMetadata.subject_name = val;
      } else if (text.includes('giảng viên') || text.includes('giáo viên') || text.includes('teacher')) {
        legacyMetadata.teacher_name = val;
      } else if (text.includes('mã số sinh viên') || text.includes('mssv') || text.includes('hssv') || text.includes('student_id')) {
        legacyMetadata.student_id = val;
      } else if (text.includes('tên') || text.includes('họ và tên') || text.includes('name')) {
        legacyMetadata.fullname = val;
      } else if (text.includes('điện thoại') || text.includes('sđt') || text.includes('phone')) {
        legacyMetadata.phone = val;
      } else if (text.includes('doanh nghiệp') || text.includes('công ty') || text.includes('company')) {
        legacyMetadata.company_name = val;
      } else if (text.includes('thuế') || text.includes('tax')) {
        legacyMetadata.tax_code = val;
      } else if (text.includes('đại diện') || text.includes('rep')) {
        legacyMetadata.representative = val;
      } else if (text.includes('địa chỉ') || text.includes('address')) {
        legacyMetadata.company_address = val;
      }
    });

    // Handle single choice job status if present for Alumni back-compat
    const alumniJobAns = answersState['S2_Q_JOB'];
    if (alumniJobAns) {
      legacyMetadata.job_status = alumniJobAns.option_id === 'S2_OP_JOB_YES' ? 'Có' : 'Không';
    }

    // 3. Prevent multiple submissions if not allowed
    if (survey.metadata.allow_multiple_responses === false) {
      // Find matches across existing responses for the current parameter values
      const isDuplicate = responses.some(res => {
        if (res.survey_id !== survey.id) return false;

        // Check if metadata identifiers are identical
        if (legacyMetadata.student_id && res.metadata.student_id === legacyMetadata.student_id) {
          return true;
        }
        if (legacyMetadata.tax_code && res.metadata.tax_code === legacyMetadata.tax_code) {
          return true;
        }
        // Match standard compound fields if specific keys aren't preset
        if (legacyMetadata.fullname && res.metadata.fullname === legacyMetadata.fullname && res.metadata.class_name === legacyMetadata.class_name) {
          return true;
        }
        return false;
      });

      if (isDuplicate) {
        setErrorMessage('Nhận dạng trùng lặp: Biểu mẫu khảo sát này giới hạn mỗi cá nhân/đơn vị nộp ý kiến tối đa 1 lần.');
        return;
      }
    }

    // Assemble absolute answers array
    const compiledAnswers: { question_id: string; answer_text: string; option_id?: string }[] = [];

    // Save parameter answers
    parameterQuestions.forEach(q => {
      const ans = answersState[q.id];
      if (ans) {
        compiledAnswers.push({
          question_id: q.id,
          answer_text: ans.answer_text,
          option_id: ans.option_id
        });
      }
    });

    // Save main questions answers only from VISIBLE conditional list
    visibleMainQuestions.forEach(q => {
      const ans = answersState[q.id];
      if (ans) {
        compiledAnswers.push({
          question_id: q.id,
          answer_text: ans.answer_text,
          option_id: ans.option_id
        });
      }
    });

    try {
      onSubmit(legacyMetadata, compiledAnswers);
      setSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(`Lỗi gửi khảo sát: ${err.message}`);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 transition animate-fade-in text-center">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl space-y-6">
          <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600 mb-2">
            <CheckCircle className="h-10 w-10 animate-scale-up" />
          </div>

          <div className="space-y-3">
            <h3 className="font-sans font-black text-lg sm:text-xl text-slate-900 px-2 leading-snug">
              {survey.metadata?.success_message 
                ? survey.metadata.success_message 
                : "Cảm ơn bạn đã hoàn thành khảo sát, chúc bạn thành công!"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto pt-1 leading-relaxed">
              Hệ thống đã ghi nhận phiếu đóng góp trực tuyến thành công của bạn vào dữ liệu bảo mật trường.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            Quay lại danh sách đợt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Return buttons */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center space-x-1 py-1.5 px-3 bg-white text-slate-600 hover:text-slate-800 border border-slate-200/50 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Trở về Danh mục</span>
      </button>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* ==========================================
            REGION 1: GENERAL SURVEY HERO
            ========================================== */}
        <div className="relative rounded-2xl h-[170px] sm:h-[190px] w-full overflow-hidden shadow-md border border-slate-100 flex flex-col justify-center items-center text-center px-4 sm:px-6">
          {/* Background image & opacity dark overlay */}
          <img 
            src={bannerImage} 
            alt="Survey Hero Banner" 
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/55" />

          {/* Core branding content */}
          <div className="relative z-10 max-w-2xl select-none space-y-1 sm:space-y-1.5 px-4 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-2 sm:mb-2.5 animate-pulse">
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-3.5 h-3.5 object-contain rounded-full bg-white/20 p-0.5" referrerPolicy="no-referrer" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              )}
              <span className="text-[10px] font-black uppercase text-white tracking-widest">{bannerBadgeText}</span>
            </div>
            <h2 className="font-sans font-black text-white text-base sm:text-xl lg:text-2xl tracking-tight leading-snug drop-shadow-md">
              {survey.title}
            </h2>
            <p className="text-white/90 text-[11px] sm:text-xs leading-relaxed max-w-xl font-medium drop-shadow-xs">
              {survey.description}
            </p>
          </div>

          {/* Admin customizable button */}
          {isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setTempBannerUrl(bannerImage);
                setTempBadgeText(bannerBadgeText);
                setShowBannerModal(true);
              }}
              className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-lg border border-slate-800 transition duration-150 backdrop-blur-xs cursor-pointer"
              title="Click để thay ảnh nền & chữ nhãn đóng dấu"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span>Thay đổi Banner & Nhãn</span>
            </button>
          )}
        </div>

        {/* CUSTOM DIALOG: Survey Hero Banner Customizer */}
        {showBannerModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
              <button
                type="button"
                onClick={() => setShowBannerModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition duration-150"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h3 className="font-sans font-extrabold text-base text-slate-900 leading-snug tracking-tight">
                    Cấu hình Banner & Nhãn Khảo sát
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cá nhân hóa ảnh bìa dã ngoại thiên nhiên và chữ nhãn đóng chip nổi bật
                  </p>
                </div>

                {/* Micro Preview Box */}
                <div className="relative rounded-xl h-[105px] w-full overflow-hidden shadow-inner border border-slate-200">
                  <img 
                    src={tempBannerUrl} 
                    alt="Preview Hero" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/50" />
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-3 space-y-1">
                    <span className="text-[8px] uppercase font-bold text-teal-300 tracking-wider px-2 py-0.5 bg-white/10 rounded-full border border-white/10">{tempBadgeText || 'Khảo sát Học viên'}</span>
                    <p className="font-sans font-extrabold text-white text-xs truncate max-w-xs">{survey.title}</p>
                  </div>
                </div>

                {/* Input section for Badge text */}
                <div className="space-y-1.5">
                  <label htmlFor="badge-text-input" className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Chữ nhãn đóng dấu (VD: Khảo sát Học viên, Ý kiến sinh viên)
                  </label>
                  <input
                    id="badge-text-input"
                    type="text"
                    value={tempBadgeText}
                    onChange={(e) => setTempBadgeText(e.target.value)}
                    placeholder="VD: Khảo sát Học viên"
                    maxLength={30}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                {/* Preset List */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Gợi ý hình ảnh (Đóng góp ngoại khóa & thiên nhiên)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        name: 'Thảo luận ngoài trời',
                        desc: 'Sinh viên học nhóm trên cỏ',
                        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
                      },
                      {
                        name: 'Ngoại khóa Đồi thông',
                        desc: 'Hoạt động dã ngoại rừng thông',
                        url: 'https://images.unsplash.com/photo-1520110120185-609e4e4e0c95?auto=format&fit=crop&w=1200&q=80'
                      },
                      {
                        name: 'Sinh viên & Sách dã dã',
                        desc: 'Campus cỏ xanh tươi',
                        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80'
                      },
                      {
                        name: 'Đêm lửa trại guitar',
                        desc: 'Giao lưu sinh viên về đêm',
                        url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80'
                      }
                    ].map((preset, pIdx) => (
                      <button
                        type="button"
                        key={pIdx}
                        onClick={() => setTempBannerUrl(preset.url)}
                        className={`p-2 rounded-xl text-left border text-xs transition duration-200 outline-none hover:bg-slate-50 relative ${
                          tempBannerUrl === preset.url
                            ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <p className="font-semibold text-slate-800">{preset.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{preset.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input section URL */}
                <div className="space-y-1.5">
                  <label htmlFor="banner-url-input" className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Nhập URL ảnh tự chọn (Hỗ trợ GIF / Động)
                  </label>
                  <input
                    id="banner-url-input"
                    type="text"
                    value={tempBannerUrl}
                    onChange={(e) => setTempBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.gif"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                {/* Bot Actions */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempBannerUrl('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80');
                      setTempBadgeText('Khảo sát Học viên');
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition duration-150"
                  >
                    Mặc định
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setShowBannerModal(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-150"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBanner}
                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition duration-150 shadow-md shadow-teal-500/10"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            REGION 2: PARAMETER CONFIGURATION (is_parameter: true)
            ========================================== */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h4 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="h-4.5 w-4.5 text-sky-500" />
            <span>PHẦN 2: THÔNG TIN CHUNG</span>
          </h4>

          {parameterQuestions.length === 0 ? (
            <p className="text-xs italic text-slate-400">Không yêu cầu thông tin định danh nào cho đợt khảo sát này.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parameterQuestions.map(q => {
                const qOptions = getQuestionOptions(q.id);
                const currentAns = answersState[q.id]?.answer_text || '';

                return (
                  <div key={q.id} className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-bold block">
                      {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
                    </label>

                    {/* TEXTBOX PARAMETER */}
                    {(q.question_type === 'TEXT' || q.question_type === 'text') && (
                      <input
                        type="text"
                        value={currentAns}
                        onChange={(e) => handleUpdateTextAnswer(q.id, e.target.value)}
                        required={q.is_required}
                        placeholder="Vui lòng điền thông tin..."
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-hidden transition"
                      />
                    )}

                    {/* SELECT BOX PARAMETER (Dropdown) */}
                    {(q.question_type === 'SINGLE_CHOICE' || q.question_type === 'radio') && (
                      <select
                        value={currentAns}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selectedOpt = qOptions.find(o => o.option_text === val);
                          handleUpdateSelectAnswer(q.id, val, selectedOpt?.id);
                        }}
                        required={q.is_required}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-hidden transition appearance-none"
                      >
                        <option value="">-- Chọn một tùy chọn --</option>
                        {qOptions.map(opt => (
                          <option key={opt.id} value={opt.option_text}>
                            {opt.option_text}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error notifications */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2.5 animate-bounce">
            <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* ==========================================
            REGION 3: MAIN QUESTION SET (is_parameter: false)
            ========================================== */}
        <AnimatePresence>
          {!isPart2Completed ? (
            /* Locked Content state until Part 2 is filled */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-100 border border-dashed border-slate-250 p-8 rounded-2xl text-center space-y-3"
            >
              <HelpCircle className="h-8 w-8 text-slate-400 mx-auto" />
              <div>
                <h5 className="font-sans font-bold text-slate-700 text-xs uppercase tracking-wider">Phần 3 đang bị khóa</h5>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Bạn bắt buộc phải hoàn tất điền toàn bộ thông tin định danh ở **Phần 2** để mở khóa và làm bộ câu hỏi ý kiến phản hồi chính thức.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Active Questions Panel */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <h4 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Phần 3: Bộ Câu hỏi Đánh giá & Góp ý</span>
                </h4>
                <p className="text-[10px] text-slate-400">Xin vui lòng trả lời các câu hỏi hiển thị dưới đây:</p>
              </div>

              {/* Loop of visual interactive questions grouped in a single unified card container */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                <AnimatePresence initial={false}>
                  {visibleMainQuestions.map((q, qIndex) => {
                    const qOptions = getQuestionOptions(q.id);
                    const currentAns = answersState[q.id];
                    const isEven = qIndex % 2 === 0;
                    const bgClass = isEven ? 'bg-white/50' : 'bg-slate-50/30';

                    return (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className={`${bgClass} p-6 sm:p-7 transition duration-150 space-y-4 overflow-hidden`}
                      >
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-indigo-650 bg-indigo-50/80 px-2 py-0.5 rounded-md tracking-wider inline-block">CÂU HỎI {qIndex + 1}</span>
                          <p className="text-xs sm:text-sm text-slate-800 font-bold leading-normal">
                            {q.question_text} {q.is_required && <span className="text-rose-500 font-black">*</span>}
                          </p>
                        </div>

                        {/* --- QUESTION TYPE RENDERERS --- */}

                        {/* 1. YES_NO RANGE */}
                        {(q.question_type === 'YES_NO' || q.question_type === 'radio') && (
                          <div className="grid grid-cols-2 gap-3.5 mt-2 max-w-sm">
                            <button
                              type="button"
                              onClick={() => handleUpdateSelectAnswer(q.id, 'YES')}
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition duration-200 cursor-pointer ${
                                currentAns?.answer_text === 'YES'
                                  ? 'bg-emerald-50/90 border-emerald-555 text-emerald-800 font-extrabold shadow-xxs scale-[1.01]'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <span className="text-xl mb-1 filter drop-shadow-xxs">👍</span>
                              <span className="text-[11px] font-bold">Đúng / Đồng ý</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSelectAnswer(q.id, 'NO')}
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition duration-200 cursor-pointer ${
                                currentAns?.answer_text === 'NO'
                                  ? 'bg-rose-50/90 border-rose-500 text-rose-800 font-extrabold shadow-xxs scale-[1.01]'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <span className="text-xl mb-1 filter drop-shadow-xxs">👎</span>
                              <span className="text-[11px] font-bold">Sai / Không đồng ý</span>
                            </button>
                          </div>
                        )}

                        {/* 2. TEXT AREA */}
                        {(q.question_type === 'TEXT' || q.question_type === 'text') && (
                          <textarea
                            value={currentAns?.answer_text || ''}
                            onChange={(e) => handleUpdateTextAnswer(q.id, e.target.value)}
                            rows={3}
                            required={q.is_required}
                            placeholder="Ghi ý kiến bình luận của bạn tại đây..."
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden transition"
                          />
                        )}

                        {/* 3. SINGLE CHOICE */}
                        {q.question_type === 'SINGLE_CHOICE' && (
                          <div className="grid grid-cols-1 gap-2 mt-1">
                            {qOptions.map(opt => {
                              const isChecked = currentAns?.option_id === opt.id;
                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => handleUpdateSelectAnswer(q.id, opt.option_text, opt.id)}
                                  className={`px-3.5 py-2 rounded-lg text-left text-xs font-semibold border transition flex items-center space-x-2 ${
                                    isChecked
                                      ? 'bg-indigo-50/70 border-indigo-500 text-indigo-800'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className={`h-4 w-4 shrink-0 rounded-full border border-slate-300 flex items-center justify-center ${
                                    isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white'
                                  }`}>
                                    {isChecked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </span>
                                  <span className="leading-snug">{opt.option_text}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 4. MULTIPLE CHOICE */}
                        {(q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'checkbox') && (
                          <div className="grid grid-cols-1 gap-2 mt-1">
                            <p className="text-[10px] italic text-slate-400">Chọn tối thiểu 1 lựa chọn</p>
                            {qOptions.map(opt => {
                              const isChecked = currentAns?.option_id === opt.id; // Single selection simulated or map multiple if wanted
                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => handleUpdateSelectAnswer(q.id, opt.option_text, opt.id)}
                                  className={`px-3.5 py-2 rounded-lg text-left text-xs font-semibold border transition flex items-center space-x-2 ${
                                    isChecked
                                      ? 'bg-indigo-50/70 border-indigo-500 text-indigo-800'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className={`h-4 w-4 shrink-0 rounded-sm border border-slate-300 flex items-center justify-center ${
                                    isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white'
                                  }`}>
                                    {isChecked && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                  <span className="leading-snug">{opt.option_text}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 5. RATING RANGES */}
                        {(q.question_type === 'rating' || q.question_type === 'RATING') && (
                          <div className="flex items-center space-x-2 mt-1">
                            {[1, 2, 3, 4, 5].map((num) => {
                              const isSelected = currentAns?.answer_text === String(num);
                              return (
                                <button
                                  type="button"
                                  key={num}
                                  onClick={() => handleUpdateSelectAnswer(q.id, String(num))}
                                  className={`h-9 w-9 rounded-lg text-xs font-bold text-center border transition flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-amber-50 border-amber-500 text-amber-700 font-extrabold shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {num}★
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Submit panel trigger */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <span className="text-[11px] text-slate-400.5 font-medium">Bấm nộp để gửi ý kiến khảo sát chính thức.</span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-lg transition flex items-center space-x-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Hoàn thành & Gửi khảo sát</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
