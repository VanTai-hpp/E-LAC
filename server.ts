import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// --- SUPABASE CLIENT INITIALIZATION & HELPERS ---
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    let url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are missing.");
    }
    // Clean up URL in case the user specified the REST endpoint with trailing slash or /rest/v1
    url = url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseClient;
}

const toUUID = (str: string): string => {
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

function generateSeedDB() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0];

  const surveys: any[] = [];
  const questions: any[] = [];
  const options: any[] = [];
  const responses: any[] = [];
  const answers: any[] = [];

  // SURVEY 1
  const s1Id = toUUID('SURVEY_TEACHING_01');
  surveys.push({
    id: s1Id,
    title: 'Khảo sát Chất lượng Giảng dạy Học kỳ II - Giảng viên & Môn học',
    description: 'Khảo sát ý kiến phản hồi của sinh viên nhằm nâng cao chất lượng dạy và học các học kỳ tiếp theo đối với cán bộ giảng dạy tại Nhà trường.',
    type: 'TEACHING',
    status: 'PUBLISHED',
    start_date: startDate,
    end_date: endDate,
    metadata: { allow_multiple_responses: false },
    created_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString()
  });

  questions.push({
    id: toUUID('S1_Q_CLASS'),
    survey_id: s1Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Lớp học của sinh viên (Chọn lớp học hiện tại)',
    is_required: true,
    order_number: 1,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: toUUID('S1_OP_CLASS_1'), question_id: toUUID('S1_Q_CLASS'), option_text: 'D20CNTT01', order_number: 1 },
    { id: toUUID('S1_OP_CLASS_2'), question_id: toUUID('S1_Q_CLASS'), option_text: 'D20CNTT02', order_number: 2 },
    { id: toUUID('S1_OP_CLASS_3'), question_id: toUUID('S1_Q_CLASS'), option_text: 'D20CNTT03', order_number: 3 },
    { id: toUUID('S1_OP_CLASS_4'), question_id: toUUID('S1_Q_CLASS'), option_text: 'D21CNTT01', order_number: 4 },
    { id: toUUID('S1_OP_CLASS_5'), question_id: toUUID('S1_Q_CLASS'), option_text: 'D19CNTT01', order_number: 5 }
  );

  questions.push({
    id: toUUID('S1_Q_SUBJECT'),
    survey_id: s1Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Học phần thực hiện đánh giá',
    is_required: true,
    order_number: 2,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: toUUID('S1_OP_SUBJ_1'), question_id: toUUID('S1_Q_SUBJECT'), option_text: 'Lập trình ứng dụng Web mới', order_number: 1 },
    { id: toUUID('S1_OP_SUBJ_2'), question_id: toUUID('S1_Q_SUBJECT'), option_text: 'Cơ sở dữ liệu nâng cao', order_number: 2 },
    { id: toUUID('S1_OP_SUBJ_3'), question_id: toUUID('S1_Q_SUBJECT'), option_text: 'Trí tuệ nhân tạo & Học máy', order_number: 3 },
    { id: toUUID('S1_OP_SUBJ_4'), question_id: toUUID('S1_Q_SUBJECT'), option_text: 'Thiết kế giao diện UI/UX', order_number: 4 }
  );

  questions.push({
    id: toUUID('S1_Q_TEACHER'),
    survey_id: s1Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Giảng viên lên lớp trực tiếp của học phần',
    is_required: true,
    order_number: 3,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: toUUID('S1_OP_TEACH_1'), question_id: toUUID('S1_Q_TEACHER'), option_text: 'TS. Nguyễn Văn Hải', order_number: 1 },
    { id: toUUID('S1_OP_TEACH_2'), question_id: toUUID('S1_Q_TEACHER'), option_text: 'ThS. Trần Thị Mai', order_number: 2 },
    { id: toUUID('S1_OP_TEACH_3'), question_id: toUUID('S1_Q_TEACHER'), option_text: 'PGS.TS. Lê Hoàng Nam', order_number: 3 },
    { id: toUUID('S1_OP_TEACH_4'), question_id: toUUID('S1_Q_TEACHER'), option_text: 'ThS. Đỗ Minh Quân', order_number: 4 }
  );

  const s1Ques = [
    { id: 'S1_Q1', text: 'Giảng viên lên lớp đúng giờ, thực hiện giảng dạy đầy đủ nội dung môn học?', type: 'YES_NO' },
    { id: 'S1_Q2', text: 'Tài liệu hướng dẫn, đề cương chi tiết môn học được cung cấp đầy đủ và kịp thời?', type: 'YES_NO' },
    { id: 'S1_Q3', text: 'Phương pháp giảng dạy của giảng viên rõ ràng, kích thích tư duy sáng tạo?', type: 'YES_NO' },
    { id: 'S1_Q4', text: 'Giảng viên nhiệt tình hỗ trợ, giải đáp thỏa đáng thắc mắc ngoài giờ lên lớp?', type: 'YES_NO' },
    { id: 'S1_Q5', text: 'Ý kiến đóng góp khác giúp giảng viên nâng cao chất lượng bài giảng?', type: 'TEXT', req: false }
  ];

  s1Ques.forEach((q, idx) => {
    questions.push({
      id: toUUID(q.id),
      survey_id: s1Id,
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

  for (let i = 1; i <= 14; i++) {
    const resId = toUUID(`S1_RES_${i}`);
    const clIdx = i % s1Classes.length;
    const subIdx = i % s1Subjects.length;
    const teaIdx = i % s1Teachers.length;

    responses.push({
      id: resId,
      survey_id: s1Id,
      submitted_at: new Date(now.getTime() - (i * 4 * 3600 * 1000)).toISOString(),
      metadata: {
        class_name: s1Classes[clIdx],
        subject_name: s1Subjects[subIdx],
        teacher_name: s1Teachers[teaIdx]
      }
    });

    answers.push({ response_id: resId, question_id: toUUID('S1_Q_CLASS'), answer_text: s1Classes[clIdx], option_id: toUUID(s1ClassOpIds[clIdx]) });
    answers.push({ response_id: resId, question_id: toUUID('S1_Q_SUBJECT'), answer_text: s1Subjects[subIdx], option_id: toUUID(s1SubjectOpIds[subIdx]) });
    answers.push({ response_id: resId, question_id: toUUID('S1_Q_TEACHER'), answer_text: s1Teachers[teaIdx], option_id: toUUID(s1TeacherOpIds[teaIdx]) });

    answers.push({ response_id: resId, question_id: toUUID('S1_Q1'), answer_text: i % 5 === 0 ? 'NO' : 'YES' });
    answers.push({ response_id: resId, question_id: toUUID('S1_Q2'), answer_text: i % 6 === 0 ? 'NO' : 'YES' });
    answers.push({ response_id: resId, question_id: toUUID('S1_Q3'), answer_text: i % 4 === 0 ? 'NO' : 'YES' });
    answers.push({ response_id: resId, question_id: toUUID('S1_Q4'), answer_text: i % 7 === 0 ? 'NO' : 'YES' });
    if (i % 2 === 0) {
      answers.push({
        response_id: resId,
        question_id: toUUID('S1_Q5'),
        answer_text: s1Comments[i % s1Comments.length]
      });
    }
  }

  // SURVEY 2: ALUMNI
  const s2Id = toUUID('SURVEY_ALUMNI_02');
  surveys.push({
    id: s2Id,
    title: 'Khảo sát Tình hình Việc làm của Cựu sinh viên sau khi tốt nghiệp',
    description: 'Khảo sát nhằm thống kê tỷ lệ sinh viên có việc làm sau tốt nghiệp từ 6 đến 12 tháng, phục vụ công tác kiểm định chất lượng đào tạo và hoàn thiện đề án việc làm của Nhà trường.',
    type: 'ALUMNI',
    status: 'PUBLISHED',
    start_date: startDate,
    end_date: endDate,
    metadata: { allow_multiple_responses: false },
    created_at: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString()
  });

  questions.push({
    id: toUUID('S2_Q_CLASS'),
    survey_id: s2Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Lớp học khóa học đào tạo (Cựu sinh viên)',
    is_required: true,
    order_number: 1,
    metadata: { is_parameter: true }
  });
  options.push(
    { id: toUUID('S2_OP_CL_1'), question_id: toUUID('S2_Q_CLASS'), option_text: 'D18CNTT01', order_number: 1 },
    { id: toUUID('S2_OP_CL_2'), question_id: toUUID('S2_Q_CLASS'), option_text: 'D18CNTT02', order_number: 2 },
    { id: toUUID('S2_OP_CL_3'), question_id: toUUID('S2_Q_CLASS'), option_text: 'D18DTVT01', order_number: 3 },
    { id: toUUID('S2_OP_CL_4'), question_id: toUUID('S2_Q_CLASS'), option_text: 'D18QTKD01', order_number: 4 }
  );

  questions.push({
    id: toUUID('S2_Q_STUDENT_ID'),
    survey_id: s2Id,
    question_type: 'TEXT',
    question_text: 'Mã số sinh viên (HSSV) cựu học sinh',
    is_required: true,
    order_number: 2,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: toUUID('S2_Q_FULLNAME'),
    survey_id: s2Id,
    question_type: 'TEXT',
    question_text: 'Họ và tên cựu học viên',
    is_required: true,
    order_number: 3,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: toUUID('S2_Q_PHONE'),
    survey_id: s2Id,
    question_type: 'TEXT',
    question_text: 'Số điện thoại liên lạc cá nhân',
    is_required: true,
    order_number: 4,
    metadata: { is_parameter: true }
  });

  questions.push({
    id: toUUID('S2_Q_JOB'),
    survey_id: s2Id,
    question_type: 'SINGLE_CHOICE',
    question_text: 'Tình trạng hiện tại của Anh/Chị về việc làm?',
    is_required: true,
    order_number: 5,
    metadata: { is_parameter: false }
  });
  options.push(
    { id: toUUID('S2_OP_JOB_YES'), question_id: toUUID('S2_Q_JOB'), option_text: 'Đã có việc làm (bao gồm cả tự kinh doanh/freelance)', order_number: 1 },
    { id: toUUID('S2_OP_JOB_NO'), question_id: toUUID('S2_Q_JOB'), option_text: 'Chưa có việc làm (đang tìm việc hoặc học tập nâng cao)', order_number: 2 }
  );

  const yesQ = [
    { id: 'S2_Q_CO_1', text: 'Tên cơ quan, doanh nghiệp hoặc đơn vị Anh/Chị đang công tác?', type: 'TEXT', req: true },
    { id: 'S2_Q_CO_2', text: 'Vị trí công việc chính đảm nhận?', type: 'SINGLE_CHOICE', req: true, opts: ['Nhân viên kỹ thuật/Lập trình viên', 'Chuyên viên kiểm thử/QA', 'Chuyên viên phân tích hệ thống/BA', 'Quản lý nhóm/Trưởng phòng', 'Tự kinh doanh/Khởi nghiệp', 'Khác'] },
    { id: 'S2_Q_CO_3', text: 'Mức thu nhập trung bình hàng tháng (VNĐ)?', type: 'SINGLE_CHOICE', req: true, opts: ['Dưới 8 triệu', 'Từ 8 - 12 triệu', 'Từ 12 - 20 triệu', 'Trên 20 triệu'] },
    { id: 'S2_Q_CO_4', text: 'Nhận xét về tương quan chuyên ngành đào tạo với công việc hiện tại?', type: 'SINGLE_CHOICE', req: true, opts: ['Phù hợp hoàn toàn (Đúng ngành học)', 'Phù hợp một phần (Ngành gần)', 'Không liên quan gì'] }
  ];

  yesQ.forEach((q, idx) => {
    questions.push({
      id: toUUID(q.id),
      survey_id: s2Id,
      question_type: q.type,
      question_text: q.text,
      is_required: q.req,
      order_number: idx + 6,
      metadata: {
        is_parameter: false,
        dependency: { question_id: toUUID('S2_Q_JOB'), expected_option_id: toUUID('S2_OP_JOB_YES') }
      }
    });

    if (q.opts) {
      q.opts.forEach((oText, oIdx) => {
        options.push({
          id: toUUID(`${q.id}_OP_${oIdx}`),
          question_id: toUUID(q.id),
          option_text: oText,
          order_number: oIdx + 1
        });
      });
    }
  });

  const noQ = [
    { id: 'S2_Q_KH_1', text: 'Lý do chủ yếu hiện tại Anh/Chị chưa có việc làm?', type: 'SINGLE_CHOICE', req: true, opts: ['Đang chuẩn bị học lên cao học/Du học', 'Đang ôn thi chứng chỉ/Mất định hướng nghề nghiệp', 'Chờ phản hồi phỏng vấn từ các công ty', 'Yêu cầu tuyển dụng quá cao, thiếu kinh nghiệm', 'Khác'] },
    { id: 'S2_Q_KH_2', text: 'Nguyện vọng hoặc lĩnh vực công tác Anh/Chị đang hướng tới nhiều nhất?', type: 'TEXT', req: true },
    { id: 'S2_Q_KH_3', text: 'Anh/Chị mong muốn Nhà trường hỗ trợ thêm điều gì trong việc kết nối nghề nghiệp?', type: 'SINGLE_CHOICE', req: true, opts: ['Tổ chức thêm khóa đào tạo kỹ năng viết CV & phỏng vấn', 'Giới thiệu thông tin thực tập/việc làm trực tiếp', 'Tạo sân chơi định hướng/Ngày hội kết nối cựu sinh viên', 'Khác'] }
  ];

  noQ.forEach((q, idx) => {
    questions.push({
      id: toUUID(q.id),
      survey_id: s2Id,
      question_type: q.type,
      question_text: q.text,
      is_required: q.req,
      order_number: idx + 10,
      metadata: {
        is_parameter: false,
        dependency: { question_id: toUUID('S2_Q_JOB'), expected_option_id: toUUID('S2_OP_JOB_NO') }
      }
    });

    if (q.opts) {
      q.opts.forEach((oText, oIdx) => {
        options.push({
          id: toUUID(`${q.id}_OP_${oIdx}`),
          question_id: toUUID(q.id),
          option_text: oText,
          order_number: oIdx + 1
        });
      });
    }
  });

  const names = ['Nguyễn Hoàng Long', 'Trần Phương Thảo', 'Phạm Minh Đức', 'Lê Khánh Linh', 'Bùi Văn Hùng', 'Vũ Thị Minh', 'Đặng Quốc Bảo', 'Hoàng Bảo Trâm', 'Đỗ Thành Trung', 'Lê Minh Tuấn'];
  const phones = ['0912111111', '0922222222', '0933333333', '0944444444', '0955555555', '0966666666', '0977777777', '0988888888', '0999999999', '0911223344'];
  const classesList = ['D18CNTT01', 'D18CNTT02', 'D18DTVT01', 'D18QTKD01'];
  const classesOpIds = ['S2_OP_CL_1', 'S2_OP_CL_2', 'S2_OP_CL_3', 'S2_OP_CL_4'];
  const companies = ['FPT Software', 'Viettel Group', 'VNG Corporation', 'VNPAY', 'Tiki JSC', 'CMC Global', 'Sotatek'];
  const positions = ['S2_Q_CO_2_OP_0', 'S2_Q_CO_2_OP_1', 'S2_Q_CO_2_OP_0', 'S2_Q_CO_2_OP_2', 'S2_Q_CO_2_OP_0', 'S2_Q_CO_2_OP_4', 'S2_Q_CO_2_OP_0'];
  const salaries = ['S2_Q_CO_3_OP_2', 'S2_Q_CO_3_OP_3', 'S2_Q_CO_3_OP_2', 'S2_Q_CO_3_OP_1', 'S2_Q_CO_3_OP_2', 'S2_Q_CO_3_OP_3', 'S2_Q_CO_3_OP_1'];
  const fitness = ['S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_1', 'S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_0', 'S2_Q_CO_4_OP_1', 'S2_Q_CO_4_OP_0'];

  for (let i = 0; i < 10; i++) {
    const resId = toUUID(`S2_RES_${i + 1}`);
    const hasJob = i < 7 ? 'Có' : 'Không';
    const clIdx = i % classesList.length;
    const stdId = `18DCCN${String(i + 15).padStart(3, '0')}`;

    responses.push({
      id: resId,
      survey_id: s2Id,
      submitted_at: new Date(now.getTime() - (i * 12 * 3600 * 1000)).toISOString(),
      metadata: {
        fullname: names[i],
        student_id: stdId,
        phone: phones[i],
        class_name: classesList[clIdx],
        job_status: hasJob
      }
    });

    answers.push({ response_id: resId, question_id: toUUID('S2_Q_CLASS'), answer_text: classesList[clIdx], option_id: toUUID(classesOpIds[clIdx]) });
    answers.push({ response_id: resId, question_id: toUUID('S2_Q_STUDENT_ID'), answer_text: stdId });
    answers.push({ response_id: resId, question_id: toUUID('S2_Q_FULLNAME'), answer_text: names[i] });
    answers.push({ response_id: resId, question_id: toUUID('S2_Q_PHONE'), answer_text: phones[i] });

    answers.push({
      response_id: resId,
      question_id: toUUID('S2_Q_JOB'),
      answer_text: hasJob === 'Có' ? 'Đã có việc làm (bao gồm cả tự kinh doanh/freelance)' : 'Chưa có việc làm (đang tìm việc hoặc học tập nâng cao)',
      option_id: hasJob === 'Có' ? toUUID('S2_OP_JOB_YES') : toUUID('S2_OP_JOB_NO')
    });

    if (hasJob === 'Có') {
      const cIdx = i % companies.length;
      answers.push({ response_id: resId, question_id: toUUID('S2_Q_CO_1'), answer_text: companies[cIdx] });
      answers.push({ response_id: resId, question_id: toUUID('S2_Q_CO_2'), option_id: toUUID(positions[cIdx]) });
      answers.push({ response_id: resId, question_id: toUUID('S2_Q_CO_3'), option_id: toUUID(salaries[cIdx]) });
      answers.push({ response_id: resId, question_id: toUUID('S2_Q_CO_4'), option_id: toUUID(fitness[cIdx]) });
    } else {
      const unIdx = i - 7;
      const unReasons = ['S2_Q_KH_1_OP_0', 'S2_Q_KH_1_OP_3', 'S2_Q_KH_1_OP_1'];
      const unCareers = ['Kỹ sư phát triển phần mềm nhúng', 'Lập trình viên Fullstack React/NodeJS', 'Ứng dụng di động iOS/Android'];
      const unSupports = ['S2_Q_KH_3_OP_1', 'S2_Q_KH_3_OP_0', 'S2_Q_KH_3_OP_1'];

      answers.push({ response_id: resId, question_id: toUUID('S2_Q_KH_1'), option_id: toUUID(unReasons[unIdx]) });
      answers.push({ response_id: resId, question_id: toUUID('S2_Q_KH_2'), answer_text: unCareers[unIdx] });
      answers.push({ response_id: resId, question_id: toUUID('S2_Q_KH_3'), option_id: toUUID(unSupports[unIdx]) });
    }
  }

  // SURVEY 3: ENTERPRISE
  const s3Id = toUUID('SURVEY_ENTERPRISE_03');
  surveys.push({
    id: s3Id,
    title: 'Khảo sát Đánh giá Ý kiến Doanh nghiệp về Chất lượng Sinh viên tốt nghiệp',
    description: 'Hệ thống khảo sát nhanh thu thập ý kiến phản hồi quý báu từ các đối tác, nhà tuyển dụng nhằm liên tục nâng cấp nội dung chương trình giảng dạy của các khoa ngành kỹ thuật và kinh tế.',
    type: 'ENTERPRISE',
    status: 'PUBLISHED',
    start_date: startDate,
    end_date: endDate,
    metadata: { allow_multiple_responses: true },
    created_at: new Date(now.getTime() - 15 * 24 * 3600 * 1000).toISOString()
  });

  questions.push({
    id: toUUID('S3_Q_COMPANY'),
    survey_id: s3Id,
    question_type: 'TEXT',
    question_text: 'Tên cơ quan / tổ chức tuyển dụng tuyển sinh',
    is_required: true,
    order_number: 1,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: toUUID('S3_Q_TAX'),
    survey_id: s3Id,
    question_type: 'TEXT',
    question_text: 'Mã số thuế doanh nghiệp (MST)',
    is_required: true,
    order_number: 2,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: toUUID('S3_Q_ADDRESS'),
    survey_id: s3Id,
    question_type: 'TEXT',
    question_text: 'Địa chỉ trụ sở đại diện Doanh nghiệp',
    is_required: true,
    order_number: 3,
    metadata: { is_parameter: true }
  });
  questions.push({
    id: toUUID('S3_Q_REPRESENTATIVE'),
    survey_id: s3Id,
    question_type: 'TEXT',
    question_text: 'Họ tên Thống kê của Người đại diện / Cán bộ nhân sự',
    is_required: true,
    order_number: 4,
    metadata: { is_parameter: true }
  });

  const entQuestions = [
    { id: 'S3_Q1', text: 'Nhận xét của Quý đơn vị về kiến thức chuyên môn cốt lõi của sinh viên sau khi nhận việc?', opts: ['Rất xuất sắc/Vượt mong đợi', 'Tốt/Đáp ứng được yêu cầu', 'Chưa đạt yêu cầu/Cần đào tạo lại'] },
    { id: 'S3_Q2', text: 'Ý kiến đánh giá nâng cao về kỹ năng mềm, làm việc nhóm và năng lực giải quyết vấn đề?', opts: ['Rất tốt/Độc lập & chủ động', 'Ổn định/Hợp tác tốt', 'Hạn chế/Còn thụ động và rụt rè'] },
    { id: 'S3_Q3', text: 'Thái độ làm việc, tính kỷ luật tác phong, ý thức tuân thủ nội quy của sinh viên?', opts: ['Ý thức trách nhiệm cao, rất chuyên nghiệp', 'Có trách nhiệm, tuân thủ tốt', 'Rất bình thường, đôi khi còn trễ hẹn'] },
    { id: 'S3_Q4', text: 'Quý doanh nghiệp có sẵn lòng đón nhận thêm các đợt sinh viên thực tập tiếp theo?', opts: ['Hoàn toàn sẵn lòng và đồng hành', 'Xem xét tùy thuộc quỹ chỉ tiêu từng năm', 'Tạm thời chưa có nhu cầu'] },
    { id: 'S3_Q5', text: 'Ý kiến góp ý bổ sung của Quý doanh nghiệp về phát triển chương trình đào tạo?', type: 'TEXT' }
  ];

  entQuestions.forEach((q, idx) => {
    questions.push({
      id: toUUID(q.id),
      survey_id: s3Id,
      question_type: q.type || 'SINGLE_CHOICE',
      question_text: q.text,
      is_required: q.type !== 'TEXT',
      order_number: idx + 5,
      metadata: { is_parameter: false }
    });

    if (q.opts) {
      q.opts.forEach((oText, oIdx) => {
        options.push({
          id: toUUID(`${q.id}_OP_${oIdx}`),
          question_id: toUUID(q.id),
          option_text: oText,
          order_number: oIdx + 1
        });
      });
    }
  });

  const entNames = ['Công ty Cổ phần MISA', 'Tập đoàn Công nghệ CMC', 'Công ty KMS Technology VN', 'FPT Software Corp'];
  const entLocs = ['Tòa nhà Technosoft, Cầu Giấy, Hà Nội', 'Tòa nhà CMC, Quận 2, TP.HCM', 'Quận Tân Bình, TP.HCM', 'F-Ville, Hòa Lạc, Hà Nội'];
  const entTaxs = ['0101345678', '0102431256', '0304561278', '0101234991'];
  const entReps = ['Phạm Giang Nam (HR Director)', 'Lê Hữu Hải (Trưởng phòng tuyển dụng)', 'Nguyễn Mai Chi (Talent Acquisition Lead)', 'Trần Quốc Tuấn (Phó Giám đốc Kỹ thuật)'];

  for (let i = 0; i < 4; i++) {
    const resId = toUUID(`S3_RES_${i + 1}`);
    responses.push({
      id: resId,
      survey_id: s3Id,
      submitted_at: new Date(now.getTime() - (i * 3 * 24 * 3600 * 1000)).toISOString(),
      metadata: {
        company_name: entNames[i],
        company_address: entLocs[i],
        tax_code: entTaxs[i],
        representative: entReps[i]
      }
    });

    answers.push({ response_id: resId, question_id: toUUID('S3_Q_COMPANY'), answer_text: entNames[i] });
    answers.push({ response_id: resId, question_id: toUUID('S3_Q_TAX'), answer_text: entTaxs[i] });
    answers.push({ response_id: resId, question_id: toUUID('S3_Q_ADDRESS'), answer_text: entLocs[i] });
    answers.push({ response_id: resId, question_id: toUUID('S3_Q_REPRESENTATIVE'), answer_text: entReps[i] });

    answers.push({ response_id: resId, question_id: toUUID('S3_Q1'), option_id: toUUID(`S3_Q1_OP_${i % 2}`) });
    answers.push({ response_id: resId, question_id: toUUID('S3_Q2'), option_id: toUUID(`S3_Q2_OP_${(i + 1) % 2}`) });
    answers.push({ response_id: resId, question_id: toUUID('S3_Q3'), option_id: toUUID(`S3_Q3_OP_0`) });
    answers.push({ response_id: resId, question_id: toUUID('S3_Q4'), option_id: toUUID(`S3_Q4_OP_0`) });
    answers.push({
      response_id: resId,
      question_id: toUUID('S3_Q5'),
      answer_text: i % 2 === 0
        ? 'Nên cho sinh viên tiếp xúc thêm tiếng Anh giao tiếp chuyên ngành và phát triển tư duy làm việc chủ động.'
        : 'Sinh viên thích nghi nhanh, kỹ năng lập trình tốt, thái độ lễ phép.'
    });
  }

  return { surveys, questions, options, responses, answers };
}

async function seedSupabaseDatabase(client: any) {
  const seed = generateSeedDB();

  // Clear existing sequential flow for perfect integrity
  await client.from("answers").delete().neq("response_id", "00000000-0000-0000-0000-000000000000");
  await client.from("responses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("question_options").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("surveys").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Seed question_types first to satisfy foreign key constraints in standard schemas
  const questionTypes = [
    { id: 'YES_NO', name: 'Câu hỏi Có/Không' },
    { id: 'TEXT', name: 'Câu hỏi Văn bản tự do' },
    { id: 'SINGLE_CHOICE', name: 'Câu hỏi Trắc nghiệm 1 đáp án' },
    { id: 'MULTIPLE_CHOICE', name: 'Câu hỏi Trắc nghiệm nhiều đáp án' }
  ];
  const { error: qtErr } = await client.from("question_types").upsert(questionTypes);
  if (qtErr) {
    console.warn("Lưu ý: Không thể upsert bảng question_types:", qtErr.message);
  }

  const surveysToInsert = seed.surveys.map((s: any) => ({
    ...s,
    metadata: typeof s.metadata === 'object' ? JSON.stringify(s.metadata) : s.metadata
  }));
  const sErr = await client.from("surveys").insert(surveysToInsert);
  if (sErr.error) throw sErr.error;

  const questionsToInsert = seed.questions.map((q: any) => ({
    ...q,
    metadata: typeof q.metadata === 'object' ? JSON.stringify(q.metadata) : q.metadata
  }));
  const qErr = await client.from("questions").insert(questionsToInsert);
  if (qErr.error) throw qErr.error;

  const oErr = await client.from("question_options").insert(seed.options);
  if (oErr.error) throw oErr.error;

  const responsesToInsert = seed.responses.map((r: any) => ({
    ...r,
    metadata: typeof r.metadata === 'object' ? JSON.stringify(r.metadata) : r.metadata
  }));
  const rErr = await client.from("responses").insert(responsesToInsert);
  if (rErr.error) throw rErr.error;

  const answersToInsert = seed.answers.map((a: any) => ({
    response_id: a.response_id,
    question_id: a.question_id,
    option_id: a.option_id || null,
    answer_text: a.answer_text || null
  }));

  const aErr = await client.from("answers").insert(answersToInsert);
  if (aErr.error) throw aErr.error;
}

const BRANDING_FILE = path.join(process.cwd(), "branding.json");
let schoolNameCache = "E-LAC";
let schoolLogoCache: string | null = null;

try {
  if (fs.existsSync(BRANDING_FILE)) {
    const raw = fs.readFileSync(BRANDING_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.schoolName) schoolNameCache = parsed.schoolName;
    if (parsed.schoolLogo !== undefined) schoolLogoCache = parsed.schoolLogo;
  }
} catch (e) {
  console.warn("Failed to load branding.json:", e);
}


async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Use JSON middleware with reasonable limit
  app.use(express.json({ limit: "20mb" }));

  // --- SUPABASE PROXY ENDPOINTS ---

  app.get("/api/db/state", async (req, res) => {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
      if (!url || !key) {
        return res.json({ 
          isSupabase: false, 
          error: "Supabase URL/Key environment secrets are missing. Running in LocalStorage fallback mode.",
          schoolName: schoolNameCache,
          schoolLogo: schoolLogoCache
        });
      }

      const client = getSupabase();

      // Fetch surveys, questions, question_options, responses, answers
      const [surveysRes, questionsRes, optionsRes, responsesRes, answersRes] = await Promise.all([
        client.from("surveys").select("*").order("created_at", { ascending: false }),
        client.from("questions").select("*").order("order_number", { ascending: true }),
        client.from("question_options").select("*").order("order_number", { ascending: true }),
        client.from("responses").select("*").order("submitted_at", { ascending: false }),
        client.from("answers").select("*"),
      ]);

      let questionTypes: any[] = [];
      try {
        const { data: qtData } = await client.from("question_types").select("*");
        if (qtData) {
          questionTypes = qtData;
        }
      } catch (qtError) {
        console.warn("Could not load from question_types table:", qtError);
      }

      // Check specifically if the tables don't exist yet (SQL Schema not run)
      const detectSchemaMissing = (err: any) => {
        if (!err) return null;
        const msg = String(err.message || "").toLowerCase();
        if (err.code === "42P01" || msg.includes("relation") && msg.includes("does not exist")) {
          return "Cơ sở dữ liệu Supabase được kết nối nhưng dữ liệu bảng khảo sát chưa sẵn sàng. Vui lòng dán chạy schema SQL được cung cấp trong Supabase SQL Editor.";
        }
        return err.message;
      };

      const tableError = detectSchemaMissing(surveysRes.error) || 
                         detectSchemaMissing(questionsRes.error) || 
                         detectSchemaMissing(optionsRes.error) || 
                         detectSchemaMissing(responsesRes.error) || 
                         detectSchemaMissing(answersRes.error);

      if (tableError) {
        return res.json({ 
          isSupabase: true, 
          schemaMissing: true, 
          error: tableError,
          schoolName: schoolNameCache,
          schoolLogo: schoolLogoCache
        });
      }

      const safeParseJson = (val: any) => {
        if (!val) return {};
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch (e) {
            console.error("Failed to parse JSON string:", val);
            return {};
          }
        }
        return val;
      };

      // If the surveys table is completely empty, trigger dynamic auto-seeding
      if ((surveysRes.data || []).length === 0) {
        console.log("Supabase db is empty. Auto-seeding default surveys, questions, and options...");
        await seedSupabaseDatabase(client);
        
        // Re-fetch everything after seeding
        const [sRes, qRes, oRes, rRes, aRes] = await Promise.all([
          client.from("surveys").select("*").order("created_at", { ascending: false }),
          client.from("questions").select("*").order("order_number", { ascending: true }),
          client.from("question_options").select("*").order("order_number", { ascending: true }),
          client.from("responses").select("*").order("submitted_at", { ascending: false }),
          client.from("answers").select("*"),
        ]);

        let freshQuestionTypes: any[] = [];
        try {
          const { data: qtData } = await client.from("question_types").select("*");
          if (qtData) freshQuestionTypes = qtData;
        } catch (e) {}
        
        return res.json({
          isSupabase: true,
          seeded: true,
          surveys: (sRes.data || []).map((s: any) => ({ ...s, metadata: safeParseJson(s.metadata) })).filter((s: any) => s.id !== "00000000-0000-0000-0000-999999999999" && s.status !== "CONFIG"),
          questions: (qRes.data || []).map((q: any) => ({ ...q, metadata: safeParseJson(q.metadata) })),
          options: oRes.data || [],
          responses: (rRes.data || []).map((r: any) => ({ ...r, metadata: safeParseJson(r.metadata) })),
          answers: aRes.data || [],
          question_types: freshQuestionTypes,
          schoolName: schoolNameCache,
          schoolLogo: schoolLogoCache
        });
      }

      let dbSchoolName = schoolNameCache;
      let dbSchoolLogo = schoolLogoCache;

      const rawSurveys = surveysRes.data || [];
      const configRow = rawSurveys.find((s: any) => s.id === "00000000-0000-0000-0000-999999999999" || s.status === "CONFIG");
      if (configRow) {
        dbSchoolName = configRow.title || "E-LAC";
        dbSchoolLogo = configRow.description || null;
        schoolNameCache = dbSchoolName;
        schoolLogoCache = dbSchoolLogo;
      }

      const surveys = rawSurveys
        .filter((s: any) => s.id !== "00000000-0000-0000-0000-999999999999" && s.status !== "CONFIG")
        .map((s: any) => ({
          ...s,
          metadata: safeParseJson(s.metadata)
        }));

      const questions = (questionsRes.data || []).map((q: any) => ({
        ...q,
        metadata: safeParseJson(q.metadata)
      }));

      const responses = (responsesRes.data || []).map((r: any) => ({
        ...r,
        metadata: safeParseJson(r.metadata)
      }));

      res.json({
        isSupabase: true,
        surveys,
        questions,
        options: optionsRes.data || [],
        responses,
        answers: answersRes.data || [],
        question_types: questionTypes,
        schoolName: dbSchoolName,
        schoolLogo: dbSchoolLogo
      });
    } catch (err: any) {
      console.error("Error reading Supabase state:", err);
      res.json({ 
        isSupabase: false, 
        error: `Supabase Connection failed: ${err.message || "Unknown error"}. Running in LocalStorage fallback mode.`,
        schoolName: schoolNameCache,
        schoolLogo: schoolLogoCache
      });
    }
  });

  app.post("/api/db/survey", async (req, res) => {
    try {
      const { survey } = req.body;
      const client = getSupabase();
      
      survey.id = toUUID(survey.id);

      const surveyToUpsert = {
        ...survey,
        metadata: typeof survey.metadata === 'object' ? JSON.stringify(survey.metadata) : survey.metadata
      };

      const { error } = await client.from("surveys").upsert(surveyToUpsert);
      if (error) throw error;

      res.json({ success: true, surveyId: survey.id });
    } catch (err: any) {
      console.error("Error saving survey:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/questions-and-options", async (req, res) => {
    try {
      const { surveyId, questions, options } = req.body;
      const client = getSupabase();

      // Ensure key categories exist in question_types to satisfy foreign key constraints
      try {
        const questionTypes = [
          { id: 'YES_NO', name: 'Câu hỏi Có/Không' },
          { id: 'TEXT', name: 'Câu hỏi Văn bản tự do' },
          { id: 'SINGLE_CHOICE', name: 'Câu hỏi Trắc nghiệm 1 đáp án' },
          { id: 'MULTIPLE_CHOICE', name: 'Câu hỏi Trắc nghiệm nhiều đáp án' }
        ];
        await client.from("question_types").upsert(questionTypes);
      } catch (qtInsertErr) {
        console.warn("Could not upsert question_types: ", qtInsertErr);
      }

      const sId = toUUID(surveyId);

      // Get old questions of this survey
      const { data: oldQs, error: oldQsErr } = await client
        .from("questions")
        .select("id")
        .eq("survey_id", sId);
      if (oldQsErr) throw oldQsErr;

      const oldQids = (oldQs || []).map((q: any) => q.id);

      // Identify new questions
      const newQuestionIds = questions.map((q: any) => toUUID(q.id));

      // Identify deleted questions
      const deletedQids = oldQids.filter((id: string) => !newQuestionIds.includes(id));

      // Delete answers, options, and questions of deleted questions if any
      if (deletedQids.length > 0) {
        const { error: delAnsErr } = await client
          .from("answers")
          .delete()
          .in("question_id", deletedQids);
        if (delAnsErr) throw delAnsErr;

        const { error: delOptsErr } = await client
          .from("question_options")
          .delete()
          .in("question_id", deletedQids);
        if (delOptsErr) throw delOptsErr;

        const { error: delQsErr } = await client
          .from("questions")
          .delete()
          .in("id", deletedQids);
        if (delQsErr) throw delQsErr;
      }

      // Prepare and upsert questions
      const mappedQuestions = questions.map((q: any) => {
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
          id: toUUID(q.id),
          survey_id: sId,
          question_type: q.question_type,
          question_text: q.question_text,
          is_required: q.is_required,
          order_number: q.order_number,
          metadata: JSON.stringify(meta)
        };
      });

      if (mappedQuestions.length > 0) {
        const { error: insQsErr } = await client.from("questions").upsert(mappedQuestions);
        if (insQsErr) throw insQsErr;
      }

      // Identify deleted options among the active questions
      const newOptionIds = options.map((o: any) => toUUID(o.id));
      let oldOptsData: any[] = [];
      if (newQuestionIds.length > 0) {
        const { data: oldOpts, error: oldOptsErr } = await client
          .from("question_options")
          .select("id")
          .in("question_id", newQuestionIds);
        if (oldOptsErr) throw oldOptsErr;
        oldOptsData = oldOpts || [];
      }

      const oldOptIds = oldOptsData.map((o: any) => o.id);
      const deletedOptIds = oldOptIds.filter((id: string) => !newOptionIds.includes(id));

      // Delete answers and options of deleted options
      if (deletedOptIds.length > 0) {
        const { error: delAnsOptsErr } = await client
          .from("answers")
          .delete()
          .in("option_id", deletedOptIds);
        if (delAnsOptsErr) throw delAnsOptsErr;

        const { error: delOptsErr } = await client
          .from("question_options")
          .delete()
          .in("id", deletedOptIds);
        if (delOptsErr) throw delOptsErr;
      }

      // Prepare and upsert options
      const mappedOptions = options.map((o: any) => ({
        id: toUUID(o.id),
        question_id: toUUID(o.question_id),
        option_text: o.option_text,
        order_number: o.order_number
      }));

      if (mappedOptions.length > 0) {
        const { error: insOptsErr } = await client.from("question_options").upsert(mappedOptions);
        if (insOptsErr) throw insOptsErr;
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error saving questions and options:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/delete-survey", async (req, res) => {
    try {
      const { id } = req.body;
      const client = getSupabase();
      const sId = toUUID(id);

      // 1. Fetch response IDs
      const { data: resData, error: resErr } = await client.from("responses").select("id").eq("survey_id", sId);
      if (resErr) throw resErr;
      const resIds = (resData || []).map((r: any) => r.id);

      // 2. Delete answers
      if (resIds.length > 0) {
        const { error: ansDelErr } = await client.from("answers").delete().in("response_id", resIds);
        if (ansDelErr) throw ansDelErr;
      }

      // 3. Delete responses
      const { error: resDelErr } = await client.from("responses").delete().eq("survey_id", sId);
      if (resDelErr) throw resDelErr;

      // 4. Fetch question IDs
      const { data: qData, error: qErr } = await client.from("questions").select("id").eq("survey_id", sId);
      if (qErr) throw qErr;
      const qIds = (qData || []).map((q: any) => q.id);

      // 5. Delete question options
      if (qIds.length > 0) {
        const { error: optDelErr } = await client.from("question_options").delete().in("question_id", qIds);
        if (optDelErr) throw optDelErr;
      }

      // 6. Delete questions
      const { error: qDelErr } = await client.from("questions").delete().eq("survey_id", sId);
      if (qDelErr) throw qDelErr;

      // 7. Delete survey
      const { error: sDelErr } = await client.from("surveys").delete().eq("id", sId);
      if (sDelErr) throw sDelErr;

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting survey:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/submit-response", async (req, res) => {
    try {
      const { surveyId, metadata, userAnswers } = req.body;
      const client = getSupabase();

      const sId = toUUID(surveyId);
      const newResponseId = toUUID(Math.random().toString(36).substring(2, 11).toUpperCase() + Date.now().toString());

      // Insert response
      const { error: resErr } = await client.from("responses").insert({
        id: newResponseId,
        survey_id: sId,
        submitted_at: new Date().toISOString(),
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || '{}')
      });
      if (resErr) throw resErr;

      // Prepare and insert answers
      const answersToInsert = userAnswers.map((ua: any) => ({
        response_id: newResponseId,
        question_id: toUUID(ua.question_id),
        option_id: ua.option_id ? toUUID(ua.option_id) : null,
        answer_text: ua.answer_text || null
      }));

      if (answersToInsert.length > 0) {
        const { error: ansErr } = await client.from("answers").insert(answersToInsert);
        if (ansErr) throw ansErr;
      }

      res.json({ success: true, responseId: newResponseId });
    } catch (err: any) {
      console.error("Error submitting response:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/reset", async (req, res) => {
    try {
      const client = getSupabase();
      await seedSupabaseDatabase(client);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error resetting Supabase database:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/branding", async (req, res) => {
    try {
      const { name, logo } = req.body;
      const schoolNameVal = name || 'E-LAC';
      const schoolLogoVal = logo || null;

      // Update memory cache
      schoolNameCache = schoolNameVal;
      schoolLogoCache = schoolLogoVal;

      // 1. Write to local file
      try {
        fs.writeFileSync(BRANDING_FILE, JSON.stringify({ schoolName: schoolNameVal, schoolLogo: schoolLogoVal }, null, 2), "utf-8");
      } catch (fErr) {
        console.error("Error writing branding.json file:", fErr);
      }

      // 2. Write to Supabase if available
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
      if (url && key) {
        try {
          const client = getSupabase();
          await client.from("surveys").upsert({
            id: "00000000-0000-0000-0000-999999999999",
            title: schoolNameVal,
            description: schoolLogoVal,
            status: "CONFIG",
            type: "SYSTEM_BRAND",
            metadata: JSON.stringify({})
          });
        } catch (dbErr) {
          console.error("Error updating Supabase branding config:", dbErr);
        }
      }

      res.json({ success: true, schoolName: schoolNameVal, schoolLogo: schoolLogoVal });
    } catch (err: any) {
      console.error("Error saving branding config:", err);
      res.status(500).json({ error: err.message });
    }
  });


  // API Route: Secure AI analysis proxy endpoint using Server-Side Gemini API
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { survey, statistics, totalResponses } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets."
        });
      }

      // Initialize Server-Side Gemini Client safely as per guidelines
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Bạn là một chuyên gia cao cấp về Đánh giá Giáo dục và Phân tích Thống kê Chất lượng của Trường Cao đẳng Công nghệ và Dịch vụ Số CDS-CSBL.
Hãy viết một báo cáo phân tích, nhận định chuyên sâu và đưa ra các khuyến nghị hành động thiết thực dựa trên số liệu kết quả khảo sát dưới đây.

THÔNG TIN ĐỢT KHẢO SÁT:
- Tiêu đề: ${survey.title}
- Loại hình khảo sát: ${survey.type === 'TEACHING' ? 'Đánh giá chất lượng giảng dạy của Giảng viên' : survey.type === 'ALUMNI' ? 'Khảo sát Cựu học sinh sinh viên' : 'Khảo sát ý kiến Doanh nghiệp'}
- Mô tả: ${survey.description}
- Tổng số phiếu phản hồi đã thu thập được: ${totalResponses} phiếu.

SỐ LIỆU THỐNG KÊ CHI TIẾT TỪNG CÂU HỎI:
${JSON.stringify(statistics, null, 2)}

Yêu cầu định dạng báo cáo phân tích:
1. Hãy viết bằng tiếng Việt, giọng điệu chuyên nghiệp, mang tính xây dựng, khách quan, chuẩn mực sư phạm cao.
2. Cấu trúc rõ ràng, sử dụng các định dạng heading đẹp mắt:
   - **I. NHẬN ĐỊNH CHUNG (EXECUTIVE SUMMARY)**: Đánh giá tổng quan chất lượng đào tạo/khảo sát dựa trên số lượng mẫu và xu hướng đánh giá chung.
   - **II. ĐIỂM MẠNH TIÊU BIỂU (KEY STRENGTHS)**: Phân tích cụ thể câu nào có tỷ lệ hài lòng/đồng ý tích cực cao nhất, phản ánh điều gì về chất lượng giảng dạy/hoạt động.
   - **III. HẠN CHẾ & VẤN ĐỀ CẦN LƯU Ý (AREAS FOR IMPROVEMENT)**: Đánh giá các câu hỏi có kết quả thấp hoặc tỷ lệ chưa hài lòng cao, đưa ra nhận định nguyên nhân.
   - **IV. ĐỀ XUẤT ĐỊNH HƯỚNG & KHUYẾN NGHỊ (ACTIONABLE RECOMMENDATIONS)**: Đưa ra 3-4 khuyến nghị hành động thiết thực, mang tính thực tế cao dành riêng cho trường CDS-CSBL.

Hãy trình bày trực tiếp báo cáo khoa học bằng định dạng Markdown hoàn chỉnh, chuyên nghiệp. Không nói thêm các câu chào xã giao ngoài báo cáo.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Gemini API error in server:", error);
      res.status(500).json({ error: error.message || "An error occurred during AI analysis." });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} with Node ${process.version}`);
  });
}

startServer();
