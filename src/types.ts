/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SurveyType = 'TEACHING' | 'ALUMNI' | 'ENTERPRISE';
export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type QuestionType = 'YES_NO' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'radio' | 'text' | 'checkbox' | 'rating' | string;

export interface SurveyMetadata {
  allow_multiple_responses: boolean;
  classes?: string[];
  subjects?: string[];
  teachers?: string[];
  [key: string]: any;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  type: SurveyType;
  status: SurveyStatus;
  start_date: string;
  end_date: string;
  metadata: SurveyMetadata;
  created_at: string;
}

export interface QuestionMetadata {
  is_parameter?: boolean;
  parameter_type?: 'TEXT' | 'DROPDOWN';
  dependency?: {
    question_id: string;
    expected_option_id: string; // can be option ID or 'YES'/'NO'
  };
  condition_trigger_value?: string;
  conditional_group?: 'YES' | 'NO'; // For backward-compatibility or generic groups
  [key: string]: any;
}

export interface Question {
  id: string;
  survey_id: string;
  question_type: QuestionType;
  question_text: string;
  is_required: boolean;
  order_number: number;
  metadata: QuestionMetadata;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  order_number: number;
}

export interface ResponseMetadata {
  // Information of identifier
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
  student_id?: string;
  fullname?: string;
  phone?: string;
  job_status?: 'Có' | 'Không';
  company_name?: string;
  company_address?: string;
  tax_code?: string;
  representative?: string;
  [key: string]: any;
}

export interface Response {
  id: string;
  survey_id: string;
  submitted_at: string;
  metadata: ResponseMetadata;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string; // Used for TEXT, YES_NO ("YES"/"NO"), SINGLE_CHOICE, MULTIPLE_CHOICE
  option_id?: string;  // option_id if referencing a specific option
}
