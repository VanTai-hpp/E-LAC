/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Survey, Question, QuestionOption, Response, Answer, SurveyType, ResponseMetadata } from '../types';

export const toUUID = (str: string): string => {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const s = str.trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (uuidRegex.test(s)) {
    return s;
  }
  let hash1 = 0;
  for (let i = 0; i < s.length; i++) {
    hash1 = (hash1 << 5) - hash1 + s.charCodeAt(i);
    hash1 |= 0;
  }
  let hash2 = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    hash2 = (hash2 << 5) - hash2 + s.charCodeAt(i);
    hash2 |= 0;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash2).toString(16).substring(0, 4).padStart(4, '0');
  const part3 = '4' + Math.abs(hash1 ^ hash2).toString(16).substring(0, 3).padStart(3, '0');
  const part4 = '8' + Math.abs(hash1).toString(16).substring(0, 3).padStart(3, '0');
  const part5 = Math.abs(hash2 * 31).toString(16).substring(0, 12).padEnd(12, 'a');
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const STORAGE_KEYS = {
  SURVEYS: 'survey_app_surveys_v1',
  QUESTIONS: 'survey_app_questions_v1',
  OPTIONS: 'survey_app_options_v1',
  RESPONSES: 'survey_app_responses_v1',
  ANSWERS: 'survey_app_answers_v1',
};

