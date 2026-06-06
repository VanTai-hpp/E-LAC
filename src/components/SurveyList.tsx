/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Survey, SurveyType, SurveyStatus } from '../types';
import {
  PlusCircle,
  Copy,
  Check,
  QrCode,
  Edit,
  BarChart3,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Users,
  Building,
  GraduationCap,
  X
} from 'lucide-react';

interface SurveyListProps {
  surveys: Survey[];
  responsesCountMap: Record<string, number>;
  onEdit: (survey: Survey) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: SurveyStatus) => void;
  onViewStats: (survey: Survey) => void;
  onSelectSurveyForUser: (id: string) => void;
  onCreateNew: () => void;
}

export const SurveyList: React.FC<SurveyListProps> = ({
  surveys,
  responsesCountMap,
  onEdit,
  onClone,
  onDelete,
  onToggleStatus,
  onViewStats,
  onSelectSurveyForUser,
  onCreateNew
}) => {
  const [filterType, setFilterType] = useState<SurveyType | 'ALL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrOverlaySurvey, setQrOverlaySurvey] = useState<Survey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);

  // Filter surveys
  const filteredSurveys = useMemo(() => {
    if (filterType === 'ALL') return surveys;
    return surveys.filter(s => s.type === filterType);
  }, [surveys, filterType]);

  const handleCopyLink = (surveyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentOrigin = window.location.origin + window.location.pathname;
    const link = `${currentOrigin}?survey=${surveyId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(surveyId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getSurveyTypeStyle = (type: SurveyType | string) => {
    switch (type) {
      case 'TEACHING':
        return {
          bg: 'bg-indigo-50 border-indigo-100',
          badge: 'bg-indigo-100 text-indigo-800',
          accent: 'text-indigo-600',
          label: 'Giảng dạy',
          icon: GraduationCap
        };
      case 'ALUMNI':
        return {
          bg: 'bg-sky-50 border-sky-100',
          badge: 'bg-sky-100 text-sky-800',
          accent: 'text-sky-600',
          label: 'Cựu sinh viên',
          icon: Users
        };
      case 'ENTERPRISE':
        return {
          bg: 'bg-teal-50 border-teal-100',
          badge: 'bg-teal-100 text-teal-800',
          accent: 'text-teal-600',
          label: 'Doanh nghiệp',
          icon: Building
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-100',
          badge: 'bg-slate-100 text-slate-800',
          accent: 'text-slate-600',
          label: 'Khảo sát chung',
          icon: Layers
        };
    }
  };

  const currentOrigin = window.location.origin + window.location.pathname;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-sans font-bold text-xl text-slate-800 tracking-tight">Kế hoạch Khảo sát</h2>
          <p className="text-slate-500 text-xs mt-1">
            Quản trị đợt khảo sát, nhân bản biểu mẫu, cấu hình đối tượng và thống kê phản hồi thời gian thực.
          </p>
        </div>
        <button
          id="btn-create-survey"
          onClick={onCreateNew}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-medium text-xs shadow-lg shadow-sky-500/15 hover:shadow-sky-500/25 transform hover:-translate-y-0.5 transition duration-200"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Tạo Đợt Khảo sát Mới</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Type select filter */}
        <div className="flex p-1 bg-slate-100 rounded-xl space-x-1 border border-slate-200/40">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filterType === 'ALL'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({surveys.length})
          </button>
          <button
            onClick={() => setFilterType('TEACHING')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filterType === 'TEACHING'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Giảng dạy</span>
          </button>
          <button
            onClick={() => setFilterType('ALUMNI')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filterType === 'ALUMNI'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Cựu sinh viên</span>
          </button>
          <button
            onClick={() => setFilterType('ENTERPRISE')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filterType === 'ENTERPRISE'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Doanh nghiệp</span>
          </button>
        </div>

        <div className="text-slate-500 text-xs font-medium">
          Đang hiển thị <span className="text-slate-800 font-bold">{filteredSurveys.length}</span> đợt khảo sát
        </div>
      </div>

      {/* Grid of Surveys */}
      {filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 px-4">
          <Layers className="h-12 w-12 text-slate-300 mx-auto stroke-1" />
          <h3 className="font-sans font-bold text-slate-700 text-sm mt-4">Không tìm thấy đợt khảo sát nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hãy đổi bộ lọc hoặc tạo một đợt khảo sát mới để tiếp cận nhóm đối tượng sinh viên, giáo viên, doanh nghiệp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSurveys.map(survey => {
            const style = getSurveyTypeStyle(survey.type);
            const responseCount = responsesCountMap[survey.id] || 0;

            return (
              <div
                key={survey.id}
                className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col lg:flex-row lg:items-stretch"
              >
                {/* Visual Status Indicator strip */}
                <div
                  className={`w-1.5 lg:w-2 shrink-0 ${
                    survey.status === 'PUBLISHED'
                      ? 'bg-emerald-500'
                      : survey.status === 'CLOSED'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />

                {/* Left Side Content - Main details */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${style.badge}`}>
                        <style.icon className="h-3.5 w-3.5" />
                        <span>{style.label}</span>
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          survey.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/55'
                            : survey.status === 'CLOSED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}
                      >
                        {survey.status === 'PUBLISHED'
                          ? 'ĐANG MỞ CHẠY'
                          : survey.status === 'CLOSED'
                          ? 'ĐÃ ĐÓNG'
                          : 'BẢN NHÁP'}
                      </span>

                      {/* Code field */}
                      <span className="font-mono text-[10px] text-slate-400">
                        ID: {survey.id}
                      </span>
                    </div>

                    {/* Survey Title */}
                    <h3 className="font-sans font-bold text-base sm:text-lg text-slate-800 group-hover:text-indigo-600 transition duration-150 leading-snug">
                      {survey.title}
                    </h3>

                    {/* Survey Description */}
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {survey.description}
                    </p>
                  </div>

                  {/* Date Indicators & Responses info */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 pt-4 border-t border-slate-100/80 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hạn: {survey.start_date} đến {survey.end_date}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-600">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Thu thập: <strong className="text-slate-800 font-bold">{responseCount}</strong> phản hồi</span>
                    </span>
                    {survey.metadata.allow_multiple_responses !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-500">
                        {survey.metadata.allow_multiple_responses ? 'Khảo sát lặp lại' : 'Chỉ 1 lượt điền/User'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side Utility Panel: Consolidated Status Toggle & Actions */}
                <div className="p-5 sm:p-6 bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-150/80 flex flex-col justify-between gap-5 lg:w-72 shrink-0">
                  
                  {/* Status Toggle control + Public Actions */}
                  <div className="flex flex-row lg:flex-col lg:items-stretch justify-between items-center gap-4">
                    <div className="flex flex-col items-start lg:items-start gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">VẬN HÀNH</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <button
                          onClick={() => onToggleStatus(survey.id, survey.status)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 outline-none ${
                            survey.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={survey.status === 'PUBLISHED' ? 'Bấm để tạm dừng đợt khảo sát này' : 'Bấm để phát hành đợt khảo sát này'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              survey.status === 'PUBLISHED' ? 'translate-x-[22px]' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-bold text-slate-700 leading-none">
                          {survey.status === 'PUBLISHED' ? 'Đang mở (On)' : 'Tắt đợt (Off)'}
                        </span>
                      </div>
                    </div>

                    {/* QR / Copy Action column */}
                    <div className="flex items-center gap-1.5 lg:mt-1 self-center lg:self-start">
                      <button
                        onClick={(e) => handleCopyLink(survey.id, e)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition duration-150 ${
                          copiedId === survey.id
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                        title="Sao chép nhanh liên kết gửi người dùng làm khảo sát"
                      >
                        {copiedId === survey.id ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedId === survey.id ? 'Đã copy' : 'Lấy link điền'}</span>
                      </button>

                      <button
                        onClick={() => setQrOverlaySurvey(survey)}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition duration-150 shadow-xs"
                        title="Hiển thị mã QR khảo sát"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Operational Controls Dashboard Buttons */}
                  <div className="space-y-2 lg:mt-auto">
                    {/* View Statistics (Primary high-contrast button) */}
                    <button
                      onClick={() => onViewStats(survey)}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 hover:shadow-md transition duration-200"
                      title="Xem kết quả, biểu đồ báo cáo & thống kê chi tiết"
                    >
                      <BarChart3 className="h-4 w-4 text-sky-400 stroke-[2.5]" />
                      <span>Xem Báo cáo Thống kê</span>
                    </button>

                    {/* Secondary button cluster container */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {/* Edit config button */}
                      <button
                        onClick={() => onEdit(survey)}
                        className="p-2 py-2.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition flex items-center justify-center"
                        title="Hiệu chỉnh thông tin & bộ câu hỏi"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {/* Clone Survey button */}
                      <button
                        onClick={() => onClone(survey.id)}
                        className="p-2 py-2.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-xl transition flex items-center justify-center"
                        title="Nhân bản biểu mẫu này để tạo đợt mới"
                      >
                        <Layers className="h-4 w-4 text-emerald-600" />
                      </button>

                      {/* Direct Test survey Link button */}
                      <button
                        onClick={() => onSelectSurveyForUser(survey.id)}
                        className="p-2 py-2.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-55 border border-slate-200 hover:border-indigo-100 rounded-xl transition flex items-center justify-center"
                        title="Làm thử biểu mẫu (Xem thử giao diện học viên)"
                      >
                        <ChevronRight className="h-4 w-4 text-indigo-500" />
                      </button>

                      {/* Delete button (Destructive action) */}
                      <button
                        onClick={() => setDeletingSurvey(survey)}
                        className="p-2 py-2.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl transition flex items-center justify-center hover:scale-105 active:scale-95"
                        title="Xóa vĩnh viễn đợt khảo sát này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal Overlay */}
      {qrOverlaySurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setQrOverlaySurvey(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase mb-2 ${getSurveyTypeStyle(qrOverlaySurvey.type).badge}`}>
                {getSurveyTypeStyle(qrOverlaySurvey.type).label}
              </span>
              <h4 className="font-sans font-bold text-slate-800 text-sm line-clamp-2 px-1">
                {qrOverlaySurvey.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Quét mã QR dưới đây để thực hiện khảo sát trên di động</p>

              {/* Real high quality QR engine via API */}
              <div className="my-6 flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-[200px] mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${currentOrigin}?survey=${qrOverlaySurvey.id}`
                  )}`}
                  alt="Survey QR Code"
                  className="w-40 h-40 object-contain shadow-xs bg-white p-1 rounded"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Copy button field */}
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-slate-600 font-mono text-[10px] break-all max-h-16 overflow-y-auto mb-4 border border-slate-200/50">
                {`${currentOrigin}?survey=${qrOverlaySurvey.id}`}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    handleCopyLink(qrOverlaySurvey.id, e);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Sao chép Link</span>
                </button>
                <a
                  href={`${currentOrigin}?survey=${qrOverlaySurvey.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Mở khảo sát</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: Delete Survey Confirmation Modal (By-passing Iframe dialogue blockers) */}
      {deletingSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto animate-in scale-in duration-200">
            <button
              onClick={() => setDeletingSurvey(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-sans font-extrabold text-lg text-slate-900 leading-snug tracking-tight">
                  Xóa đợt Khảo sát vĩnh viễn?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  Bạn đang chuẩn bị xoá đợt: <strong className="text-slate-700 font-bold block mt-1">{deletingSurvey.title}</strong>
                </p>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-xl text-left border border-rose-100 space-y-2 text-[11px] text-rose-700">
                <p className="font-semibold text-xs text-rose-800">CẢNH BÁO QUAN TRỌNG:</p>
                <p>● Thao tác này sẽ xoá toàn bộ danh sách câu hỏi & logic điều hướng.</p>
                <p>● Toàn bộ <strong className="underline">{responsesCountMap[deletingSurvey.id] || 0} bài điền khảo sát</strong> liên kết cũng sẽ bị xóa vĩnh viễn.</p>
                <p>● Dữ liệu sau khi xoá <strong>không thể cứu vãn</strong> bằng bất cứ phương pháp nào.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeletingSurvey(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy quay lại
                </button>
                <button
                  onClick={() => {
                    onDelete(deletingSurvey.id);
                    setDeletingSurvey(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/10 hover:shadow-rose-600/20"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
