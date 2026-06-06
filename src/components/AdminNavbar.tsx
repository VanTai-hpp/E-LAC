/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, FileSpreadsheet, RefreshCw, Layers, LogOut, Lock, AlertTriangle, X, Camera, Upload, Trash2 } from 'lucide-react';

interface AdminNavbarProps {
  activeTab: 'admin' | 'user';
  setActiveTab: (tab: 'admin' | 'user') => void;
  onResetDB: () => void;
  isAdminAuthenticated?: boolean;
  onLogout?: () => void;
  onLoginClick?: () => void;
  isSurveyRespondent?: boolean;
  dbStatus?: { isSupabase: boolean; schemaMissing: boolean; error?: string };
  schoolLogo?: string | null;
  schoolName?: string;
  onSaveBrand?: (name: string, logo: string | null) => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetDB,
  isAdminAuthenticated = false,
  onLogout,
  onLoginClick,
  isSurveyRespondent = false,
  dbStatus,
  schoolLogo: propSchoolLogo,
  schoolName: propSchoolName,
  onSaveBrand
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('school_url_or_base64_logo');
    }
    return null;
  });
  const [schoolName, setSchoolName] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('school_banner_text') || 'E-LAC';
    }
    return 'E-LAC';
  });
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(schoolLogo);
  const [tempName, setTempName] = useState<string>(schoolName);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync prop changes to keep view updated in live multi-tabs/screens
  React.useEffect(() => {
    if (propSchoolLogo !== undefined) {
      setSchoolLogo(propSchoolLogo);
    }
  }, [propSchoolLogo]);

  React.useEffect(() => {
    if (propSchoolName !== undefined) {
      setSchoolName(propSchoolName || 'E-LAC');
    }
  }, [propSchoolName]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("Hình ảnh vượt dung lượng cho phép (tối đa 2MB)!");
        return;
      }
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTempLogo(base64String);
        setLogoUrl(''); // Clear text URL when uploading file
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBrand = () => {
    let finalLogo = tempLogo;
    if (logoUrl.trim()) {
      finalLogo = logoUrl.trim();
    }
    
    if (finalLogo) {
      localStorage.setItem('school_url_or_base64_logo', finalLogo);
    } else {
      localStorage.removeItem('school_url_or_base64_logo');
    }
    
    localStorage.setItem('school_banner_text', tempName.trim() || 'E-LAC');
    
    setSchoolLogo(finalLogo);
    setSchoolName(tempName.trim() || 'E-LAC');
    
    if (onSaveBrand) {
      onSaveBrand(tempName.trim() || 'E-LAC', finalLogo);
    }
    setShowLogoModal(false);
  };

  const handleResetBrand = () => {
    setTempLogo(null);
    setLogoUrl('');
    setTempName('E-LAC');
    setErrorMsg(null);
  };

  // Sync temp variables when modal opens
  React.useEffect(() => {
    if (showLogoModal) {
      setTempLogo(schoolLogo);
      setTempName(schoolName);
      setLogoUrl(schoolLogo && !schoolLogo.startsWith('data:') ? schoolLogo : '');
      setErrorMsg(null);
    }
  }, [showLogoModal, schoolLogo, schoolName]);

  return (
    <header className="bg-[#0a1931] text-white shadow-xl relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => isAdminAuthenticated && setShowLogoModal(true)}
            className={`flex items-center space-x-2 sm:space-x-3 ${isAdminAuthenticated ? 'cursor-pointer hover:bg-slate-800/40 p-1 rounded-xl transition duration-150' : ''}`}
            title={isAdminAuthenticated ? "Nhấp vào đây cấu hình Logo - Thương hiệu trường" : undefined}
          >
            <div className={`relative group/logo flex h-10 w-10 sm:h-11 sm:w-11 overflow-hidden shrink-0 items-center justify-center rounded-xl shadow-lg shadow-sky-500/10 ${
              schoolLogo ? 'bg-transparent border border-slate-700/50' : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
            }`}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
              ) : (
                <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
              {isAdminAuthenticated && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="font-sans font-bold tracking-tight text-base sm:text-lg text-white">{schoolName}</h1>
                {dbStatus && (
                  <span className={`inline-flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded-md text-[8px] tracking-wider uppercase font-extrabold border ${
                    dbStatus.isSupabase 
                      ? dbStatus.schemaMissing 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-400 border-slate-700'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      dbStatus.isSupabase 
                        ? dbStatus.schemaMissing 
                          ? 'bg-amber-400 animate-pulse' 
                          : 'bg-emerald-400'
                        : 'bg-slate-450'
                    }`} />
                    <span className="hidden sm:inline">
                      {dbStatus.isSupabase 
                        ? dbStatus.schemaMissing 
                          ? 'Cần SQL' 
                          : 'Supabase'
                        : 'Offline'}
                    </span>
                  </span>
                )}
              </div>
              <p className="font-mono text-[9px] text-teal-400 tracking-wider font-extrabold uppercase hidden sm:block">CỔNG KHẢO SÁT & Ý KIẾN</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-4">
            {isSurveyRespondent ? (
              /* Completely restricted respondent view - no backdoors to admin workspace */
              <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-extrabold bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-widest animate-[pulse_2s_infinite]">
                Học viên & Sinh viên
              </span>
            ) : isAdminAuthenticated ? (
              <>
                <div className="bg-slate-800 p-0.5 sm:p-1 rounded-xl flex items-center space-x-0.5 sm:space-x-1 border border-slate-700/50">
                  <button
                    id="btn-nav-admin"
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold sm:font-medium tracking-wide transition-all ${
                      activeTab === 'admin'
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Quản trị (Admin)</span>
                    <span className="inline sm:hidden">Admin</span>
                  </button>

                  <button
                    id="btn-nav-user"
                    onClick={() => setActiveTab('user')}
                    className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold sm:font-medium tracking-wide transition-all ${
                      activeTab === 'user'
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Xem dạng Khách (User)</span>
                    <span className="inline sm:hidden">Khách</span>
                  </button>
                </div>

                {/* Utility Reset Button */}
                <button
                  id="btn-reset-db"
                  onClick={() => setShowConfirmReset(true)}
                  title="Đặt lại dữ liệu mặc định ban đầu"
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition duration-200 border border-transparent hover:border-slate-700/50 flex"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>

                {/* Log Out Button */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Đăng xuất khỏi phân hệ Quản trị"
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-white transition duration-200 text-[10px] sm:text-xs font-semibold"
                  >
                    <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </button>
                )}
              </>
            ) : (
              /* Public / Student view Header Badge */
              <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-extrabold bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-widest animate-[pulse_2s_infinite]">
                  Học viên & Sinh viên
                </span>
                
                {onLoginClick && (
                  <button
                    onClick={onLoginClick}
                    className="flex items-center space-x-1 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition duration-150 text-[10px] sm:text-xs font-semibold"
                    title="Dành riêng cho Cán bộ Quản lý"
                  >
                    <Lock className="h-3 w-3 text-sky-400" />
                    <span className="hidden sm:inline">Quản trị viên</span>
                    <span className="inline sm:hidden">Admin</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM DIALOG: Reset Database Confirmation Modal (By-passing Iframe Sandboxes) */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto animate-in scale-in duration-200">
            <button
              onClick={() => setShowConfirmReset(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-500 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-sans font-extrabold text-lg text-slate-800 tracking-tight leading-snug">
                  Xác nhận Khôi phục Hệ thống?
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Hành động này sẽ thực hiện <strong>đặt lại toàn bộ cơ sở dữ liệu</strong> về mẫu nguyên bản ban đầu từ hạt giống Seed Data.
                </p>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-[11px] text-rose-700 leading-normal space-y-1">
                  <p>● Toàn bộ đợt khảo sát mới tạo sẽ bị xóa vĩnh viễn.</p>
                  <p>● Tất cả phản hồi bài làm từ sinh viên, cựu sinh viên, doanh nghiệp sẽ bị làm sạch.</p>
                  <p>● Thiết lập này không thể khôi phục lại.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 justify-end">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onResetDB();
                  setShowConfirmReset(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/10 hover:shadow-rose-600/25 transition"
              >
                Xác nhận Đặt lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: School Brand & Logo Editor */}
      {showLogoModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <button
              onClick={() => {
                setTempLogo(schoolLogo);
                setTempName(schoolName);
                setShowLogoModal(false);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition duration-150"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-650 mb-2">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="font-sans font-extrabold text-lg text-slate-900 leading-snug tracking-tight">
                  Cấu hình Thương hiệu trường học
                </h3>
                <p className="text-xs text-slate-400">
                  Tải logo mới hoặc thay đổi tên hiển thị đại diện trên trang
                </p>
              </div>

              {/* Preview banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center space-x-3.5 border border-slate-800">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shadow-md shrink-0 ${
                  tempLogo ? 'bg-transparent border border-slate-700/50' : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
                }`}>
                  {tempLogo ? (
                    <img src={tempLogo} alt="Preview Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Layers className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Xem trước tiêu đề</p>
                  <p className="font-sans font-extrabold text-sm sm:text-base text-white truncate">{tempName || 'E-LAC'}</p>
                </div>
              </div>

              {/* Input section */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="brand-name-input" className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Tên nhãn hiệu / Tên trường
                  </label>
                  <input
                    id="brand-name-input"
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="E-LAC"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-550 outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Hình ảnh Logo (Chọn file hình vẽ)
                  </span>
                  <div className="relative group border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 transition-colors bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer min-h-[100px]">
                    <input
                      id="school-logo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 duration-150 mb-1.5 pointer-events-none" />
                    <span className="text-[11px] font-bold text-slate-600 pointer-events-none">Click để chọn hoặc Kéo thả ảnh</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 pointer-events-none">Hỗ trợ PNG, JPG (Dung lượng nhỏ hơn 2MB)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      Hoặc Đường dẫn URL trực tuyến
                    </label>
                    {tempLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempLogo(null);
                          setLogoUrl('');
                        }}
                        className="text-[10px] text-rose-500 hover:underline font-bold flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa logo</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setTempLogo(e.target.value.trim());
                      }
                    }}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-550 outline-none transition"
                  />
                </div>
              </div>

              {/* Error Message banner */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Bot buttons */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleResetBrand}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition duration-150"
                  title="Đặt lại về mặc định"
                >
                  Khôi phục
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => {
                    setTempLogo(schoolLogo);
                    setTempName(schoolName);
                    setShowLogoModal(false);
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-150"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={handleSaveBrand}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition duration-150 shadow-md shadow-sky-500/10"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