// --- INITIAL SEED DATA ---
const getInitialSeedData = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0];

  const surveys: Survey[] = [];
  const questions: Question[] = [];
  const options: QuestionOption[] = [];
  const responses: Response[] = [];
  const answers: Answer[] = [];

  // ==========================================
  // SEED SURVEY 1: KHẢO SÁT GIÁO VIÊN (TEACHING)
  // ==========================================
  const survey1Id = 'SURVEY_TEACHING_01';
  surveys.push({
    id: survey1Id,
    title: 'Khảo sát Chất lượng Giảng dạy Học kỳ II - Giảng viên & Môn học',
    description: 'Khảo sát ý kiến phản hồi của sinh viên nhằm nâng cao chất lượng dạy và học các học kỳ tiếp theo đối với cán bộ giảng dạy tại Nhà trường.',
    type: 'TEACHING',
    status: 'PUBLISHED',
    start_date: startDate,
    end_date: endDate,
    metadata: {
      allow_multiple_responses: false
    },
    created_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString()
  });

  // --- Part 2: Parameter questions (is_parameter: true) ---
  questions.push({
    id: 'S1_Q_CLASS',
    survey_id: survey1Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Lớp học của sinh viên (Chọn lớp học hiện tại)',
    is_required: true,
    order_number: 1,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: 'S1_OP_CLASS_1', question_id: 'S1_Q_CLASS', option_text: 'D20CNTT01', order_number: 1 },
    { id: 'S1_OP_CLASS_2', question_id: 'S1_Q_CLASS', option_text: 'D20CNTT02', order_number: 2 },
    { id: 'S1_OP_CLASS_3', question_id: 'S1_Q_CLASS', option_text: 'D20CNTT03', order_number: 3 },
    { id: 'S1_OP_CLASS_4', question_id: 'S1_Q_CLASS', option_text: 'D21CNTT01', order_number: 4 },
    { id: 'S1_OP_CLASS_5', question_id: 'S1_Q_CLASS', option_text: 'D19CNTT01', order_number: 5 }
  );

  questions.push({
    id: 'S1_Q_SUBJECT',
    survey_id: survey1Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Học phần thực hiện đánh giá',
    is_required: true,
    order_number: 2,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: 'S1_OP_SUBJ_1', question_id: 'S1_Q_SUBJECT', option_text: 'Lập trình ứng dụng Web mới', order_number: 1 },
    { id: 'S1_OP_SUBJ_2', question_id: 'S1_Q_SUBJECT', option_text: 'Cơ sở dữ liệu nâng cao', order_number: 2 },
    { id: 'S1_OP_SUBJ_3', question_id: 'S1_Q_SUBJECT', option_text: 'Trí tuệ nhân tạo & Học máy', order_number: 3 },
    { id: 'S1_OP_SUBJ_4', question_id: 'S1_Q_SUBJECT', option_text: 'Thiết kế giao diện UI/UX', order_number: 4 }
  );

  questions.push({
    id: 'S1_Q_TEACHER',
    survey_id: survey1Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Giảng viên lên lớp trực tiếp của học phần',
    is_required: true,
    order_number: 3,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: 'S1_OP_TEACH_1', question_id: 'S1_Q_TEACHER', option_text: 'TS. Nguyễn Văn Hải', order_number: 1 },
    { id: 'S1_OP_TEACH_2', question_id: 'S1_Q_TEACHER', option_text: 'ThS. Trần Thị Mai', order_number: 2 },
    { id: 'S1_OP_TEACH_3', question_id: 'S1_Q_TEACHER', option_text: 'PGS.TS. Lê Hoàng Nam', order_number: 3 },
    { id: 'S1_OP_TEACH_4', question_id: 'S1_Q_TEACHER', option_text: 'ThS. Đỗ Minh Quân', order_number: 4 }
  );

  // --- Part 3: Main content questions (is_parameter: false) ---
  const s1Ques = [
    { id: 'S1_Q1', text: 'Giảng viên lên lớp đúng giờ, thực hiện giảng dạy đầy đủ nội dung môn học?', type: 'YES_NO' as const },
    { id: 'S1_Q2', text: 'Tài liệu hướng dẫn, đề cương chi tiết môn học được cung cấp đầy đủ và kịp thời?', type: 'YES_NO' as const },
    { id: 'S1_Q3', text: 'Phương pháp giảng dạy của giảng viên rõ ràng, kích thích tư duy sáng tạo?', type: 'YES_NO' as const },
    { id: 'S1_Q4', text: 'Giảng viên nhiệt tình hỗ trợ, giải đáp thỏa đáng thắc mắc ngoài giờ lên lớp?', type: 'YES_NO' as const },
    { id: 'S1_Q5', text: 'Ý kiến đóng góp khác giúp giảng viên nâng cao chất lượng bài giảng?', type: 'TEXT' as const, req: false }
  ];

  s1Ques.forEach((q, idx) => {
    questions.push({
      id: q.id,
      survey_id: survey1Id,
      question_type: q.type,
      question_text: q.text,
      is_required: q.req !== false,
      order_number: idx + 4,
      metadata: { is_parameter: false }
    });
  });

  const s1Classes = ['D20CNTT01', 'D20CNTT02', 'D21CNTT01'];
  const s1ClassOpIds = ['S1_OP_CLASS_1', 'S1_OP_CLASS_2', 'S1_OP_CLASS_4'];
  const s1Subjects = ['Lập trình ứng dụng Web mới', 'Cơ sở dữ liệu nâng cao', 'Trí tuệ nhân tạo & Học máy'];
  const s1SubjectOpIds = ['S1_OP_SUBJ_1', 'S1_OP_SUBJ_2', 'S1_OP_SUBJ_3'];
  const s1Teachers = ['TS. Nguyễn Văn Hải', 'ThS. Trần Thị Mai', 'PGS.TS. Lê Hoàng Nam'];
  const s1TeacherOpIds = ['S1_OP_TEACH_1', 'S1_OP_TEACH_2', 'S1_OP_TEACH_3'];

  const s1Comments = [
    'Giảng viên dạy cực kì tâm huyết, thực hành nhiều bài tập thực tế.',
    'Thầy cô giảng bài dễ hiểu, tốc độ bài giảng vừa phải, slide đẹp.',
    'Mong muốn tài liệu được dịch sát nghĩa tiếng Việt hơn.',
    'Em rất thích phương pháp trao đổi và chấm bài tập nhóm của thầy.',
    'Cần bổ sung thêm ví dụ thực tế về các dự án đã triển khai.',
    'Thầy giảng hơi nhanh ở những phần cuối, còn lại rất xuất sắc.'
  ];

  // Seed 14 responses for teaching
  for (let i = 1; i <= 14; i++) {
    const resId = `S1_RES_${i}`;
    const clIdx = i % s1Classes.length;
    const subIdx = i % s1Subjects.length;
    const teaIdx = i % s1Teachers.length;

    responses.push({
      id: resId,
      survey_id: survey1Id,
      submitted_at: new Date(now.getTime() - (i * 4 * 3600 * 1000)).toISOString(),
      metadata: {
        class_name: s1Classes[clIdx],
        subject_name: s1Subjects[subIdx],
        teacher_name: s1Teachers[teaIdx]
      }
    });

    // Answers to Part 2 parameter questions (essential to populate 'answers')
    answers.push({
      id: `${resId}_AP1`,
      response_id: resId,
      question_id: 'S1_Q_CLASS',
      answer_text: s1Classes[clIdx],
      option_id: s1ClassOpIds[clIdx]
    });
    answers.push({
      id: `${resId}_AP2`,
      response_id: resId,
      question_id: 'S1_Q_SUBJECT',
      answer_text: s1Subjects[subIdx],
      option_id: s1SubjectOpIds[subIdx]
    });
    answers.push({
      id: `${resId}_AP3`,
      response_id: resId,
      question_id: 'S1_Q_TEACHER',
      answer_text: s1Teachers[teaIdx],
      option_id: s1TeacherOpIds[teaIdx]
    });

    // Answers to Part 3 content questions
    answers.push({ id: `${resId}_A1`, response_id: resId, question_id: 'S1_Q1', answer_text: i % 5 === 0 ? 'NO' : 'YES' });
    answers.push({ id: `${resId}_A2`, response_id: resId, question_id: 'S1_Q2', answer_text: i % 6 === 0 ? 'NO' : 'YES' });
    answers.push({ id: `${resId}_A3`, response_id: resId, question_id: 'S1_Q3', answer_text: i % 4 === 0 ? 'NO' : 'YES' });
    answers.push({ id: `${resId}_A4`, response_id: resId, question_id: 'S1_Q4', answer_text: i % 7 === 0 ? 'NO' : 'YES' });
    if (i % 2 === 0) {
      answers.push({
        id: `${resId}_A5`,
        response_id: resId,
        question_id: 'S1_Q5',
        answer_text: s1Comments[i % s1Comments.length]
      });
    }
  }

  // ==========================================
  // SEED SURVEY 2: VIỆC LÀM SAU TỐT NGHIỆP (ALUMNI)
  // ==========================================
  const survey2Id = 'SURVEY_ALUMNI_02';
  surveys.push({
    id: survey2Id,
    title: 'Khảo sát Tình hình Việc làm của Cựu sinh viên sau khi tốt nghiệp',
    description: 'Khảo sát nhằm thống kê tỷ lệ sinh viên có việc làm sau tốt nghiệp từ 6 đến 12 tháng, phục vụ công tác kiểm định chất lượng đào tạo và hoàn thiện đề án việc làm của Nhà trường.',
    type: 'ALUMNI',
    status: 'PUBLISHED',
    start_date: startDate,
    end_date: endDate,
    metadata: {
      allow_multiple_responses: false
    },
    created_at: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString()
  });

  // --- Part 2: Parameter questions (is_parameter: true) ---
  questions.push({
    id: 'S2_Q_CLASS',
    survey_id: survey2Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Lớp học khóa học đào tạo (Cựu sinh viên)',
    is_required: true,
    order_number: 1,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: 'S2_OP_CL_1', question_id: 'S2_Q_CLASS', option_text: 'D18CNTT01', order_number: 1 },
    { id: 'S2_OP_CL_2', question_id: 'S2_Q_CLASS', option_text: 'D18CNTT02', order_number: 2 },
    { id: 'S2_OP_CL_3', question_id: 'S2_Q_CLASS', option_text: 'D18DTVT01', order_number: 3 },
    { id: 'S2_OP_CL_4', question_id: 'S2_Q_CLASS', option_text: 'D18QTKD01', order_number: 4 }
  );

  questions.push({
    id: 'S2_Q_STUDENT_ID',
    survey_id: survey2Id,
    question_type: 'TEXT',
    question_text: 'Mã số sinh viên (HSSV) cựu học sinh',
    is_required: true,
    order_number: 2,
    metadata: { is_parameter: true }
  });

  questions.push({
    id: 'S2_Q_FULLNAME',
    survey_id: survey2Id,
    question_type: 'TEXT',
    question_text: 'Họ và tên cựu học viên',
    is_required: true,
    order_number: 3,
    metadata: { is_parameter: true }
  });

  questions.push({
    id: 'S2_Q_PHONE',
    survey_id: survey2Id,
    question_type: 'TEXT',
    question_text: 'Số điện thoại liên lạc cá nhân',
    is_required: true,
    order_number: 4,
    metadata: { is_parameter: true }
  });

  // --- Part 3: Main Dynamic Content Questionnaire (is_parameter: false) ---
  // Base branches question
  questions.push({
    id: 'S2_Q_JOB',
    survey_id: survey2Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Tình trạng hiện tại của Anh/Chị về việc làm?',
    is_required: true,
    order_number: 5,
    metadata: { is_parameter: false }
  });

  const opJobYes = { id: 'S2_OP_JOB_YES', question_id: 'S2_Q_JOB', option_text: 'Đã có việc làm (bao gồm cả tự kinh doanh/freelance)', order_number: 1 };
  const opJobNo = { id: 'S2_OP_JOB_NO', question_id: 'S2_Q_JOB', option_text: 'Chưa có việc làm (đang tìm việc hoặc học tập nâng cao)', order_number: 2 };
  options.push(opJobYes, opJobNo);

  // Group ĐÃ CÓ VIỆC LÀM (dependency on opJobYes)
  const yesQ = [
    { id: 'S2_Q_CO_1', text: 'Tên cơ quan, doanh nghiệp hoặc đơn vị Anh/Chị đang công tác?', type: 'TEXT' as const, req: true },
    { id: 'S2_Q_CO_2', text: 'Vị trí công việc chính đảm nhận?', type: 'SINGLE_CHOICE' as const, req: true, opts: ['Nhân viên kỹ thuật/Lập trình viên', 'Chuyên viên kiểm thử/QA', 'Chuyên viên phân tích hệ thống/BA', 'Quản lý nhóm/Trưởng phòng', 'Tự kinh doanh/Khởi nghiệp', 'Khác'] },
    { id: 'S2_Q_CO_3', text: 'Mức thu nhập trung bình hàng tháng (VNĐ)?', type: 'SINGLE_CHOICE' as const, req: true, opts: ['Dưới 8 triệu', 'Từ 8 - 12 triệu', 'Từ 12 - 20 triệu', 'Trên 20 triệu'] },
    { id: 'S2_Q_CO_4', text: 'Nhận xét về tương quan chuyên ngành đào tạo với công việc hiện tại?', type: 'SINGLE_CHOICE' as const, req: true, opts: ['Phù hợp hoàn toàn (Đúng ngành học)', 'Phù hợp một phần (Ngành gần)', 'Không liên quan gì'] }
  ];

  yesQ.forEach((q, idx) => {
    questions.push({
      id: q.id,
      survey_id: survey2Id,
      question_type: q.type,
      question_text: q.text,
      is_required: q.req,
      order_number: idx + 6,
      metadata: {
        is_parameter: false,
        dependency: {
          question_id: 'S2_Q_JOB',
          expected_option_id: 'S2_OP_JOB_YES'
        }
      }
    });

    if (q.opts) {
      q.opts.forEach((oText, oIdx) => {
        options.push({
          id: `${q.id}_OP_${oIdx}`,
          question_id: q.id,
          option_text: oText,
          order_number: oIdx + 1
        });
      });
    }
  });

  // Group CHƯA CÓ VIỆC LÀM (dependency on opJobNo)
  const noQ = [
    { id: 'S2_Q_KH_1', text: 'Lý do chủ yếu hiện tại Anh/Chị chưa có việc làm?', type: 'SINGLE_CHOICE' as const, req: true, opts: ['Đang chuẩn bị học lên cao học/Du học', 'Đang ôn thi chứng chỉ/Mất định hướng nghề nghiệp', 'Chờ phản hồi phỏng vấn từ các công ty', 'Yêu cầu tuyển dụng quá cao, thiếu kinh nghiệm', 'Khác'] },
    { id: 'S2_Q_KH_2', text: 'Nguyện vọng hoặc lĩnh vực công tác Anh/Chị đang hướng tới nhiều nhất?', type: 'TEXT' as const, req: true },
    { id: 'S2_Q_KH_3', text: 'Anh/Chị mong muốn Nhà trường hỗ trợ thêm điều gì trong việc kết nối nghề nghiệp?', type: 'SINGLE_CHOICE' as const, req: true, opts: ['Tổ chức thêm khóa đào tạo kỹ năng viết CV & phỏng vấn', 'Giới thiệu thông tin thực tập/việc làm trực tiếp', 'Tạo sân chơi định hướng/Ngày hội kết nối cựu sinh viên', 'Khác'] }
  ];

  noQ.forEach((q, idx) => {
    questions.push({
      id: q.id,
      survey_id: survey2Id,
      question_type: q.type,
      question_text: q.text,
      is_required: q.req,
      order_number: idx + 10,
      metadata: {
        is_parameter: false,
        dependency: {
          question_id: 'S2_Q_JOB',
          expected_option_id: 'S2_OP_JOB_NO'
        }
      }
    });

    if (q.opts) {
      q.opts.forEach((oText, oIdx) => {
        options.push({
          id: `${q.id}_OP_${oIdx}`,
          question_id: q.id,
          option_text: oText,
          order_number: oIdx + 1
        });
      });
    }
  });

  // Seed 10 responses for alumni: 7 Yes, 3 No
  const names = ['Nguyễn Hoàng Long', 'Trần Phương Thảo', 'Phạm Minh Đức', 'Lê Khánh Linh', 'Bùi Văn Hùng', 'Vũ Thị Minh', 'Đặng Quốc Bảo', 'Hoàng Bảo Trâm', 'Đỗ Thành Trung', 'Lê Minh Tuấn'];
  const phones = ['0912111111', '0922222222', '0933333333', '0944444444', '0955555555', '0966666666', '0977777777', '0988888888', '0999999999', '0911223344'];
  const classesList = ['D18CNTT01', 'D18CNTT02', 'D18DTVT01', 'D18QTKD01'];
  const classesOpIds = ['S2_OP_CL_1', 'S2_OP_CL_2', 'S2_OP_CL_3', 'S2_OP_CL_4'];

  const companies = ['FPT Software', 'Viettel Group', 'VNG Corporation', 'VNPAY', 'Tiki JSC', 'CMC Global', 'Sotatek'];
  const positions = ['S2_Q_CO_2_OP_0', 'S2_Q_CO_2_OP_1', 'S2_Q_CO_2_OP_0', 'S2_Q_CO_2_OP_2', 'S2_Q_CO_2_OP_0', 'S2_Q_CO_2_OP_4', 'S2_Q_CO_2_OP_0'];
  const salaries = ['S2_Q_CO_3_OP_2', 'S2_Q_CO_3_OP_3', 'S2_Q_CO_3_OP_2', 'S2_Q_CO_3_OP_1', 'S2_Q_CO_3_OP_2', 'S2_Q_CO_3_OP_3', 'S2_Q_CO_3_OP_1'];
  const fitness = ['S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_1', 'S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_1', 'S2_Q_CO_4_OP_0'];

  for (let i = 0; i < 10; i++) {
    const resId = `S2_RES_${i + 1}`;
    const hasJob = i < 7 ? 'Có' : 'Không';
    const clIdx = i % classesList.length;
    const stdId = `18DCCN${String(i + 15).padStart(3, '0')}`;

    responses.push({
      id: resId,
      survey_id: survey2Id,
      submitted_at: new Date(now.getTime() - (i * 12 * 3600 * 1000)).toISOString(),
      metadata: {
        fullname: names[i],
        student_id: stdId,
        phone: phones[i],
        class_name: classesList[clIdx],
        job_status: hasJob
      }
    });

    // Answers to Part 2 parameter questions
    answers.push({ id: `${resId}_AP1`, response_id: resId, question_id: 'S2_Q_CLASS', answer_text: classesList[clIdx], option_id: classesOpIds[clIdx] });
    answers.push({ id: `${resId}_AP2`, response_id: resId, question_id: 'S2_Q_STUDENT_ID', answer_text: stdId });
    answers.push({ id: `${resId}_AP3`, response_id: resId, question_id: 'S2_Q_FULLNAME', answer_text: names[i] });
    answers.push({ id: `${resId}_AP4`, response_id: resId, question_id: 'S2_Q_PHONE', answer_text: phones[i] });

    // Primary questions answers
    answers.push({
      id: `${resId}_A_JOB`,
      response_id: resId,
      question_id: 'S2_Q_JOB',
      answer_text: hasJob === 'Có' ? 'Đã có việc làm (bao gồm cả tự kinh doanh/freelance)' : 'Chưa có việc làm (đang tìm việc hoặc học tập nâng cao)',
      option_id: hasJob === 'Có' ? 'S2_OP_JOB_YES' : 'S2_OP_JOB_NO'
    });

    if (hasJob === 'Có') {
      const cIdx = i % companies.length;
      answers.push({ id: `${resId}_A_CO1`, response_id: resId, question_id: 'S2_Q_CO_1', answer_text: companies[cIdx] });
      answers.push({ id: `${resId}_A_CO2`, response_id: resId, question_id: 'S2_Q_CO_2', answer_text: '', option_id: positions[cIdx] });
      answers.push({ id: `${resId}_A_CO3`, response_id: resId, question_id: 'S2_Q_CO_3', answer_text: '', option_id: salaries[cIdx] });
      answers.push({ id: `${resId}_A_CO4`, response_id: resId, question_id: 'S2_Q_CO_4', answer_text: '', option_id: fitness[cIdx] });
    } else {
      const unIdx = i - 7; // 0, 1, 2
      const unReasons = ['S2_Q_KH_1_OP_0', 'S2_Q_KH_1_OP_3', 'S2_Q_KH_1_OP_1'];
      const unCareers = ['Kỹ sư phát triển phần mềm nhúng', 'Lập trình viên Fullstack React/NodeJS', 'Ứng dụng di động iOS/Android'];
      const unSupports = ['S2_Q_KH_3_OP_1', 'S2_Q_KH_3_OP_0', 'S2_Q_KH_3_OP_1'];

      answers.push({ id: `${resId}_A_KH1`, response_id: resId, question_id: 'S2_Q_KH_1', answer_text: '', option_id: unReasons[unIdx] });
      answers.push({ id: `${resId}_A_KH2`, response_id: resId, question_id: 'S2_Q_KH_2', answer_text: unCareers[unIdx] });
      answers.push({ id: `${resId}_A_KH3`, response_id: resId, question_id: 'S2_Q_KH_3', answer_text: '', option_id: unSupports[unIdx] });
    }
  }

  // ==========================================
  // SEED SURVEY 3: Ý KIẾN DOANH NGHIỆP (ENTERPRISE)
  // ==========================================
  const survey3Id = 'SURVEY_ENTERPRISE_03';
  surveys.push({
    id: survey3Id,
    title: 'Khảo sát Đánh giá Ý kiến Doanh nghiệp về Chất lượng Sinh viên tốt nghiệp',
    description: 'Hệ thống khảo sát nhanh thu thập ý kiến phản hồi quý báu từ các đối tác, nhà tuyển dụng nhằm liên tục nâng cấp nội dung chương trình giảng dạy của các khoa ngành kỹ thuật và kinh tế.',
    type: 'ENTERPRISE',
    status: 'PUBLISHED',
    start_date: startDate,
    end_date: endDate,
    metadata: {
      allow_multiple_responses: true
    },
    created_at: new Date(now.getTime() - 15 * 24 * 3600 * 1000).toISOString()
  });

  // --- Part 2: Parameter questions (is_parameter: true) ---
  questions.push({
    id: 'S3_Q_COMPANY',
    survey_id: survey3Id,
    question_type: 'TEXT',
    question_text: 'Tên cơ quan / tổ chức tuyển dụng tuyển sinh',
    is_required: true,
    order_number: 1,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: 'S3_Q_TAX',
    survey_id: survey3Id,
    question_type: 'TEXT',
    question_text: 'Mã số thuế doanh nghiệp (MST)',
    is_required: true,
    order_number: 2,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: 'S3_Q_ADDRESS',
    survey_id: survey3Id,
    question_type: 'TEXT',
    question_text: 'Địa chỉ trụ sở đại diện Doanh nghiệp',
    is_required: true,
    order_number: 3,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: 'S3_Q_REPRESENTATIVE',
    survey_id: survey3Id,
    question_type: 'TEXT',
    question_text: 'Họ tên Thống kê của Người đại diện / Cán bộ nhân sự',
    is_required: true,
    order_number: 4,
    metadata: { is_parameter: true }
  });

  // --- Part 3: Main Questionnaire content questions (is_parameter: false) ---
  const entQuestions = [
    { id: 'S3_Q1', text: 'Nhận xét của Quý đơn vị về kiến thức chuyên môn cốt lõi của sinh viên sau khi nhận việc?', opts: ['Rất xuất sắc/Vượt mong đợi', 'Tốt/Đáp ứng được yêu cầu', 'Chưa đạt yêu cầu/Cần đào tạo lại'] },
    { id: 'S3_Q2', text: 'Ý kiến đánh giá nâng cao về kỹ năng mềm, làm việc nhóm và năng lực giải quyết vấn đề?', opts: ['Rất tốt/Độc lập & chủ động', 'Ổn định/Hợp tác tốt', 'Hạn chế/Còn thụ động và rụt rè'] },
    { id: 'S3_Q3', text: 'Thái độ làm việc, tính kỷ luật tác phong, ý thức tuân thủ nội quy của sinh viên?', opts: ['Ý thức trách nhiệm cao, rất chuyên nghiệp', 'Có trách nhiệm, tuân thủ tốt', 'Rất bình thường, đôi khi còn trễ hẹn'] },
    { id: 'S3_Q4', text: 'Quý doanh nghiệp có sẵn lòng đón nhận thêm các đợt sinh viên thực tập tiếp theo?', opts: ['Hoàn toàn sẵn lòng và đồng hành', 'Xem xét tùy thuộc quỹ chỉ tiêu từng năm', 'Tạm thời chưa có nhu cầu'] },
    { id: 'S3_Q5', text: 'Ý kiến góp ý bổ sung của Quý doanh nghiệp về phát triển chương trình đào tạo?', type: 'TEXT' as const }
  ];

  entQuestions.forEach((q, idx) => {
    questions.push({
      id: q.id,
      survey_id: survey3Id,
      question_type: q.type || ('SINGLE_CHOICE' as const),
      question_text: q.text,
      is_required: q.type !== 'TEXT',
      order_number: idx + 5,
      metadata: { is_parameter: false }
    });

    if (q.opts) {
      q.opts.forEach((oText, oIdx) => {
        options.push({
          id: `${q.id}_OP_${oIdx}`,
          question_id: q.id,
          option_text: oText,
          order_number: oIdx + 1
        });
      });
    }
  });

  // Seed responses for enterprise
  const entNames = ['Công ty Cổ phần MISA', 'Tập đoàn Công nghệ CMC', 'Công ty KMS Technology VN', 'FPT Software Corp'];
  const entLocs = ['Tòa nhà Technosoft, Cầu Giấy, Hà Nội', 'Tòa nhà CMC, Quận 2, TP.HCM', 'Quận Tân Bình, TP.HCM', 'F-Ville, Hòa Lạc, Hà Nội'];
  const entTaxs = ['0101345678', '0102431256', '0304561278', '0101234991'];
  const entReps = ['Phạm Giang Nam (HR Director)', 'Lê Hữu Hải (Trưởng phòng tuyển dụng)', 'Nguyễn Mai Chi (Talent Acquisition Lead)', 'Trần Quốc Tuấn (Phó Giám đốc Kỹ thuật)'];

  for (let i = 0; i < 4; i++) {
    const resId = `S3_RES_${i + 1}`;
    responses.push({
      id: resId,
      survey_id: survey3Id,
      submitted_at: new Date(now.getTime() - (i * 3 * 24 * 3600 * 1000)).toISOString(),
      metadata: {
        company_name: entNames[i],
        company_address: entLocs[i],
        tax_code: entTaxs[i],
        representative: entReps[i]
      }
    });

    // Answers to Part 2 parameter questions
    answers.push({ id: `${resId}_AP1`, response_id: resId, question_id: 'S3_Q_COMPANY', answer_text: entNames[i] });
    answers.push({ id: `${resId}_AP2`, response_id: resId, question_id: 'S3_Q_TAX', answer_text: entTaxs[i] });
    answers.push({ id: `${resId}_AP3`, response_id: resId, question_id: 'S3_Q_ADDRESS', answer_text: entLocs[i] });
    answers.push({ id: `${resId}_AP4`, response_id: resId, question_id: 'S3_Q_REPRESENTATIVE', answer_text: entReps[i] });

    // Answers to Part 3 questions
    answers.push({ id: `${resId}_A1`, response_id: resId, question_id: 'S3_Q1', answer_text: '', option_id: `S3_Q1_OP_${i % 2}` });
    answers.push({ id: `${resId}_A2`, response_id: resId, question_id: 'S3_Q2', answer_text: '', option_id: `S3_Q2_OP_${(i + 1) % 2}` });
    answers.push({ id: `${resId}_A3`, response_id: resId, question_id: 'S3_Q3', answer_text: '', option_id: `S3_Q3_OP_0` });
    answers.push({ id: `${resId}_A4`, response_id: resId, question_id: 'S3_Q4', answer_text: '', option_id: `S3_Q4_OP_0` });
    answers.push({
      id: `${resId}_A5`,
      response_id: resId,
      question_id: 'S3_Q5',
      answer_text: i % 2 === 0
        ? 'Nên cho sinh viên tiếp xúc thêm tiếng Anh giao tiếp chuyên ngành và phát triển tư duy làm việc chủ động.'
        : 'Sinh viên thích nghi nhanh, kỹ năng lập trình tốt, thái độ lễ phép.'
    });
  }

  // Dynamically map all IDs and foreign keys to deterministic UUIDs for full database integrity
  const mappedSurveys = surveys.map(s => ({
    ...s,
    id: toUUID(s.id)
  }));

  const mappedQuestions = questions.map(q => {
    const qId = toUUID(q.id);
    const sId = toUUID(q.survey_id);
    const meta = { ...q.metadata };
    if (meta.dependency) {
      meta.dependency = {
        question_id: toUUID(meta.dependency.question_id),
        expected_option_id: toUUID(meta.dependency.expected_option_id)
      };
    }
    return {
      ...q,
      id: qId,
      survey_id: sId,
      metadata: meta
    };
  });

  const mappedOptions = options.map(o => ({
    ...o,
    id: toUUID(o.id),
    question_id: toUUID(o.question_id)
  }));

  const mappedResponses = responses.map(r => ({
    ...r,
    id: toUUID(r.id),
    survey_id: toUUID(r.survey_id)
  }));

  const mappedAnswers = answers.map(a => ({
    ...a,
    id: toUUID(a.id),
    response_id: toUUID(a.response_id),
    question_id: toUUID(a.question_id),
    option_id: a.option_id ? toUUID(a.option_id) : undefined
  }));

  return {
    surveys: mappedSurveys,
    questions: mappedQuestions,
    options: mappedOptions,
    responses: mappedResponses,
    answers: mappedAnswers
  };
};

