/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Survey, Question, QuestionOption, SurveyType, QuestionType, SurveyStatus } from '../types';
import { generateId } from '../lib/db';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  Workflow,
  PlusCircle,
  Hash,
  ListFilter,
  Layers,
  HelpCircle,
  Settings
} from 'lucide-react';

interface SurveyEditorProps {
  survey: Survey | null; // null if creating a new survey
  questions: Question[];
  options: QuestionOption[];
  onSave: (survey: Survey, questions: Question[], options: QuestionOption[]) => void;
  onCancel: () => void;
  questionTypes?: { id: string; name: string }[];
}

export const SurveyEditor: React.FC<SurveyEditorProps> = ({
  survey,
  questions,
  options,
  onSave,
  onCancel,
  questionTypes = []
}) => {
  // --- Part 1: Survey Core Fields ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SurveyType>('TEACHING');
  const [status, setStatus] = useState<SurveyStatus>('DRAFT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Part 2 & Part 3 Questions editing lists ---
  const [editorQuestions, setEditorQuestions] = useState<Question[]>([]);
  const [editorOptions, setEditorOptions] = useState<QuestionOption[]>([]);
  const [pendingTypeChange, setPendingTypeChange] = useState<SurveyType | null>(null);

  // Initialize and load survey details on mount/change
  useEffect(() => {
    if (survey) {
      setTitle(survey.title);
      setDescription(survey.description);
      setType(survey.type);
      setStatus(survey.status);
      setStartDate(survey.start_date);
      setEndDate(survey.end_date);
      setAllowMultiple(survey.metadata?.allow_multiple_responses || false);
      setSuccessMessage(survey.metadata?.success_message || '');

      const sQues = questions.filter(q => q.survey_id === survey.id);
      const sortedQues = [...sQues].sort((a, b) => a.order_number - b.order_number);
      setEditorQuestions(sortedQues);

      const qids = sortedQues.map(q => q.id);
      const sOpts = options.filter(o => qids.includes(o.question_id));
      setEditorOptions(sOpts);
    } else {
      // Defaults for brand new
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      setTitle('');
      setDescription('');
      setType('TEACHING');
      setStatus('DRAFT');
      setStartDate(todayStr);
      setEndDate(nextMonthStr);
      setAllowMultiple(false);
      setSuccessMessage('');

      // Pre-populate with typical questions for quick setups
      setupDefaultQuestionsForType('TEACHING');
    }
  }, [survey]);

  // Handler to helper seed default sample data on click
  const setupDefaultQuestionsForType = (newType: SurveyType) => {
    const tempSurveyId = survey?.id || 'TEMP_ID';
    const qParams: Question[] = [];
    const qContent: Question[] = [];
    const tempOpts: QuestionOption[] = [];

    if (newType === 'TEACHING') {
      const qClassId = `Q_${generateId()}`;
      const qSubjId = `Q_${generateId()}`;
      const qTeachId = `Q_${generateId()}`;

      qParams.push(
        { id: qClassId, survey_id: tempSurveyId, question_type: 'SINGLE_CHOICE', question_text: 'Chọn lớp học của bạn sân sinh viên', is_required: true, order_number: 1, metadata: { is_parameter: true } },
        { id: qSubjId, survey_id: tempSurveyId, question_type: 'SINGLE_CHOICE', question_text: 'Học phần được thực hiện đánh giá', is_required: true, order_number: 2, metadata: { is_parameter: true } },
        { id: qTeachId, survey_id: tempSurveyId, question_type: 'SINGLE_CHOICE', question_text: 'Giảng viên lên lớp chính thức', is_required: true, order_number: 3, metadata: { is_parameter: true } }
      );

      tempOpts.push(
        { id: `OP_${generateId()}`, question_id: qClassId, option_text: 'D20CNTT01', order_number: 1 },
        { id: `OP_${generateId()}`, question_id: qClassId, option_text: 'D20CNTT02', order_number: 2 },
        { id: `OP_${generateId()}`, question_id: qSubjId, option_text: 'Lập trình ứng dụng Web mới', order_number: 1 },
        { id: `OP_${generateId()}`, question_id: qSubjId, option_text: 'Cơ sở dữ liệu nâng cao', order_number: 2 },
        { id: `OP_${generateId()}`, question_id: qTeachId, option_text: 'TS. Nguyễn Văn Hải', order_number: 1 },
        { id: `OP_${generateId()}`, question_id: qTeachId, option_text: 'ThS. Trần Thị Mai', order_number: 2 }
      );

      qContent.push(
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'YES_NO', question_text: 'Giảng viên giảng dạy đầy đủ nội dung theo đề cương chuẩn học phần?', is_required: true, order_number: 4, metadata: { is_parameter: false } },
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'YES_NO', question_text: 'Tài liệu học tập được chuẩn bị và phân phối đầy đủ?', is_required: true, order_number: 5, metadata: { is_parameter: false } },
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Góp ý thiết thực thảo luận thêm?', is_required: false, order_number: 6, metadata: { is_parameter: false } }
      );
    } else if (newType === 'ALUMNI') {
      const qClassId = `Q_${generateId()}`;
      const qNameId = `Q_${generateId()}`;
      const qPhoneId = `Q_${generateId()}`;

      qParams.push(
        { id: qClassId, survey_id: tempSurveyId, question_type: 'SINGLE_CHOICE', question_text: 'Lớp niên khóa học tập', is_required: true, order_number: 1, metadata: { is_parameter: true } },
        { id: qNameId, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Họ và tên cựu sinh viên cựu học sinh', is_required: true, order_number: 2, metadata: { is_parameter: true } },
        { id: qPhoneId, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Số điện thoại di động cá nhân', is_required: true, order_number: 3, metadata: { is_parameter: true } }
      );

      tempOpts.push(
        { id: `OP_${generateId()}`, question_id: qClassId, option_text: 'D18CNTT01', order_number: 1 },
        { id: `OP_${generateId()}`, question_id: qClassId, option_text: 'D18CNTT02', order_number: 2 }
      );

      const qParentJobId = `Q_${generateId()}`;
      qContent.push({
        id: qParentJobId,
        survey_id: tempSurveyId,
        question_type: 'SINGLE_CHOICE',
        question_text: 'Tình trạng hiện tại của Anh/Chị về việc làm?',
        is_required: true,
        order_number: 4,
        metadata: { is_parameter: false }
      });

      const opYesId = `OP_${generateId()}`;
      const opNoId = `OP_${generateId()}`;
      tempOpts.push(
        { id: opYesId, question_id: qParentJobId, option_text: 'Đã có việc làm (bao gồm cả tự kinh doanh/freelance)', order_number: 1 },
        { id: opNoId, question_id: qParentJobId, option_text: 'Chưa có việc làm (đang tìm việc hoặc học tập nâng cao)', order_number: 2 }
      );

      qContent.push(
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Tên cơ quan, doanh nghiệp Anh/Chị đang phục vụ công tác?', is_required: true, order_number: 5, metadata: { is_parameter: false, dependency: { question_id: qParentJobId, expected_option_id: opYesId } } },
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Lý do chính hiện tại chưa ứng tuyển việc làm thành công?', is_required: true, order_number: 6, metadata: { is_parameter: false, dependency: { question_id: qParentJobId, expected_option_id: opNoId } } }
      );
    } else {
      // ENTERPRISE
      const qEntId = `Q_${generateId()}`;
      const qTaxId = `Q_${generateId()}`;
      const qRepId = `Q_${generateId()}`;

      qParams.push(
        { id: qEntId, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Tên cơ quan / Doanh nghiệp tuyển sinh', is_required: true, order_number: 1, metadata: { is_parameter: true } },
        { id: qTaxId, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Mã số thuế doanh nghiệp (MST)', is_required: true, order_number: 2, metadata: { is_parameter: true } },
        { id: qRepId, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Tên cán bộ đại diện / Cán bộ nhân sự', is_required: true, order_number: 3, metadata: { is_parameter: true } }
      );

      qContent.push(
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'YES_NO', question_text: 'Doanh nghiệp có mong muốn kết nối lâu dài giới thiệu học bổng?', is_required: true, order_number: 4, metadata: { is_parameter: false } },
        { id: `Q_${generateId()}`, survey_id: tempSurveyId, question_type: 'TEXT', question_text: 'Ý kiến góp ý bổ sung của Quý doanh nghiệp về phát triển chương trình đào tạo?', is_required: false, order_number: 5, metadata: { is_parameter: false } }
      );
    }

    setEditorQuestions([...qParams, ...qContent]);
    setEditorOptions(tempOpts);
  };

  // Switch type triggers reset
  const handleTypeChange = (newType: SurveyType) => {
    setType(newType);
    if (editorQuestions.length <= 4) {
      setPendingTypeChange(newType);
    }
  };

  // Split view groups for edit layout
  const editorParameterQuestions = useMemo(() => {
    return editorQuestions.filter(q => q.metadata?.is_parameter === true);
  }, [editorQuestions]);

  const editorMainQuestions = useMemo(() => {
    return editorQuestions.filter(q => q.metadata?.is_parameter !== true);
  }, [editorQuestions]);

  // --- ADD / DELETE / MOVE PARAMETERS (PART 2) ---
  const handleAddParameter = () => {
    const newId = `Q_${generateId()}`;
    // Insert parameters with low order_numbers
    const nextOrder = editorParameterQuestions.length > 0
      ? Math.max(...editorParameterQuestions.map(q => q.order_number)) + 1
      : 1;

    // Shift main questions orders higher if needed
    const shiftedMainQuestions = editorMainQuestions.map(q => ({
      ...q,
      order_number: q.order_number >= nextOrder ? q.order_number + 1 : q.order_number
    }));

    const newParam: Question = {
      id: newId,
      survey_id: survey?.id || 'TEMP_ID',
      question_type: 'TEXT', // Default textbox
      question_text: 'Tên tham số định danh mới',
      is_required: true,
      order_number: nextOrder,
      metadata: { is_parameter: true }
    };

    // Reconstruct
    setEditorQuestions([...editorParameterQuestions, newParam, ...shiftedMainQuestions].sort((a, b) => a.order_number - b.order_number));
  };

  // --- ADD / DELETE / MOVE MAIN QUESTIONS (PART 3) ---
  const handleAddMainQuestion = () => {
    const newId = `Q_${generateId()}`;
    const nextOrder = editorQuestions.length > 0
      ? Math.max(...editorQuestions.map(q => q.order_number)) + 1
      : 1;

    const newQ: Question = {
      id: newId,
      survey_id: survey?.id || 'TEMP_ID',
      question_type: 'YES_NO',
      question_text: 'Nội dung câu hỏi đánh giá mới',
      is_required: true,
      order_number: nextOrder,
      metadata: { is_parameter: false }
    };

    setEditorQuestions([...editorQuestions, newQ]);
  };

  // Update specific question field
  const handleUpdateQuestionField = (qid: string, field: keyof Question, value: any) => {
    setEditorQuestions(
      editorQuestions.map(q => {
        if (q.id === qid) {
          const updated = { ...q, [field]: value };
          // If changing type to YES_NO or TEXT, wipe unrelated options to save space
          if (field === 'question_type' && (value === 'YES_NO' || value === 'TEXT')) {
            setEditorOptions(editorOptions.filter(o => o.question_id !== qid));
          }
          return updated;
        }
        return q;
      })
    );
  };

  // Update question metadata property
  const handleUpdateQuestionMeta = (qid: string, metaField: string, value: any) => {
    setEditorQuestions(
      editorQuestions.map(q => {
        if (q.id === qid) {
          return {
            ...q,
            metadata: {
              ...q.metadata,
              [metaField]: value !== undefined && value !== '' ? value : undefined
            }
          };
        }
        return q;
      })
    );
  };

  // Delete question
  const handleDeleteQuestion = (qid: string) => {
    setEditorQuestions(editorQuestions.filter(q => q.id !== qid));
    setEditorOptions(editorOptions.filter(o => o.question_id !== qid));
  };

  // Shift ordering position
  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN', isParameterGroup: boolean) => {
    const activeList = isParameterGroup ? editorParameterQuestions : editorMainQuestions;
    const targetSubindex = direction === 'UP' ? index - 1 : index + 1;

    if (targetSubindex < 0 || targetSubindex >= activeList.length) return;

    // Create shallow copy of active list and swap
    const copyList = [...activeList];
    const temp = copyList[index];
    copyList[index] = copyList[targetSubindex];
    copyList[targetSubindex] = temp;

    // Merge with the complementary list and re-calculate all overall order numbers chronologically
    let merged: Question[] = [];
    if (isParameterGroup) {
      merged = [...copyList, ...editorMainQuestions];
    } else {
      merged = [...editorParameterQuestions, ...copyList];
    }

    const reorderedValue = merged.map((q, idx) => ({
      ...q,
      order_number: idx + 1
    }));

    setEditorQuestions(reorderedValue);
  };

  // --- MCQ OPTION MANAGEMENT ---
  const handleAddOption = (qid: string) => {
    const currentOpts = editorOptions.filter(o => o.question_id === qid);
    const nextOrder = currentOpts.length + 1;
    const newOpt: QuestionOption = {
      id: `OP_${generateId()}`,
      question_id: qid,
      option_text: `Tùy chọn số ${nextOrder}`,
      order_number: nextOrder
    };
    setEditorOptions([...editorOptions, newOpt]);
  };

  const handleUpdateOptionText = (opid: string, text: string) => {
    setEditorOptions(
      editorOptions.map(o => (o.id === opid ? { ...o, option_text: text } : o))
    );
  };

  const handleDeleteOption = (opid: string) => {
    setEditorOptions(editorOptions.filter(o => o.id !== opid));
  };

  // --- SAVE OPERATION ---
  const handleSaveAllFields = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề đợt khảo sát ở Phần 1.');
      return;
    }
    if (editorQuestions.length === 0) {
      alert('Đợt khảo sát phải chứa ít nhất 1 câu hỏi định dạng.');
      return;
    }

    const finalSurveyId = survey?.id || `SURVEY_${generateId()}`;

    const finalSurvey: Survey = {
      id: finalSurveyId,
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || new Date().toISOString().split('T')[0],
      metadata: {
        allow_multiple_responses: allowMultiple,
        success_message: successMessage.trim()
      },
      created_at: survey?.created_at || new Date().toISOString()
    };

    // Recalculate and re-map IDs to match finalSurveyId
    const finalQuestions = editorQuestions.map((q, idx) => ({
      ...q,
      survey_id: finalSurveyId,
      order_number: idx + 1
    }));

    onSave(finalSurvey, finalQuestions, editorOptions);
  };

  // Candidates for dependencies (only SINGLE_CHOICE or YES_NO questions that appear BEFORE this target index)
  const getBranchingOptionsCandidates = (currentQ: Question) => {
    return editorMainQuestions.filter(q => {
      return (
        q.id !== currentQ.id &&
        q.order_number < currentQ.order_number &&
        (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'YES_NO')
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-xs gap-3">
        <button
          onClick={onCancel}
          className="self-start flex items-center space-x-1 py-1.5 px-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/50 rounded-lg text-xs font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Hủy / Quay lại</span>
        </button>

        <h3 className="font-sans font-black text-slate-800 text-sm">
          {survey ? `Thiết kế: Đợt Khảo sát ${survey.id}` : 'Khởi tạo Đợt Khảo sát Mới'}
        </h3>

        <button
          onClick={handleSaveAllFields}
          className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/15 transition cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Lưu thay đổi đợt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ==========================================
            COLUMN 1: PART 1 (THÔNG TIN CHUNG)
            ========================================== */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h4 className="font-sans font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
              <FileText className="h-4.5 w-4.5 text-sky-500" />
              <span>Phần 1: Thông tin chung</span>
            </h4>

            {/* Template Class category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Phân loại Đợt tuyển tập</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as SurveyType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="TEACHING">Đánh giá chất lượng Giảng dạy (HSSV - Giáo viên)</option>
                <option value="ALUMNI">Khảo sát Tình hình Việc làm (Cựu sinh viên)</option>
                <option value="ENTERPRISE">Khảo sát ý kiến ý thức Đào tạo (Doanh nghiệp tuyển dụng)</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Tiêu đề đợt khảo sát *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Phiếu lấy ý kiến phản hồi về học phần..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Mô tả tóm tắt ý nghĩa</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Lời dẫn lời ngỏ chào mừng đến người làm khảo sát..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Success Message After Submission */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <span>Lời nhắn sau khi hoàn thành khảo sát</span>
                <span className="text-[9px] text-slate-400 font-normal">(Hiển thị sau khi nhấn Submit)</span>
              </label>
              <textarea
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Cảm ơn bạn rất nhiều vì những ý kiến đóng góp quý báu! Chúc bạn gặt hái nhiều thành công."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Close / Open Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 font-semibold">Ngày mở</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 font-semibold">Ngày khóa</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Multiple submissions setting */}
            <div className="flex items-center justify-between bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="block text-[11px] font-bold text-slate-700">Khảo sát nhiều lần?</span>
                <span className="text-[9px] text-slate-400 block">Cho phép nộp nhiều phiếu</span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="allow_multiple"
                    checked={allowMultiple === true}
                    onChange={() => setAllowMultiple(true)}
                    className="h-3.5 w-3.5 text-indigo-600"
                  />
                  <span className="text-xs text-slate-700 font-bold">Có</span>
                </label>
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="allow_multiple"
                    checked={allowMultiple === false}
                    onChange={() => setAllowMultiple(false)}
                    className="h-3.5 w-3.5 text-indigo-600"
                  />
                  <span className="text-xs text-slate-700 font-bold">Không</span>
                </label>
              </div>
            </div>

            {/* Publish state */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Trạng thái đợt phát hành</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SurveyStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="DRAFT">Bản nháp (DRAFT - Không nộp được)</option>
                <option value="PUBLISHED">Công bố (PUBLISHED - Điền được phiếu)</option>
                <option value="CLOSED">Đóng đợt (CLOSED - Khóa số, chỉ xem thống kê)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ==========================================
            COLUMN 2 & 3: PARTS 2 & Part 3 (QUESTIONNAIRES DESIGNER)
            ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ==========================================
              PART 2: PARAMETERS CONSOLE
              ========================================== */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-sans font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Settings className="h-4.5 w-4.5 text-sky-500" />
                  <span>Phần 2: Cấu hình Tham số / Đối tượng</span>
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Thông tin lọc và liên kết định dạng (Lớp, Môn, GV, Tên DN...) gom ở đầu khảo sát.</p>
              </div>

              <button
                type="button"
                onClick={handleAddParameter}
                className="flex items-center space-x-1 px-3 py-1.5 bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold scale-95 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm tham số</span>
              </button>
            </div>

            {editorParameterQuestions.length === 0 ? (
              <p className="text-xs italic text-slate-400 text-center py-4">Bấm nút "Thêm tham số" để thiết lập trường thông tin định dạng ở đầu phiếu.</p>
            ) : (
              <div className="space-y-3">
                {editorParameterQuestions.map((q, qidx) => {
                  const paramOptions = editorOptions.filter(o => o.question_id === q.id);

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:border-sky-200 transition space-y-3 relative"
                    >
                      {/* Floating utilities */}
                      <div className="absolute right-3 top-3 flex items-center space-x-1 bg-white border border-slate-100 px-1.5 py-1 rounded-md">
                        <span className="font-mono text-[9px] text-slate-450 font-black mr-2">TS {qidx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qidx, 'UP', true)}
                          disabled={qidx === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Lên"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qidx, 'DOWN', true)}
                          disabled={qidx === editorParameterQuestions.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Xuống"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-0.5 text-rose-500 hover:bg-rose-50 rounded ml-1"
                          title="Xóa tham số này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Header text inputs */}
                      <div className="space-y-1.5 pr-28">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Tên tham số (VD: Lớp niên khóa của bạn)</label>
                        <input
                          type="text"
                          value={q.question_text}
                          onChange={(e) => handleUpdateQuestionField(q.id, 'question_text', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                        />
                      </div>

                      {/* Config widgets */}
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Kiểu hiển thị</label>
                          <select
                            value={q.question_type}
                            onChange={(e) => handleUpdateQuestionField(q.id, 'question_type', e.target.value as QuestionType)}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                          >
                            {questionTypes
                              .filter(qt => qt.id === 'TEXT' || qt.id === 'text' || qt.id === 'SINGLE_CHOICE' || qt.id === 'radio')
                              .map(qt => (
                                <option key={qt.id} value={qt.id}>
                                  {qt.name} ({qt.id})
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        <div className="flex items-center space-x-1.5 pt-3">
                          <input
                            type="checkbox"
                            id={`req_chk_para_${q.id}`}
                            checked={q.is_required}
                            onChange={(e) => handleUpdateQuestionField(q.id, 'is_required', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-300"
                          />
                          <label htmlFor={`req_chk_para_${q.id}`} className="text-xs text-slate-600 font-bold cursor-pointer">
                            Bắt buộc ghi nhận
                          </label>
                        </div>
                      </div>

                      {/* Dropdown Options editor panel */}
                      {q.question_type === 'SINGLE_CHOICE' && (
                        <div className="mt-2.5 border-t border-dashed border-slate-200 pt-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-450 uppercase flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              Lựa chọn của Dropdown danh mục:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddOption(q.id)}
                              className="text-[9px] text-sky-600 bg-white border border-sky-100 hover:bg-sky-50 px-2 py-0.5 rounded font-extrabold transition flex items-center space-x-0.5"
                            >
                              <PlusCircle className="h-2.5 w-2.5" />
                              <span>Thêm dòng</span>
                            </button>
                          </div>

                          {paramOptions.length === 0 ? (
                            <p className="text-[9px] text-rose-500 italic">Nhấp "Thêm dòng" để thiết lập giá trị danh mục cho dropdown</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white p-2 rounded-xl border border-slate-100">
                              {paramOptions.map((opt, oidx) => (
                                <div key={opt.id} className="flex items-center space-x-1.5 bg-slate-50 px-1.5 py-1 rounded-lg border border-slate-200/50">
                                  <span className="text-[8px] font-mono font-bold text-slate-400">{oidx + 1}.</span>
                                  <input
                                    type="text"
                                    value={opt.option_text}
                                    onChange={(e) => handleUpdateOptionText(opt.id, e.target.value)}
                                    className="flex-1 text-[10px] bg-transparent focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(opt.id)}
                                    className="p-0.5 text-slate-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
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
            )}
          </div>

          {/* ==========================================
              PART 3: CONTENT QUESTIONNAIRE
              ========================================== */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-sans font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Workflow className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Phần 3: Cấu trúc Bộ Câu hỏi Khảo sát</span>
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Trình thiết kế nội dung câu hỏi chính và logic rẽ nhánh động.</p>
              </div>

              <button
                type="button"
                onClick={handleAddMainQuestion}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold scale-95 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Câu hỏi chính</span>
              </button>
            </div>

            {editorMainQuestions.length === 0 ? (
              <p className="text-xs italic text-slate-400 text-center py-6">Nhấp "Thêm Câu hỏi chính" nhằm chuẩn bị câu hỏi phản hồi ý kiến.</p>
            ) : (
              <div className="space-y-4">
                {editorMainQuestions.map((q, qidx) => {
                  const mainOpts = editorOptions.filter(o => o.question_id === q.id);
                  const branchingCandidates = getBranchingOptionsCandidates(q);

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition duration-150 space-y-3 relative"
                    >
                      {/* Floating utilities */}
                      <div className="absolute right-3 top-3 flex items-center space-x-1 bg-slate-100/60 p-1 rounded-lg">
                        <span className="font-mono text-[9px] text-slate-500 font-bold mr-1.5 pl-1.5">Câu {qidx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qidx, 'UP', false)}
                          disabled={qidx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Lên"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qidx, 'DOWN', false)}
                          disabled={qidx === editorMainQuestions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Xuống"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded transition"
                          title="Xóa câu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Content label field */}
                      <div className="space-y-1.5 pr-28">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block">Nội dung câu hỏi đánh giá</label>
                        <input
                          type="text"
                          value={q.question_text}
                          onChange={(e) => handleUpdateQuestionField(q.id, 'question_text', e.target.value)}
                          placeholder="Ví dụ: Giảng viên truyền đạt dễ hiểu?"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                        />
                      </div>

                      {/* Formatting panel row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block">Dạng câu trả lời</label>
                          <select
                            value={q.question_type}
                            onChange={(e) => handleUpdateQuestionField(q.id, 'question_type', e.target.value as QuestionType)}
                            className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                          >
                            {questionTypes.map((qt) => (
                              <option key={qt.id} value={qt.id}>
                                {qt.name} ({qt.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                          <input
                            type="checkbox"
                            id={`req_chk_main_${q.id}`}
                            checked={q.is_required}
                            onChange={(e) => handleUpdateQuestionField(q.id, 'is_required', e.target.checked)}
                            className="h-3.5 w-3.5 text-indigo-600 border-slate-300"
                          />
                          <label htmlFor={`req_chk_main_${q.id}`} className="text-xs text-slate-600 font-bold cursor-pointer">
                            Bắt buộc phản hồi
                          </label>
                        </div>
                      </div>

                      {/* Branching logical configurations (GENEALOGY!) */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-2">
                        <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Workflow className="h-3 w-3" />
                          Thiết lập rẽ nhánh (Phụ thuộc câu hỏi trước)
                        </span>

                        {branchingCandidates.length === 0 ? (
                          <p className="text-[9.5px] italic text-slate-400 mt-0.5">Không có câu hỏi Trắc nghiệm/Yes-No nào xuất hiện trước câu này để rẽ nhánh.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {/* Select parent question */}
                            <div className="space-y-1">
                              <span className="text-slate-450 text-[9px]">Chọn câu hỏi gốc:</span>
                              <select
                                value={q.metadata?.dependency?.question_id || ''}
                                onChange={(e) => {
                                  const parentId = e.target.value;
                                  if (!parentId) {
                                    handleUpdateQuestionMeta(q.id, 'dependency', undefined);
                                  } else {
                                    handleUpdateQuestionMeta(q.id, 'dependency', {
                                      question_id: parentId,
                                      expected_option_id: ''
                                    });
                                  }
                                }}
                                className="w-full px-2 py-0.5 border border-slate-200 text-[10px] rounded bg-white text-slate-700 font-medium"
                              >
                                <option value="">-- Luôn hiển thị (Mặc định) --</option>
                                {branchingCandidates.map(bc => (
                                  <option key={bc.id} value={bc.id}>
                                    Câu {editorQuestions.indexOf(bc) + 1 - editorParameterQuestions.length}: {bc.question_text.substring(0, 30)}...
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Select trigger value (expected_option_id) */}
                            {q.metadata?.dependency?.question_id && (
                              <div className="space-y-1 animate-fade-in">
                                <span className="text-slate-450 text-[9px]">Khi câu gốc được chọn là:</span>
                                {(() => {
                                  const selectedParentObj = branchingCandidates.find(
                                    bc => bc.id === q.metadata?.dependency?.question_id
                                  );

                                  if (selectedParentObj?.question_type === 'YES_NO') {
                                    return (
                                      <select
                                        value={q.metadata?.dependency?.expected_option_id || ''}
                                        onChange={(e) => {
                                          const dep = q.metadata.dependency;
                                          handleUpdateQuestionMeta(q.id, 'dependency', {
                                            ...dep,
                                            expected_option_id: e.target.value
                                          });
                                        }}
                                        className="w-full px-2 py-0.5 border border-slate-200 text-[10px] rounded bg-white text-slate-700 font-medium"
                                      >
                                        <option value="">-- Chọn option kích hoạt --</option>
                                        <option value="YES">Đúng (YES)</option>
                                        <option value="NO">Sai (NO)</option>
                                      </select>
                                    );
                                  } else {
                                    const parentOpts = editorOptions.filter(
                                      o => o.question_id === q.metadata?.dependency?.question_id
                                    );
                                    return (
                                      <select
                                        value={q.metadata?.dependency?.expected_option_id || ''}
                                        onChange={(e) => {
                                          const dep = q.metadata.dependency;
                                          handleUpdateQuestionMeta(q.id, 'dependency', {
                                            ...dep,
                                            expected_option_id: e.target.value
                                          });
                                        }}
                                        className="w-full px-2 py-0.5 border border-slate-200 text-[10px] rounded bg-white text-slate-700 font-medium"
                                      >
                                        <option value="">-- Chọn một option trắc nghiệm --</option>
                                        {parentOpts.map(po => (
                                          <option key={po.id} value={po.id}>
                                            {po.option_text}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Custom Choice editor if SINGLE_CHOICE / MULTIPLE_CHOICE */}
                      {(q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'radio' || q.question_type === 'checkbox') && (
                        <div className="mt-2 text-xs border-t border-dashed border-slate-150 pt-3 space-y-2 bg-slate-50/40 p-2.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-450 uppercase flex items-center gap-1">
                              <Hash className="h-3 w-3 text-slate-400" />
                              Lựa chọn trắc nghiệm Câu {qidx + 1}:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddOption(q.id)}
                              className="text-[9px] text-indigo-700 bg-white hover:bg-slate-100 border border-slate-250 px-2 py-0.5 rounded font-extrabold flex items-center space-x-0.5 transition"
                            >
                              <PlusCircle className="h-3 w-3" />
                              <span>Thêm tùy chọn</span>
                            </button>
                          </div>

                          {mainOpts.length === 0 ? (
                            <p className="text-[9px] text-rose-500 italic">Bấm "Thêm tùy chọn" để tạo list phương án trả lời.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mainOpts.map((opt, oidx) => (
                                <div key={opt.id} className="flex items-center space-x-1 border border-slate-200/60 bg-white p-1 rounded-lg">
                                  <span className="font-mono text-[9px] font-bold text-slate-400 pl-1">{oidx + 1}.</span>
                                  <input
                                    type="text"
                                    value={opt.option_text}
                                    onChange={(e) => handleUpdateOptionText(opt.id, e.target.value)}
                                    className="flex-1 bg-slate-50 px-2 py-0.5 rounded text-[11px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(opt.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500"
                                    title="Xóa option này"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
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
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM DIALOG: Type Change Defaults Configuration Modal (By-passing Iframe dialogue blockers) */}
      {pendingTypeChange && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative animate-in scale-in duration-200">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Layers className="h-6 w-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-sans font-extrabold text-base text-slate-900 leading-snug tracking-tight">
                  Tải danh sách câu hỏi mẫu?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed px-1">
                  Bạn có muốn hệ thống tự động thiết lập lại danh sách câu hỏi & tham số cơ bản tương ứng với loại khảo sát mới chọn này không?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingTypeChange(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Giữ mặc định cũ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setupDefaultQuestionsForType(pendingTypeChange);
                    setPendingTypeChange(null);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10"
                >
                  Đồng ý Thiết lập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
