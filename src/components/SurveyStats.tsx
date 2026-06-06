/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Survey, Question, QuestionOption, Response, Answer } from '../types';
import {
  ArrowLeft,
  Download,
  Printer,
  Inbox,
  Filter,
  Users,
  Calendar,
  Layers,
  BarChart2,
  ListFilter,
  Sparkles,
  Settings,
  Eye,
  CheckCircle,
  FileText,
  Copy,
  PenTool,
  Check,
  RefreshCw,
  Sliders,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  CheckSquare,
  Square,
  FileCheck
} from 'lucide-react';

interface SurveyStatsProps {
  survey: Survey;
  questions: Question[];
  options: QuestionOption[];
  responses: Response[];
  answers: Answer[];
  onBack: () => void;
}

// Custom lightweight Markdown Renderer for elegant AI response rendering without packages
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-3.5 text-slate-700 text-sm leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-3.5" />;

        // Match headers
        if (trimmed.startsWith('#')) {
          const depth = trimmed.match(/^#+/)?.[0].length || 1;
          const text = trimmed.replace(/^#+\s*/, '');
          if (depth === 1) {
            return <h1 key={idx} className="text-xl font-extrabold text-slate-900 border-b border-indigo-100 pb-1.5 pt-3">{text}</h1>;
          } else if (depth === 2) {
            return <h2 key={idx} className="text-base font-black text-slate-800 pt-2">{text}</h2>;
          } else {
            return <h3 key={idx} className="text-sm font-bold text-slate-800 pt-1.5">{text}</h3>;
          }
        }

        // Match list items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start space-x-2 pl-3">
              <span className="text-indigo-500 font-bold mt-1 text-sm">•</span>
              <span className="flex-1 text-slate-700 text-sm">{parseBoldText(text)}</span>
            </div>
          );
        }

        // Standard paragraphs
        return <p key={idx} className="text-slate-700 text-sm">{parseBoldText(trimmed)}</p>;
      })}
    </div>
  );
};

const parseBoldText = (text: string) => {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-extrabold text-slate-900">{part}</strong>;
    }
    return part;
  });
};

const formatDateString = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4 && month.length <= 2 && day.length <= 2) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // ignore
  }
  return dateStr;
};