// --- DATA SERVICE HELPERS ---
export const initializeDB = () => {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.SURVEYS);
  if (!isInitialized) {
    const seed = getInitialSeedData();
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(seed.surveys));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(seed.questions));
    localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(seed.options));
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(seed.responses));
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(seed.answers));
  } else {
    // Migration for existing users who might have duplicate or plain string IDs in local storage
    try {
      const surveys = getFromLS<Survey>(STORAGE_KEYS.SURVEYS);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasNonUuidOrDuplicates = surveys.some(s => !uuidRegex.test(s.id)) || 
        new Set(surveys.map(s => toUUID(s.id).toLowerCase())).size !== surveys.length;

      if (hasNonUuidOrDuplicates) {
        const oldSurveys = getFromLS<Survey>(STORAGE_KEYS.SURVEYS);
        const oldQuestions = getFromLS<Question>(STORAGE_KEYS.QUESTIONS);
        const oldOptions = getFromLS<QuestionOption>(STORAGE_KEYS.OPTIONS);
        const oldResponses = getFromLS<Response>(STORAGE_KEYS.RESPONSES);
        const oldAnswers = getFromLS<Answer>(STORAGE_KEYS.ANSWERS);

        const uniqueSurveysMap = new Map<string, Survey>();
        oldSurveys.forEach(s => {
          const uId = toUUID(s.id);
          const mappedS = { ...s, id: uId };
          if (!uniqueSurveysMap.has(uId)) {
            uniqueSurveysMap.set(uId, mappedS);
          } else {
            // If we have a duplicate (e.g. one plain string and one UUID version), 
            // merge or prefer the newer or more established one.
            const existing = uniqueSurveysMap.get(uId)!;
            if (new Date(s.created_at || 0) > new Date(existing.created_at || 0)) {
              uniqueSurveysMap.set(uId, mappedS);
            }
          }
        });
        const mappedSurveys = Array.from(uniqueSurveysMap.values());

        const uniqueQuestionsMap = new Map<string, Question>();
        oldQuestions.forEach(q => {
          const qId = toUUID(q.id);
          const sId = toUUID(q.survey_id);
          const meta = { ...q.metadata };
          if (meta.dependency) {
            const dOpt = meta.dependency.expected_option_id;
            const mappedDepOpt = (dOpt === 'YES' || dOpt === 'NO') ? dOpt : toUUID(dOpt);
            meta.dependency = {
              question_id: toUUID(meta.dependency.question_id),
              expected_option_id: mappedDepOpt
            };
          }
          const mappedQ = {
            ...q,
            id: qId,
            survey_id: sId,
            metadata: meta
          };
          if (!uniqueQuestionsMap.has(qId)) {
            uniqueQuestionsMap.set(qId, mappedQ);
          }
        });
        const mappedQuestions = Array.from(uniqueQuestionsMap.values());

        const uniqueOptionsMap = new Map<string, QuestionOption>();
        oldOptions.forEach(o => {
          const oId = toUUID(o.id);
          const qId = toUUID(o.question_id);
          const mappedO = {
            ...o,
            id: oId,
            question_id: qId
          };
          if (!uniqueOptionsMap.has(oId)) {
            uniqueOptionsMap.set(oId, mappedO);
          }
        });
        const mappedOptions = Array.from(uniqueOptionsMap.values());

        const uniqueResponsesMap = new Map<string, Response>();
        oldResponses.forEach(r => {
          const rId = toUUID(r.id);
          const sId = toUUID(r.survey_id);
          const mappedR = {
            ...r,
            id: rId,
            survey_id: sId
          };
          if (!uniqueResponsesMap.has(rId)) {
            uniqueResponsesMap.set(rId, mappedR);
          }
        });
        const mappedResponses = Array.from(uniqueResponsesMap.values());

        const uniqueAnswersMap = new Map<string, Answer>();
        oldAnswers.forEach(a => {
          const aId = toUUID(a.id);
          const rId = toUUID(a.response_id);
          const qId = toUUID(a.question_id);
          const optId = a.option_id ? ((a.option_id === 'YES' || a.option_id === 'NO') ? a.option_id : toUUID(a.option_id)) : undefined;
          const mappedA = {
            ...a,
            id: aId,
            response_id: rId,
            question_id: qId,
            option_id: optId
          };
          if (!uniqueAnswersMap.has(aId)) {
            uniqueAnswersMap.set(aId, mappedA);
          }
        });
        const mappedAnswers = Array.from(uniqueAnswersMap.values());

        localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(mappedSurveys));
        localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(mappedQuestions));
        localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(mappedOptions));
        localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(mappedResponses));
        localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(mappedAnswers));
      }
    } catch (e) {
      console.error("Migration error: ", e);
    }
  }
};

const getFromLS = <T>(key: string): T[] => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch (err) {
    console.error('Error parsing localStorage key ' + key, err);
    return [];
  }
};

const saveToLS = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  // Get lists
  getSurveys: (): Survey[] => getFromLS<Survey>(STORAGE_KEYS.SURVEYS),
  getQuestions: (): Question[] => getFromLS<Question>(STORAGE_KEYS.QUESTIONS),
  getOptions: (): QuestionOption[] => getFromLS<QuestionOption>(STORAGE_KEYS.OPTIONS),
  getResponses: (): Response[] => getFromLS<Response>(STORAGE_KEYS.RESPONSES),
  getAnswers: (): Answer[] => getFromLS<Answer>(STORAGE_KEYS.ANSWERS),

  // Save survey
  saveSurvey: (survey: Survey): void => {
    const surveys = getFromLS<Survey>(STORAGE_KEYS.SURVEYS);
    const existingIdx = surveys.findIndex(s => s.id.toLowerCase() === survey.id.toLowerCase());
    if (existingIdx > -1) {
      surveys[existingIdx] = survey;
    } else {
      surveys.push(survey);
    }
    saveToLS(STORAGE_KEYS.SURVEYS, surveys);
  },

  // Delete survey
  deleteSurvey: (id: string): void => {
    // Cascading delete questions, options, responses, answers
    const surveys = getFromLS<Survey>(STORAGE_KEYS.SURVEYS).filter(s => s.id.toLowerCase() !== id.toLowerCase());
    const oldQs = getFromLS<Question>(STORAGE_KEYS.QUESTIONS);
    const questionsToDelete = oldQs.filter(q => q.survey_id.toLowerCase() === id.toLowerCase()).map(q => q.id);
    const questions = oldQs.filter(q => q.survey_id.toLowerCase() !== id.toLowerCase());

    const options = getFromLS<QuestionOption>(STORAGE_KEYS.OPTIONS).filter(o => !questionsToDelete.includes(o.question_id));

    const oldRes = getFromLS<Response>(STORAGE_KEYS.RESPONSES);
    const responsesToDelete = oldRes.filter(r => r.survey_id.toLowerCase() === id.toLowerCase()).map(r => r.id);
    const responses = oldRes.filter(r => r.survey_id.toLowerCase() !== id.toLowerCase());

    const answers = getFromLS<Answer>(STORAGE_KEYS.ANSWERS).filter(a => !responsesToDelete.includes(a.response_id));

    saveToLS(STORAGE_KEYS.SURVEYS, surveys);
    saveToLS(STORAGE_KEYS.QUESTIONS, questions);
    saveToLS(STORAGE_KEYS.OPTIONS, options);
    saveToLS(STORAGE_KEYS.RESPONSES, responses);
    saveToLS(STORAGE_KEYS.ANSWERS, answers);
  },

  // Save multiple questions and their options for a survey
  saveQuestionsAndOptions: (surveyId: string, qList: Question[], oList: QuestionOption[]) => {
    // Remove existing questions of this survey
    const oldQuestions = getFromLS<Question>(STORAGE_KEYS.QUESTIONS);
    const oldQids = oldQuestions.filter(q => q.survey_id.toLowerCase() === surveyId.toLowerCase()).map(q => q.id);
    const filteredQuestions = oldQuestions.filter(q => q.survey_id.toLowerCase() !== surveyId.toLowerCase());

    // Remove existing options of those old questions
    const oldOptions = getFromLS<QuestionOption>(STORAGE_KEYS.OPTIONS);
    const filteredOptions = oldOptions.filter(o => !oldQids.includes(o.question_id));

    // Concat new items
    saveToLS(STORAGE_KEYS.QUESTIONS, [...filteredQuestions, ...qList]);
    saveToLS(STORAGE_KEYS.OPTIONS, [...filteredOptions, ...oList]);
  },

  // Dynamic duplicate with branch-mapping (Cloning with full branch integrity!)
  cloneSurvey: (surveyId: string): Survey => {
    const surveys = getFromLS<Survey>(STORAGE_KEYS.SURVEYS);
    const originalSurvey = surveys.find(s => s.id.toLowerCase() === surveyId.toLowerCase());
    if (!originalSurvey) {
      throw new Error(`Survey với ID ${surveyId} không tồn tại`);
    }

    const newSurveyId = `clone_${generateId()}`;
    const newSurvey: Survey = {
      ...originalSurvey,
      id: newSurveyId,
      title: `${originalSurvey.title} - Bản sao`,
      status: 'DRAFT', // Set status to DRAFT automatically
      created_at: new Date().toISOString()
    };

    const questions = getFromLS<Question>(STORAGE_KEYS.QUESTIONS);
    const originalQuestions = questions.filter(q => q.survey_id.toLowerCase() === surveyId.toLowerCase());
    const options = getFromLS<QuestionOption>(STORAGE_KEYS.OPTIONS);

    const newQuestions: Question[] = [];
    const newOptions: QuestionOption[] = [];

    // Map old IDs to brand-new generated IDs to preserve branching relationships
    const qIdMap: Record<string, string> = {};
    const oIdMap: Record<string, string> = {};

    originalQuestions.forEach(oldQ => {
      qIdMap[oldQ.id] = `Q_${generateId()}`;
    });

    originalQuestions.forEach(oldQ => {
      const newQid = qIdMap[oldQ.id];

      // Find options of this old question
      const oldOpts = options.filter(o => o.question_id === oldQ.id);
      oldOpts.forEach(oldO => {
        const newOid = `OP_${generateId()}`;
        oIdMap[oldO.id] = newOid;
        newOptions.push({
          ...oldO,
          id: newOid,
          question_id: newQid
        });
      });

      // Assemble metadata mapping references
      const clonedMeta = { ...oldQ.metadata };
      if (clonedMeta.dependency) {
        const depQId = clonedMeta.dependency.question_id;
        const depOptId = clonedMeta.dependency.expected_option_id;
        clonedMeta.dependency = {
          question_id: qIdMap[depQId] || depQId,
          expected_option_id: oIdMap[depOptId] || depOptId
        };
      }

      newQuestions.push({
        ...oldQ,
        id: newQid,
        survey_id: newSurveyId,
        metadata: clonedMeta
      });
    });

    const allSurveys = [...surveys, newSurvey];
    const allQuestions = [...questions, ...newQuestions];
    const allOptions = [...options, ...newOptions];

    saveToLS(STORAGE_KEYS.SURVEYS, allSurveys);
    saveToLS(STORAGE_KEYS.QUESTIONS, allQuestions);
    saveToLS(STORAGE_KEYS.OPTIONS, allOptions);

    return newSurvey;
  },

  // Save user submission
  submitResponse: (surveyId: string, metadata: ResponseMetadata, userAnswers: { question_id: string; answer_text: string; option_id?: string }[]): Response => {
    const responses = getFromLS<Response>(STORAGE_KEYS.RESPONSES);
    const answers = getFromLS<Answer>(STORAGE_KEYS.ANSWERS);

    const newResponseId = `RES_${generateId()}`;
    const newResponse: Response = {
      id: newResponseId,
      survey_id: surveyId,
      submitted_at: new Date().toISOString(),
      metadata: metadata // Encapsulated identification stored in metadata
    };

    const newAnswers: Answer[] = userAnswers.map(ua => ({
      id: `ANS_${generateId()}`,
      response_id: newResponseId,
      question_id: ua.question_id,
      answer_text: ua.answer_text,
      option_id: ua.option_id
    }));

    responses.push(newResponse);
    saveToLS(STORAGE_KEYS.RESPONSES, responses);
    saveToLS(STORAGE_KEYS.ANSWERS, [...answers, ...newAnswers]);

    return newResponse;
  },

  resetToDefault: (): void => {
    localStorage.removeItem(STORAGE_KEYS.SURVEYS);
    localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
    localStorage.removeItem(STORAGE_KEYS.OPTIONS);
    localStorage.removeItem(STORAGE_KEYS.RESPONSES);
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    initializeDB();
  }
};