export const SurveyStats: React.FC<SurveyStatsProps> = ({
  survey,
  questions,
  options,
  responses,
  answers,
  onBack
}) => {
  // Find all questions belonging to this survey (sorted by order number)
  const surveyQuestions = useMemo(() => {
    return questions
      .filter(q => q.survey_id === survey.id)
      .sort((a, b) => a.order_number - b.order_number);
  }, [questions, survey.id]);

  // Extract parameter questions (Part 2) versus main content questions (Part 3)
  const parameterQuestions = useMemo(() => {
    return surveyQuestions.filter(q => q.metadata?.is_parameter === true);
  }, [surveyQuestions]);

  const mainQuestions = useMemo(() => {
    return surveyQuestions.filter(q => q.metadata?.is_parameter !== true);
  }, [surveyQuestions]);

  // Base responses for this survey
  const surveyResponses = useMemo(() => {
    return responses.filter(r => r.survey_id === survey.id);
  }, [responses, survey.id]);

  // Answers belonging to this survey's responses
  const surveyResponseIds = useMemo(() => {
    return surveyResponses.map(r => r.id);
  }, [surveyResponses]);

  const surveyAnswers = useMemo(() => {
    return answers.filter(a => surveyResponseIds.includes(a.response_id));
  }, [answers, surveyResponseIds]);

  // --- DYNAMIC PARAMETERS FILTER ENGINE ---
  // Store filter state for each parameter question by key: qid -> selected_value (or 'ALL')
  const [filtersState, setFiltersState] = useState<Record<string, string>>({});

  // Calculate unique answered values for each parameter question to populate filter lists
  const parameterFilters = useMemo(() => {
    const filters: Record<string, string[]> = {};

    parameterQuestions.forEach(q => {
      const uniqueVals = new Set<string>();
      // Find all answers to this parameter question among our responses
      const qAnswers = surveyAnswers.filter(a => a.question_id === q.id);
      qAnswers.forEach(ans => {
        if (ans.answer_text && ans.answer_text.trim()) {
          uniqueVals.add(ans.answer_text.trim());
        }
      });
      filters[q.id] = Array.from(uniqueVals).sort();
    });

    return filters;
  }, [parameterQuestions, surveyAnswers]);

  // Filtered responses based on selected filtersState
  const filteredResponses = useMemo(() => {
    return surveyResponses.filter(res => {
      // Must match every active filter set in filtersState
      for (const [qid, val] of Object.entries(filtersState)) {
        const selectedVal = val as string;
        if (selectedVal === 'ALL' || !selectedVal) continue;

        // Find if this response has an answer for qid matching selectedVal
        const matchingAns = surveyAnswers.find(
          a => a.response_id === res.id && a.question_id === qid
        );

        if (!matchingAns || matchingAns.answer_text.trim() !== selectedVal.trim()) {
          return false;
        }
      }
      return true;
    });
  }, [surveyResponses, filtersState, surveyAnswers]);

  const filteredResponseIds = useMemo(() => {
    return filteredResponses.map(r => r.id);
  }, [filteredResponses]);

  // Filtered answers map matching filtered responses
  const activeSurveyAnswers = useMemo(() => {
    return surveyAnswers.filter(a => filteredResponseIds.includes(a.response_id));
  }, [surveyAnswers, filteredResponseIds]);

  // Set individual parameter filter value
  const handleSetFilter = (qid: string, value: string) => {
    setFiltersState(prev => ({
      ...prev,
      [qid]: value
    }));
  };

  // Reset all dynamic filters
  const handleResetFilters = () => {
    setFiltersState({});
  };

  // Precalculate exact YES / NO counts for the PDF table report
  const tableStats = useMemo(() => {
    const results: Record<string, { yesCount: number; noCount: number; percent: number }> = {};

    surveyQuestions.forEach(q => {
      const qAnswers = activeSurveyAnswers.filter(a => a.question_id === q.id);
      const total = qAnswers.length;

      let yesCount = 0;
      let noCount = 0;

      if (q.question_type === 'YES_NO' || q.question_type === 'radio') {
        yesCount = qAnswers.filter(a => a.answer_text === 'YES').length;
        noCount = qAnswers.filter(a => a.answer_text === 'NO').length;
      } else {
        yesCount = qAnswers.filter(a => a.answer_text === 'YES' || a.answer_text === 'Có').length;
        noCount = total - yesCount;
      }

      const denom = yesCount + noCount;
      const percent = denom > 0 ? (yesCount / denom) * 105 / 1.05 / denom * 100 : 0; // matching same math if needed, but let's simply use yesCount / denom * 100
      const actualPercent = denom > 0 ? (yesCount / denom) * 100 : 0;

      results[q.id] = {
        yesCount,
        noCount,
        percent: actualPercent
      };
    });

    return results;
  }, [surveyQuestions, activeSurveyAnswers]);

  // Dynamic parameter values based on active filtering
  const paramValues = useMemo(() => {
    const getParamFilterValue = (keywords: string[]) => {
      const q = surveyQuestions.find(pq => 
        pq.metadata?.is_parameter === true &&
        keywords.some(kw => pq.question_text.toLowerCase().includes(kw.toLowerCase()))
      );
      if (q) {
        const selected = filtersState[q.id];
        if (selected && selected !== 'ALL') {
          return selected;
        }
      }
      return 'Tất cả';
    };

    return {
      lop: getParamFilterValue(['lớp', 'lop']),
      monHoc: getParamFilterValue(['môn', 'mon', 'mh', 'mđ', 'md']),
      giaoVien: getParamFilterValue(['giáo viên', 'giao vien', 'gv'])
    };
  }, [surveyQuestions, filtersState]);

  // Dynamic calculation for the survey response timeframe
  const thoiGianKhaoSatValue = useMemo(() => {
    if (filteredResponses.length === 0) return 'Tất cả';
    const dates = filteredResponses
      .map(r => r.submitted_at ? new Date(r.submitted_at) : null)
      .filter((d): d is Date => d !== null);
    if (dates.length === 0) return 'Tất cả';
    const uniqueDates = Array.from(new Set(dates.map(d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`)));
    if (uniqueDates.length === 1) return uniqueDates[0];
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const format = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    return `${format(minDate)} - ${format(maxDate)}`;
  }, [filteredResponses]);

  // --- STATISTICAL CALCULATOR FOR EACH QUESTION ---
  const statistics = useMemo(() => {
    const stats: Record<string, {
      totalAnswers: number;
      distribution: Record<string, { label: string; count: number; percent: number }>;
      textReplies: string[];
    }> = {};

    surveyQuestions.forEach(q => {
      const qAnswers = activeSurveyAnswers.filter(a => a.question_id === q.id);
      const total = qAnswers.length;

      // YES_NO Question Type
      if (q.question_type === 'YES_NO' || q.question_type === 'radio') {
        const yesCount = qAnswers.filter(a => a.answer_text === 'YES').length;
        const noCount = qAnswers.filter(a => a.answer_text === 'NO').length;

        stats[q.id] = {
          totalAnswers: total,
          distribution: {
            YES: { label: 'Đúng / Có (YES)', count: yesCount, percent: total > 0 ? (yesCount / total) * 100 : 0 },
            NO: { label: 'Sai / Không (NO)', count: noCount, percent: total > 0 ? (noCount / total) * 100 : 0 }
          },
          textReplies: []
        };
      }
      // SINGLE_CHOICE / MULTIPLE_CHOICE Question Type
      else if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'checkbox') {
        const qOptions = options.filter(o => o.question_id === q.id);
        const dist: Record<string, { label: string; count: number; percent: number }> = {};

        // Prepare placeholder keys for options
        qOptions.forEach(o => {
          dist[o.id] = { label: o.option_text, count: 0, percent: 0 };
        });
        dist['OTHER'] = { label: 'Ý kiến khác / Bỏ trống', count: 0, percent: 0 };

        let countedAnswers = 0;
        qAnswers.forEach(a => {
          if (a.option_id && dist[a.option_id]) {
            dist[a.option_id].count++;
            countedAnswers++;
          } else {
            // Fallback match by text value if option_id is absent
            const matchedOpt = qOptions.find(o => o.option_text === a.answer_text);
            if (matchedOpt) {
              dist[matchedOpt.id].count++;
              countedAnswers++;
            } else if (a.answer_text) {
              dist['OTHER'].count++;
              countedAnswers++;
            }
          }
        });

        // Calculate distribution percentages
        qOptions.forEach(o => {
          dist[o.id].percent = countedAnswers > 0 ? (dist[o.id].count / countedAnswers) * 100 : 0;
        });
        dist['OTHER'].percent = countedAnswers > 0 ? (dist['OTHER'].count / countedAnswers) * 100 : 0;

        stats[q.id] = {
          totalAnswers: countedAnswers,
          distribution: dist,
          textReplies: []
        };
      }
      // RATING Question Type
      else if (q.question_type === 'rating' || q.question_type === 'RATING') {
        const dist: Record<string, { label: string; count: number; percent: number }> = {};
        [1, 2, 3, 4, 5].forEach(num => {
          dist[String(num)] = { label: `${num}★`, count: 0, percent: 0 };
        });

        let countedAnswers = 0;
        qAnswers.forEach(a => {
          const ratingKey = a.answer_text?.trim();
          if (ratingKey && dist[ratingKey]) {
            dist[ratingKey].count++;
            countedAnswers++;
          }
        });

        [1, 2, 3, 4, 5].forEach(num => {
          dist[String(num)].percent = countedAnswers > 0 ? (dist[String(num)].count / countedAnswers) * 100 : 0;
        });

        stats[q.id] = {
          totalAnswers: countedAnswers,
          distribution: dist,
          textReplies: []
        };
      }
      // TEXT / TEXTAREA Question Type
      else {
        const textReplies = qAnswers
          .map(a => a.answer_text?.trim())
          .filter(t => t && t.length > 0);

        stats[q.id] = {
          totalAnswers: total,
          distribution: {},
          textReplies
        };
      }
    });

    return stats;
  }, [surveyQuestions, activeSurveyAnswers, options]);

  // --- EXPORT TO EXCEL-READY CSV LOGIC (UTF-8 BOM FOR DOUBLE-CLICK EXCEL COHESION) ---
  const handleExportExcel = () => {
    // Construct columns completely dynamically based on existing questions!
    const headers = ['Mã phản hồi', 'Ngày nạp/gửi'];

    // Part 2 dynamic parameter headers
    parameterQuestions.forEach((q, idx) => {
      headers.push(`[Tham số] ${q.question_text}`);
    });

    // Part 3 content questionnaire headers
    mainQuestions.forEach((q, idx) => {
      headers.push(`Câu ${idx + 1}: ${q.question_text}`);
    });

    const rows: string[][] = [headers];

    // Build row values
    filteredResponses.forEach(res => {
      const rDate = new Date(res.submitted_at).toLocaleString('vi-VN');
      const row: string[] = [res.id, rDate];

      // Insert answers for parameter questions
      parameterQuestions.forEach(q => {
        const ans = surveyAnswers.find(a => a.response_id === res.id && a.question_id === q.id);
        row.push(ans ? ans.answer_text || 'Chưa định danh' : 'N/A');
      });

      // Insert answers for content questions
      mainQuestions.forEach(q => {
        const ans = surveyAnswers.find(a => a.response_id === res.id && a.question_id === q.id);
        if (!ans) {
          row.push('Chưa trả lời / Bỏ qua (Rẽ nhánh)');
        } else {
          if (q.question_type === 'YES_NO' || q.question_type === 'radio') {
            row.push(ans.answer_text === 'YES' ? 'Đúng / Có (YES)' : 'Sai / Không (NO)');
          } else if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'checkbox') {
            if (ans.option_id) {
              const opt = options.find(o => o.id === ans.option_id);
              row.push(opt ? opt.option_text : ans.answer_text || '');
            } else {
              row.push(ans.answer_text || '');
            }
          } else {
            row.push(ans.answer_text || '');
          }
        }
      });

      rows.push(row);
    });

    const escapedCSVContent = rows
      .map(r =>
        r
          .map(cell => {
            const cleanCell = cell.replace(/"/g, '""');
            return `"${cleanCell}"`;
          })
          .join(',')
      )
      .join('\n');

    const csvContent = '\uFEFF' + escapedCSVContent; // Excel UTF-8 BOM byte signature
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BAO_CAO_KHAO_SAT_${survey.id}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFiltersApplied = useMemo(() => {
    return Object.values(filtersState).some(val => val && val !== 'ALL');
  }, [filtersState]);

  // --- WORKSPACE VIEW MODE TABS ---
  // "dashboard" for interactive charts, "builder" for custom print templates
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder'>('dashboard');

  // --- AI ANALYSIS SYSTEM STATE ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  const [aiPulseMessage, setAiPulseMessage] = useState('Đang tối ưu cấu trúc dữ liệu...');

  // --- OFFICIAL TEMPLATE BUILDER STATE ---
  const [reportTitle, setReportTitle] = useState('KẾT QUẢ THỐNG KÊ KHẢO SÁT');
  const [issuingDept, setIssuingDept] = useState('TRƯỜNG CAO ĐẲNG LONG AN - CƠ SỞ BẾN LỨC');
  const [evaluatorDepartment, setEvaluatorDepartment] = useState('CƠ SỞ BẾN LỨC');
  const [evaluatorName, setEvaluatorName] = useState('NGƯỜI LẬP BÁO CÁO');
  const [approverTitle, setApproverTitle] = useState('BAN GIÁM HIỆU');
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportSubtitle, setReportSubtitle] = useState(() => `Chương trình khảo sát: ${survey.title}`);
  
  // Choose which questions are selected for inclusion in the template
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(() => 
    mainQuestions.map(q => q.id)
  );

  // --- REPORT TEMPLATE MANAGEMENT STATE ---
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; name: string; data: any }[]>(() => {
    try {
      const stored = localStorage.getItem(`report_templates_${survey.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  const [showPrintModalConfirmation, setShowPrintModalConfirmation] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const [includeChartsInDoc, setIncludeChartsInDoc] = useState(true);
  const [includeCommentsInDoc, setIncludeCommentsInDoc] = useState(true);
  const [includeSigningBlock, setIncludeSigningBlock] = useState(true);
  const [showPrintToast, setShowPrintToast] = useState(false);

  const [reportDateText, setReportDateText] = useState(() => {
    const d = new Date();
    return `Bến Lức, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  });

  const handleLoadTemplate = (tid: string) => {
    setSelectedTemplateId(tid);
    if (tid === 'default') {
      setReportTitle('KẾT QUẢ THỐNG KÊ KHẢO SÁT');
      setIssuingDept('TRƯỜNG CAO ĐẲNG LONG AN - CƠ SỞ BẾN LỨC');
      setEvaluatorDepartment('CƠ SỞ BẾN LỨC');
      setEvaluatorName('NGƯỜI LẬP BÁO CÁO');
      setApproverTitle('BAN GIÁM HIỆU');
      setReportRemarks('');
      setReportSubtitle(`Chương trình khảo sát: ${survey.title}`);
      setSelectedQuestionIds(mainQuestions.map(q => q.id));
      setIncludeChartsInDoc(true);
      setIncludeCommentsInDoc(true);
      setIncludeSigningBlock(true);
      return;
    }

    const found = savedTemplates.find(t => t.id === tid);
    if (found) {
      const d = found.data;
      if (d.reportTitle !== undefined) setReportTitle(d.reportTitle);
      if (d.issuingDept !== undefined) setIssuingDept(d.issuingDept);
      if (d.evaluatorDepartment !== undefined) setEvaluatorDepartment(d.evaluatorDepartment);
      if (d.evaluatorName !== undefined) setEvaluatorName(d.evaluatorName);
      if (d.approverTitle !== undefined) setApproverTitle(d.approverTitle);
      if (d.reportRemarks !== undefined) setReportRemarks(d.reportRemarks);
      if (d.reportSubtitle !== undefined) setReportSubtitle(d.reportSubtitle);
      if (d.selectedQuestionIds !== undefined) setSelectedQuestionIds(d.selectedQuestionIds);
      if (d.includeChartsInDoc !== undefined) setIncludeChartsInDoc(d.includeChartsInDoc);
      if (d.includeCommentsInDoc !== undefined) setIncludeCommentsInDoc(d.includeCommentsInDoc);
      if (d.includeSigningBlock !== undefined) setIncludeSigningBlock(d.includeSigningBlock);
      if (d.reportDateText !== undefined) setReportDateText(d.reportDateText);
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Vui lòng giới thiệu một tên gợi nhớ cho mẫu này.');
      return;
    }
    const templateData = {
      reportTitle,
      reportSubtitle,
      issuingDept,
      evaluatorDepartment,
      evaluatorName,
      approverTitle,
      reportRemarks,
      reportDateText,
      includeChartsInDoc,
      includeCommentsInDoc,
      includeSigningBlock,
      selectedQuestionIds
    };

    const newId = `tpl_${Date.now()}`;
    const newTpl = {
      id: newId,
      name: newTemplateName.trim(),
      data: templateData
    };

    const updated = [...savedTemplates, newTpl];
    setSavedTemplates(updated);
    localStorage.setItem(`report_templates_${survey.id}`, JSON.stringify(updated));
    setSelectedTemplateId(newId);
    setNewTemplateName('');
    setIsSavingTemplate(false);
    alert(`Đã lưu mẫu báo cáo "${newTpl.name}" thành công vào bộ nhớ hệ thống.`);
  };

  const handleDeleteTemplate = (tid: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản mẫu báo cáo này không?')) {
      const updated = savedTemplates.filter(t => t.id !== tid);
      setSavedTemplates(updated);
      localStorage.setItem(`report_templates_${survey.id}`, JSON.stringify(updated));
      if (selectedTemplateId === tid) {
        handleLoadTemplate('default');
      }
    }
  };

  const activeScopeText = useMemo(() => {
    const activeFilters = Object.entries(filtersState)
      .filter(([_, val]) => val && val !== 'ALL')
      .map(([qid, val]) => {
        const q = parameterQuestions.find(pq => pq.id === qid);
        const shortQName = q ? q.question_text.split('(')[0].trim().replace('Chọn ', '') : '';
        return `${shortQName}: ${val}`;
      });
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'Toàn bộ mẫu khảo sát';
  }, [filtersState, parameterQuestions]);

  // --- FETCH SECURE AI ANALYSIS FROM EXPRESS SERVICE ---
  const handleTriggerAI = async () => {
    setIsAnalyzing(true);
    setAiError('');
    
    // Simulate smart thinking logs for reassurance
    const messages = [
      'Khởi động Gemini 3.5-flash...',
      'Đang thu thập và chuẩn hóa dữ liệu thống kê chất lượng trường CDS-CSBL...',
      'Đang xử lý phân tích xu hướng và tỷ lệ hài lòng...',
      'Đang soạn thảo báo cáo nhận xét và khuyến nghị nâng cao nghiệp vụ...'
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setAiPulseMessage(messages[msgIdx]);
    }, 4500);

    try {
      // Build small statistical digest to fit perfectly on server payload
      const dataDigest = mainQuestions.map((q, idx) => {
        const stat = statistics[q.id];
        if (!stat) return null;

        let resultsText = '';
        if (q.question_type === 'YES_NO' || q.question_type === 'radio') {
          resultsText = `Đúng/Có (YES): ${stat.distribution.YES?.percent.toFixed(1)}%, Sai/Không (NO): ${stat.distribution.NO?.percent.toFixed(1)}%`;
        } else if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'checkbox') {
          resultsText = Object.entries(stat.distribution)
            .filter(([key, item]) => {
              const distItem = item as { label: string; count: number; percent: number };
              return key !== 'OTHER' || distItem.count > 0;
            })
            .map(([_, item]) => {
              const distItem = item as { label: string; count: number; percent: number };
              return `${distItem.label}: ${distItem.percent.toFixed(1)}%`;
            })
            .join(' | ');
        } else {
          resultsText = `Tổng cộng ${stat.textReplies.length} ý kiến đóng góp bằng chữ.`;
        }

        return {
          id: q.id,
          order: idx + 1,
          question: q.question_text,
          type: q.question_type,
          responsesCount: stat.totalAnswers,
          summary: resultsText,
          sampleTexts: stat.textReplies.slice(0, 5) // send top 5 comments
        };
      }).filter(Boolean);

      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          survey: {
            title: survey.title,
            description: survey.description,
            type: survey.type
          },
          statistics: dataDigest,
          totalResponses: filteredResponses.length
        })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Yêu cầu dịch vụ thất bại với mã trạng thái ${res.status}`);
      }

      const resData = await res.json();
      setAiReport(resData.analysis || 'Không tạo được báo cáo phân tích từ AI.');
      
      // Auto transition to report builder tab and hint insertion
      setActiveTab('builder');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Có lỗi xảy ra khi kết nối máy chủ phân tích.');
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleApplyAIToTemplate = () => {
    if (!aiReport) return;
    setReportRemarks(prev => {
      const delim = prev ? '\n\n' : '';
      return prev + delim + `[TỔNG HỢP KIỂM ĐỊNH TỰ ĐỘNG BẰNG TRÍ TUỆ NHÂN TẠO - AI AGENT REPORT]\n` + aiReport;
    });
    
    // Smooth scrolling to comments section
    const el = document.getElementById('reportRemarksTextarea');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.focus();
    }
  };

  // Toggle individual question in template checked list
  const handleToggleQuestionInReport = (qid: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
    );
  };

  const handleExportDirectPDF = async () => {
    if (filteredResponses.length === 0) return;
    setIsExportingPDF(true);
    
    let iframe: HTMLIFrameElement | null = null;
    
    try {
      const element = document.getElementById('direct-pdf-report-container');
      if (!element) {
        console.error('Report container element not found!');
        setIsExportingPDF(false);
        return;
      }

      // Create a temporary hidden iframe to fully isolate the PDF layout
      // This completely shields html2canvas from the parent document's Tailwind stylesheet containing oklch/oklab functions
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '195mm';
      iframe.style.height = '100%';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        console.error('Could not create iframe document context');
        setIsExportingPDF(false);
        return;
      }

      // Setup clean background styles on the iframe canvas
      iframeDoc.body.style.margin = '0';
      iframeDoc.body.style.padding = '0';
      iframeDoc.body.style.backgroundColor = '#ffffff';

      // Clone and clean up coordinates of the template report element inside the isolated document body
      const tempClone = element.cloneNode(true) as HTMLElement;
      tempClone.style.position = 'relative';
      tempClone.style.left = '0';
      tempClone.style.top = '0';
      tempClone.style.margin = '0';
      tempClone.style.display = 'block';
      tempClone.style.width = '100%';
      
      iframeDoc.body.appendChild(tempClone);

      const opt = {
        margin: [15, 15, 15, 15],
        filename: 'KET_QUA_THONG_KE_KHAO_SAT.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(tempClone).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      // Clean up the temporary iframe safely from the parent document body
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6 print:space-y-0 print:p-0">
      {/* Dynamic Embedded Styling for Beautiful CSS-Driven Print Outputs */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-element {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          .page-break-before {
            page-break-before: always !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
          /* Eliminate any custom margins/borders on cards for print integrity */
          .print-bordered-card {
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin-bottom: 20px !important;
            background: white !important;
          }
          /* Print-ready custom progress bar */
          .print-bar-outer {
            background-color: #e5e7eb !important;
            border: 1px solid #9ca3af !important;
            height: 12px !important;
            width: 100% !important;
            border-radius: 4px !important;
          }
          .print-bar-inner {
            background-color: #4b5563 !important;
            height: 100% !important;
            border-radius: 3px !important;
          }
        }
      `}</style>

      {/* Floating System-Level Print Help Toast */}
      {showPrintToast && (
        <div className="no-print fixed top-5 right-5 left-5 md:left-auto md:w-96 bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="flex items-start space-x-3">
            <div className="bg-sky-500/20 p-2 rounded-xl text-sky-400">
              <Printer className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-extrabold text-white">Xuất báo cáo PDF thành công!</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hệ thống in trình duyệt đã được khởi tạo. Để có bản in hoặc tệp xuất PDF chuẩn nhất:
              </p>
              <ul className="text-[10px] text-slate-400 list-disc pl-4 space-y-1 mt-1 font-medium">
                <li>Chọn <strong>Lưu dưới dạng PDF</strong> (Save as PDF) tại mục máy in.</li>
                <li>Mở rộng tùy chọn, tích chọn <strong>Đồ họa nền</strong> (Background graphics) để hiển thị biểu đồ sắc nét.</li>
                <li>Tắt <strong>Tiêu đề và chân trang</strong> (Headers and footers) để có văn bản sạch sẽ nhất.</li>
              </ul>
              <button 
                onClick={() => setShowPrintToast(false)} 
                className="mt-3 text-xs w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg font-bold transition border border-slate-700"
              >
                Đồng ý / Đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          HEADER SYSTEM BAR (NO PRINT)
          ========================================== */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between bg-slate-900/95 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-800 shadow-xl gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="flex items-center justify-center h-9 w-9 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl transition duration-200 hover:scale-105 active:scale-95"
            title="Trở về danh sách khảo sát"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black tracking-widest text-orange-400 uppercase bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-850/30">
                ADMIN WORKSPACE
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {filteredResponses.length} Phiếu nộp
              </span>
            </div>
            <h1 className="font-sans font-black text-white text-sm sm:text-base tracking-tight leading-tight uppercase">
              Bình diện Phân tích & Tùy biến Báo cáo
            </h1>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Analysis button */}
          <button
            onClick={handleTriggerAI}
            disabled={isAnalyzing || filteredResponses.length === 0}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black transition shadow-md border ${
              isAnalyzing 
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-indigo-600 via-pink-650 to-indigo-600 hover:opacity-90 text-white border-indigo-500 hover:shadow-indigo-500/10 cursor-pointer duration-300'
            }`}
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-sky-300 fill-sky-300/30 animate-pulse" />
            )}
            <span>{isAnalyzing ? 'Vui lòng chờ AI...' : 'Phân tích kết quả bằng AI'}</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportExcel}
            disabled={filteredResponses.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 hover:border-emerald-600 rounded-xl text-xs font-bold transition shadow-md duration-200 cursor-pointer disabled:opacity-40"
            title="Trích xuất toàn bộ dữ liệu ra bảng tính Excel CSV"
          >
            <Download className="h-4 w-4" />
            <span>Xuất Excel CSV</span>
          </button>

          {/* Master PDF Button */}
          <button
            onClick={handleExportDirectPDF}
            disabled={filteredResponses.length === 0 || isExportingPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-xs font-black transition shadow-md duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Tải báo cáo thống kê trực tiếp dưới dạng file PDF mẫu"
          >
            {isExportingPDF ? (
              <RefreshCw className="h-4 w-4 text-indigo-650 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-indigo-650" />
            )}
            <span>{isExportingPDF ? 'Đang tạo PDF...' : 'Xuất báo cáo PDF'}</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          AI PROCESSING PANEL (NO PRINT)
          ========================================== */}
      {isAnalyzing && (
        <div className="no-print bg-indigo-950/40 border border-indigo-800 text-indigo-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/40 animate-pulse">
              <Brain className="h-8 w-8 text-indigo-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
          </div>
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-sm font-extrabold text-white">AI đang phân tích kết quả thống kê...</h3>
            <p className="text-xs text-indigo-300 animate-pulse font-mono">{aiPulseMessage}</p>
            <div className="w-48 bg-indigo-950 h-1.5 rounded-full overflow-hidden mx-auto mt-2.5">
              <div className="h-full bg-gradient-to-r from-sky-450 to-indigo-500 rounded-full w-2/3 animate-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* AI Error message block */}
      {aiError && (
        <div className="no-print bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs flex items-start space-x-2.5 text-left shadow-xs">
          <Brain className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <p className="font-extrabold">Không tiến hành phân tích AI được:</p>
            <p className="text-slate-600 font-medium">{aiError}</p>
            <button 
              onClick={handleTriggerAI} 
              className="mt-1.5 text-[10px] bg-rose-600 font-bold text-white px-2.5 py-1 rounded-md hover:bg-rose-700 transition"
            >
              Thử lại phân tích
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          METRICS & FILTERS REGION (NO PRINT)
          ========================================== */}
      <div className="no-print bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
              Báo cáo Chương trình khảo sát
            </span>
            <h2 className="font-sans font-black text-slate-800 text-base sm:text-lg tracking-tight leading-snug">
              {survey.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">{survey.description}</p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Biểu đồ trực quan</span>
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Cấu hình Mẫu báo cáo</span>
            </button>
          </div>
        </div>

        {/* METRICS COUNT Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs relative overflow-hidden flex items-start space-x-3">
            <div className="h-9 w-9 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng phiếu thu</span>
              <div className="flex items-baseline space-x-1.5 pt-0.5">
                <span className="text-2xl font-black text-slate-900 leading-none">{filteredResponses.length}</span>
                <span className="text-slate-400 text-[10px] font-semibold">/ {surveyResponses.length} phiếu</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs relative overflow-hidden flex items-start space-x-3">
            <div className="h-9 w-9 bg-sky-550/10 text-sky-655 rounded-xl flex items-center justify-center shrink-0">
              <FileCheck className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mẫu khảo sát</span>
              <span className="text-xs sm:text-sm font-extrabold text-indigo-600 block leading-tight pt-1">
                {survey.type === 'TEACHING' ? 'Giảng dạy' : survey.type === 'ALUMNI' ? 'Cựu học sinh' : 'Ý kiến doanh nghiệp'}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs relative overflow-hidden flex items-start space-x-3">
            <div className="h-9 w-9 bg-amber-550/10 text-amber-655 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phạm vi thời gian</span>
              <span className="text-xs font-black text-slate-800 block leading-tight pt-1">
                {formatDateString(survey.start_date)} - {formatDateString(survey.end_date)}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs relative overflow-hidden flex items-start space-x-3">
            <div className="h-9 w-9 bg-emerald-555/10 text-emerald-650 rounded-xl flex items-center justify-center shrink-0">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái đợt</span>
              <div className="pt-1.5">
                {survey.status === 'PUBLISHED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 shadow-xxs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    PUBLISHED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-750 border border-rose-150 shadow-xxs">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {survey.status === 'DRAFT' ? 'Bản nháp' : 'Đã khóa'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Parameter Filtering Drawer */}
        {surveyResponses.length > 0 && parameterQuestions.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 flex flex-wrap items-center gap-4">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-indigo-500" />
              Lọc tham số phân tổ:
            </span>

            <div className="flex flex-wrap items-center gap-3">
              {parameterQuestions.map(q => {
                const uniqueVals = parameterFilters[q.id] || [];
                const selectedValue = filtersState[q.id] || 'ALL';

                if (uniqueVals.length === 0) return null;
                // Prettify name
                const shortParamName = q.question_text.split('(')[0].trim().replace('Chọn ', '').replace('đánh giá', '').replace('Bạn ', '').replace('bạn ', '');

                return (
                  <div key={q.id} className="flex items-center space-x-1 text-xs">
                    <span className="text-slate-500 font-bold">{shortParamName}:</span>
                    <select
                      value={selectedValue}
                      onChange={(e) => handleSetFilter(q.id, e.target.value)}
                      className="bg-white border border-slate-250 py-1 px-2 text-slate-700 font-bold rounded-lg text-xs hover:border-slate-350 transition duration-150 cursor-pointer"
                    >
                      <option value="ALL">Tất cả ({uniqueVals.length})</option>
                      {uniqueVals.map(val => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {hasFiltersApplied && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          AI INTELLIGENT REPORT DISPLAY SUBPANEL
          ========================================== */}
      {aiReport && !isAnalyzing && (
        <div className="no-print bg-gradient-to-br from-indigo-50/60 via-pink-50/30 to-white border border-indigo-250 rounded-3xl p-6 shadow-md relative overflow-hidden space-y-4">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-550/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3 flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-650 text-white p-2 rounded-xl shadow-sm">
                <Brain className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-slate-800 text-sm">Báo cáo Phân tích từ Trí tuệ Nhân tạo (AI Report)</h3>
                <p className="text-[10px] text-slate-500 font-medium">Biên thảo bởi mô hình Gemini 3.5-Flash dựa trên tham số: <span className="font-bold text-indigo-700">{activeScopeText}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyAIToTemplate}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs border border-indigo-500"
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>✍️ Đưa vào Mẫu báo cáo chính thức</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiReport);
                  alert("Đã sao chép nội dung báo cáo AI vào khay nhớ tạm!");
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép văn bản</span>
              </button>
              <button
                onClick={() => setAiReport('')}
                className="flex items-center justify-center p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-xl transition cursor-pointer"
                title="Khóa thu nhỏ báo cáo AI"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Markdown Output Text Flow Box */}
          <div className="bg-white/80 border border-indigo-100/50 p-5 rounded-2xl max-h-96 overflow-y-auto leading-relaxed shadow-inner">
            <MarkdownRenderer content={aiReport} />
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-right italic">
            *Nhận định có giá trị tham khảo và hỗ trợ lập tờ trình kiểm định chất lượng tức thời cơ sở CDS-CSBL.
          </div>
        </div>
      )}

      {/* ==========================================
          NO FEEDBACK SAFETY NOTIFICATION (NO PRINT)
          ========================================== */}
      {filteredResponses.length === 0 ? (
        <div className="no-print bg-white rounded-3xl border border-slate-100 shadow-sm text-center py-20 px-4">
          <Inbox className="h-12 w-12 text-slate-350 mx-auto stroke-1" />
          <h3 className="font-sans font-bold text-slate-700 text-sm mt-4">Không tìm thấy ý kiến phản hồi nào bổ sung</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Chưa có phản hồi tương ứng được thiết kế hay nhập nộp khớp với tham số tổ phân tách của đợt khảo sát này.
          </p>
        </div>
      ) : (
        /* Work tab sections content */
        <>
          {/* ==========================================
              TAB 1: INTERACTIVE ANALYSIS CHARTS (NO PRINT)
              ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="no-print space-y-6">
              {/* Statistical cards layout flow */}
              <div className="grid grid-cols-1 gap-6">
                {mainQuestions.map((q, idx) => {
                  const qStats = statistics[q.id];
                  if (!qStats) return null;

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 hover:border-slate-200 transition-all duration-200"
                    >
                      {/* Badge detail index */}
                      <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-indigo-650 bg-indigo-50/80 px-2 py-0.5 rounded uppercase tracking-wider">
                              Câu hỏi số {idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                              Dạng {q.question_type === 'YES_NO' || q.question_type === 'radio' ? 'Đúng / Sai' : q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'checkbox' ? 'Trắc nghiệm' : q.question_type === 'rating' || q.question_type === 'RATING' ? 'Thang điểm' : 'Góp ý tự do'}
                            </span>
                            {q.metadata?.dependency && (
                              <span className="text-[9px] font-extrabold text-amber-750 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                                Rẽ nhánh phụ thuộc
                              </span>
                            )}
                          </div>
                          <h3 className="font-sans font-bold text-sm sm:text-base text-slate-800 leading-snug">
                            {q.question_text}
                          </h3>
                        </div>

                        <span className="text-[10px] text-slate-400 font-extrabold whitespace-nowrap bg-slate-50 border border-slate-200/30 px-2.5 py-1 rounded-xl">
                          {qStats.totalAnswers} Lượt nộp
                        </span>
                      </div>

                      {/* Distribution plots render */}
                      {/* YES_NO Charts */}
                      {(q.question_type === 'YES_NO' || q.question_type === 'radio') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          {['YES', 'NO'].map(key => {
                            const isYes = key === 'YES';
                            const distItem = qStats.distribution[key] || { label: isYes ? 'Có / Đồng ý' : 'Không / Từ chối', count: 0, percent: 0 };
                            return (
                              <div key={key} className="bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100/80 transition-all duration-150 space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span className="text-slate-700 font-bold">{isYes ? 'Có / Đồng ý (YES)' : 'Không (NO)'}</span>
                                  <span className="text-slate-900 font-extrabold bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xxs">
                                    {distItem.count} lượt ({distItem.percent.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                                  <div
                                    style={{ width: `${distItem.percent}%` }}
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isYes
                                        ? 'bg-emerald-500'
                                        : 'bg-rose-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* CHOICE type charts */}
                      {(q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'checkbox') && (
                        <div className="space-y-3 mt-3">
                          {Object.entries(qStats.distribution).map(([key, item]) => {
                            const distItem = item as { label: string; count: number; percent: number };
                            if (key === 'OTHER' && distItem.count === 0) return null; // Avoid empty optional representation
                            return (
                              <div key={key} className="bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100/80 transition-all duration-150 space-y-2">
                                <div className="flex items-start justify-between text-xs font-semibold gap-3">
                                  <span className="text-slate-700 font-bold leading-relaxed flex-1">{distItem.label}</span>
                                  <span className="text-slate-900 font-extrabold shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xxs">
                                    {distItem.count} phiếu ({distItem.percent.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                                  <div
                                    style={{ width: `${distItem.percent}%` }}
                                    className="h-full rounded-full transition-all duration-500 bg-indigo-650"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* RATING type charts */}
                      {(q.question_type === 'rating' || q.question_type === 'RATING') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                          {Object.entries(qStats.distribution).map(([key, item]) => {
                            const distItem = item as { label: string; count: number; percent: number };
                            return (
                              <div key={key} className="bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100/80 transition-all duration-150 space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold gap-3">
                                  <span className="text-slate-700 font-bold leading-tight flex-1">{distItem.label}</span>
                                  <span className="text-slate-900 font-extrabold shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-150 shadow-xxs">
                                    {distItem.count} lượt ({distItem.percent.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                                  <div
                                    style={{ width: `${distItem.percent}%` }}
                                    className="h-full rounded-full transition-all duration-500 bg-amber-500"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TEXTAREA type text lists */}
                      {(q.question_type === 'TEXT' || q.question_type === 'text') && (
                        <div className="mt-2 text-left">
                          {qStats.textReplies.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Không tìm thấy ý kiến đóng góp dạng văn bản nào trong mẫu lọc.</p>
                          ) : (
                            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
                              {qStats.textReplies.map((reply, rIdx) => (
                                <div key={rIdx} className="p-3.5 text-xs text-slate-700 font-semibold flex items-start gap-3">
                                  <span className="text-indigo-400 font-mono font-bold text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xxs">
                                    #{rIdx + 1}
                                  </span>
                                  <p className="flex-1 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-xl shadow-xxs font-medium text-slate-600">
                                    {reply}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: TEMPLATE DESIGNER & PRINT MANAGER (NO PRINT)
              ========================================== */}
          {activeTab === 'builder' && (
            <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: CONTROL CONSOLE (Lg span 5) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-sans font-black text-slate-800 text-sm flex items-center gap-1.5">
                    <Settings className="h-4.5 w-4.5 text-indigo-500" />
                    Tham số Mẫu báo cáo
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Tùy biến các trường chính thống của văn bản báo cáo theo mẫu tùy nghị.</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 mb-2 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chọn Mẫu báo cáo lưu trữ</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => handleLoadTemplate(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="default">✨ Mẫu chuẩn hệ thống</option>
                        {savedTemplates.map(t => (
                          <option key={t.id} value={t.id}>📝 {t.name}</option>
                        ))}
                      </select>
                      {selectedTemplateId !== 'default' && (
                        <button
                          onClick={() => handleDeleteTemplate(selectedTemplateId)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 cursor-pointer transition"
                          title="Xóa mẫu báo cáo này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!isSavingTemplate ? (
                    <button
                      onClick={() => setIsSavingTemplate(true)}
                      className="w-full text-center py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200/50 rounded-xl text-[10.5px] font-bold cursor-pointer transition"
                    >
                      ➕ Lưu cấu hình hiện tại thành Mẫu mới
                    </button>
                  ) : (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Tên mẫu báo cáo mới</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Báo cáo Khoa Du lịch học..."
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-855 focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setIsSavingTemplate(false);
                            setNewTemplateName('');
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          className="px-3 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition"
                        >
                          Lưu mẫu
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-4">
                  {/* Title of report input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tiêu đề Báo cáo</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>

                  {/* Subtitle with survey status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phụ đề chi tiết</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      value={reportSubtitle}
                      onChange={(e) => setReportSubtitle(e.target.value)}
                    />
                  </div>

                  {/* Issuing university authority */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Đại học / Ban ban hành</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      value={issuingDept}
                      onChange={(e) => setIssuingDept(e.target.value)}
                    />
                  </div>

                  {/* evaluator names details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phòng Khoa Lập</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        value={evaluatorDepartment}
                        onChange={(e) => setEvaluatorDepartment(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Người đại diện lập</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        value={evaluatorName}
                        onChange={(e) => setEvaluatorName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Approving manager role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chức vụ Phê duyệt</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      value={approverTitle}
                      onChange={(e) => setApproverTitle(e.target.value)}
                    />
                  </div>

                  {/* Extra report remarks editor (supports AI sync) */}
                  <div className="space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nhận xét & Khuyến nghị chung</label>
                      {aiReport && (
                        <button
                          onClick={handleApplyAIToTemplate}
                          className="text-[9px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center space-x-0.5"
                          title="Tải nhận xét từ kết quả tạo tự động của AI"
                        >
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          <span>Mượn ý AI</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      id="reportRemarksTextarea"
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                      placeholder="Viết nhận định tổng quan của quản trị viên hoặc các kết quả khuyến nghị định hướng phát học hiệu của Nhà trường tại đây..."
                      value={reportRemarks}
                      onChange={(e) => setReportRemarks(e.target.value)}
                    />
                  </div>

                  {/* Signing layout date details string */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Địa điểm & Ngày tháng ký báo cáo</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      value={reportDateText}
                      onChange={(e) => setReportDateText(e.target.value)}
                    />
                  </div>

                  {/* Render content Toggles choices list */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Cấu hình Hiển thị</span>
                    
                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none font-semibold text-slate-750">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        checked={includeChartsInDoc}
                        onChange={(e) => setIncludeChartsInDoc(e.target.checked)}
                      />
                      <span>Bao gồm biểu đồ phân chia tỷ lệ</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none font-semibold text-slate-750">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        checked={includeCommentsInDoc}
                        onChange={(e) => setIncludeCommentsInDoc(e.target.checked)}
                      />
                      <span>In phản hồi đóng góp chữ tự do (TEXT)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none font-semibold text-slate-750">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        checked={includeSigningBlock}
                        onChange={(e) => setIncludeSigningBlock(e.target.checked)}
                      />
                      <span>Thêm khung ký đóng khuôn phê duyệt cuối</span>
                    </label>
                  </div>

                  {/* SELECT QUESTIONS INDIVIDUALLY TO EXCLUDE OR INCLUDE IN REPORT */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chọn lọc Câu hỏi ra báo cáo ({selectedQuestionIds.length})</span>
                      <button
                        onClick={() => {
                          if (selectedQuestionIds.length === mainQuestions.length) {
                            setSelectedQuestionIds([]);
                          } else {
                            setSelectedQuestionIds(mainQuestions.map(q => q.id));
                          }
                        }}
                        className="text-[9px] text-indigo-650 hover:text-indigo-850 font-black cursor-pointer uppercase"
                      >
                        {selectedQuestionIds.length === mainQuestions.length ? 'Bỏ tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 p-2 divide-y divide-slate-200/50">
                      {mainQuestions.map((q, idx) => {
                        const isIncluded = selectedQuestionIds.includes(q.id);
                        return (
                          <div 
                            key={q.id}
                            onClick={() => handleToggleQuestionInReport(q.id)}
                            className="flex items-start space-x-2 py-2 px-1.5 hover:bg-white rounded-lg cursor-pointer select-none transition"
                          >
                            <span className="mt-0.5 shrink-0 text-indigo-600">
                              {isIncluded ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700 leading-snug">
                              Câu {idx+1}: {q.question_text.length > 60 ? q.question_text.substring(0, 60) + '...' : q.question_text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: DOCUMENT REAL-TIME ON-SCREEN PRINT PREVIEW (Lg span 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4.5 w-4.5 text-indigo-600" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Xem trước thiết kế trang A4</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 italic bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Giao diện hiển thị chân thực khổ giấy in vật lý
                  </span>
                </div>

                {/* Elegant pseudo-A4 paper format designed perfectly */}
                <div className="bg-white border border-slate-250/70 p-8 sm:p-12 shadow-2xl rounded-2xl w-full mx-auto font-sans text-slate-900 leading-relaxed text-xs space-y-6 select-text max-h-[750px] overflow-y-auto">
                  {/* Tiền đề ban hành & Tiêu đề */}
                  <div className="border-b-2 border-slate-900 pb-4 text-left">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{issuingDept || 'TRƯỜNG CAO ĐẲNG LONG AN - CƠ SỞ BẾN LỨC'}</p>
                    <h2 className="font-extrabold text-[17px] text-slate-955 uppercase tracking-tight mt-1">{reportTitle || 'KẾT QUẢ THỐNG KÊ KHẢO SÁT'}</h2>
                    {reportSubtitle && <p className="text-xs italic text-slate-500 mt-1">{reportSubtitle}</p>}
                  </div>

                  {/* Thông tin cấu hình chi tiết */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div>Ngày xuất báo cáo: <span className="font-bold text-slate-900">{(() => {
                      const d = new Date();
                      const pad = (n: number) => String(n).padStart(2, '0');
                      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                      const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                      return `${time} ${date}`;
                    })()}</span></div>
                    <div>Đợt khảo sát: <span className="font-bold text-slate-900">{survey.title || 'Tất cả các đợt'}</span></div>
                    <div>Thời gian khảo sát: <span className="font-bold text-slate-900">{thoiGianKhaoSatValue}</span></div>
                    <div>Lớp: <span className="font-bold text-slate-900">{paramValues.lop}</span></div>
                    <div>Môn học: <span className="font-bold text-slate-900">{paramValues.monHoc}</span></div>
                    <div>Giáo viên: <span className="font-bold text-slate-900">{paramValues.giaoVien}</span></div>
                    <div className="sm:col-span-2">Tổng số phiếu: <span className="font-bold text-slate-900">{filteredResponses.length}</span></div>
                  </div>

                  {/* Nhận xét chung nếu có */}
                  {reportRemarks && (
                    <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3.5 space-y-1">
                      <span className="text-[10px] font-black text-amber-800 uppercase block tracking-wider">Ghi chú / Nhận xét của Quản trị viên</span>
                      <div className="text-xs text-amber-900 whitespace-pre-line leading-relaxed font-semibold">{reportRemarks}</div>
                    </div>
                  )}

                  {/* Bảng số liệu thống kê */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-450 uppercase block tracking-wider">Bảng số liệu thống kê</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold">
                            <th className="p-2.5 text-center w-12 border-r border-slate-700">ID</th>
                            <th className="p-2.5 border-r border-slate-700">Nội dung câu hỏi</th>
                            <th className="p-2.5 text-center w-16 border-r border-slate-700">Có</th>
                            <th className="p-2.5 text-center w-16 border-r border-slate-700">Không</th>
                            <th className="p-2.5 text-center w-24">Tỉ lệ Có</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-sans">
                          {surveyQuestions
                            .filter(q => selectedQuestionIds.includes(q.id))
                            .map((q, idx) => {
                              const stats = tableStats[q.id] || { yesCount: 0, noCount: 0, percent: 0 };
                              const totalAnswers = stats.yesCount + stats.noCount;
                              return (
                                <tr key={q.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="p-2.5 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                                  <td className="p-2.5 font-semibold text-slate-808 leading-snug border-r border-slate-100">{q.question_text}</td>
                                  <td className="p-2.5 text-center text-slate-600 border-r border-slate-100">{stats.yesCount}</td>
                                  <td className="p-2.5 text-center text-slate-600 border-r border-slate-100">{stats.noCount}</td>
                                  <td className="p-2.5 text-center font-bold text-slate-900 bg-slate-50/30">
                                    {totalAnswers > 0 ? `${stats.percent.toFixed(1)}%` : '0.0%'}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ký tên */}
                  {includeSigningBlock && (
                    <div className="grid grid-cols-2 text-center pt-6 text-xs font-semibold border-t border-dashed border-slate-250">
                      <div className="space-y-1">
                        <p className="uppercase text-slate-450 font-bold">NGƯỜI LẬP BÁO CÁO</p>
                        <p className="text-[10px] text-slate-400 font-medium italic">(Ký và ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="text-slate-900 font-extrabold">{evaluatorName || 'NGƯỜI LẬP BÁO CÁO'}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{evaluatorDepartment || 'CƠ SỞ BẾN LỨC'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="uppercase text-slate-900 font-bold">BAN GIÁM HIỆU</p>
                        <p className="text-[10px] text-slate-400 font-medium italic">(Ký tên và đóng dấu)</p>
                        <div className="h-14" />
                        <p className="text-slate-900 font-extrabold">{approverTitle || 'BAN GIÁM HIỆU'}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{issuingDept || 'TRƯỜNG CAO ĐẲNG LONG AN'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==========================================
          OFFICIAL PRINT-READY CONTAINER (HIDDEN ON SCREEN, SHOWS IN PRINT PREVIEW / PDF)
          ========================================== */}
      {filteredResponses.length > 0 && (
        <div className="print-element hidden bg-white p-0 m-0 font-sans text-slate-900 text-xs leading-relaxed space-y-6">
          {/* Tiền đề ban hành & Tiêu đề */}
          <div className="border-b-2 border-slate-900 pb-4 text-left">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{issuingDept || 'TRUONG CAO DANG LONG AN - CO SO BEN LUC'}</p>
            <h2 className="font-extrabold text-[17px] text-slate-955 uppercase tracking-tight mt-1">{reportTitle || 'KET QUA THONG KE KHAO SAT'}</h2>
            {reportSubtitle && <p className="text-xs italic text-slate-500 mt-1">{reportSubtitle}</p>}
          </div>

          {/* Thông tin cấu hình chi tiết */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-150">
            <div>Ngày xuất báo cáo: <span className="font-bold text-slate-900">{(() => {
              const d = new Date();
              const pad = (n: number) => String(n).padStart(2, '0');
              const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
              const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
              return `${time} ${date}`;
            })()}</span></div>
            <div>Đợt khảo sát: <span className="font-bold text-slate-900">{survey.title || 'Tất cả các đợt'}</span></div>
            <div>Thời gian khảo sát: <span className="font-bold text-slate-900">{thoiGianKhaoSatValue}</span></div>
            <div>Lớp: <span className="font-bold text-slate-900">{paramValues.lop}</span></div>
            <div>Môn học: <span className="font-bold text-slate-900">{paramValues.monHoc}</span></div>
            <div>Giáo viên: <span className="font-bold text-slate-900">{paramValues.giaoVien}</span></div>
            <div className="col-span-2">Tổng số phiếu: <span className="font-bold text-slate-900">{filteredResponses.length}</span></div>
          </div>

          {/* Nhận xét chung nếu có */}
          {reportRemarks && (
            <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-black text-amber-800 uppercase block tracking-wider">Ghi chú / Nhận xét của Quản trị viên</span>
              <div className="text-xs text-amber-900 whitespace-pre-line leading-relaxed font-semibold">{reportRemarks}</div>
            </div>
          )}

          {/* Bảng số liệu thống kê */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-450 uppercase block tracking-wider">Bảng số liệu thống kê</span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-905 text-white text-[10px] uppercase font-bold">
                    <th className="p-2.5 text-center w-12 border-r border-slate-700">ID</th>
                    <th className="p-2.5 border-r border-slate-700">Nội dung câu hỏi</th>
                    <th className="p-2.5 text-center w-16 border-r border-slate-700">Có</th>
                    <th className="p-2.5 text-center w-16 border-r border-slate-700">Không</th>
                    <th className="p-2.5 text-center w-24">Tỉ lệ Có</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {surveyQuestions
                    .filter(q => selectedQuestionIds.includes(q.id))
                    .map((q, idx) => {
                      const stats = tableStats[q.id] || { yesCount: 0, noCount: 0, percent: 0 };
                      const totalAnswers = stats.yesCount + stats.noCount;
                      return (
                        <tr key={q.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-2.5 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                          <td className="p-2.5 font-semibold text-slate-804 leading-snug border-r border-slate-100">{q.question_text}</td>
                          <td className="p-2.5 text-center text-slate-600 border-r border-slate-100">{stats.yesCount}</td>
                          <td className="p-2.5 text-center text-slate-600 border-r border-slate-100">{stats.noCount}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900 bg-slate-50/30">
                            {totalAnswers > 0 ? `${stats.percent.toFixed(1)}%` : '0.0%'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ký tên */}
          {includeSigningBlock && (
            <div className="grid grid-cols-2 text-center pt-6 text-xs font-semibold border-t border-dashed border-slate-250">
              <div className="space-y-1">
                <p className="uppercase text-slate-450 font-bold">NGƯỜI LẬP BÁO CÁO</p>
                <p className="text-[10px] text-slate-400 font-medium italic">(Ký và ghi rõ họ tên)</p>
                <div className="h-14" />
                <p className="text-slate-900 font-extrabold">{evaluatorName || 'NGƯỜI LẬP BÁO CÁO'}</p>
                <p className="text-[10px] text-slate-500 font-medium">{evaluatorDepartment || 'CƠ SỞ BẾN LỨC'}</p>
              </div>
              <div className="space-y-1">
                <p className="uppercase text-slate-900 font-bold">BAN GIÁM HIỆU</p>
                <p className="text-[10px] text-slate-400 font-medium italic">(Ký tên và đóng dấu)</p>
                <div className="h-14" />
                <p className="text-slate-900 font-extrabold">{approverTitle || 'BAN GIÁM HIỆU'}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{issuingDept || 'TRƯỜNG CAO ĐẲNG LONG AN'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          OFFSCREEN PERFECT PDF TARGET CONTAINER (Sử dụng cho xuất PDF trực tiếp - cập nhật theo mẫu mới hoàn toàn)
          ========================================== */}
      <div 
        id="direct-pdf-report-container" 
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '185mm',
          padding: '20mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '11px',
          lineHeight: '1.45'
        }}
      >
        {/* Tiêu đề cấp cơ sở */}
        <div style={{ textAlign: 'left', borderBottom: '2px solid #000000', paddingBottom: '16px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>
            {issuingDept || 'TRƯỜNG CAO ĐẲNG LONG AN - CƠ SỞ BẾN LỨC'}
          </p>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', color: '#000000', letterSpacing: '-0.02em' }}>
            {reportTitle || 'KẾT QUẢ THỐNG KÊ KHẢO SÁT'}
          </h1>
          {reportSubtitle && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontStyle: 'italic', color: '#475569' }}>
              {reportSubtitle}
            </p>
          )}
        </div>

        {/* Thông tin thông số cấu hình */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#1e293b', marginBottom: '20px', fontWeight: '500', lineHeight: '1.4' }}>
          <div>Ngày xuất báo cáo: {(() => {
            const d = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            return `${time} ${date}`;
          })()}</div>
          <div>Đợt khảo sát: {survey.title || 'Tất cả các đợt'}</div>
          <div>Thời gian khảo sát: {thoiGianKhaoSatValue}</div>
          <div>Lớp: {paramValues.lop}</div>
          <div>Môn học: {paramValues.monHoc}</div>
          <div>Giáo viên: {paramValues.giaoVien}</div>
          <div style={{ gridColumn: 'span 2' }}>Tổng số phiếu: {filteredResponses.length}</div>
        </div>

        {/* Nhận xét chung nếu có */}
        {reportRemarks && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <span style={{ fontWeight: 'bold', display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>Nhận xét & Khuyến nghị:</span>
            <div style={{ whiteSpace: 'pre-line', fontSize: '10.5px', color: '#1e293b' }}>{reportRemarks}</div>
          </div>
        )}

        {/* Bảng số liệu thống kê */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0c1b33', color: '#ffffff' }}>
              <th style={{ border: '1px solid #475569', padding: '8px 6px', textAlign: 'center', width: '35px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px' }}>ID</th>
              <th style={{ border: '1px solid #475569', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px' }}>Nội dung câu hỏi</th>
              <th style={{ border: '1px solid #475569', padding: '8px 6px', textAlign: 'center', width: '50px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px' }}>Có</th>
              <th style={{ border: '1px solid #475569', padding: '8px 6px', textAlign: 'center', width: '50px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px' }}>Không</th>
              <th style={{ border: '1px solid #475569', padding: '8px 6px', textAlign: 'center', width: '70px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px' }}>Tỉ lệ Có</th>
            </tr>
          </thead>
          <tbody>
            {surveyQuestions
              .filter(q => selectedQuestionIds.includes(q.id))
              .map((q, idx) => {
                const stats = tableStats[q.id] || { yesCount: 0, noCount: 0, percent: 0 };
                const totalAnswers = stats.yesCount + stats.noCount;
                return (
                  <tr key={q.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#475569' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left', color: '#0f172a', lineHeight: '1.3' }}>{q.question_text}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#334155' }}>{stats.yesCount}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#334155' }}>{stats.noCount}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#000000', fontWeight: 'bold' }}>
                      {totalAnswers > 0 ? `${stats.percent.toFixed(1)}%` : '0.0%'}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Khung ký phê duyệt nếu enabled */}
        {includeSigningBlock && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '25px', fontSize: '10px' }}>
            <div>
              <p style={{ margin: '0', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569' }}>NGƯỜI LẬP BÁO CÁO</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#64748b', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</p>
              <div style={{ height: '40px' }} />
              <p style={{ margin: '0', fontWeight: 'bold', color: '#0f172a' }}>{evaluatorName || 'NGƯỜI LẬP BÁO CÁO'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#475569' }}>{evaluatorDepartment || 'CƠ SỞ BẾN LỨC'}</p>
            </div>
            <div>
              <p style={{ margin: '0', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>BAN GIÁM HIỆU</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#64748b', fontStyle: 'italic' }}>(Ký tên và đóng dấu)</p>
              <div style={{ height: '40px' }} />
              <p style={{ margin: '0', fontWeight: 'bold', color: '#000000' }}>{approverTitle || 'BAN GIÁM HIỆU'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#475569', fontWeight: 'bold' }}>{issuingDept || 'TRƯỜNG CAO ĐẲNG LONG AN'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
